import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { Q } from '@nozbe/watermelondb';

import { database } from '../../src/database';
import { useAuthStore } from '../../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import Transaction from '../../src/database/models/Transaction';
import Wallet from '../../src/database/models/Wallet';

import MainHeader from '../../components/MainHeader';
import MonthSelector from '../../components/MonthSelector';
import TransactionFilters from '../../components/TransactionFilters';

export default function TransactionsScreen() {
  // ✅ Removido o 'updateUserSetting' que agora é gerenciado pelo MainHeader
  const { user } = useAuthStore();
  const hideValues = useAuthStore(state => state.hideValues);

  const { colors, isDark } = useThemeColor();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  // Filtros
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const formatDisplayCurrency = (value: number) => {
    if (hideValues) return "R$ •••••";
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // ✅ Função unificada de busca de dados
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const allWallets = await database.get<Wallet>('wallets').query().fetch();
      setWallets(allWallets);
      
      const activeId = user?.settings?.last_opened_wallet || allWallets[0]?.id;

      if (activeId) {
        const start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getTime();
        const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59).getTime();

        const queryArr = [
          Q.where('wallet_id', activeId),
          Q.where('transaction_date', Q.gte(start)),
          Q.where('transaction_date', Q.lte(end)),
          Q.sortBy('transaction_date', Q.desc)
        ];

        if (selectedType !== 'all') queryArr.push(Q.where('type', selectedType));

        const res = await database.get<Transaction>('transactions').query(...queryArr).fetch();
        setTransactions(res);
      }
    } catch (e) { 
      console.error("Erro ao carregar transações:", e); 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  }, [user?.id, user?.settings?.last_opened_wallet, selectedMonth, selectedType]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const mSearch = !searchText || t.description?.toLowerCase().includes(searchText.toLowerCase()) || t.categoryName?.toLowerCase().includes(searchText.toLowerCase());
      const mCat = !selectedCategory || t.categoryName === selectedCategory;
      return mSearch && mCat;
    });
  }, [transactions, searchText, selectedCategory]);

  const sections = useMemo(() => {
    const grouped: any = {};
    filteredTransactions.forEach(t => {
      const key = new Date(t.transactionDate).toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });
    return Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map(k => ({ title: formatDateHeader(k), data: grouped[k] }));
  }, [filteredTransactions]);

  function formatDateHeader(dateString: string) {
    const d = new Date(dateString + 'T12:00:00');
    const now = new Date();
    if (dateString === now.toISOString().split('T')[0]) return 'Hoje';
    now.setDate(now.getDate() - 1);
    if (dateString === now.toISOString().split('T')[0]) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).replace('-feira', '').replace(/^\w/, c => c.toUpperCase());
  }

  const handleClearAll = () => {
    setSearchText('');
    setSelectedType('all');
    setSelectedCategory(null);
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
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ✅ MainHeader agora gerencia o seletor de carteira e modais internamente */}
      <MainHeader 
        activeWallet={activeWallet}
        onWalletChange={fetchData} 
      />

      <View style={styles.filterSection}>
        <MonthSelector selectedDate={selectedMonth} onMonthChange={setSelectedMonth} />
        <TransactionFilters
          searchText={searchText}
          onSearchChange={setSearchText}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onClearAll={handleClearAll}
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        extraData={hideValues} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
        renderItem={({ item }) => {
          const isIncome = item.type === 'income';
          const iconBgColor = isIncome
            ? (isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4')
            : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2');
          const amountColor = isIncome ? colors.success : colors.danger;
          const isLinked = !!((item as any)._raw?.debt_id || (item as any)._raw?.goal_id);

          return (
            <TouchableOpacity
              style={[styles.transactionItem, { backgroundColor: colors.card }]}
              onPress={() => router.push({ pathname: '/edit-transaction', params: { id: item.id } })}
              activeOpacity={0.7}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
                  <MaterialIcons name={(item.categoryIcon || 'attach-money') as any} size={20} color={amountColor} />
                </View>
                <View style={styles.descContainer}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>{item.categoryName || 'Geral'}</Text>
                    {isLinked && (
                      <View style={[styles.linkedBadge, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                        <MaterialIcons name="lock" size={8} color={colors.textSub} />
                        <Text style={[styles.linkedText, { color: colors.textSub }]}>Vinculado</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.itemSubtitle, { color: colors.textSub }]} numberOfLines={1}>
                    {new Date(item.transactionDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    {item.description ? ` • ${item.description}` : ''}
                  </Text>
                </View>
              </View>
              <Text style={[styles.itemAmount, { color: amountColor }]}>
                {isIncome ? '+' : '-'} {formatDisplayCurrency(item.amount)}
              </Text>
            </TouchableOpacity>
          );
        }}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>{title}</Text>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={40} color={colors.textSub} />
            <Text style={[styles.emptyText, { color: colors.textSub }]}>Nenhuma transação encontrada</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterSection: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 16
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 100
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 6
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  descContainer: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2
  },
  linkedText: {
    fontSize: 8,
    fontWeight: 'bold'
  },
  itemSubtitle: {
    fontSize: 12
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '900'
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80
  },
  emptyText: {
    marginTop: 8
  }
});