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
import MainHeader from "../../components/MainHeader";
import WalletSelectorModal from "../../components/WalletSelectorModal";
import CreateWalletModal from "../../components/CreateWalletModal";

const COLORS = {
    primary: "#1773cf",
    bgLight: "#f6f7f8",
    textMain: "#1e293b",
    textGray: "#64748b",
    payable: "#fa6238",    // Laranja
    receivable: "#0bda5b",  // Verde
};

export default function DebtsScreen() {
  const user = useAuthStore((state) => state.user);
  const updateUserSetting = useAuthStore((state) => state.updateUserSetting);

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
  const [paymentValue, setPaymentValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FETCH DATA BLINDADO (Igual Dashboard/Transactions) ---
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 1. Busca Carteiras
      const walletRes = await api.get("/wallets");
      const allWallets = walletRes.data;
      setWallets(allWallets);

      // 2. Verifica se a carteira salva ainda existe
      const savedWalletExists = allWallets.find((w: any) => w.id === user.last_opened_wallet);
      const activeId = savedWalletExists ? savedWalletExists.id : (allWallets.length > 0 ? allWallets[0].id : null);

      if (activeId) {
         // Atualiza preferência se necessário
         if (user.last_opened_wallet !== activeId) {
            updateUserSetting({ last_opened_wallet: activeId });
         }

         // 3. Busca Dívidas
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
    // Fetch rodará automaticamente via useFocusEffect/useEffect dependendo do user
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

  // --- MODAL ACTIONS ---
  const openDepositModal = (debt: any) => {
    setSelectedDebt(debt);
    setPaymentValue("");
    setDepositModalVisible(true);
  };

  const confirmDeposit = async () => {
    const val = parseFloat(paymentValue.replace(",", "."));
    const pending = Number(selectedDebt.amount) - Number(selectedDebt.total_paid || 0);

    if (isNaN(val) || val <= 0) return Alert.alert("Erro", "Digite um valor válido");
    
    // Pequena margem de erro para ponto flutuante (0.01)
    if (val > pending + 0.01) return Alert.alert("Erro", "O valor excede o restante");

    setIsSubmitting(true);
    try {
      await api.patch(`/debts/${selectedDebt.id}/deposit`, {
        paymentAmount: val,
      });
      setDepositModalVisible(false);
      fetchData(); // Recarrega para atualizar saldos e progresso
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
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
     );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f7f8" />
      
      <MainHeader
        user={user}
        activeWallet={activeWallet}
        onPressSelector={() => wallets.length === 0 ? setCreateModalVisible(true) : setSelectorVisible(true)}
        onPressAdd={() => setCreateModalVisible(true)}
      />

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Restante Total</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: activeTab === "payable" ? COLORS.payable : COLORS.receivable },
            ]}
            numberOfLines={1}
          >
            {totals.pending.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Já Pago/Rec.</Text>
          <Text style={styles.summaryValue} numberOfLines={1}>
            {totals.paid.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        {["payable", "receivable"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab && styles.tabButtonTextActive,
              ]}
            >
              {tab === "payable" ? "A Pagar" : "A Receber"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredDebts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listPadding}
        // EMPTY STATE ADICIONADO
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <MaterialIcons name="assignment-late" size={50} color="#cbd5e1" />
                <Text style={styles.emptyText}>
                    Nenhum registro {activeTab === 'payable' ? 'a pagar' : 'a receber'}.
                </Text>
            </View>
        }
        renderItem={({ item }) => {
          const total = Number(item.amount);
          const paid = Number(item.total_paid || 0);
          const pending = total - paid;
          const progress = total > 0 ? Math.min(paid / total, 1) : 0;
          
          // Verifica vencimento apenas se não estiver pago
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
              style={[styles.card, overdue && styles.cardOverdue]}
            >
              <View style={styles.cardHeader}>
                {/* Flex 1 para empurrar o texto e truncar corretamente */}
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.debtTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.entityName} numberOfLines={1}>
                    {item.entity_name || "Particular"}
                  </Text>
                </View>

                {/* Valor alinhado à direita */}
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={[
                      styles.amount,
                      { color: activeTab === "payable" ? COLORS.payable : COLORS.receivable },
                    ]}
                  >
                    {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </Text>
                  <Text style={styles.pendingMini}>
                    Falta: {pending.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBg}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progress * 100}%`,
                        backgroundColor: activeTab === "payable" ? COLORS.payable : COLORS.receivable,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.dateRow}>
                  <MaterialIcons
                    name="event"
                    size={12}
                    color={overdue ? "#ef4444" : "#64748b"}
                  />
                  <Text
                    style={[
                      styles.dateText,
                      overdue && { color: "#ef4444", fontWeight: "bold" },
                    ]}
                  >
                    Vence: {new Date(item.due_date).toLocaleDateString("pt-BR")}
                  </Text>
                </View>

                {item.is_paid ? (
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidText}>Concluído</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.payBtn}
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Abater Valor</Text>
            <Text style={styles.modalSubtitle} numberOfLines={1}>
              {selectedDebt?.title}
            </Text>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>R$</Text>
              <TextInput
                style={styles.modalInput}
                value={paymentValue}
                onChangeText={setPaymentValue}
                keyboardType="numeric" // Use numeric para melhor compatibilidade
                autoFocus
                placeholder="0,00"
                placeholderTextColor="#cbd5e1"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDepositModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  { backgroundColor: activeTab === "payable" ? COLORS.payable : COLORS.receivable },
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
  container: { flex: 1, backgroundColor: "#f6f7f8" },
  
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 12,
    borderRadius: 12,
    ...Platform.select({ ios: { shadowOpacity: 0.05, shadowRadius: 5 }, android: { elevation: 2 } })
  },
  summaryItem: { flex: 1, alignItems: "center", paddingHorizontal: 4 },
  summaryLabel: { fontSize: 10, color: COLORS.textGray, fontWeight: "bold" },
  summaryValue: { fontSize: 13, fontWeight: "800", marginTop: 1, color: COLORS.textMain },
  divider: { width: 1, backgroundColor: COLORS.bgLight },
  
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
    backgroundColor: "#FFF",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tabButtonActive: { backgroundColor: COLORS.textMain, borderColor: COLORS.textMain },
  tabButtonText: { fontSize: 11, fontWeight: "700", color: COLORS.textGray },
  tabButtonTextActive: { color: "#FFF" },
  
  listPadding: { paddingHorizontal: 16, paddingBottom: 100 },
  
  // Estilo do Card
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardOverdue: { borderColor: "#fee2e2", backgroundColor: "#fffcfc" },
  
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  debtTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textMain },
  entityName: { fontSize: 11, color: COLORS.textGray },
  amount: { fontSize: 14, fontWeight: "800" },
  pendingMini: { fontSize: 10, color: COLORS.textGray },

  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 8,
  },
  progressBg: {
    flex: 1,
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 10, fontWeight: "bold", color: COLORS.textGray, width: 30, textAlign: 'right' },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
  },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText: { fontSize: 11, color: COLORS.textGray },
  
  paidBadge: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  paidText: { fontSize: 10, color: COLORS.receivable, fontWeight: "bold" },
  
  payBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  payBtnText: { color: "#FFF", fontSize: 11, fontWeight: "bold" },

  // Empty State
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: COLORS.textGray, marginTop: 10, fontSize: 14 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textMain,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textGray,
    textAlign: "center",
    marginBottom: 15,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  currencyPrefix: { fontSize: 16, fontWeight: "bold", color: COLORS.textGray, marginRight: 5 },
  modalInput: { flex: 1, height: 45, fontSize: 18, fontWeight: "bold", color: COLORS.textMain },
  
  modalButtons: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  cancelBtnText: { color: COLORS.textGray, fontWeight: "bold", fontSize: 13 },
  confirmBtn: { flex: 2, padding: 12, borderRadius: 10, alignItems: "center" },
  confirmBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 13 },
});