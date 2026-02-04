import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, SectionList, TouchableOpacity, 
  StatusBar, RefreshControl, Platform, ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';

// Imports internos
import { useAuthStore } from '../../src/stores/authStore';
import api from '../../src/services/api';

// Components
import CreateWalletModal from '../../components/CreateWalletModal';
import WalletSelectorModal from '../../components/WalletSelectorModal';
import MainHeader from '../../components/MainHeader';

const COLORS = {
  primary: "#1773cf",
  bgLight: "#f6f7f8",
  border: "#e2e8f0"
};

export default function TransactionsScreen() {
  const user = useAuthStore(state => state.user);
  const updateUserSetting = useAuthStore(state => state.updateUserSetting);
  
  const [refreshing, setRefreshing] = useState(false);
  
  // Dados
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  
  // Filtros
  const [activeFilter, setActiveFilter] = useState<'week' | 'current' | 'last' | 'all'>('current');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Modais
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);

  // --- BUSCA GERAL (useCallback para evitar avisos do ESLint) ---
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [walletRes, transRes] = await Promise.all([
        api.get('/wallets', { params: { userId: user.id } }),
        user.last_opened_wallet 
          ? api.get(`/transactions?wallet_id=${user.last_opened_wallet}`) 
          : Promise.resolve({ data: [] })
      ]);

      setWallets(walletRes.data);
      setTransactions(transRes.data);

      if (!user.last_opened_wallet && walletRes.data.length > 0) {
        const firstId = walletRes.data[0].id;
        updateUserSetting({ last_opened_wallet: firstId });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, user?.last_opened_wallet, updateUserSetting]);

  // --- LÓGICA DE FILTRO, RESUMO E AGRUPAMENTO ---
  const { sections, summary } = useMemo(() => {
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

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const activeWallet = wallets.find(w => w.id === user?.last_opened_wallet) || wallets[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f7f8" />
      
      {/* AJUSTADO: Adicionado onPressAdd */}
      <MainHeader 
        user={user} 
        activeWallet={activeWallet} 
        onPressSelector={() => setSelectorVisible(true)}
        onPressAdd={() => setCreateModalVisible(true)} 
      />

      <View style={styles.summaryCardSlim}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Entradas</Text>
          <Text style={[styles.summaryValueSmall, { color: '#0bda5b' }]} numberOfLines={1}>
            {summary.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Saídas</Text>
          <Text style={[styles.summaryValueSmall, { color: '#fa6238' }]} numberOfLines={1}>
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
              style={[styles.filterTabSlim, activeFilter === f && styles.filterTabActive]}
            >
              <Text style={[styles.filterTextSmall, activeFilter === f && styles.filterTextActive]}>
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
              style={[styles.typeBtnSlim, typeFilter === t && styles.typeBtnActive]}
            >
              <Text style={[styles.typeBtnTextSmall, typeFilter === t && styles.typeBtnTextActive]}>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.transactionItem}
            onPress={() => router.push({ pathname: '/edit-transaction', params: { ...item } })}
          >
            <View style={styles.itemLeft}>
              <View style={[styles.iconCircle, { backgroundColor: item.type === 'income' ? '#ecfdf5' : '#fef2f2' }]}>
                <MaterialIcons name={item.category_icon || 'attach-money'} size={20} color={item.type === 'income' ? '#0bda5b' : '#fa6238'} />
              </View>
              <View style={styles.descContainer}>
                <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                <Text style={styles.itemCat} numberOfLines={1}>{item.category_name || 'Geral'}</Text>
              </View>
            </View>
            <View style={styles.amountContainer}>
              <Text style={[styles.itemAmount, { color: item.type === 'income' ? '#0bda5b' : '#fa6238' }]} numberOfLines={1}>
                {item.type === 'income' ? '+' : '-'} {Number(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="event-note" size={50} color="#cbd5e1" />
            <Text style={styles.emptyText}>Nenhuma transação encontrada.</Text>
          </View>
        }
      />

      {/* AJUSTADO: Adicionado onAddPress */}
      <WalletSelectorModal 
        visible={selectorVisible} 
        onClose={() => setSelectorVisible(false)} 
        onSelect={fetchData} 
        onAddPress={() => setCreateModalVisible(true)}
      />

      <CreateWalletModal 
        visible={createModalVisible} 
        onClose={() => setCreateModalVisible(false)} 
        onSuccess={fetchData} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f8' },
  summaryCardSlim: { 
    flexDirection: 'row', backgroundColor: '#FFF', 
    marginHorizontal: 16, marginTop: 8, marginBottom: 12,
    paddingVertical: 12, borderRadius: 12, 
    ...Platform.select({ ios: { shadowOpacity: 0.03, shadowRadius: 5 }, android: { elevation: 1 } }) 
  },
  summaryItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  summaryDivider: { width: 1, backgroundColor: '#f1f5f9' },
  summaryLabel: { fontSize: 10, color: '#94a3b8', marginBottom: 2, fontWeight: '600' },
  summaryValueSmall: { fontSize: 13, fontWeight: '700' },
  filtersWrapper: { marginBottom: 8 },
  periodScroll: { paddingHorizontal: 16, gap: 6, marginBottom: 8 },
  filterTabSlim: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 15, backgroundColor: '#e2e8f0' },
  filterTabActive: { backgroundColor: '#1773cf' },
  filterTextSmall: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  filterTextActive: { color: '#FFF', fontWeight: 'bold' },
  typeRowSlim: { flexDirection: 'row', paddingHorizontal: 16, gap: 6 },
  typeBtnSlim: { 
    flex: 1, paddingVertical: 6, alignItems: 'center', 
    borderRadius: 8, backgroundColor: '#FFF', 
    borderWidth: 1, borderColor: '#f1f5f9' 
  },
  typeBtnActive: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
  typeBtnTextSmall: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  typeBtnTextActive: { color: '#FFF' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#cbd5e1', marginTop: 16, marginBottom: 8, marginLeft: 4 },
  transactionItem: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    backgroundColor: '#FFF', padding: 12, borderRadius: 16, marginBottom: 8 
  },
  itemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  descContainer: { flex: 1, marginRight: 8 },
  itemDesc: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  itemCat: { fontSize: 11, color: '#94a3b8' },
  amountContainer: { marginLeft: 4, alignItems: 'flex-end' },
  itemAmount: { fontSize: 14, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', marginTop: 10 }
});