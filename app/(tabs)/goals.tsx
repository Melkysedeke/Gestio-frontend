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
import { useThemeColor } from '@/hooks/useThemeColor'; // <--- Hook de Tema

import MainHeader from '../../components/MainHeader';
import WalletSelectorModal from '../../components/WalletSelectorModal';
import CreateWalletModal from '../../components/CreateWalletModal';
import ActionSheet from '../../components/ActionSheet';

export default function GoalsScreen() {
  const user = useAuthStore(state => state.user);
  const updateUserSetting = useAuthStore(state => state.updateUserSetting);
  const { colors, isDark } = useThemeColor(); // <--- Cores Dinâmicas

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
  
  // Lógica de Valor (Mask)
  const [amountRaw, setAmountRaw] = useState(''); 
  const [submitting, setSubmitting] = useState(false);

  // Cores Semânticas Fixas
  const THEME_COLOR = '#1773cf';
  const SUCCESS_COLOR = '#0bda5b';
  const DANGER_COLOR = '#fa6238';

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
  }, [user?.id, user?.last_opened_wallet, updateUserSetting]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const activeWallet = wallets.find(w => w.id === user?.last_opened_wallet) || wallets[0];

  // --- HANDLERS ---
  const handleOpenAction = (goal: any, type: 'deposit' | 'withdraw') => {
    setSelectedGoal(goal);
    setActionType(type);
    setAmountRaw(''); // Limpa valor
    setActionModalVisible(true);
  };

  // Máscara Monetária (Direita -> Esquerda)
  const handleAmountChange = (text: string) => {
    const onlyNumbers = text.replace(/\D/g, "");
    setAmountRaw(onlyNumbers);
  };

  const getFormattedAmountInput = () => {
    if (!amountRaw) return "0,00";
    const value = parseInt(amountRaw) / 100;
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const submitTransaction = async () => {
    const val = amountRaw ? parseInt(amountRaw) / 100 : 0;

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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <MainHeader 
        user={user}
        activeWallet={activeWallet}
        onPressSelector={() => wallets.length === 0 ? setCreateWalletVisible(true) : setSelectorVisible(true)}
        // onPressAdd removido para consistência
      />

      <FlatList
        data={goals}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={THEME_COLOR} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="flag" size={60} color={colors.textSub} />
            <Text style={[styles.emptyText, { color: colors.textSub }]}>Nenhum objetivo definido.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const current = Number(item.current_amount);
          const target = Number(item.target_amount);
          const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
          const isCompleted = current >= target && target > 0;

          return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                  <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(23, 115, 207, 0.15)' : '#f0f9ff' }]}>
                    <MaterialIcons name="savings" size={20} color={THEME_COLOR} />
                  </View>
                  <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.cardDate, { color: colors.textSub }]}>Meta: {new Date(item.deadline).toLocaleDateString('pt-BR')}</Text>
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
                      <Text style={[styles.progressPercentage, { color: THEME_COLOR }]}>{progress.toFixed(0)}%</Text>
                      <Text style={[styles.progressValues, { color: colors.textSub }]}>
                          {formatCurrency(current)} / {formatCurrency(target)}
                      </Text>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
                      <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: isCompleted ? SUCCESS_COLOR : THEME_COLOR }]} />
                  </View>
                </View>
              </TouchableOpacity>

              <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
                <TouchableOpacity 
                    style={[styles.actionButtonOutline, { borderColor: isDark ? '#7f1d1d' : '#fee2e2' }]} 
                    onPress={() => handleOpenAction(item, 'withdraw')}
                >
                    <MaterialIcons name="remove" size={16} color={DANGER_COLOR} />
                    <Text style={[styles.actionText, { color: DANGER_COLOR }]}>Resgatar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.actionButtonFilled, { backgroundColor: THEME_COLOR }]} 
                    onPress={() => handleOpenAction(item, 'deposit')}
                >
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

      {/* MODAL DE DEPÓSITO/RESGATE PADRONIZADO */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
            <View style={[styles.modalContentSmall, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {actionType === 'deposit' ? 'Guardar Dinheiro' : 'Resgatar Valor'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSub }]}>
                    {actionType === 'deposit' 
                        ? `Quanto você quer guardar para "${selectedGoal?.name}"?` 
                        : `Quanto você vai retirar de "${selectedGoal?.name}"?`}
                </Text>

                <View style={[styles.amountWrapper, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border, borderWidth: 1 }]}>
                    <Text style={[styles.currencySymbol, { color: colors.textSub }]}>R$</Text>
                    <TextInput 
                        style={[styles.amountInput, { color: colors.text }]}
                        value={getFormattedAmountInput()}
                        onChangeText={handleAmountChange}
                        keyboardType="numeric"
                        placeholder="0,00"
                        placeholderTextColor={colors.textSub}
                        autoFocus
                    />
                </View>

                <View style={styles.modalButtonsRow}>
                    <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]} onPress={() => setActionModalVisible(false)}>
                        <Text style={[styles.cancelText, { color: colors.textSub }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.confirmBtn, { backgroundColor: actionType === 'deposit' ? THEME_COLOR : DANGER_COLOR }]} 
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
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100 },
  
  card: { borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardDate: { fontSize: 12 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0bda5b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  completedText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  progressContainer: { marginBottom: 16 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressPercentage: { fontSize: 14, fontWeight: '800' },
  progressValues: { fontSize: 12 },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  cardActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, paddingTop: 12 },
  actionButtonOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 8, borderWidth: 1, gap: 6 },
  actionButtonFilled: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 8, gap: 6 },
  actionText: { fontSize: 12, fontWeight: '700' },
  actionTextFilled: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContentSmall: { borderRadius: 24, padding: 24, width: '100%' },
  modalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  modalSubtitle: { fontSize: 14, marginTop: 4, textAlign: 'center', marginBottom: 10 },
  amountWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 20, borderRadius: 16, padding: 10 },
  currencySymbol: { fontSize: 20, fontWeight: 'bold', marginRight: 8 },
  amountInput: { fontSize: 32, fontWeight: 'bold', minWidth: 100, textAlign: 'center' },
  modalButtonsRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelText: { fontWeight: 'bold' },
  confirmText: { fontWeight: 'bold', color: '#FFF' },
});