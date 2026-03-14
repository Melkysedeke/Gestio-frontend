import React, { useEffect, useState, useCallback } from 'react'; 
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, TouchableWithoutFeedback 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import { database } from '../src/database';
import Wallet from '../src/database/models/Wallet';

import { triggerHaptic, triggerSelectionHaptic } from '@/src/utils/haptics';

interface WalletSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (walletId: string) => void;
  onAddPress: () => void;
  onManagePress: () => void; // 🚀 Nova prop para rotear para a MyWallets
}

export default function WalletSelectorModal({ visible, onClose, onSelect, onAddPress, onManagePress }: WalletSelectorProps) {
  const { user, hideValues } = useAuthStore(); 
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets(); 

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
    triggerSelectionHaptic();
    onSelect(id);
  };

  const handleAddNew = () => {
    triggerHaptic();
    onClose();      
    onAddPress(); 
  };

  const handleManage = () => {
    triggerHaptic();
    onClose();      
    onManagePress(); // 🚀 Fecha o modal e chama a rota da MyWallets
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide" 
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        
        {/* Fundo Escuro */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <View style={[
          styles.modalContent, 
          { 
            backgroundColor: colors.card,
            paddingBottom: Math.max(insets.bottom + 10, 24) 
          }
        ]}>
          
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Minhas Carteiras</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <View style={[styles.closeIconBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                  <MaterialIcons name="close" size={20} color={colors.textSub} />
                </View>
            </TouchableOpacity>
          </View>
          
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

          {/* 🚀 Novo Rodapé com duas ações: Nova Carteira e Gerenciar */}
          <View style={styles.footerActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={handleAddNew}
            >
              <View style={[styles.miniIcon, { backgroundColor: colors.primary }]}>
                 <MaterialIcons name="add" size={18} color="#FFF" />
              </View>
              <Text style={[styles.actionText, { color: colors.primary }]}>Nova</Text>
            </TouchableOpacity>

            <View style={[styles.dividerVertical, { backgroundColor: colors.border }]} />

            <TouchableOpacity 
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={handleManage}
            >
              <View style={[styles.miniIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                 <MaterialIcons name="edit" size={16} color={colors.textSub} />
              </View>
              <Text style={[styles.actionText, { color: colors.textSub }]}>Gerenciar</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'flex-end', 
  },
  modalContent: { 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    paddingHorizontal: 24, 
    paddingTop: 16,
    maxHeight: '85%', 
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  handleBar: {
    width: 48,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '900', 
    textAlign: 'center' 
  },
  closeBtn: {
    padding: 4,
  },
  closeIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  
  // 🚀 Estilos do novo rodapé
  footerActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  dividerVertical: {
    width: 1,
    height: 24,
    opacity: 0.5,
  },
  miniIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionText: { 
    fontWeight: '800', 
    fontSize: 15 
  }
});