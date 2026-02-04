import React, { useEffect, useState, useCallback } from 'react'; // Adicionado useCallback
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, TouchableWithoutFeedback 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/authStore';
import api from '../src/services/api';

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

  // 1. Envolvemos a função em um useCallback para ela ser estável
  const loadWallets = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await api.get('/wallets', { params: { userId: user.id } });
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
            <View style={styles.modalContent}>
              <Text style={styles.title}>Minhas Carteiras</Text>
              
              {loading ? (
                <ActivityIndicator color="#1773cf" style={{ padding: 20 }} />
              ) : (
                <FlatList
                  data={wallets}
                  keyExtractor={item => String(item.id)}
                  renderItem={({ item }) => {
                    const isSelected = user?.last_opened_wallet === item.id;
                    return (
                      <TouchableOpacity 
                        style={[styles.item, isSelected && styles.selectedItem]}
                        onPress={() => onSelect(item.id)}
                      >
                        <View style={styles.row}>
                          <View style={styles.iconBg}>
                            <MaterialIcons name="account-balance-wallet" size={24} color="#1773cf" />
                          </View>
                          <View>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemBalance}>
                              {Number(item.balance || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </Text>
                          </View>
                        </View>
                        
                        {isSelected && (
                          <MaterialIcons name="check-circle" size={24} color="#1773cf" />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              )}

              {/* Botão Adicionar Nova - AGORA FUNCIONAL */}
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => {
                   onClose();    // Fecha este modal (o seletor)
                   onAddPress(); // Chama a função de abrir o modal de criação
                }}
              >
                <MaterialIcons name="add" size={20} color="#1773cf" />
                <Text style={styles.addText}>Nova Carteira</Text>
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
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, maxHeight: '60%' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 16, textAlign: 'center' },
  item: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: 16, borderRadius: 12, marginBottom: 8, backgroundColor: '#f8fafc',
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  selectedItem: { borderColor: '#1773cf', backgroundColor: '#f0f9ff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  itemBalance: { fontSize: 14, color: '#64748b' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginTop: 8, gap: 8 },
  addText: { color: '#1773cf', fontWeight: 'bold', fontSize: 16 }
});