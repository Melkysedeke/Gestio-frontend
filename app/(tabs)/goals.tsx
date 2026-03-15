import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'; 
import { 
  View, Text, StyleSheet, StatusBar, RefreshControl, Modal, TextInput, 
  ActivityIndicator, Platform, Alert, TouchableWithoutFeedback, Keyboard, TouchableOpacity,
  Animated as RNAnimated
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Q } from '@nozbe/watermelondb';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';

import { database } from '../../src/database';
import { useAuthStore } from '../../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import Goal from '../../src/database/models/Goal';
import Wallet from '../../src/database/models/Wallet';

import MainHeader from '../../components/MainHeader';
import GoalItem from '../../components/GoalItem';

export default function GoalsScreen() {
  const { user, hideValues, hapticsEnabled } = useAuthStore();
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit');
  
  const [amountRaw, setAmountRaw] = useState(''); 
  const [submitting, setSubmitting] = useState(false);

  const THEME_COLOR = colors.primary;
  const SUCCESS_COLOR = colors.success; 
  const DANGER_COLOR = colors.danger; 

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

  const formatDisplayCurrency = useCallback((val: number) => {
    if (hideValues) return "R$ •••••";
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }, [hideValues]);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    if (!loading) setRefreshing(true); 

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
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.settings?.last_opened_wallet, loading]);

  useFocusEffect(
    useCallback(() => { 
      fetchData(); 
    }, [fetchData])
  );

  const totalSaved = useMemo(() => {
    return goals.reduce((acc, g) => acc + Number(g.currentAmount || (g as any)._raw.current_amount || 0), 0);
  }, [goals]);

  const triggerHaptic = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleOpenAction = (goal: Goal, type: 'deposit' | 'withdraw') => {
    setSelectedGoal(goal);
    setActionType(type);
    setAmountRaw('');
    setActionModalVisible(true);
  };

  const closeModal = () => {
    Keyboard.dismiss();
    setActionModalVisible(false);
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
      triggerHaptic();
      return Alert.alert('Aviso', 'Saldo insuficiente no objetivo.');
    }
    
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    Keyboard.dismiss();

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

      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeModal();
      fetchData(); 
    } catch (error) {
      console.error(error);
      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Falha na operação.');
    } finally { setSubmitting(false); }
  };

  const activeWallet = wallets.find(w => w.id === user?.settings?.last_opened_wallet) || wallets[0];

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      
      <MainHeader activeWallet={activeWallet} onWalletChange={fetchData} />

      <View style={styles.headerSection}>
        <View style={styles.compactFilterRow}>
          <View style={styles.headerInfoGroup}>
             <View style={[styles.iconIndicator, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#f0f9ff' }]}>
                <MaterialIcons name="flag" size={14} color={THEME_COLOR} />
             </View>
             <Text style={[styles.headerLabel, { color: colors.text }]}>Meus Objetivos</Text>
          </View>

          <View style={[styles.compactSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
             <Text style={[styles.summaryMiniLabel, { color: colors.textSub }]}>Total: </Text>
             <Text style={[styles.summaryMiniValue, { color: SUCCESS_COLOR }]}>
                {formatDisplayCurrency(totalSaved)}
             </Text>
          </View>
        </View>
      </View>

      <View style={styles.listWrapper}>
        <FlashList
          data={goals}
          keyExtractor={(item) => item.id}
          // @ts-ignore
          estimatedItemSize={120}
          extraData={[hideValues, isDark]}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 80, 120) }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={THEME_COLOR} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={40} color={colors.textSub} />
              <Text style={[styles.emptyText, { color: colors.textSub }]}>Nenhum objetivo definido.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <GoalItem 
              item={item as Goal}
              onDeposit={(goal) => handleOpenAction(goal, 'deposit')}
              onWithdraw={(goal) => handleOpenAction(goal, 'withdraw')}
            />
          )}
        />
      </View>

      <Modal 
        visible={actionModalVisible} 
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
                      <Text style={[styles.modalTitle, { color: colors.text }]}>
                        {actionType === 'deposit' ? 'Guardar Dinheiro' : 'Resgatar Valor'}
                      </Text>
                      <Text style={[styles.modalSubtitle, { color: colors.textSub }]}>{selectedGoal?.name || ""}</Text>
                    </View>
                    <TouchableOpacity onPress={closeModal} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <View style={[styles.closeIconBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                        <MaterialIcons name="close" size={20} color={colors.textSub} />
                      </View>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={[styles.infoBadge, { backgroundColor: infoBadgeBg }]}>
                      <Text style={[styles.infoBadgeText, { color: colors.textSub }]}>
                        {actionType === 'deposit' ? 'Falta para a meta: ' : 'Saldo atual no objetivo: '}
                        <Text style={[styles.boldText, { color: colors.text }]}>
                          {hideValues 
                            ? "R$ •••••" 
                            : (actionType === 'deposit' 
                              ? (Number(selectedGoal?.targetAmount || 0) - Number(selectedGoal?.currentAmount || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                              : Number(selectedGoal?.currentAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            )
                          }
                        </Text>
                      </Text>
                  </View>

                  <View style={[styles.inputWrapper, { backgroundColor: inputWrapperBg, borderColor: colors.border }]}>
                      <Text style={[styles.currencyPrefix, { color: colors.textSub }]}>R$</Text>
                      <TextInput 
                        style={[styles.amountInput, { color: colors.text }]} 
                        value={getFormattedAmountInput()} 
                        onChangeText={handleAmountChange} 
                        keyboardType="numeric" 
                        autoFocus={Platform.OS === 'ios'} 
                      />
                  </View>

                  <View style={styles.modalButtonsRow}>
                      <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                        <Text style={[styles.boldText, { color: colors.textSub }]}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.confirmBtn, { backgroundColor: actionType === 'deposit' ? THEME_COLOR : DANGER_COLOR }]} 
                        onPress={submitTransaction} 
                        disabled={submitting}
                      >
                          {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmText}>Confirmar</Text>}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSection: { paddingTop: 12, paddingBottom: 8 },
  compactFilterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerInfoGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconIndicator: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontSize: 14, fontWeight: '800' },
  compactSummary: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  summaryMiniLabel: { fontSize: 10, fontWeight: '700' },
  summaryMiniValue: { fontSize: 12, fontWeight: '900' },
  listWrapper: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 12, fontSize: 13, fontWeight: '500' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 16, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 20 },
  sheetHandle: { width: 48, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitleContainer: { flex: 1, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, textAlign: "center" },
  closeBtn: { padding: 4 },
  closeIconBg: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  infoBadge: { padding: 10, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  infoBadgeText: { fontSize: 12 },
  infoLabel: { fontSize: 12 },
  boldText: { fontWeight: 'bold' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, height: 56, marginBottom: 24 },
  currencyPrefix: { fontSize: 18, fontWeight: 'bold', marginRight: 6 },
  amountInput: { fontSize: 22, fontWeight: '900', minWidth: 100, textAlign: 'center' },
  modalButtonsRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center' },
  confirmBtn: { flex: 2, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  confirmText: { fontWeight: 'bold', color: '#FFF', fontSize: 14 },
});