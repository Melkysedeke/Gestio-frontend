import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Banco de Dados e Stores
import { database } from '../src/database';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor'; 

// Componentes
import CreateWalletModal from '../components/CreateWalletModal';
import EditWalletModal from '../components/EditWalletModel'; 

export default function MyWalletsScreen() {
  const user = useAuthStore(state => state.user);
  const { updateUserSetting, setHasWallets } = useAuthStore();
  const hideValues = useAuthStore(state => state.hideValues); // ✅ Integrado para privacidade
  
  const { colors, isDark } = useThemeColor();
  
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);

  const fetchWallets = useCallback(async () => {
    if (!user?.id) return;
    try {
      const walletsCollection = database.get('wallets');
      const allWallets = await walletsCollection.query().fetch();
      
      setWallets(allWallets);
      setHasWallets(allWallets.length > 0);
    } catch (error: any) {
      console.log("Erro ao buscar carteiras locais:", error.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, setHasWallets]);

  useFocusEffect(useCallback(() => { 
    fetchWallets(); 
  }, [fetchWallets]));

  async function handleDelete(wallet: any) {
    if (wallets.length <= 1) {
      return Alert.alert('Atenção', 'Você não pode excluir sua única carteira.');
    }

    Alert.alert(
      'Excluir Carteira',
      `Tem certeza que deseja apagar "${wallet.name}"? Isso removerá permanentemente os dados desta carteira no dispositivo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              const isDeletingActive = user?.settings?.last_opened_wallet === wallet.id;

              await database.write(async () => {
                await wallet.markAsDeleted();
              });

              if (isDeletingActive) {
                const remainingWallets = wallets.filter(w => w.id !== wallet.id);
                if (remainingWallets.length > 0) {
                  await updateUserSetting({ last_opened_wallet: remainingWallets[0].id });
                }
              }
              
              await fetchWallets();
              Alert.alert('Sucesso', 'Carteira removida com sucesso.');
            } catch {
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
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

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

      <FlatList 
        data={wallets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        extraData={[user?.settings?.last_opened_wallet, hideValues]} // ✅ Garante atualização visual
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isActive = user?.settings?.last_opened_wallet === item.id;
          const balanceValue = Number(item.balance || 0);

          // ✅ Lógica de cores pré-calculada para performance
          const cardBg = isActive 
            ? (isDark ? '#1e293b' : '#f0f9ff') 
            : colors.card;
          
          const iconBoxBg = isActive 
            ? colors.primary 
            : (isDark ? colors.background : '#eff6ff');

          const actionBtnBg = isDark ? colors.background : '#f8fafc';

          return (
            <View style={[
                styles.card, 
                { backgroundColor: cardBg, borderColor: isActive ? colors.primary : colors.border }
            ]}>
              <View style={styles.cardInfo}>
                <View style={[styles.iconBox, { backgroundColor: iconBoxBg }]}>
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
                    {hideValues 
                      ? "R$ •••••" 
                      : balanceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    }
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity 
                    onPress={() => handleEdit(item)} 
                    style={[styles.actionButton, { backgroundColor: actionBtnBg }]}
                >
                  <MaterialIcons name="edit" size={20} color={colors.textSub} />
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => handleDelete(item)} 
                    style={[styles.actionButton, { backgroundColor: actionBtnBg }]}
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
      
      {selectedWallet && (
        <EditWalletModal 
          visible={editVisible} 
          wallet={selectedWallet}
          onClose={() => {
            setEditVisible(false);
            setSelectedWallet(null);
          }} 
          onSuccess={fetchWallets} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerContainer: { 
    borderBottomWidth: 1 
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 12 
  },
  headerButton: { 
    padding: 4 
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  list: { 
    padding: 20, 
    paddingBottom: 40 
  },
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
  cardInfo: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  iconBox: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  textContainer: { 
    flex: 1 
  },
  titleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginBottom: 2 
  },
  cardTitle: { 
    fontSize: 15, 
    fontWeight: '600', 
    maxWidth: '70%' 
  },
  cardBalance: { 
    fontSize: 13 
  },
  activeBadge: { 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 6 
  },
  activeBadgeText: { 
    fontSize: 9, 
    fontWeight: 'bold', 
    textTransform: 'uppercase' 
  },
  actions: { 
    flexDirection: 'row', 
    gap: 8 
  },
  actionButton: { 
    padding: 8, 
    borderRadius: 8 
  },
  emptyContainer: { 
    alignItems: 'center', 
    marginTop: 40 
  },
  emptyText: { 
    fontSize: 14 
  }
});