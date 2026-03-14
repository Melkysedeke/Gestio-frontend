import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, router } from 'expo-router';
import { Q } from '@nozbe/watermelondb';

// Stores & DB
import { database } from '../../src/database';
import { useAuthStore } from '../../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import Wallet from '../../src/database/models/Wallet';
import Transaction from '../../src/database/models/Transaction';

// Componentes
import NoWalletState from '../../components/NoWalletState';
import MainHeader from '../../components/MainHeader';
import MonthSelector from '../../components/MonthSelector'; 
import MonthlyReport from '../../components/MonthlyReport';
import TransactionItem from '../../components/TransactionItem'; // 🚀 Novo Componente

export default function DashboardScreen() {
  const { user, setHasWallets, lastSyncTime } = useAuthStore();
  const hideValues = useAuthStore(state => state.hideValues);
  const { colors, isDark } = useThemeColor();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]); 
  const [monthlyStats, setMonthlyStats] = useState({ income: 0, expense: 0 });
  const [growthPercentage, setGrowthPercentage] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const lastOpenedWalletId = user?.settings?.last_opened_wallet;

  // 🚀 Memoização pesada das funções de formatação
  const formatCurrency = useCallback((value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }, []);

  const formatDisplayCurrency = useCallback((value: number) => {
    if (hideValues) return "R$ •••••"; 
    return formatCurrency(value);
  }, [hideValues, formatCurrency]);

  const fetchDashboardData = useCallback(async () => {
    const freshUser = useAuthStore.getState().user;
    if (!freshUser?.id) return;

    try {
      const allWallets = await database.get<Wallet>('wallets')
        .query(Q.where('deleted_at', Q.eq(null)))
        .fetch();
      
      setWallets(allWallets);
      setHasWallets(allWallets.length > 0);

      const activeId = freshUser.settings?.last_opened_wallet || allWallets[0]?.id;
      const activeWallet = allWallets.find(w => w.id === activeId) || allWallets[0];

      if (activeWallet) {
        const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getTime();
        const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59).getTime();

        // 🚀 Busca transações do mês para estatísticas
        const monthTrans = await database.get<Transaction>('transactions')
          .query(
            Q.where('wallet_id', activeWallet.id),
            Q.where('transaction_date', Q.gte(startOfMonth)),
            Q.where('transaction_date', Q.lte(endOfMonth)),
            Q.where('deleted_at', Q.eq(null))
          ).fetch();

        // 🚀 Busca APENAS as últimas 5 globalmente para a lista
        const recentTrans = await database.get<Transaction>('transactions')
          .query(
            Q.where('wallet_id', activeWallet.id),
            Q.where('deleted_at', Q.eq(null)),
            Q.sortBy('transaction_date', Q.desc),
            Q.take(5)
          ).fetch();

        const stats = monthTrans.reduce((acc, t) => {
          const val = Number(t.amount); 
          if (t.type === 'income') acc.income += val;
          else acc.expense += val;
          return acc;
        }, { income: 0, expense: 0 });

        const totalVolume = stats.income + stats.expense;
        setGrowthPercentage(totalVolume > 0 ? ((stats.income - stats.expense) / totalVolume) * 100 : 0);
        setMonthlyStats(stats);
        setRecentTransactions(recentTrans); 
      }
    } catch (error) {
      console.error('Erro dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth, setHasWallets]); 

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, [fetchDashboardData]));
  useEffect(() => { fetchDashboardData(); }, [lastSyncTime, fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const activeWallet = useMemo(() => wallets.find(w => w.id === lastOpenedWalletId) || wallets[0], [wallets, lastOpenedWalletId]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <MainHeader activeWallet={activeWallet} onWalletChange={fetchDashboardData} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {wallets.length === 0 ? (
          <NoWalletState onSuccess={fetchDashboardData} />
        ) : (
          <>
            <MonthSelector selectedDate={selectedMonth} onMonthChange={setSelectedMonth} />

            {/* 1. Card Hero */}
            <LinearGradient
              colors={[colors.primary, '#0f4d8b']} 
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <MaterialIcons name="account-balance-wallet" size={110} color="rgba(255,255,255,0.15)" style={styles.bgIcon} />
              
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Saldo Disponível</Text>
                <View style={styles.growthBadge}>
                  <MaterialIcons name={growthPercentage >= 0 ? "trending-up" : "trending-down"} size={14} color="#FFF" />
                  <Text style={styles.growthText}>{Math.abs(growthPercentage).toFixed(1)}%</Text>
                </View>
              </View>
              
              <Text style={styles.balanceValue}>{formatDisplayCurrency(activeWallet?.balance || 0)}</Text> 
              <Text style={styles.balanceDateText}>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
            </LinearGradient>

            {/* 2. Alertas */}
            <View style={[styles.adContainer, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
              <MaterialIcons name="campaign" size={18} color={colors.textSub} />
              <Text style={[styles.adText, { color: colors.textSub }]}>Espaço reservado para Alertas</Text>
            </View>

            {/* 3. Entradas e Saídas */}
            <View style={styles.statsRow}>
               <View style={[styles.statCard, { backgroundColor: isDark ? '#1e293b' : colors.card, borderColor: isDark ? '#334155' : colors.border }]}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIconBox, { backgroundColor: isDark ? 'rgba(11, 218, 91, 0.1)' : '#ecfdf5' }]}>
                    <MaterialIcons name="arrow-downward" size={16} color={colors.success} />
                  </View>
                  <Text style={[styles.statLabel, { color: colors.textSub }]}>Entradas</Text>
                </View>
                <Text style={[styles.statValue, { color: colors.success }]}>{formatDisplayCurrency(monthlyStats.income)}</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: isDark ? '#1e293b' : colors.card, borderColor: isDark ? '#334155' : colors.border }]}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIconBox, { backgroundColor: isDark ? 'rgba(250, 98, 56, 0.1)' : '#fef2f2' }]}>
                    <MaterialIcons name="arrow-upward" size={16} color={colors.danger} />
                  </View>
                  <Text style={[styles.statLabel, { color: colors.textSub }]}>Saídas</Text>
                </View>
                <Text style={[styles.statValue, { color: colors.danger }]}>{formatDisplayCurrency(monthlyStats.expense)}</Text>
              </View>
            </View>

            {/* 🔥 Relatório Mensal 🔥 */}
            {activeWallet && (
              <MonthlyReport 
                walletId={activeWallet.id} 
                selectedMonth={selectedMonth} 
                updateTrigger={recentTransactions}
              />
            )}

            {/* 4. Atividade Recente */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Atividade Recente</Text>
              <Text onPress={() => router.push('/(tabs)/Transactions')} style={[styles.seeAllText, { color: colors.primary }]}>Ver tudo</Text>
            </View>

            <View style={styles.transactionsList}>
              {recentTransactions.length === 0 ? (
                  <View style={styles.emptyRecent}>
                      <MaterialIcons name="history" size={40} color={colors.textSub} />
                      <Text style={[styles.emptyRecentText, { color: colors.textSub }]}>Nenhuma transação este mês.</Text>
                  </View>
              ) : (
                  recentTransactions.map((item) => (
                    <TransactionItem 
                      key={item.id} 
                      item={item} 
                      hideValues={hideValues} 
                      formatCurrency={formatCurrency} 
                    />
                  ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Mantenha apenas os styles não relacionados às transações (removi os do transactionItem)
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100, gap: 12 },
  
  balanceCard: { width: '100%', borderRadius: 20, padding: 20, elevation: 6, overflow: 'hidden' },
  bgIcon: { position: 'absolute', right: -15, bottom: -15, transform: [{ rotate: '-10deg' }] },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  growthBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
  growthText: { fontSize: 11, fontWeight: '800', color: "#FFF" },
  balanceValue: { color: '#FFF', fontSize: 36, fontWeight: '900', letterSpacing: -0.5 },
  balanceDateText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },

  adContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(150,150,150,0.3)', gap: 8 },
  adText: { fontSize: 12, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 12, borderWidth: 1 },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  statIconBox: { width: 30, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: '900' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  seeAllText: { fontSize: 14, fontWeight: '700' },
  transactionsList: { gap: 0 }, // Gap zero pois o item já tem margin bottom
  emptyRecent: { alignItems: 'center', paddingVertical: 20 },
  emptyRecentText: { marginTop: 8 }
});