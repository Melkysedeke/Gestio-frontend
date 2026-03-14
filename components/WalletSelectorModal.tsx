import React, { useEffect, useState, useCallback } from 'react'; 
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, TouchableWithoutFeedback 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import { database } from '../src/database';
import Wallet from '../src/database/models/Wallet';

// 🚀 Importamos nossos novos utilitários centralizados
import { triggerHaptic, triggerSelectionHaptic } from '@/src/utils/haptics';

interface WalletSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (walletId: string) => void;
  onAddPress: () => void;
}

export default function WalletSelectorModal({ visible, onClose, onSelect, onAddPress }: WalletSelectorProps) {
  const { user, hideValues } = useAuthStore(); 
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
    if (visible) loadWallets();
  }, [visible, loadWallets]); 

  const formatDisplayCurrency = (value: number) => {
    if (hideValues) return "R$ •••••";
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleSelectWallet = (id: string) => {
    // 🚀 Feedback tátil sutil de seleção
    triggerSelectionHaptic();
    onSelect(id);
  };

  const handleAddNew = () => {
    // 🚀 Feedback de impacto leve ao abrir formulário
    triggerHaptic();
    onClose();      
    onAddPress(); 
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.title, { color: colors.text }]}>Minhas Carteiras</Text>
              
              {loading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator color={colors.primary} size="large" />
                </View>
              ) : (
                <FlatList
                  data={wallets}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  renderItem={({ item }) => {
                    const isSelected = user?.settings?.last_opened_wallet === item.id;
                    
                    const itemBackgroundColor = isSelected 
                        ? (isDark ? 'rgba(23, 115, 207, 0.12)' : '#f0f9ff') 
                        : colors.background;
                    
                    const itemBorderColor = isSelected ? colors.primary : colors.border;
                    const iconBgColor = isDark ? '#1e293b' : '#e0f2fe';

                    return (
                      <TouchableOpacity 
                        style={[
                            styles.item, 
                            { backgroundColor: itemBackgroundColor, borderColor: itemBorderColor }
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleSelectWallet(item.id)}
                      >
                        <View style={styles.row}>
                          <View style={[styles.iconBg, { backgroundColor: iconBgColor }]}>
                            <MaterialIcons name="account-balance-wallet" size={22} color={colors.primary} />
                          </View>
                          
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
                onPress={handleAddNew}
              >
                <View style={[styles.miniIconAdd, { backgroundColor: colors.primary }]}>
                   <MaterialIcons name="add" size={18} color="#FFF" />
                </View>
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
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    padding: 24 
  },
  modalContent: { 
    borderRadius: 28, 
    padding: 24, 
    maxHeight: '70%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20
  },
  title: { 
    fontSize: 20, 
    fontWeight: '900', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  loaderContainer: { 
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },
  item: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 14, 
    borderRadius: 18, 
    marginBottom: 10,
    borderWidth: 1.5
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    flex: 1 
  },
  textContainer: { 
    flex: 1, 
    paddingRight: 8 
  }, 
  iconBg: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  itemName: { 
    fontSize: 15, 
    fontWeight: '800' 
  },
  itemBalance: { 
    fontSize: 13, 
    marginTop: 2, 
    fontWeight: '600' 
  },
  addButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
    gap: 8 
  },
  miniIconAdd: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addText: { 
    fontWeight: '800', 
    fontSize: 15 
  }
});