import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Animated as RNAnimated
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";
import { Q } from "@nozbe/watermelondb";
import { FlashList } from "@shopify/flash-list";
import * as Haptics from 'expo-haptics';

import { database } from "../../src/database";
import { useAuthStore } from "../../src/stores/authStore";
import { useThemeColor } from "@/hooks/useThemeColor"; 
import Wallet from '../../src/database/models/Wallet';
import Debt from '../../src/database/models/Debt';

import MainHeader from "../../components/MainHeader";
import DebtItem from "../../components/DebtItem"; 

export default function DebtsScreen() {
  const { user, hideValues, hapticsEnabled } = useAuthStore(); 
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeTab, setActiveTab] = useState<"payable" | "receivable">("payable");

  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [amountRaw, setAmountRaw] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PAYABLE_COLOR = colors.danger;
  const RECEIVABLE_COLOR = colors.success;
  const ACTIVE_TAB_COLOR = activeTab === "payable" ? PAYABLE_COLOR : RECEIVABLE_COLOR;

  const infoBadgeBg = isDark ? '#1e293b' : '#f1f5f9';
  const inputWrapperBg = isDark ? '#1e293b' : '#f8fafc';

  const keyboardPadding = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      RNAnimated.timing(keyboardPadding, {
        toValue: e.endCoordinates.height,
        duration: 250,
        useNativeDriver: false, 
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      RNAnimated.timing(keyboardPadding, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const formatDisplayCurrency = (value: number) => {
    if (hideValues) return "R$ •••••";
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const allWallets = await database.get<Wallet>('wallets').query().fetch();
      setWallets(allWallets);
      const activeId = user?.settings?.last_opened_wallet || allWallets[0]?.id;

      if (activeId) {
         const debtRes = await database.get<Debt>('debts')
          .query(
            Q.where('wallet_id', activeId),
            Q.sortBy('due_date', Q.asc)
          ).fetch();
         setDebts(debtRes);
      }
    } catch (error) {
      console.error("Erro debts:", error);
    }
  }, [user?.id, user?.settings?.last_opened_wallet]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const { filteredDebts, totals } = useMemo(() => {
    const list = debts.filter((d) => d.type === activeTab);
    const stats = list.reduce(
      (acc, curr) => {
        const total = Number(curr.amount);
        const paid = Number(curr.totalPaid || (curr as any)._raw.total_paid || 0);
        acc.pending += (total - paid);
        return acc;
      },
      { pending: 0 }
    );
    return { filteredDebts: list, totals: stats };
  }, [debts, activeTab]);

  const handleAmountChange = (text: string) => setAmountRaw(text.replace(/\D/g, ""));

  const getFormattedAmountInput = () => {
    if (!amountRaw) return "0,00";
    return (parseInt(amountRaw) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const closeModal = () => {
    Keyboard.dismiss();
    setDepositModalVisible(false);
  };

  const confirmDeposit = async () => {
    const val = amountRaw ? parseInt(amountRaw) / 100 : 0;
    if (!selectedDebt || val <= 0) return;

    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      await database.write(async () => {
        const currentPaid = Number(selectedDebt.totalPaid || (selectedDebt as any)._raw.total_paid || 0);
        const totalAmount = Number(selectedDebt.amount);
        const newTotalPaid = Number((currentPaid + val).toFixed(2));
        const walletId = (selectedDebt as any)._raw.wallet_id;

        await selectedDebt.update((d: any) => {
          d.totalPaid = newTotalPaid;
          d.isPaid = newTotalPaid >= totalAmount - 0.009; 
          if (d.isPaid) d.paidAt = Date.now();
        });

        const wallet = await database.get<Wallet>('wallets').find(walletId);
        await wallet.update(w => {
          if (selectedDebt.type === 'payable') w.balance -= val;
          else w.balance += val;
        });

        await database.get('transactions').create((t: any) => {
          t.amount = val;
          t.type = selectedDebt.type === 'payable' ? 'expense' : 'income';
          t.description = `Abatimento: ${selectedDebt.title}`;
          t.categoryName = selectedDebt.type === 'payable' ? 'Dívida' : 'Empréstimo';
          t.categoryIcon = 'receipt-long';
          t._raw.wallet_id = walletId; 
          t._raw.debt_id = selectedDebt.id;
          t.transactionDate = new Date(); 
        });
      });

      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeModal();
      fetchData();
    } catch (error) { 
      console.error(error);
      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erro", "Falha ao processar."); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const activeWallet = wallets.find((w) => w.id === user?.settings?.last_opened_wallet) || wallets[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      
      <MainHeader activeWallet={activeWallet} onWalletChange={fetchData} />

      <View style={styles.headerSection}>
        <View style={styles.compactFilterRow}>
          <View style={styles.tabGroup}>
            {["payable", "receivable"].map((tab) => {
              const isActive = activeTab === tab;
              const tabColor = tab === "payable" ? PAYABLE_COLOR : RECEIVABLE_COLOR;
              const tabBg = isActive ? tabColor : colors.card;
              const tabTextColor = isActive ? "#FFF" : colors.textSub;

              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.miniTab, { backgroundColor: tabBg, borderColor: isActive ? tabColor : colors.border }]}
                  onPress={() => {
                    if (hapticsEnabled && !isActive) Haptics.selectionAsync();
                    setActiveTab(tab as any);
                  }}
                >
                  <Text style={[styles.miniTabText, { color: tabTextColor }]}>
                    {tab === "payable" ? "A Pagar" : "A Receber"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.compactSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryMiniLabel, { color: colors.textSub }]}>Total: </Text>
            <Text style={[styles.summaryMiniValue, { color: ACTIVE_TAB_COLOR }]}>
              {formatDisplayCurrency(totals.pending)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.listWrapper}>
        <FlashList
          data={filteredDebts}
          keyExtractor={(item) => item.id}
          // @ts-ignore
          estimatedItemSize={120} 
          extraData={[hideValues, isDark, activeTab]}
          contentContainerStyle={[styles.listPadding, { paddingBottom: Math.max(insets.bottom + 80, 120) }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={40} color={colors.textSub} />
              <Text style={[styles.emptyText, { color: colors.textSub }]}>Nenhum registro encontrado.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const total = Number(item.amount);
            const paid = Number(item.totalPaid || (item as any)._raw.total_paid || 0);
            
            return (
              <DebtItem
                type={item.type === 'payable' ? 'debt' : 'loan'}
                title={item.title}
                description={item.entityName || "Particular"}
                totalValue={total} 
                remainingValue={total - paid}
                dueDate={item.dueDate || (item as any)._raw.due_date}
                createdAt={item.createdAt || (item as any)._raw.created_at}
                onPay={() => { 
                  setSelectedDebt(item); 
                  setAmountRaw(""); 
                  setDepositModalVisible(true); 
                }}
              />
            );
          }}
        />
      </View>

      <Modal 
        visible={depositModalVisible} 
        transparent 
        animationType="slide" 
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          
          <RNAnimated.View style={{ paddingBottom: keyboardPadding, width: '100%' }}>
            <View style={[styles.modalContent, { 
              backgroundColor: colors.card,
              paddingBottom: Math.max(insets.bottom + 20, 24) 
            }]}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View>
                  <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

                  <View style={styles.modalHeaderRow}>
                    <View style={{ width: 40 }} />
                    <View style={styles.modalTitleContainer}>
                      <Text style={[styles.modalTitle, { color: colors.text }]}>Abater Valor</Text>
                      <Text style={[styles.modalSubtitle, { color: colors.textSub }]}>{selectedDebt?.title || ""}</Text>
                    </View>
                    <TouchableOpacity onPress={closeModal} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <View style={[styles.closeIconBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                        <MaterialIcons name="close" size={20} color={colors.textSub} />
                      </View>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={[styles.infoBadge, { backgroundColor: infoBadgeBg }]}>
                      <Text style={[styles.infoBadgeText, { color: colors.textSub }]}>
                        Restante: <Text style={[styles.boldText, { color: colors.text }]}>
                          {hideValues ? 'R$ •••••' : 
                            Number(Number(selectedDebt?.amount || 0) - Number(selectedDebt?.totalPaid || (selectedDebt as any)?._raw.total_paid || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          }
                        </Text>
                      </Text>
                  </View>

                  <View style={[styles.inputWrapper, { backgroundColor: inputWrapperBg, borderColor: colors.border }]}>
                    <Text style={[styles.currencyPrefix, { color: colors.textSub }]}>R$</Text>
                    <TextInput 
                      style={[styles.modalInput, { color: colors.text }]} 
                      value={getFormattedAmountInput()} 
                      onChangeText={handleAmountChange} 
                      keyboardType="numeric" 
                      autoFocus={Platform.OS === 'ios'} 
                    />
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                        <Text style={[styles.boldText, { color: colors.textSub }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.confirmBtn, { backgroundColor: ACTIVE_TAB_COLOR }]} 
                      onPress={confirmDeposit} 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmBtnText}>Confirmar</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </RNAnimated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: { paddingTop: 12, paddingBottom: 8 }, 
  compactFilterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, gap: 8 },
  tabGroup: { flexDirection: 'row', gap: 6, flex: 1 },
  miniTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, minWidth: 80, alignItems: 'center' },
  miniTabText: { fontSize: 11, fontWeight: '800' },
  compactSummary: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  summaryMiniLabel: { fontSize: 10, fontWeight: '700' },
  summaryMiniValue: { fontSize: 12, fontWeight: '900' },
  listWrapper: { flex: 1 },
  listPadding: { paddingHorizontal: 16, paddingTop: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 12, fontSize: 13, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 16, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 20 },
  sheetHandle: { width: 48, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitleContainer: { flex: 1, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: "900", textAlign: "center", marginBottom: 4 },
  modalSubtitle: { fontSize: 13, textAlign: "center" },
  closeBtn: { padding: 4 },
  closeIconBg: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  infoBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  infoBadgeText: { fontSize: 12 },
  boldText: { fontWeight: 'bold' },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, height: 56, marginBottom: 24 },
  currencyPrefix: { fontSize: 18, fontWeight: "bold", marginRight: 6 },
  modalInput: { flex: 1, fontSize: 22, fontWeight: "900", textAlign: 'center' },
  modalButtons: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center' },
  confirmBtn: { flex: 2, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
});