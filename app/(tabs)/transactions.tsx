import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, SectionList, TouchableOpacity, 
  StatusBar, RefreshControl, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';

import { useAuthStore } from '../../src/stores/authStore';
import api from '../../src/services/api';
import { useThemeColor } from '@/hooks/useThemeColor'; // Hook de tema

import CreateWalletModal from '../../components/CreateWalletModal';
import WalletSelectorModal from '../../components/WalletSelectorModal';
import MainHeader from '../../components/MainHeader';

export default function TransactionsScreen() {
  const user = useAuthStore(state => state.user);
  const updateUserSetting = useAuthStore(state => state.updateUserSetting);
  const { colors, isDark } = useThemeColor(); // Cores dinâmicas
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  
  const [activeFilter, setActiveFilter] = useState<'week' | 'current' | 'last' | 'all'>('current');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);

  // Cores fixas semânticas
  const INCOME_COLOR = "#0bda5b";
  const EXPENSE_COLOR = "#fa6238";
  const THEME_PRIMARY = "#1773cf";

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const walletRes = await api.get('/wallets/');
      const allWallets = walletRes.data;
      setWallets(allWallets);

      const savedWalletExists = allWallets.find((w: any) => w.id === user.last_opened_wallet);
      const activeId = savedWalletExists ? savedWalletExists.id : (allWallets.length > 0 ? allWallets[0].id : null);

      if (activeId) {
        if (user.last_opened_wallet !== activeId) {
           updateUserSetting({ last_opened_wallet: activeId });
        }
        const transRes = await api.get(`/transactions?wallet_id=${activeId}`);
        setTransactions(transRes.data);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.last_opened_wallet, updateUserSetting]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const { sections, summary } = useMemo(() => {
    if (transactions.length === 0) return { sections: [], summary: { income: 0, expense: 0 } };

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const filtered = transactions.filter(item => {
      const tDate = new Date(item.transaction_date); 
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      
      let matchesDate = true;
      if (activeFilter === 'week') matchesDate = tDate >= startOfWeek && tDate <= endOfWeek;
      else if (activeFilter === 'current') matchesDate = tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
      else if (activeFilter === 'last') {
        const lastM = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastY = currentMonth === 0 ? currentYear - 1 : currentYear;
        matchesDate = tDate.getMonth() === lastM && tDate.getFullYear() === lastY;
      }
      return matchesDate && matchesType;
    });

    const stats = filtered.reduce((acc, curr) => {
      const val = Number(curr.amount);
      if (curr.type === 'income') acc.income += val;
      else acc.expense += val;
      return acc;
    }, { income: 0, expense: 0 });

    const grouped: { [key: string]: any[] } = {};
    filtered.forEach(item => {
      const dateKey = item.transaction_date.split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(item);
    });

    const sectionData = Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(dateKey => ({
        title: formatDateHeader(dateKey),
        data: grouped[dateKey]
      }));

    return { sections: sectionData, summary: stats };
  }, [transactions, activeFilter, typeFilter]);

  function formatDateHeader(dateString: string) {
    const date = new Date(dateString + 'T12:00:00');
    const today = new Date();
    const dStr = date.toISOString().split('T')[0];
    const tStr = today.toISOString().split('T')[0];

    if (dStr === tStr) return 'Hoje';
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (dStr === yesterday.toISOString().split('T')[0]) return 'Ontem';
    
    const fullDate = date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    const cleanDate = fullDate.replace('-feira', '');
    return cleanDate.charAt(0).toUpperCase() + cleanDate.slice(1);
  }

  const handleSelectWallet = (walletId: number) => {
    updateUserSetting({ last_opened_wallet: walletId });
    setSelectorVisible(false);
  };

  const activeWallet = wallets.find(w => w.id === user?.last_opened_wallet) || wallets[0];

  if (loading && !refreshing) {
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
        // onPressAdd REMOVIDO para corrigir o erro de TypeScript
      />

      <View style={[styles.summaryCardSlim, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#ccc' }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSub }]}>Entradas</Text>
          <Text style={[styles.summaryValueSmall, { color: INCOME_COLOR }]} numberOfLines={1}>
            {summary.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSub }]}>Saídas</Text>
          <Text style={[styles.summaryValueSmall, { color: EXPENSE_COLOR }]} numberOfLines={1}>
            {summary.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        </View>
      </View>

      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodScroll}>
          {['week', 'current', 'last', 'all'].map((f) => (
            <TouchableOpacity 
              key={f} 
              onPress={() => setActiveFilter(f as any)}
              style={[
                  styles.filterTabSlim, 
                  { backgroundColor: activeFilter === f ? THEME_PRIMARY : colors.card }
              ]}
            >
              <Text style={[styles.filterTextSmall, { color: activeFilter === f ? '#FFF' : colors.textSub }]}>
                {f === 'week' ? 'Semana' : f === 'current' ? 'Mês' : f === 'last' ? 'Mês Passado' : 'Tudo'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.typeRowSlim}>
          {['all', 'income', 'expense'].map((t) => (
            <TouchableOpacity 
              key={t} 
              onPress={() => setTypeFilter(t as any)}
              style={[
                  styles.typeBtnSlim, 
                  { 
                      backgroundColor: typeFilter === t ? (isDark ? '#334155' : '#1e293b') : colors.card,
                      borderColor: typeFilter === t ? 'transparent' : colors.border
                  }
              ]}
            >
              <Text style={[styles.typeBtnTextSmall, { color: typeFilter === t ? '#FFF' : colors.textSub }]}>
                {t === 'all' ? 'Todas' : t === 'income' ? 'Receitas' : 'Despesas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={THEME_PRIMARY} />}
        renderItem={({ item }) => {
          const isIncome = item.type === 'income';
          
          // Fundo do ícone adaptativo
          const iconBg = isIncome 
            ? (isDark ? 'rgba(11, 218, 91, 0.15)' : '#ecfdf5') 
            : (isDark ? 'rgba(250, 98, 56, 0.15)' : '#fef2f2');

          return (
            <TouchableOpacity 
                style={[styles.transactionItem, { backgroundColor: colors.card }]}
                onPress={() => router.push({ pathname: '/edit-transaction', params: { ...item } })}
            >
                <View style={styles.itemLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                        <MaterialIcons name={item.category_icon || 'attach-money'} size={20} color={isIncome ? INCOME_COLOR : EXPENSE_COLOR} />
                    </View>
                    <View style={styles.descContainer}>
                        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                            {item.category_name || 'Geral'}
                        </Text>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                            <Text style={[styles.itemSubtitle, { color: colors.textSub }]}>
                                {formatDateShort(item.transaction_date)}
                            </Text>
                            {item.description ? (
                                <Text style={[styles.itemSubtitle, { color: colors.textSub, flex: 1 }]} numberOfLines={1}>
                                    • {item.description}
                                </Text>
                            ) : null}
                        </View>
                    </View>
                </View>
                <View style={styles.amountContainer}>
                    <Text style={[styles.itemAmount, { color: isIncome ? INCOME_COLOR : EXPENSE_COLOR }]} numberOfLines={1}>
                        {isIncome ? '+' : '-'} {Number(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Text>
                </View>
            </TouchableOpacity>
          );
        }}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>{title}</Text>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="event-note" size={50} color={colors.textSub} />
            <Text style={[styles.emptyText, { color: colors.textSub }]}>Nenhuma transação encontrada.</Text>
          </View>
        }
      />

      <WalletSelectorModal 
        visible={selectorVisible} 
        onClose={() => setSelectorVisible(false)} 
        onSelect={handleSelectWallet} 
        onAddPress={() => setCreateModalVisible(true)}
      />
      <CreateWalletModal visible={createModalVisible} onClose={() => setCreateModalVisible(false)} onSuccess={fetchData} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  summaryCardSlim: { 
    flexDirection: 'row', 
    marginHorizontal: 16, marginTop: 8, marginBottom: 12,
    paddingVertical: 12, borderRadius: 12, 
    ...Platform.select({ ios: { shadowOpacity: 0.03, shadowRadius: 5 }, android: { elevation: 1 } }) 
  },
  summaryItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  summaryDivider: { width: 1 },
  summaryLabel: { fontSize: 10, marginBottom: 2, fontWeight: '600' },
  summaryValueSmall: { fontSize: 13, fontWeight: '700' },
  
  filtersWrapper: { marginBottom: 8 },
  periodScroll: { paddingHorizontal: 16, gap: 6, marginBottom: 8 },
  filterTabSlim: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 15 },
  filterTextSmall: { fontSize: 11, fontWeight: '500' },
  
  typeRowSlim: { flexDirection: 'row', paddingHorizontal: 16, gap: 6 },
  typeBtnSlim: { 
    flex: 1, paddingVertical: 6, alignItems: 'center', 
    borderRadius: 8, borderWidth: 1
  },
  typeBtnTextSmall: { fontSize: 11, fontWeight: '600' },
  
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  sectionTitle: { fontSize: 12, fontWeight: '700', marginTop: 16, marginBottom: 8, marginLeft: 4 },
  
  transactionItem: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 10, borderRadius: 16, marginBottom: 4 
  },
  itemLeft: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  iconCircle: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  descContainer: { 
    flex: 1, 
    marginRight: 8 
  },
  itemTitle: { fontSize: 14, fontWeight: '700' }, 
  itemSubtitle: { fontSize: 12 }, 
  
  amountContainer: { marginLeft: 4, alignItems: 'flex-end' },
  itemAmount: { fontSize: 14, fontWeight: '900' },
  
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { marginTop: 10 }
});