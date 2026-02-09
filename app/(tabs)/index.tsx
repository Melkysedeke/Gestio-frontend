import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, router } from 'expo-router';

import api from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';

// Componentes
import CreateWalletModal from '../../components/CreateWalletModal';
import WalletSelectorModal from '../../components/WalletSelectorModal';
import NoWalletState from '../../components/NoWalletState';
import MainHeader from '../../components/MainHeader';

const COLORS = {
  primary: "#1773cf",
  primaryDark: "#0f4d8b",
  bgLight: "#f6f7f8",
  bgWhite: "#ffffff",
  textMain: "#111418",
  textGray: "#637588",
  expense: "#fa6238",
  income: "#0bda5b",
  border: "#e2e8f0"
};

export default function DashboardScreen() {
  const user = useAuthStore(state => state.user);
  const setHasWallets = useAuthStore(state => state.setHasWallets);
  const updateUserSetting = useAuthStore(state => state.updateUserSetting);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [wallets, setWallets] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]); 
  const [monthlyStats, setMonthlyStats] = useState({ income: 0, expense: 0 });
  const [growthPercentage, setGrowthPercentage] = useState(0);

  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const [modalVisible, setModalVisible] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);

  const availableMonths = useMemo(() => {
    const months = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date);
    }
    return months.reverse(); 
  }, []);

  const formatCurrency = (value: string | number) => {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const walletRes = await api.get('/wallets/');
      const allWallets = walletRes.data;
      setWallets(allWallets);
      
      const hasAnyWallet = allWallets.length > 0;
      setHasWallets(hasAnyWallet);

      const savedWalletExists = allWallets.find((w: any) => w.id === user.last_opened_wallet);
      const activeId = savedWalletExists ? savedWalletExists.id : (hasAnyWallet ? allWallets[0].id : null);

      if (activeId) {
        if (user.last_opened_wallet !== activeId) {
             updateUserSetting({ last_opened_wallet: activeId });
        }

        const transRes = await api.get(`/transactions?wallet_id=${activeId}`);
        const allTrans = transRes.data;

        const stats = allTrans.reduce((acc: any, t: any) => {
          const tDate = new Date(t.transaction_date);
          if (tDate.getMonth() === selectedMonth.getMonth() && 
              tDate.getFullYear() === selectedMonth.getFullYear()) {
            const val = Number(t.amount);
            if (t.type === 'income') acc.income += val;
            else acc.expense += val;
          }
          return acc;
        }, { income: 0, expense: 0 });

        const total = stats.income + stats.expense;
        const growth = total > 0 ? ((stats.income - stats.expense) / total) * 100 : 0;
        
        setGrowthPercentage(growth);
        setMonthlyStats(stats);
        setRecentTransactions(allTrans.slice(0, 5));
      } else {
        setMonthlyStats({ income: 0, expense: 0 });
        setRecentTransactions([]);
        setGrowthPercentage(0);
      }
    } catch (error) {
      console.error('Erro dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.last_opened_wallet, selectedMonth, updateUserSetting, setHasWallets]);

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, [fetchDashboardData]));

  const activeWallet = useMemo(() => {
      return wallets.find(w => w.id === user?.last_opened_wallet) || wallets[0];
  }, [wallets, user?.last_opened_wallet]);

  const handleSelectWallet = (walletId: number) => {
    updateUserSetting({ last_opened_wallet: walletId });
    setSelectorVisible(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWhite} />
      
      <MainHeader 
        user={user}
        activeWallet={activeWallet}
        onPressSelector={() => wallets.length === 0 ? setModalVisible(true) : setSelectorVisible(true)}
        onPressAdd={() => setModalVisible(true)}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboardData(); }} />}
      >
        {wallets.length === 0 ? (
          <NoWalletState onCreateWallet={() => setModalVisible(true)} />
        ) : (
          <>
            <View style={styles.filterWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {availableMonths.map((monthDate, index) => {
                  const isSelected = monthDate.getMonth() === selectedMonth.getMonth();
                  const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
                  return (
                    <TouchableOpacity 
                      key={index} 
                      style={[styles.filterItem, isSelected && styles.filterItemActive]}
                      onPress={() => setSelectedMonth(monthDate)}
                    >
                      <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                        {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <View style={styles.blurCircleTop} />
              <View style={styles.blurCircleBottom} />
              <View style={{ zIndex: 10 }}>
                <View style={styles.balanceHeader}>
                  <Text style={styles.balanceLabel}>Saldo Disponível</Text>
                  <View style={[styles.growthBadge, { backgroundColor: growthPercentage >= 0 ? 'rgba(11, 218, 91, 0.2)' : 'rgba(250, 98, 56, 0.2)' }]}>
                    <MaterialIcons name={growthPercentage >= 0 ? "trending-up" : "trending-down"} size={14} color={growthPercentage >= 0 ? COLORS.income : COLORS.expense} />
                    <Text style={[styles.growthText, { color: growthPercentage >= 0 ? COLORS.income : COLORS.expense }]}>{Math.abs(growthPercentage).toFixed(1)}%</Text>
                  </View>
                </View>
                <Text style={styles.balanceValue}>{formatCurrency(activeWallet?.balance || 0)}</Text> 
                <View style={styles.balanceBadgeContainer}>
                  <View style={styles.balanceBadgeIcon}><MaterialIcons name="account-balance-wallet" size={12} color="#FFF" /></View>
                  <Text style={styles.balanceBadgeText}>{activeWallet?.name}</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.statsRow}>
               <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIconBox, { backgroundColor: '#ecfdf5' }]}>
                    <MaterialIcons name="arrow-downward" size={18} color={COLORS.income} />
                  </View>
                  <Text style={styles.statLabel}>Entradas</Text>
                </View>
                <Text style={[styles.statValue, { color: COLORS.income }]}>{formatCurrency(monthlyStats.income)}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIconBox, { backgroundColor: '#fef2f2' }]}>
                    <MaterialIcons name="arrow-upward" size={18} color={COLORS.expense} />
                  </View>
                  <Text style={styles.statLabel}>Saídas</Text>
                </View>
                <Text style={[styles.statValue, { color: COLORS.expense }]}>{formatCurrency(monthlyStats.expense)}</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Atividade Recente</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                <Text style={styles.seeAllText}>Ver tudo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.transactionsList}>
              {recentTransactions.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: COLORS.textGray, marginTop: 10 }}>Nenhuma transação recente.</Text>
              ) : (
                  recentTransactions.map((item) => {
                    const isIncome = item.type === 'income';
                    return (
                      <TouchableOpacity 
                        key={item.id} 
                        style={styles.transactionItem}
                        onPress={() => router.push({ pathname: '/edit-transaction', params: { ...item } })}
                      >
                        <View style={styles.transactionLeft}>
                          <View style={[styles.transactionIcon, { backgroundColor: isIncome ? '#ecfdf5' : '#fef2f2' }]}>
                            <MaterialIcons name={item.category_icon || 'attach-money'} size={20} color={isIncome ? COLORS.income : COLORS.expense} />
                          </View>
                          <View style={{ flex: 1 }}> 
                            <Text style={styles.transactionTitle} numberOfLines={1}>
                                {item.category_name || 'Geral'}
                            </Text>
                            <Text style={styles.transactionDate} numberOfLines={1}>
                                {formatDate(item.transaction_date)}
                                {item.description ? ` • ${item.description}` : ''}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.transactionAmount, { color: isIncome ? COLORS.income : COLORS.expense }]}>
                          {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
              )}
            </View>
          </>
        )}
      </ScrollView>

      <WalletSelectorModal visible={selectorVisible} onClose={() => setSelectorVisible(false)} onSelect={handleSelectWallet} onAddPress={() => setModalVisible(true)} />
      <CreateWalletModal visible={modalVisible} onClose={() => setModalVisible(false)} onSuccess={() => fetchDashboardData()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100, gap: 16 },

  // Filter
  filterWrapper: { marginBottom: 4 },
  filterScroll: { gap: 12, paddingRight: 20 },
  filterItem: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.border },
  filterItemActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.textGray },
  filterTextActive: { color: '#FFF' },

  // Balance Card
  balanceCard: { width: '100%', borderRadius: 24, padding: 16, overflow: 'hidden', elevation: 8 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  growthBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  growthText: { fontSize: 12, fontWeight: '800' },
  blurCircleTop: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)' },
  blurCircleBottom: { position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  balanceValue: { color: '#FFF', fontSize: 36, fontWeight: '900', marginBottom: 16 },
  balanceBadgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  balanceBadgeIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  balanceBadgeText: { color: '#FFF', fontWeight: '700', fontSize: 12 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#f1f5f9', elevation: 1 },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  statIconBox: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textGray },
  statValue: { fontSize: 18, fontWeight: '900' },

  // Transactions
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textMain },
  seeAllText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  transactionsList: { gap: 4 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 8, borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9' },
  transactionLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  transactionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  transactionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMain, maxWidth: 160 },
  transactionDate: { fontSize: 12, color: COLORS.textGray, marginTop: 2 },
  transactionAmount: { fontSize: 16, fontWeight: '900' }
});