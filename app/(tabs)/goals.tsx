import React, { useState, useCallback, useMemo } from 'react'; 
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  StatusBar, RefreshControl, Modal, TextInput, 
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { Q } from '@nozbe/watermelondb';
import { FlashList } from '@shopify/flash-list';

// Banco de Dados, Models e Stores
import { database } from '../../src/database';
import { useAuthStore } from '../../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import Goal from '../../src/database/models/Goal';
import Wallet from '../../src/database/models/Wallet';

// Componentes
import MainHeader from '../../components/MainHeader';

export default function GoalsScreen() {
  // ✅ Removido o updateUserSetting (o MainHeader cuida da carteira agora)
  const { user } = useAuthStore();
  const hideValues = useAuthStore(state => state.hideValues);
  
  const { colors, isDark } = useThemeColor();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Removido o estado createWalletVisible

  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit');
  
  const [amountRaw, setAmountRaw] = useState(''); 
  const [submitting, setSubmitting] = useState(false);

  // Constantes de tema pré-calculadas
  const THEME_COLOR = colors.primary;
  const SUCCESS_COLOR = colors.success; 
  const DANGER_COLOR = colors.danger; 

  const iconBgColor = isDark ? 'rgba(23, 115, 207, 0.1)' : '#f0f9ff';
  const completedBadgeBg = isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4';
  const guardarBtnBg = isDark ? 'rgba(56, 189, 248, 0.1)' : '#f0f9ff';
  const infoBadgeBg = isDark ? '#1e293b' : '#f1f5f9';
  const amountWrapperBg = isDark ? '#1e293b' : '#f8fafc';

  const formatDisplayCurrency = (val: number) => {
    if (hideValues) return "R$ •••••";
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const allWallets = await database.get<Wallet>('wallets').query().fetch();
      setWallets(allWallets);
      const activeId = user?.settings?.last_opened_wallet || allWallets[0]?.id;

      if (activeId) {
        const goalRes = await database.get<Goal>('goals')
          .query(Q.where('wallet_id', activeId))
          .fetch();
        setGoals(goalRes);
      }
    } catch (error) {
      console.error("Erro goals:", error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, user?.settings?.last_opened_wallet]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const totalSaved = useMemo(() => {
    return goals.reduce((acc, g) => acc + Number(g.currentAmount || (g as any)._raw.current_amount || 0), 0);
  }, [goals]);

  const handleOpenAction = (goal: Goal, type: 'deposit' | 'withdraw') => {
    setSelectedGoal(goal);
    setActionType(type);
    setAmountRaw('');
    setActionModalVisible(true);
  };

  const handleAmountChange = (text: string) => setAmountRaw(text.replace(/\D/g, ""));

  const getFormattedAmountInput = () => {
    if (!amountRaw) return "0,00";
    return (parseInt(amountRaw) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const submitTransaction = async () => {
    const val = amountRaw ? parseInt(amountRaw) / 100 : 0;
    if (!val || val <= 0 || !selectedGoal) return;

    const currentGoalAmount = Number(selectedGoal.currentAmount || (selectedGoal as any)._raw.current_amount || 0);
    if (actionType === 'withdraw' && val > currentGoalAmount) {
      return Alert.alert('Aviso', 'Saldo insuficiente no objetivo.');
    }
    
    setSubmitting(true);
    try {
      await database.write(async () => {
        const activeId = user?.settings?.last_opened_wallet;
        
        await selectedGoal.update((g: any) => {
          g.currentAmount = actionType === 'deposit' ? currentGoalAmount + val : currentGoalAmount - val;
        });

        await database.get('transactions').create((t: any) => {
          t.amount = val;
          t.type = actionType === 'deposit' ? 'expense' : 'income'; 
          t.description = `${actionType === 'deposit' ? 'Guardado em' : 'Resgate de'}: ${selectedGoal.name}`;
          t.categoryName = 'Objetivo';
          t.categoryIcon = 'savings';
          t._raw.wallet_id = activeId;
          t._raw.goal_id = selectedGoal.id; 
          t.transactionDate = new Date();
        });

        const wallet = await database.get<Wallet>('wallets').find(activeId!);
        await wallet.update((w) => {
          if (actionType === 'deposit') w.balance -= val; 
          else w.balance += val; 
        });
      });

      setActionModalVisible(false);
      fetchData(); 
      Alert.alert('Sucesso', 'Operação realizada!');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha na operação.');
    } finally { setSubmitting(false); }
  };

  const activeWallet = wallets.find(w => w.id === user?.settings?.last_opened_wallet) || wallets[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* ✅ MainHeader atualizado para sincronizar com o estado global da carteira */}
      <MainHeader 
        activeWallet={activeWallet}
        onWalletChange={fetchData} 
      />

      <View style={styles.headerSection}>
        <View style={styles.compactFilterRow}>
          <View style={styles.headerInfoGroup}>
             <MaterialIcons name="flag" size={18} color={THEME_COLOR} />
             <Text style={[styles.headerLabel, { color: colors.text }]}>Meus Objetivos</Text>
          </View>
          <View style={[styles.compactSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
             <Text style={[styles.summaryLabel, { color: colors.textSub }]}>Total: </Text>
             <Text style={[styles.summaryMiniValue, { color: SUCCESS_COLOR }]}>
                {formatDisplayCurrency(totalSaved)}
             </Text>
          </View>
        </View>
      </View>

      <View style={styles.listWrapper}>
        <FlashList<Goal>
          data={goals}
          keyExtractor={(item) => item.id}
          // @ts-ignore
          estimatedItemSize={160}
          extraData={[hideValues, isDark]}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={THEME_COLOR} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={40} color={colors.textSub} />
              <Text style={[styles.emptyText, { color: colors.textSub }]}>Nenhum objetivo definido.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const current = Number(item.currentAmount || (item as any)._raw.current_amount || 0);
            const target = Number(item.targetAmount || (item as any)._raw.target_amount || 0);
            const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
            const isCompleted = progress >= 100;
            const deadline = new Date(item.deadline || (item as any)._raw.deadline);

            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/edit-goal', params: { id: item.id } })}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
                      <MaterialIcons name="savings" size={20} color={THEME_COLOR} />
                    </View>
                    <View style={styles.cardTitleContainer}>
                        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.cardDate, { color: colors.textSub }]}>Meta: {deadline.toLocaleDateString('pt-BR')}</Text>
                    </View>
                    {isCompleted && (
                      <View style={[styles.completedBadge, { backgroundColor: completedBadgeBg }]}>
                          <Text style={[styles.completedText, { color: SUCCESS_COLOR }]}>Concluído</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressLabelRow}>
                        <Text style={[styles.progressPercentage, { color: THEME_COLOR }]}>{progress.toFixed(0)}%</Text>
                        <Text style={[styles.progressValues, { color: colors.textSub }]}>
                            {formatDisplayCurrency(current)} / {formatDisplayCurrency(target)}
                        </Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                        <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: isCompleted ? SUCCESS_COLOR : THEME_COLOR }]} />
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenAction(item, 'withdraw')}>
                      <MaterialIcons name="remove-circle-outline" size={16} color={DANGER_COLOR} />
                      <Text style={[styles.actionText, { color: DANGER_COLOR }]}>Resgatar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: guardarBtnBg }]} onPress={() => handleOpenAction(item, 'deposit')}>
                      <MaterialIcons name="add-circle-outline" size={16} color={THEME_COLOR} />
                      <Text style={[styles.actionText, { color: THEME_COLOR }]}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </View>

      {/* Modal de Ação */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
            <View style={[styles.modalContentSmall, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {actionType === 'deposit' ? 'Guardar Dinheiro' : 'Resgatar Valor'}
                </Text>
                
                <View style={[styles.infoBadge, { backgroundColor: infoBadgeBg }]}>
                   <Text style={[styles.infoLabel, { color: colors.textSub }]}>
                     {actionType === 'deposit' ? 'Falta para a meta: ' : 'Saldo atual no objetivo: '}
                     <Text style={[styles.boldText, { color: colors.text }]}>
                       {actionType === 'deposit' 
                         ? (Number(selectedGoal?.targetAmount || 0) - Number(selectedGoal?.currentAmount || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                         : Number(selectedGoal?.currentAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                       }
                     </Text>
                   </Text>
                </View>

                <View style={[styles.amountWrapper, { backgroundColor: amountWrapperBg, borderColor: colors.border }]}>
                    <Text style={[styles.currencySymbol, { color: colors.textSub }]}>R$</Text>
                    <TextInput style={[styles.amountInput, { color: colors.text }]} value={getFormattedAmountInput()} onChangeText={handleAmountChange} keyboardType="numeric" autoFocus />
                </View>

                <View style={styles.modalButtonsRow}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setActionModalVisible(false)}>
                      <Text style={[styles.boldText, { color: colors.textSub }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: actionType === 'deposit' ? THEME_COLOR : DANGER_COLOR }]} onPress={submitTransaction} disabled={submitting}>
                        {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmText}>Confirmar</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ✅ Modais de WalletSelector e CreateWallet removidos (já estão no MainHeader) */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: { paddingTop: 12, paddingBottom: 8 },
  compactFilterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerInfoGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLabel: { fontSize: 16, fontWeight: '800' },
  compactSummary: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  summaryLabel: { fontSize: 10, fontWeight: '700'},
  summaryMiniValue: { fontSize: 12, fontWeight: '900' },
  listWrapper: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  card: { borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  iconBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitleContainer: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  cardDate: { fontSize: 11 },
  completedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  completedText: { fontSize: 10, fontWeight: 'bold' },
  progressContainer: { marginBottom: 14 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressPercentage: { fontSize: 14, fontWeight: '900' },
  progressValues: { fontSize: 11 },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  cardActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, paddingTop: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 10, gap: 6 },
  actionText: { fontSize: 12, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 12, fontSize: 13, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modalContentSmall: { borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  infoBadge: { padding: 10, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  infoLabel: { fontSize: 12 },
  boldText: { fontWeight: 'bold' },
  amountWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, height: 56, marginBottom: 24 },
  currencySymbol: { fontSize: 18, fontWeight: 'bold', marginRight: 6 },
  amountInput: { fontSize: 22, fontWeight: '900', minWidth: 100, textAlign: 'center' },
  modalButtonsRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, height: 48, justifyContent: 'center', alignItems: 'center' },
  confirmBtn: { flex: 2, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  confirmText: { fontWeight: 'bold', color: '#FFF', fontSize: 14 },
});