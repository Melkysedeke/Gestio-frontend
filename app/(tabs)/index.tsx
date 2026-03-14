import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { Q } from '@nozbe/watermelondb';

// Banco de Dados e Stores
import { database } from '../../src/database';
import { useAuthStore } from '../../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import { syncData } from '../../src/services/SyncService';
import Wallet from '../../src/database/models/Wallet';
import Transaction from '../../src/database/models/Transaction';

// Componentes
import NoWalletState from '../../components/NoWalletState';
import MainHeader from '../../components/MainHeader';
import MonthSelector from '../../components/MonthSelector'; 
import MonthlyReport from '../../components/MonthlyReport'; // <-- Relatório Mensal Importado aqui!

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

  useFocusEffect(
    useCallback(() => {
      syncData().then(() => fetchDashboardData());
    }, [])
  );

  const formatDisplayCurrency = (value: number) => {
    if (hideValues) return "R$ •••••"; 
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const formatFullDate = () => {
    const today = new Date();
    return today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const fetchDashboardData = useCallback(async () => {
    const freshUser = useAuthStore.getState().user;
    if (!freshUser?.id) return;

    try {
      const allWallets = await database.get<Wallet>('wallets').query(
        Q.where('deleted_at', Q.eq(null)) 
      ).fetch();
      
      setWallets(allWallets);
      setHasWallets(allWallets.length > 0);

      const activeId = freshUser.settings?.last_opened_wallet || allWallets[0]?.id;
      const activeWallet = allWallets.find(w => w.id === activeId) || allWallets[0];

      if (activeWallet) {
        const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getTime();
        const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59).getTime();

        const monthTrans = await database.get<Transaction>('transactions')
          .query(
            Q.where('wallet_id', activeWallet.id),
            Q.where('transaction_date', Q.gte(startOfMonth)),
            Q.where('transaction_date', Q.lte(endOfMonth)),
            Q.where('deleted_at', Q.eq(null))
          )
          .fetch();

        const recentTrans = await database.get<Transaction>('transactions')
          .query(
            Q.where('wallet_id', activeWallet.id),
            Q.where('deleted_at', Q.eq(null)),
            Q.sortBy('transaction_date', Q.desc),
            Q.take(5)
          )
          .fetch();

        const stats = monthTrans.reduce((acc, t) => {
          const val = Number(t.amount); 
          if (t.type === 'income') acc.income += val;
          else acc.expense += val;
          return acc;
        }, { income: 0, expense: 0 });

        const totalVolume = stats.income + stats.expense;
        const growth = totalVolume > 0 ? ((stats.income - stats.expense) / totalVolume) * 100 : 0;
        
        setGrowthPercentage(growth);
        setMonthlyStats(stats);
        setRecentTransactions(recentTrans); 
      }
    } catch (error) {
      console.error('Erro dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, setHasWallets]); 

  useFocusEffect(
    useCallback(() => { 
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  useEffect(() => {
    fetchDashboardData();
  }, [lastSyncTime, fetchDashboardData]);

  const activeWallet = useMemo(() => {
      return wallets.find(w => w.id === lastOpenedWalletId) || wallets[0];
  }, [wallets, lastOpenedWalletId]);

  const isGrowthPositive = growthPercentage >= 0;
  
  const gradientColors = [colors.primary, '#0f4d8b'];
  const card = isDark ? '#1e293b' : colors.card; // Atualizado para usar as suas cores
  const cardBorderColor = isDark ? '#334155' : colors.border; // Atualizado para usar as suas cores
  
  const statIncomeBg = isDark ? 'rgba(11, 218, 91, 0.1)' : '#ecfdf5';
  const statExpenseBg = isDark ? 'rgba(250, 98, 56, 0.1)' : '#fef2f2';

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
      
      <MainHeader 
        activeWallet={activeWallet}
        onWalletChange={fetchDashboardData} 
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}
            tintColor={colors.primary} 
            colors={[colors.primary]}
          />
        }
      >
        {wallets.length === 0 ? (
          <NoWalletState onSuccess={fetchDashboardData} />
        ) : (
          <>
            <MonthSelector 
              selectedDate={selectedMonth} 
              onMonthChange={setSelectedMonth} 
            />

            {/* 1. Card Hero com Ícone de Fundo */}
            <LinearGradient
              colors={gradientColors as [string, string]} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <MaterialIcons name="account-balance-wallet" size={110} color="rgba(255,255,255,0.15)" style={styles.bgIcon} />
              
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Saldo Disponível</Text>
                <View style={styles.growthBadge}>
                  <MaterialIcons name={isGrowthPositive ? "trending-up" : "trending-down"} size={14} color="#FFF" />
                  <Text style={styles.growthText}>{Math.abs(growthPercentage).toFixed(1)}%</Text>
                </View>
              </View>
              
              <Text style={styles.balanceValue}>{formatDisplayCurrency(activeWallet?.balance || 0)}</Text> 
              <Text style={styles.balanceDateText}>{formatFullDate()}</Text>
            </LinearGradient>

            {/* 2. Container Reservado (Alertas / Ads) */}
            <View style={[styles.adContainer, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
              <MaterialIcons name="campaign" size={18} color={colors.textSub} />
              <Text style={[styles.adText, { color: colors.textSub }]}>Espaço reservado para Alertas</Text>
            </View>

            {/* 3. O Fluxo (Títulos Maiores e Cores Restauradas) */}
            <View style={styles.statsRow}>
               <View style={[styles.statCard, { backgroundColor: card, borderColor: cardBorderColor }]}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIconBox, { backgroundColor: statIncomeBg }]}>
                    <MaterialIcons name="arrow-downward" size={16} color={colors.success} />
                  </View>
                  <Text style={[styles.statLabel, { color: colors.textSub }]}>Entradas</Text>
                </View>
                <Text style={[styles.statValue, { color: colors.success }]}>{formatDisplayCurrency(monthlyStats.income)}</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: card, borderColor: cardBorderColor }]}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIconBox, { backgroundColor: statExpenseBg }]}>
                    <MaterialIcons name="arrow-upward" size={16} color={colors.danger} />
                  </View>
                  <Text style={[styles.statLabel, { color: colors.textSub }]}>Saídas</Text>
                </View>
                <Text style={[styles.statValue, { color: colors.danger }]}>{formatDisplayCurrency(monthlyStats.expense)}</Text>
              </View>
            </View>

            {/* 🔥 Relatório Mensal Adicionado Aqui 🔥 */}
            {/* <MonthlyReport /> */}

            {/* 4. O Diário (Categoria no Título, Nome na Descrição) */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Atividade Recente</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/Transactions')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver tudo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.transactionsList}>
              {recentTransactions.length === 0 ? (
                  <View style={styles.emptyRecent}>
                      <MaterialIcons name="history" size={40} color={colors.textSub} />
                      <Text style={[styles.emptyRecentText, { color: colors.textSub }]}>Nenhuma transação este mês.</Text>
                  </View>
              ) : (
                  recentTransactions.map((item) => {
                    const isIncome = item.type === 'income';
                    const itemColor = isIncome ? colors.success : colors.danger;
                    const iconBgColor = isIncome ? 'rgba(11, 218, 91, 0.1)' : 'rgba(250, 98, 56, 0.1)';
                    const rawItem = (item as any)._raw;
                    const isLinked = !!(rawItem?.debt_id || rawItem?.goal_id);
                    const linkedBadgeBg = isDark ? '#334155' : '#e2e8f0';
                    
                    return (
                      <TouchableOpacity 
                        key={item.id} 
                        activeOpacity={0.7}
                        onPress={() => router.push({
                          pathname: '/EditTransaction',
                          params: { id: item.id }
                        })}
                        style={[styles.transactionItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                      >
                        <View style={styles.transactionLeft}>
                          <View style={[styles.transactionIcon, { backgroundColor: iconBgColor }]}>
                            <MaterialIcons name={(item.categoryIcon || 'attach-money') as any} size={20} color={itemColor} />
                          </View>
                          
                          <View style={styles.descContainer}> 
                             <View style={styles.titleRow}>
                                <Text style={[styles.transactionTitle, { color: colors.text }]} numberOfLines={1}>
                                    {item.categoryName || 'Geral'}
                                </Text>
                                {isLinked && (
                                  <View style={[styles.linkedBadge, { backgroundColor: linkedBadgeBg }]}>
                                    <MaterialIcons name="lock" size={8} color={colors.textSub} />
                                    <Text style={[styles.linkedText, { color: colors.textSub }]}>Vinculado</Text>
                                  </View>
                                )}
                            </View>
                            <Text style={[styles.transactionSubtitle, { color: colors.textSub }]} numberOfLines={1}>
                                {formatDate(item.transactionDate.getTime())} {item.description ? `• ${item.description}` : ''}
                            </Text>
                          </View>
                        </View>
                        
                        <Text style={[styles.transactionAmount, { color: itemColor }]}>
                          {isIncome ? '+' : '-'} {formatDisplayCurrency(item.amount)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100, gap: 12 },
  
  balanceCard: { width: '100%', borderRadius: 20, padding: 20, elevation: 6, overflow: 'hidden' },
  bgIcon: { position: 'absolute', right: -15, bottom: -15, transform: [{ rotate: '-10deg' }] },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  growthBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 2, 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  growthText: { fontSize: 11, fontWeight: '800', color: "#FFF" },
  balanceValue: { color: '#FFF', fontSize: 36, fontWeight: '900', marginBottom: 4, letterSpacing: -0.5 },
  balanceDateText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },

  adContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(150,150,150,0.3)', gap: 8 },
  adText: { fontSize: 12, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 12, borderWidth: 1 },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statIconBox: { width: 30, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: '900' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  seeAllText: { fontSize: 14, fontWeight: '700' },
  transactionsList: { gap: 8 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1 },
  transactionLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  transactionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  descContainer: { flex: 1, marginRight: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  transactionTitle: { fontSize: 15, fontWeight: '700' }, 
  linkedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, gap: 2 },
  linkedText: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  transactionSubtitle: { fontSize: 12 },
  transactionAmount: { fontSize: 16, fontWeight: '900', marginLeft: 4 },
  emptyRecent: { alignItems: 'center', paddingVertical: 20 },
  emptyRecentText: { marginTop: 8 }
});