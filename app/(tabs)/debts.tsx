import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";
import { Q } from "@nozbe/watermelondb";
import { FlashList } from "@shopify/flash-list";

// Banco de Dados e Stores
import { database } from "../../src/database";
import { useAuthStore } from "../../src/stores/authStore";
import { useThemeColor } from "@/hooks/useThemeColor"; 
import Wallet from '../../src/database/models/Wallet';
import Debt from '../../src/database/models/Debt';

// Componentes
import MainHeader from "../../components/MainHeader";

export default function DebtsScreen() {
  const { user } = useAuthStore();
  const hideValues = useAuthStore(state => state.hideValues); 
  const { colors, isDark } = useThemeColor();

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

  const paidBadgeBg = isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4';
  const infoBadgeBg = isDark ? '#1e293b' : '#f1f5f9';
  const inputWrapperBg = isDark ? '#1e293b' : '#f8fafc';

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

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

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

  const confirmDeposit = async () => {
    const val = amountRaw ? parseInt(amountRaw) / 100 : 0;
    if (!selectedDebt || val <= 0) return;
    setIsSubmitting(true);
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
      setDepositModalVisible(false);
      fetchData();
      Alert.alert("Sucesso", "Abatimento registrado!");
    } catch (error) { 
      console.error(error);
      Alert.alert("Erro", "Falha ao processar."); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const activeWallet = wallets.find((w) => w.id === user?.settings?.last_opened_wallet) || wallets[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <MainHeader 
        activeWallet={activeWallet}
        onWalletChange={fetchData} 
      />

      <View style={styles.headerSection}>
        <View style={styles.compactFilterRow}>
          <View style={styles.tabGroup}>
            {["payable", "receivable"].map((tab) => {
              const isActive = activeTab === tab;
              const tabColor = tab === "payable" ? PAYABLE_COLOR : RECEIVABLE_COLOR;
              const tabBg = isActive ? tabColor : colors.card;
              const tabBorder = isActive ? tabColor : colors.border;
              const tabTextColor = isActive ? "#FFF" : colors.textSub;

              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.miniTab, { backgroundColor: tabBg, borderColor: tabBorder }]}
                  onPress={() => setActiveTab(tab as any)}
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
          estimatedItemSize={130}
          extraData={[hideValues, isDark, activeTab]}
          contentContainerStyle={styles.listPadding}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={40} color={colors.textSub} />
              <Text style={[styles.emptyText, { color: colors.textSub }]}>Nenhum registro encontrado.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const total = Number(item.amount);
            const paid = Number(item.totalPaid || (item as any)._raw.total_paid || 0);
            const pending = total - paid;
            const progress = total > 0 ? Math.min(paid / total, 1) : 0;
            const isFinished = item.isPaid || (item as any)._raw.is_paid;
            
            // ✅ Resgatando a data de criação e formatação
            const createdAt = new Date(item.createdAt || (item as any)._raw.created_at || Date.now());
            const dueDate = new Date(item.dueDate || (item as any)._raw.due_date);
            const isOverdue = !isFinished && dueDate < new Date(new Date().setHours(0, 0, 0, 0));

            const cardBorderColor = isOverdue ? colors.danger : colors.border;
            const dateColor = isOverdue ? colors.danger : colors.textSub;

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: "/edit-debt", params: { id: item.id } })}
                style={[styles.card, { backgroundColor: colors.card, borderColor: cardBorderColor }]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={[styles.debtTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.entityName, { color: colors.textSub }]}>{item.entityName || "Particular"}</Text>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <Text style={[styles.amount, { color: ACTIVE_TAB_COLOR }]}>
                        {formatDisplayCurrency(total)}
                    </Text>
                    <Text style={[styles.pendingMini, { color: colors.textSub }]}>
                        Falta: {formatDisplayCurrency(pending)}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: ACTIVE_TAB_COLOR }]} />
                  </View>
                  <Text style={[styles.progressText, { color: colors.textSub }]}>{Math.round(progress * 100)}%</Text>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  {/* ✅ Nova coluna de datas empilhadas */}
                  <View style={styles.datesColumn}>
                    <View style={styles.dateRow}>
                      <MaterialIcons name="calendar-today" size={11} color={colors.textSub} />
                      <Text style={[styles.dateText, { color: colors.textSub }]}>
                        Criado: {createdAt.toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                    <View style={styles.dateRow}>
                      <MaterialIcons name="event" size={12} color={dateColor} />
                      <Text style={[styles.dateText, { color: dateColor }]}>
                        {isOverdue ? "Atrasado" : "Vence"}: {dueDate.toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                  </View>

                  {isFinished ? (
                    <View style={[styles.paidBadge, { backgroundColor: paidBadgeBg }]}>
                      <Text style={[styles.paidText, { color: colors.success }]}>Concluído</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.payBtn, { backgroundColor: colors.primary }]}
                      onPress={(e) => { e.stopPropagation(); setSelectedDebt(item); setAmountRaw(""); setDepositModalVisible(true); }}
                    >
                      <Text style={styles.payBtnText}>Abater</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <Modal visible={depositModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Abater Valor</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSub }]}>{selectedDebt?.title}</Text>
            
            <View style={[styles.infoBadge, { backgroundColor: infoBadgeBg }]}>
                <Text style={[styles.infoBadgeText, { color: colors.textSub }]}>
                Restante: <Text style={[styles.boldText, { color: colors.text }]}>
                    {Number(Number(selectedDebt?.amount || 0) - Number(selectedDebt?.totalPaid || (selectedDebt as any)?._raw.total_paid || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
                </Text>
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: inputWrapperBg, borderColor: colors.border }]}>
              <Text style={[styles.currencyPrefix, { color: colors.textSub }]}>R$</Text>
              <TextInput style={[styles.modalInput, { color: colors.text }]} value={getFormattedAmountInput()} onChangeText={handleAmountChange} keyboardType="numeric" autoFocus />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDepositModalVisible(false)}>
                  <Text style={[styles.boldText, { color: colors.textSub }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: ACTIVE_TAB_COLOR }]} onPress={confirmDeposit} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmBtnText}>Confirmar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  listPadding: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  card: { borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardHeaderLeft: { flex: 1 },
  cardHeaderRight: { alignItems: "flex-end" },
  debtTitle: { fontSize: 14, fontWeight: "700" },
  entityName: { fontSize: 11, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: "900" },
  pendingMini: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 10 },
  progressBg: { flex: 1, height: 6, borderRadius: 3 },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 10, fontWeight: "bold", width: 30 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTopWidth: 1 },
  datesColumn: { gap: 4, justifyContent: 'center' }, // ✅ Estilo adicionado para empilhar as datas
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText: { fontSize: 11, fontWeight: '600' },
  paidBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  paidText: { fontSize: 10, fontWeight: "bold" },
  payBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  payBtnText: { color: "#FFF", fontSize: 11, fontWeight: "bold" },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 12, fontSize: 13, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 },
  modalContent: { borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "900", textAlign: "center", marginBottom: 4 },
  modalSubtitle: { fontSize: 13, textAlign: "center", marginBottom: 20 },
  infoBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  infoBadgeText: { fontSize: 12 },
  boldText: { fontWeight: 'bold' },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, height: 50, marginBottom: 20 },
  currencyPrefix: { fontSize: 16, fontWeight: "bold", marginRight: 4 },
  modalInput: { flex: 1, fontSize: 18, fontWeight: "900" },
  modalButtons: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, height: 45, justifyContent: 'center', alignItems: 'center' },
  confirmBtn: { flex: 2, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 13 },
});