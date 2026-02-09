import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Componentes e Stores
import CreateWalletModal from '../components/CreateWalletModal';
import EditWalletModal from '../components/EditWalletModel'; 
import api from '../src/services/api';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor'; 

export default function MyWalletsScreen() {
  const user = useAuthStore(state => state.user);
  const { updateUserSetting } = useAuthStore();
  
  // Hook de cores
  const { colors, isDark } = useThemeColor();
  
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);

  async function fetchWallets() {
    if (!user?.id) return;
    try {
      if (wallets.length === 0) setLoading(true);
      const response = await api.get('/wallets');
      setWallets(response.data);
    } catch (error: any) {
      console.log("Erro ao buscar carteiras:", error.message);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { 
    fetchWallets(); 
  }, []));

  function handleDelete(wallet: any) {
    if (wallets.length === 1) {
      return Alert.alert('Atenção', 'Você precisa manter pelo menos uma carteira ativa.');
    }

    Alert.alert(
      'Excluir Carteira',
      `Tem certeza que deseja apagar "${wallet.name}"? Isso excluirá todas as transações vinculadas a ela.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/wallets/${wallet.id}`);
              
              if (user?.last_opened_wallet === wallet.id) {
                // CORREÇÃO: Usar undefined em vez de null para limpar o valor opcional
                updateUserSetting({ last_opened_wallet: undefined });
              }
              
              setWallets(prev => prev.filter(w => w.id !== wallet.id));
              fetchWallets();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a carteira.');
            }
          }
        }
      ]
    );
  }

  function handleEdit(wallet: any) {
    setSelectedWallet(wallet);
    setEditVisible(true);
  }

  if (loading && wallets.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.card} />

      {/* HEADER */}
      <SafeAreaView style={[styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]} edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={[styles.title, { color: colors.text }]}>Minhas Carteiras</Text>
            
            <TouchableOpacity onPress={() => setCreateVisible(true)} style={styles.headerButton}>
              <MaterialIcons name="add" size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>
      </SafeAreaView>

      {/* LISTA */}
      <FlatList 
        data={wallets}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isActive = user?.last_opened_wallet === item.id;
          const rawBalance = item.current_balance || item.balance || 0;
          const balanceValue = Number(rawBalance);

          return (
            <View style={[
                styles.card, 
                { backgroundColor: colors.card, borderColor: colors.border },
                isActive && { borderColor: colors.primary, backgroundColor: isDark ? '#1e293b' : '#f0f9ff' }
            ]}>
              <View style={styles.cardInfo}>
                <View style={[
                    styles.iconBox, 
                    { backgroundColor: isDark ? colors.background : '#eff6ff' },
                    isActive && { backgroundColor: colors.primary }
                ]}>
                  <MaterialIcons 
                    name="account-balance-wallet" 
                    size={24} 
                    color={isActive ? '#FFF' : colors.primary} 
                  />
                </View>
                
                <View style={styles.textContainer}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    {isActive && (
                      <View style={[styles.activeBadge, { backgroundColor: isDark ? '#1e3a8a' : '#dbeafe' }]}>
                        <Text style={[styles.activeBadgeText, { color: isDark ? '#93c5fd' : '#1e40af' }]}>
                            Ativa
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.cardBalance, { color: colors.textSub }]}>
                    {balanceValue.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity 
                    onPress={() => handleEdit(item)} 
                    style={[styles.actionButton, { backgroundColor: isDark ? colors.background : '#f8fafc' }]}
                >
                  <MaterialIcons name="edit" size={20} color={colors.textSub} />
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => handleDelete(item)} 
                    style={[styles.actionButton, { backgroundColor: isDark ? colors.background : '#f8fafc' }]}
                >
                  <MaterialIcons name="delete-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSub }]}>Nenhuma carteira encontrada.</Text>
          </View>
        }
      />

      <CreateWalletModal 
        visible={createVisible} 
        onClose={() => setCreateVisible(false)} 
        onSuccess={fetchWallets} 
      />
      
      <EditWalletModal 
        visible={editVisible} 
        wallet={selectedWallet}
        onClose={() => setEditVisible(false)} 
        onSuccess={fetchWallets} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerContainer: { borderBottomWidth: 1 },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 12 
  },
  headerButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: 'bold' },
  
  list: { padding: 20, paddingBottom: 40 },
  
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1, 
  },
  
  // --- ESTILOS QUE ESTAVAM FALTANDO ---
  cardInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  textContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  cardTitle: { fontSize: 15, fontWeight: '600', maxWidth: '70%' },
  cardBalance: { fontSize: 13 },
  
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },

  actions: { flexDirection: 'row', gap: 8 },
  actionButton: { padding: 8, borderRadius: 8 },

  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 14 }
});