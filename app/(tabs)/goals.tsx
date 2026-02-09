import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  StatusBar, RefreshControl, Modal, TextInput, 
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';

import api from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';

import MainHeader from '../../components/MainHeader';
import WalletSelectorModal from '../../components/WalletSelectorModal';
import CreateWalletModal from '../../components/CreateWalletModal';
import ActionSheet from '../../components/ActionSheet';

const COLORS = {
  primary: "#1773cf",
  bgLight: "#f6f7f8",
  textMain: "#1e293b",
  textGray: "#64748b",
  success: "#0bda5b",
  danger: "#fa6238",
};

export default function GoalsScreen() {
  const user = useAuthStore(state => state.user);
  const updateUserSetting = useAuthStore(state => state.updateUserSetting);

  const [goals, setGoals] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectorVisible, setSelectorVisible] = useState(false);
  const [createWalletVisible, setCreateWalletVisible] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [amountValue, setAmountValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const walletRes = await api.get('/wallets');
      const allWallets = walletRes.data;
      setWallets(allWallets);

      const savedWalletExists = allWallets.find((w: any) => w.id === user.last_opened_wallet);
      const activeId = savedWalletExists ? savedWalletExists.id : (allWallets.length > 0 ? allWallets[0].id : null);

      if (activeId) {
        if (user.last_opened_wallet !== activeId) {
           updateUserSetting({ last_opened_wallet: activeId });
        }
        const goalRes = await api.get(`/goals?wallet_id=${activeId}`);
        setGoals(goalRes.data);
      } else {
        setGoals([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.last_opened_wallet]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const activeWallet = wallets.find(w => w.id === user?.last_opened_wallet) || wallets[0];

  const handleOpenAction = (goal: any, type: 'deposit' | 'withdraw') => {
    setSelectedGoal(goal);
    setActionType(type);
    setAmountValue('');
    setActionModalVisible(true);
  };

  const submitTransaction = async () => {
    const val = parseFloat(amountValue.replace(',', '.'));
    if (!val || val <= 0) return Alert.alert('Erro', 'Valor inválido');

    if (actionType === 'withdraw' && val > Number(selectedGoal.current_amount)) {
      return Alert.alert('Erro', 'Saldo insuficiente no objetivo.');
    }
    
    setSubmitting(true);
    try {
      const endpoint = actionType === 'deposit' ? 'deposit' : 'withdraw';
      await api.patch(`/goals/${selectedGoal.id}/${endpoint}`, {
        wallet_id: activeWallet.id,
        amount: val
      });
      setActionModalVisible(false);
      fetchData(); 
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Falha na transação');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: string | number) => {
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading && !refreshing) {
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
        onPressSelector={() => wallets.length === 0 ? setCreateWalletVisible(true) : setSelectorVisible(true)}
        onPressAdd={() => setActionSheetVisible(true)}
      />

      <FlatList
        data={goals}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="flag" size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>Nenhum objetivo definido.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const current = Number(item.current_amount);
          const target = Number(item.target_amount);
          const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
          const isCompleted = current >= target && target > 0;

          return (
            // TRANSFORMEI A VIEW PRINCIPAL EM UM BUTTON APENAS NA PARTE DE CIMA
            <View style={styles.card}>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => router.push({
                  pathname: '/edit-goal',
                  params: { 
                    id: item.id,
                    name: item.name,
                    target_amount: item.target_amount,
                    deadline: item.deadline
                  }
                })}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    <MaterialIcons name="savings" size={20} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <Text style={styles.cardDate}>Meta: {new Date(item.deadline).toLocaleDateString('pt-BR')}</Text>
                  </View>
                  {isCompleted && (
                    <View style={styles.completedBadge}>
                        <MaterialIcons name="check" size={12} color="#FFF" />
                        <Text style={styles.completedText}>Concluído</Text>
                    </View>
                  )}
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressLabelRow}>
                      <Text style={styles.progressPercentage}>{progress.toFixed(0)}%</Text>
                      <Text style={styles.progressValues}>
                          {formatCurrency(current)} / {formatCurrency(target)}
                      </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: isCompleted ? COLORS.success : COLORS.primary }]} />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Botões de Ação continuam aqui, fora do TouchableOpacity de edição */}
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionButtonOutline} onPress={() => handleOpenAction(item, 'withdraw')}>
                    <MaterialIcons name="remove" size={16} color={COLORS.danger} />
                    <Text style={[styles.actionText, { color: COLORS.danger }]}>Resgatar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButtonFilled} onPress={() => handleOpenAction(item, 'deposit')}>
                    <MaterialIcons name="add" size={16} color="#FFF" />
                    <Text style={styles.actionTextFilled}>Depositar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <ActionSheet 
        visible={actionSheetVisible} 
        context="goals" 
        onClose={() => setActionSheetVisible(false)} 
      />

      <Modal visible={actionModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
            <View style={styles.modalContentSmall}>
                <Text style={styles.modalTitle}>
                    {actionType === 'deposit' ? 'Guardar Dinheiro' : 'Resgatar Valor'}
                </Text>
                <Text style={styles.modalSubtitle}>
                    {actionType === 'deposit' 
                        ? `Quanto você quer guardar para "${selectedGoal?.name}"?` 
                        : `Quanto você vai retirar de "${selectedGoal?.name}"?`}
                </Text>

                <View style={styles.amountWrapper}>
                    <Text style={styles.currencySymbol}>R$</Text>
                    <TextInput 
                        style={styles.amountInput}
                        value={amountValue}
                        onChangeText={setAmountValue}
                        keyboardType="numeric"
                        placeholder="0,00"
                        autoFocus
                    />
                </View>

                <View style={styles.modalButtonsRow}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setActionModalVisible(false)}>
                        <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.confirmBtn, { backgroundColor: actionType === 'deposit' ? COLORS.primary : COLORS.danger }]} 
                        onPress={submitTransaction}
                        disabled={submitting}
                    >
                        {submitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.confirmText}>Confirmar</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      <WalletSelectorModal 
        visible={selectorVisible} 
        onClose={() => setSelectorVisible(false)} 
        onSelect={(id) => updateUserSetting({ last_opened_wallet: id })} 
        onAddPress={() => setCreateWalletVisible(true)}
      />
      <CreateWalletModal visible={createWalletVisible} onClose={() => setCreateWalletVisible(false)} onSuccess={fetchData} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  listContent: { padding: 16, paddingBottom: 100 },
  
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f9ff', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
  cardDate: { fontSize: 12, color: COLORS.textGray },
  completedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.success, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  completedText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  progressContainer: { marginBottom: 16 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressPercentage: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  progressValues: { fontSize: 12, color: COLORS.textGray },
  progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  cardActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 12 },
  actionButtonOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#fee2e2', gap: 6 },
  actionButtonFilled: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 8, backgroundColor: COLORS.primary, gap: 6 },
  actionText: { fontSize: 12, fontWeight: '700' },
  actionTextFilled: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  // Empty State Limpo
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: COLORS.textGray, marginTop: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContentSmall: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, width: '100%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textMain, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: COLORS.textGray, marginTop: 4, textAlign: 'center', marginBottom: 10 },
  amountWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 20, backgroundColor: '#f8fafc', borderRadius: 16, padding: 10 },
  currencySymbol: { fontSize: 20, fontWeight: 'bold', color: COLORS.textGray, marginRight: 8 },
  amountInput: { fontSize: 32, fontWeight: 'bold', color: COLORS.textMain, minWidth: 100, textAlign: 'center' },
  modalButtonsRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelText: { fontWeight: 'bold', color: COLORS.textGray },
  confirmText: { fontWeight: 'bold', color: '#FFF' },
});