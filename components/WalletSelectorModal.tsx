import React, { useEffect, useState, useCallback } from 'react'; 
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, TouchableWithoutFeedback 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';

// Importações do WatermelonDB
import { database } from '../src/database';
import Wallet from '../src/database/models/Wallet';

interface WalletSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (walletId: string) => void;
  onAddPress: () => void;
}

export default function WalletSelectorModal({ visible, onClose, onSelect, onAddPress }: WalletSelectorProps) {
  const user = useAuthStore(state => state.user);
  const hideValues = useAuthStore(state => state.hideValues);
  
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { colors, isDark } = useThemeColor();

  const loadWallets = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const allWallets = await database.get<Wallet>('wallets').query().fetch();
      setWallets(allWallets);
    } catch (error) {
      console.error("Erro ao carregar carteiras:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);
  
  useEffect(() => {
    if (visible) {
      loadWallets();
    }
  }, [visible, loadWallets]); 

  const formatDisplayCurrency = (value: number) => {
    if (hideValues) return "R$ •••••";
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.title, { color: colors.text }]}>Minhas Carteiras</Text>
              
              {loading ? (
                <ActivityIndicator color={colors.primary} style={styles.loader} />
              ) : (
                <FlatList
                  data={wallets}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const isSelected = user?.settings?.last_opened_wallet === item.id;
                    
                    const itemBackgroundColor = isSelected 
                        ? (isDark ? 'rgba(23, 115, 207, 0.15)' : '#f0f9ff') 
                        : (isDark ? colors.background : '#f8fafc');
                    
                    const itemBorderColor = isSelected ? colors.primary : colors.border;
                    const iconBgColor = isDark ? colors.card : '#e0f2fe';

                    return (
                      <TouchableOpacity 
                        style={[
                            styles.item, 
                            { 
                                backgroundColor: itemBackgroundColor, 
                                borderColor: itemBorderColor 
                            }
                        ]}
                        activeOpacity={0.7}
                        onPress={() => onSelect(item.id)}
                      >
                        <View style={styles.row}>
                          <View style={[styles.iconBg, { backgroundColor: iconBgColor }]}>
                            <MaterialIcons name="account-balance-wallet" size={24} color={colors.primary} />
                          </View>
                          
                          {/* ✅ TextContainer controla o limite de tamanho para não empurrar o ícone */}
                          <View style={styles.textContainer}>
                            <Text 
                              style={[styles.itemName, { color: colors.text }]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {item.name}
                            </Text>
                            <Text style={[styles.itemBalance, { color: colors.textSub }]}>
                              {formatDisplayCurrency(Number(item.balance || 0))}
                            </Text>
                          </View>
                        </View>
                        
                        {isSelected && (
                          <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              )}

              <TouchableOpacity 
                style={styles.addButton}
                activeOpacity={0.7}
                onPress={() => {
                   onClose();    
                   onAddPress(); 
                }}
              >
                <MaterialIcons name="add" size={20} color={colors.primary} />
                <Text style={[styles.addText, { color: colors.primary }]}>Nova Carteira</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 20, maxHeight: '60%' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  loader: { padding: 20 },
  item: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: 16, borderRadius: 12, marginBottom: 8,
    borderWidth: 1
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  textContainer: { flex: 1, paddingRight: 10 }, // ✅ Impede o texto de empurrar outros elementos
  iconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemBalance: { fontSize: 14, marginTop: 2 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginTop: 8, gap: 8 },
  addText: { fontWeight: 'bold', fontSize: 16 }
});