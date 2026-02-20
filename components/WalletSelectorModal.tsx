import React, { useEffect, useState, useCallback } from 'react'; 
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, TouchableWithoutFeedback 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/authStore';
import api from '../src/services/api';
import { useThemeColor } from '@/hooks/useThemeColor'; // <--- Hook de Tema

interface WalletSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (walletId: number) => void;
  onAddPress: () => void;
}

export default function WalletSelectorModal({ visible, onClose, onSelect, onAddPress }: WalletSelectorProps) {
  const user = useAuthStore(state => state.user);
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Hook de Cores
  const { colors, isDark } = useThemeColor();

  const loadWallets = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await api.get('/wallets/');
      setWallets(response.data);
    } catch (error) {
      console.log("Erro ao carregar carteiras:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);
  
  useEffect(() => {
    if (visible) {
      loadWallets();
    }
  }, [visible, loadWallets]); 

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.title, { color: colors.text }]}>Minhas Carteiras</Text>
              
              {loading ? (
                <ActivityIndicator color={colors.primary} style={{ padding: 20 }} />
              ) : (
                <FlatList
                  data={wallets}
                  keyExtractor={item => String(item.id)}
                  renderItem={({ item }) => {
                    const isSelected = user?.last_opened_wallet === item.id;
                    
                    // Lógica de cores do item
                    const itemBackgroundColor = isSelected 
                        ? (isDark ? 'rgba(23, 115, 207, 0.15)' : '#f0f9ff') 
                        : (isDark ? colors.background : '#f8fafc');
                    
                    const itemBorderColor = isSelected ? colors.primary : colors.border;

                    return (
                      <TouchableOpacity 
                        style={[
                            styles.item, 
                            { 
                                backgroundColor: itemBackgroundColor, 
                                borderColor: itemBorderColor 
                            }
                        ]}
                        onPress={() => onSelect(item.id)}
                      >
                        <View style={styles.row}>
                          <View style={[
                              styles.iconBg, 
                              { backgroundColor: isDark ? colors.card : '#e0f2fe' } // Fundo do ícone
                            ]}>
                            <MaterialIcons name="account-balance-wallet" size={24} color={colors.primary} />
                          </View>
                          <View>
                            <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                            <Text style={[styles.itemBalance, { color: colors.textSub }]}>
                              {Number(item.balance || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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

              {/* Botão Adicionar Nova */}
              <TouchableOpacity 
                style={styles.addButton}
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
  item: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: 16, borderRadius: 12, marginBottom: 8,
    borderWidth: 1
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemBalance: { fontSize: 14 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginTop: 8, gap: 8 },
  addText: { fontWeight: 'bold', fontSize: 16 }
});