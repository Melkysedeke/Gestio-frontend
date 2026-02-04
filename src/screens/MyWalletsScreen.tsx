import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Platform 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';

import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import CreateWalletModal from '../../components/CreateWalletModal';
import EditWalletModal from '../../components/EditWalletModel';

export default function MyWalletsScreen() {
  const user = useAuthStore(state => state.user);
  const { updateUserSetting } = useAuthStore();
  
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);

  async function fetchWallets() {
    if (!user?.id) return;
    try {
      setLoading(true);
      // O backend identifica o usuário pelo Token enviado no interceptor
      const response = await api.get('/wallets');
      
      // LOG de Depuração: Verifique no terminal se o campo é 'current_balance' ou 'balance'
      console.log("Carteiras carregadas:", response.data);
      
      setWallets(response.data);
    } catch (error: any) {
      console.log("Erro ao buscar carteiras:", error.message);
      Alert.alert('Erro', 'Não foi possível carregar suas carteiras.');
    } finally {
      setLoading(false);
    }
  }

  // Recarrega sempre que a tela ganha foco
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
              
              // Se a carteira apagada era a ativa, limpamos a preferência no Store
              if (user?.last_opened_wallet === wallet.id) {
                updateUserSetting({ last_opened_wallet: null });
              }
              
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1773cf" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>Minhas Carteiras</Text>
        <TouchableOpacity onPress={() => setCreateVisible(true)} style={styles.addButton}>
          <MaterialIcons name="add" size={28} color="#1773cf" />
        </TouchableOpacity>
      </View>

      {/* LISTA DE CARTEIRAS */}
      <FlatList 
        data={wallets}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isActive = user?.last_opened_wallet === item.id;
          
          // Tratamento de saldo: PostgreSQL numeric -> String -> Number
          const rawBalance = item.current_balance || item.balance || 0;
          const balanceValue = Number(rawBalance);

          return (
            <View style={[styles.card, isActive && styles.activeCardBorder]}>
              <View style={styles.cardInfo}>
                <View style={[styles.iconBox, isActive && styles.activeIconBox]}>
                  <MaterialIcons 
                    name="account-balance-wallet" 
                    size={24} 
                    color={isActive ? '#FFF' : '#1773cf'} 
                  />
                </View>
                
                <View style={styles.textContainer}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Ativa</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardBalance}>
                    {balanceValue.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
                  <MaterialIcons name="edit" size={20} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
                  <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma carteira encontrada.</Text>
          </View>
        }
      />

      {/* MODAIS */}
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
  container: { flex: 1, backgroundColor: '#f6f7f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  backButton: { padding: 4 },
  addButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  list: { padding: 20, paddingBottom: 40 },
  
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1, 
    borderColor: 'transparent'
  },
  activeCardBorder: {
    borderColor: '#1773cf',
    backgroundColor: '#f0f9ff'
  },
  
  cardInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  activeIconBox: { backgroundColor: '#1773cf' },

  textContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', maxWidth: '70%' },
  cardBalance: { fontSize: 13, color: '#64748b' },
  
  activeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 9,
    color: '#1e40af',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },

  actions: { flexDirection: 'row', gap: 8 },
  actionButton: { padding: 8, backgroundColor: '#f8fafc', borderRadius: 8 },

  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', fontSize: 14 }
});