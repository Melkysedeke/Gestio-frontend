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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

// Banco de Dados e Stores
import { database } from '../src/database';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor'; 
import { triggerHaptic, triggerSelectionHaptic, triggerNotificationHaptic } from '@/src/utils/haptics';

// Componentes
import SubHeader from '@/components/SubHeader'; 
import CreateWalletModal from '../components/CreateWalletModal';
import EditWalletModal from '../components/EditWalletModel'; 

export default function MyWalletsScreen() {
  const user = useAuthStore(state => state.user);
  const { updateUserSetting, setHasWallets } = useAuthStore();
  const hideValues = useAuthStore(state => state.hideValues); 
  
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();
  
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
    triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);

    if (wallets.length <= 1) {
      return Alert.alert('Atenção', 'Você não pode excluir sua única carteira.');
    }

    Alert.alert(
      'Excluir Carteira',
      `Tem certeza que deseja apagar "${wallet.name}"? Isso removerá permanentemente os dados desta carteira.`,
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
              
              triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
              await fetchWallets();
            } catch {
              triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Erro', 'Não foi possível excluir a carteira.');
            }
          }
        }
      ]
    );
  }

  function handleEdit(wallet: any) {
    triggerSelectionHaptic();
    setSelectedWallet(wallet);
    setEditVisible(true);
  }

  function handleOpenCreate() {
    triggerHaptic();
    setCreateVisible(true);
  }

  if (loading && wallets.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const headerRightButton = (
    <TouchableOpacity 
      onPress={handleOpenCreate} 
      style={styles.addButton}
      activeOpacity={0.6}
    >
      <MaterialIcons name="add-circle" size={32} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent"
        translucent
      />

      <SubHeader 
        title="Minhas Carteiras" 
        rightComponent={headerRightButton} 
      />

      <FlatList 
        data={wallets}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list, 
          { paddingBottom: Math.max(insets.bottom + 20, 40) }
        ]}
        extraData={[user?.settings?.last_opened_wallet, hideValues]} 
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isActive = user?.settings?.last_opened_wallet === item.id;
          const balanceValue = Number(item.balance || 0);

          const cardBg = isActive 
            ? (isDark ? '#1e293b' : '#f0f9ff') 
            : colors.card;
          
          const iconBoxBg = isActive 
            ? colors.primary 
            : (isDark ? 'rgba(255,255,255,0.05)' : '#eff6ff');

          return (
            <View style={[
                styles.card, 
                { 
                  backgroundColor: cardBg, 
                  borderColor: isActive ? colors.primary : colors.border,
                  borderWidth: isActive ? 1.5 : 1
                }
            ]}>
              <View style={styles.cardInfo}>
                <View style={[styles.iconBox, { backgroundColor: iconBoxBg }]}>
                  <MaterialIcons 
                    name="account-balance-wallet" 
                    size={22} 
                    color={isActive ? '#FFF' : colors.primary} 
                  />
                </View>
                
                <View style={styles.textContainer}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    {isActive && (
                      <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.activeBadgeText}>Ativa</Text>
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
                    style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' }]}
                >
                  <MaterialIcons name="edit" size={18} color={colors.textSub} />
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => handleDelete(item)} 
                    style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2' }]}
                >
                  <MaterialIcons name="delete-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="account-balance-wallet" size={48} color={colors.border} />
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
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addButton: { 
    padding: 4,
    marginRight: -4
  },
  list: { padding: 20 },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 14, 
    borderRadius: 18, 
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { 
    width: 42, 
    height: 42, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  textContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  cardBalance: { fontSize: 13, fontWeight: '500' },
  activeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  activeBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFF', textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: { 
    padding: 10, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '500' }
});