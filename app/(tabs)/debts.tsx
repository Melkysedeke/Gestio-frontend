import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  StatusBar, Alert, Modal, TextInput, KeyboardAvoidingView, 
  Platform, ActivityIndicator 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';

// Imports internos
import api from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import MainHeader from '../../components/MainHeader';
import WalletSelectorModal from '../../components/WalletSelectorModal';
import CreateWalletModal from '../../components/CreateWalletModal';

export default function DebtsScreen() {
  const user = useAuthStore(state => state.user);
  const updateUserSetting = useAuthStore(state => state.updateUserSetting);
  
  const [debts, setDebts] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'payable' | 'receivable'>('payable');
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Estados do Modal de Abatimento
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [paymentValue, setPaymentValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [walletRes, debtRes] = await Promise.all([
        api.get('/wallets', { params: { userId: user.id } }),
        user.last_opened_wallet 
          ? api.get(`/debts?wallet_id=${user.last_opened_wallet}`)
          : Promise.resolve({ data: [] })
      ]);
      setWallets(walletRes.data);
      setDebts(debtRes.data);
    } catch (error: any) {
      console.error("Erro ao carregar dívidas:", error.message);
    }
  }, [user?.id, user?.last_opened_wallet]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleSwitchWallet = (walletId: number) => {
    setSelectorVisible(false);
    updateUserSetting({ last_opened_wallet: walletId });
  };

  const { filteredDebts, totals } = useMemo(() => {
    const list = debts.filter(d => d.type === activeTab);
    const stats = list.reduce((acc, curr) => {
      const total = Number(curr.amount);
      const paid = Number(curr.total_paid || 0);
      acc.pending += (total - paid);
      acc.paid += paid;
      return acc;
    }, { paid: 0, pending: 0 });

    return { filteredDebts: list, totals: stats };
  }, [debts, activeTab]);

  const openDepositModal = (debt: any) => {
    setSelectedDebt(debt);
    setPaymentValue('');
    setDepositModalVisible(true);
  };

  const confirmDeposit = async () => {
    const val = parseFloat(paymentValue.replace(',', '.'));
    const pending = Number(selectedDebt.amount) - Number(selectedDebt.total_paid || 0);

    if (isNaN(val) || val <= 0) return Alert.alert("Erro", "Digite um valor válido");
    if (val > pending + 0.01) return Alert.alert("Erro", "O valor excede o restante");

    setIsSubmitting(true);
    try {
      await api.patch(`/debts/${selectedDebt.id}/deposit`, { paymentAmount: val });
      setDepositModalVisible(false);
      fetchData();
    } catch (error: any) {
      const serverError = error.response?.data?.error || "Erro de conexão";
      Alert.alert("Erro no Servidor", serverError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeWallet = wallets.find(w => w.id === user?.last_opened_wallet) || wallets[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* CORRIGIDO: Adicionado onPressAdd */}
      <MainHeader 
        user={user} 
        activeWallet={activeWallet} 
        onPressSelector={() => setSelectorVisible(true)}
        onPressAdd={() => setCreateModalVisible(true)} 
      />

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Restante Total</Text>
          <Text style={[styles.summaryValue, { color: activeTab === 'payable' ? '#fa6238' : '#0bda5b' }]} numberOfLines={1}>
            {totals.pending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Já Pago/Rec.</Text>
          <Text style={styles.summaryValue} numberOfLines={1}>{totals.paid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        {['payable', 'receivable'].map((tab) => (
          <TouchableOpacity 
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
              {tab === 'payable' ? 'A Pagar' : 'A Receber'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredDebts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listPadding}
        renderItem={({ item }) => {
          const total = Number(item.amount);
          const paid = Number(item.total_paid || 0);
          const pending = total - paid;
          const progress = Math.min(paid / total, 1);
          const overdue = !item.is_paid && new Date(item.due_date) < new Date(new Date().setHours(0,0,0,0));

          return (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/edit-debt-loan', params: { id: item.id } })}
              style={[styles.card, overdue && styles.cardOverdue]}
            >
              <View style={styles.cardHeader}>
                {/* RESPONSIVIDADE: Flex 1 para o texto não vazar */}
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.debtTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.entityName} numberOfLines={1}>{item.entity_name || 'Particular'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.amount, { color: activeTab === 'payable' ? '#fa6238' : '#0bda5b' }]}>
                    {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </Text>
                  <Text style={styles.pendingMini}>Falta: {pending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: activeTab === 'payable' ? '#fa6238' : '#0bda5b' }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.dateRow}>
                  <MaterialIcons name="event" size={12} color={overdue ? '#ef4444' : '#64748b'} />
                  <Text style={[styles.dateText, overdue && { color: '#ef4444', fontWeight: 'bold' }]}>
                    Vence: {new Date(item.due_date).toLocaleDateString('pt-BR')}
                  </Text>
                </View>

                {item.is_paid ? (
                  <View style={styles.paidBadge}><Text style={styles.paidText}>Concluído</Text></View>
                ) : (
                  <TouchableOpacity 
                    style={styles.payBtn} 
                    onPress={(e) => { e.stopPropagation(); openDepositModal(item); }}
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Abater Valor</Text>
            <Text style={styles.modalSubtitle} numberOfLines={1}>{selectedDebt?.title}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>R$</Text>
              <TextInput
                style={styles.modalInput}
                value={paymentValue}
                onChangeText={setPaymentValue}
                keyboardType="numeric"
                autoFocus
                placeholder="0,00"
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDepositModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmBtn, { backgroundColor: activeTab === 'payable' ? '#fa6238' : '#0bda5b' }]} 
                onPress={confirmDeposit}
                disabled={isSubmitting}
              >
                {isSubmitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.confirmBtnText}>Confirmar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* CORRIGIDO: Adicionado onAddPress e Modal de Criação */}
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
  container: { flex: 1, backgroundColor: '#f6f7f8' },
  summaryCard: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 16, marginVertical: 10, padding: 12, borderRadius: 12, elevation: 1 },
  summaryItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  summaryLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
  summaryValue: { fontSize: 13, fontWeight: '800', marginTop: 1 },
  divider: { width: 1, backgroundColor: '#f1f5f9' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tabButton: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  tabButtonActive: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
  tabButtonText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  tabButtonTextActive: { color: '#FFF' },
  listPadding: { paddingHorizontal: 16, paddingBottom: 100 },
  
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  cardOverdue: { borderColor: '#fee2e2', backgroundColor: '#fffcfc' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  debtTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  entityName: { fontSize: 11, color: '#94a3b8' },
  amount: { fontSize: 14, fontWeight: '800' },
  pendingMini: { fontSize: 10, color: '#94a3b8' },
  
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8 },
  progressBg: { flex: 1, height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 10, fontWeight: 'bold', color: '#64748b', width: 30 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11, color: '#64748b' },
  paidBadge: { backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  paidText: { fontSize: 10, color: '#0bda5b', fontWeight: 'bold' },
  payBtn: { backgroundColor: '#1773cf', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  payBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  modalSubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 15 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, marginBottom: 15 },
  currencyPrefix: { fontSize: 16, fontWeight: 'bold', color: '#94a3b8', marginRight: 5 },
  modalInput: { flex: 1, height: 45, fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  modalButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#f1f5f9' },
  cancelBtnText: { color: '#64748b', fontWeight: 'bold', fontSize: 13 },
  confirmBtn: { flex: 2, padding: 12, borderRadius: 10, alignItems: 'center' },
  confirmBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
});