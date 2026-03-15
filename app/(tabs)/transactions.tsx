import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
// 🚀 Removido o SafeAreaView, mantido apenas o hook dos insets
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Q } from '@nozbe/watermelondb';

import { database } from '../../src/database';
import { useAuthStore } from '../../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';

// Models
import Transaction from '../../src/database/models/Transaction';
import Wallet from '../../src/database/models/Wallet';

// Componentes
import MainHeader from '../../components/MainHeader';
import MonthSelector from '../../components/MonthSelector';
import TransactionFilters from '../../components/TransactionFilters';
import TransactionItem from '../../components/TransactionItem';

export default function TransactionsScreen() {
  const { user } = useAuthStore();
  const hideValues = useAuthStore(state => state.hideValues);

  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets(); // 🚀 Pegamos as medidas reais das bordas

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  // Filtros
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const formatCurrency = useCallback((value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }, []);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    if (!loading) setRefreshing(true); 

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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const mSearch = !searchText || 
                      t.description?.toLowerCase().includes(searchText.toLowerCase()) || 
                      t.categoryName?.toLowerCase().includes(searchText.toLowerCase());
      
      const mCat = selectedCategories.length === 0 || selectedCategories.includes(t.categoryName);
      
      return mSearch && mCat;
    });
  }, [transactions, searchText, selectedCategories]);

  const sections = useMemo(() => {
    const grouped = filteredTransactions.reduce((acc: any, t) => {
      const key = new Date(t.transactionDate).toISOString().split('T')[0];
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    }, {});

    return Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .map(key => ({ title: formatDateHeader(key), data: grouped[key] }));
  }, [filteredTransactions]);

  function formatDateHeader(dateString: string) {
    const d = new Date(dateString + 'T12:00:00');
    const now = new Date();
    
    if (dateString === now.toISOString().split('T')[0]) return 'Hoje';
    
    now.setDate(now.getDate() - 1);
    if (dateString === now.toISOString().split('T')[0]) return 'Ontem';
    
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
            .replace('-feira', '')
            .replace(/^\w/, c => c.toUpperCase());
  }

  const handleClearAll = () => {
    setSearchText('');
    setSelectedType('all');
    setSelectedCategories([]); 
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
    // 🚀 Trocado SafeAreaView por View comum para o background vazar até as bordas
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      {/* 🚀 O MainHeader possui seu próprio SafeAreaView para empurrar o conteúdo para baixo da Status Bar */}
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
          selectedCategories={selectedCategories} 
          onCategoriesChange={setSelectedCategories}
          onClearAll={handleClearAll}
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        // 🚀 O paddingBottom usa o insets.bottom para não esconder o último item atrás da TabBar ou da Home Indicator do iPhone
        contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 80, 120) }]}
        stickySectionHeadersEnabled={false}
        extraData={hideValues} 
        refreshControl={
            <RefreshControl 
                refreshing={refreshing} 
                onRefresh={fetchData} 
                tintColor={colors.primary} 
            />
        }
        renderItem={({ item }) => (
          <TransactionItem 
            item={item}
            hideValues={hideValues}
            formatCurrency={formatCurrency}
          />
        )}
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
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterSection: { paddingTop: 12, paddingBottom: 16, paddingHorizontal: 16, gap: 16 },
  listContent: { paddingHorizontal: 16, paddingTop: 0 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 8, fontSize: 14, fontWeight: '600' }
});