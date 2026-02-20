import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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

import api from "../../src/services/api";
import { useAuthStore } from "../../src/stores/authStore";
import { useThemeColor } from "@/hooks/useThemeColor"; 

import MainHeader from "../../components/MainHeader";
import WalletSelectorModal from "../../components/WalletSelectorModal";
import CreateWalletModal from "../../components/CreateWalletModal";

export default function DebtsScreen() {
  const user = useAuthStore((state) => state.user);
  const updateUserSetting = useAuthStore((state) => state.updateUserSetting);
  const { colors, isDark } = useThemeColor();

  const [debts, setDebts] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"payable" | "receivable">("payable");
  
  // UI States
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados do Modal de Abatimento
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  
  // Máscara Monetária
  const [amountRaw, setAmountRaw] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cores Semânticas
  const PAYABLE_COLOR = "#fa6238";
  const RECEIVABLE_COLOR = "#0bda5b";
  const THEME_PRIMARY = "#1773cf";

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const walletRes = await api.get("/wallets");
      const allWallets = walletRes.data;
      setWallets(allWallets);

      const savedWalletExists = allWallets.find((w: any) => w.id === user.last_opened_wallet);
      const activeId = savedWalletExists ? savedWalletExists.id : (allWallets.length > 0 ? allWallets[0].id : null);

      if (activeId) {
         if (user.last_opened_wallet !== activeId) {
            updateUserSetting({ last_opened_wallet: activeId });
         }
         const debtRes = await api.get(`/debts?wallet_id=${activeId}`);
         setDebts(debtRes.data);
      } else {
         setDebts([]);
      }
    } catch (error: any) {
      console.error("Erro ao carregar dívidas:", error.message);
    } finally {
        setLoading(false);
    }
  }, [user?.id, user?.last_opened_wallet, updateUserSetting]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleSwitchWallet = (walletId: number) => {
    setSelectorVisible(false);
    updateUserSetting({ last_opened_wallet: walletId });
  };

  const { filteredDebts, totals } = useMemo(() => {
    const list = debts.filter((d) => d.type === activeTab);
    const stats = list.reduce(
      (acc, curr) => {
        const total = Number(curr.amount);
        const paid = Number(curr.total_paid || 0);
        acc.pending += total - paid;
        acc.paid += paid;
        return acc;
      },
      { paid: 0, pending: 0 }
    );

    return { filteredDebts: list, totals: stats };
  }, [debts, activeTab]);

  // --- MÁSCARA MONETÁRIA ---
  const handleAmountChange = (text: string) => {
    const onlyNumbers = text.replace(/\D/g, "");
    setAmountRaw(onlyNumbers);
  };

  const getFormattedAmountInput = () => {
    if (!amountRaw) return "0,00";
    const value = parseInt(amountRaw) / 100;
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  // --- MODAL ACTIONS ---
  const openDepositModal = (debt: any) => {
    setSelectedDebt(debt);
    setAmountRaw(""); 
    setDepositModalVisible(true);
  };

  const confirmDeposit = async () => {
    const val = amountRaw ? parseInt(amountRaw) / 100 : 0;
    const pending = Number(selectedDebt.amount) - Number(selectedDebt.total_paid || 0);

    if (val <= 0) return Alert.alert("Erro", "Digite um valor válido");
    if (val > pending + 0.01) return Alert.alert("Erro", "O valor excede o restante");

    setIsSubmitting(true);
    try {
      await api.patch(`/debts/${selectedDebt.id}/deposit`, {
        paymentAmount: val,
      });
      setDepositModalVisible(false);
      fetchData();
    } catch (error: any) {
      const serverError = error.response?.data?.error || "Erro de conexão";
      Alert.alert("Erro no Servidor", serverError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeWallet = wallets.find((w) => w.id === user?.last_opened_wallet) || wallets[0];

  if (loading && debts.length === 0) {
     return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={THEME_PRIMARY} />
        </View>
     );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <MainHeader
        user={user}
        activeWallet={activeWallet}
        onPressSelector={() => wallets.length === 0 ? setCreateModalVisible(true) : setSelectorVisible(true)}
        onPressAdd={() => setCreateModalVisible(true)}
      />

      {/* SUMÁRIO E ABAS (Fixos no topo) */}
      <View>
        <View style={[styles.summaryCard, { backgroundColor: colors.card, shadowColor: isDark ? "#000" : "#ccc" }]}>
            <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSub }]}>Restante Total</Text>
            <Text
                style={[
                styles.summaryValue,
                { color: activeTab === "payable" ? PAYABLE_COLOR : RECEIVABLE_COLOR },
                ]}
                numberOfLines={1}
            >
                {totals.pending.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSub }]}>Já Pago/Rec.</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]} numberOfLines={1}>
                {totals.paid.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </Text>
            </View>
        </View>

        <View style={styles.tabContainer}>
            {["payable", "receivable"].map((tab) => {
                const isActive = activeTab === tab;
                const activeColor = tab === "payable" ? PAYABLE_COLOR : RECEIVABLE_COLOR;
                
                return (
                <TouchableOpacity
                    key={tab}
                    style={[
                    styles.tabButton,
                    { 
                        backgroundColor: isActive ? activeColor : colors.card,
                        borderColor: isActive ? activeColor : colors.border
                    },
                    ]}
                    onPress={() => setActiveTab(tab as any)}
                >
                    <Text
                    style={[
                        styles.tabButtonText,
                        { color: isActive ? "#FFF" : colors.textSub },
                    ]}
                    >
                    {tab === "payable" ? "A Pagar" : "A Receber"}
                    </Text>
                </TouchableOpacity>
                );
            })}
        </View>
      </View>

      {/* LISTA (Agora ocupa o espaço restante com flex: 1) */}
      <FlatList
        data={filteredDebts}
        keyExtractor={(item) => String(item.id)}
        // CORREÇÃO AQUI: flex: 1 garante que a lista ocupe o resto da tela e scrolle
        style={{ flex: 1 }} 
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <MaterialIcons name="assignment-late" size={50} color={colors.textSub} />
                <Text style={[styles.emptyText, { color: colors.textSub }]}>
                    Nenhum registro {activeTab === 'payable' ? 'a pagar' : 'a receber'}.
                </Text>
            </View>
        }
        renderItem={({ item }) => {
          const total = Number(item.amount);
          const paid = Number(item.total_paid || 0);
          const pending = total - paid;
          const progress = total > 0 ? Math.min(paid / total, 1) : 0;
          
          const overdue = !item.is_paid && new Date(item.due_date) < new Date(new Date().setHours(0, 0, 0, 0));

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/edit-debt",
                  params: { id: item.id },
                })
              }
              style={[
                  styles.card, 
                  { 
                      backgroundColor: colors.card, 
                      borderColor: overdue ? PAYABLE_COLOR : colors.border,
                      borderWidth: overdue ? 1 : 1
                  }
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.debtTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.entityName, { color: colors.textSub }]} numberOfLines={1}>
                    {item.entity_name || "Particular"}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={[
                      styles.amount,
                      { color: activeTab === "payable" ? PAYABLE_COLOR : RECEIVABLE_COLOR },
                    ]}
                  >
                    {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </Text>
                  <Text style={[styles.pendingMini, { color: colors.textSub }]}>
                    Falta: {pending.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={[styles.progressBg, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progress * 100}%`,
                        backgroundColor: activeTab === "payable" ? PAYABLE_COLOR : RECEIVABLE_COLOR,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.textSub }]}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <View style={styles.dateRow}>
                  <MaterialIcons
                    name="event"
                    size={12}
                    color={overdue ? PAYABLE_COLOR : colors.textSub}
                  />
                  <Text
                    style={[
                      styles.dateText,
                      { color: overdue ? PAYABLE_COLOR : colors.textSub, fontWeight: overdue ? 'bold' : '400' },
                    ]}
                  >
                    Vence: {new Date(item.due_date).toLocaleDateString("pt-BR")}
                  </Text>
                </View>

                {item.is_paid ? (
                  <View style={[styles.paidBadge, { backgroundColor: activeTab === 'payable' ? '#fff7ed' : '#ecfdf5' }]}>
                    <Text style={[styles.paidText, { color: activeTab === 'payable' ? PAYABLE_COLOR : RECEIVABLE_COLOR }]}>Concluído</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.payBtn, { backgroundColor: THEME_PRIMARY }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      openDepositModal(item);
                    }}
                  >
                    <Text style={styles.payBtnText}>Abater</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Modal de Abatimento */}
      <Modal visible={depositModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Abater Valor</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSub }]} numberOfLines={1}>
              {selectedDebt?.title}
            </Text>
            
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
              <Text style={[styles.currencyPrefix, { color: colors.textSub }]}>R$</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text }]}
                value={getFormattedAmountInput()}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                autoFocus
                placeholder="0,00"
                placeholderTextColor={colors.textSub}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                onPress={() => setDepositModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSub }]}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  { backgroundColor: activeTab === "payable" ? PAYABLE_COLOR : RECEIVABLE_COLOR },
                ]}
                onPress={confirmDeposit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <WalletSelectorModal
        visible={selectorVisible}
        onClose={() => setSelectorVisible(false)}
        onSelect={handleSwitchWallet}
        onAddPress={() => setCreateModalVisible(true)}
      />

      <CreateWalletModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={fetchData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  summaryCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 12,
    borderRadius: 12,
    ...Platform.select({ ios: { shadowOpacity: 0.05, shadowRadius: 5 }, android: { elevation: 2 } })
  },
  summaryItem: { flex: 1, alignItems: "center", paddingHorizontal: 4 },
  summaryLabel: { fontSize: 10, fontWeight: "bold" },
  summaryValue: { fontSize: 13, fontWeight: "800", marginTop: 1 },
  divider: { width: 1 },
  
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  tabButtonText: { fontSize: 11, fontWeight: "700" },
  
  listPadding: { paddingHorizontal: 16, paddingBottom: 100 },
  
  // Estilo do Card
  card: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  debtTitle: { fontSize: 14, fontWeight: "700" },
  entityName: { fontSize: 11 },
  amount: { fontSize: 14, fontWeight: "800" },
  pendingMini: { fontSize: 10 },

  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 8,
  },
  progressBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 10, fontWeight: "bold", width: 30, textAlign: 'right' },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
  },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText: { fontSize: 11 },
  
  paidBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  paidText: { fontSize: 10, fontWeight: "bold" },
  
  payBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  payBtnText: { color: "#FFF", fontSize: 11, fontWeight: "bold" },

  // Empty State
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { marginTop: 10, fontSize: 14 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 15,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  currencyPrefix: { fontSize: 16, fontWeight: "bold", marginRight: 5 },
  modalInput: { flex: 1, height: 45, fontSize: 18, fontWeight: "bold" },
  
  modalButtons: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelBtnText: { fontWeight: "bold", fontSize: 13 },
  confirmBtn: { flex: 2, padding: 12, borderRadius: 10, alignItems: "center" },
  confirmBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 13 },
});