import React, { useState, useEffect } from 'react';
import { 
  View, Text, Modal, StyleSheet, TouchableOpacity, 
  Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useThemeColor } from '@/hooks/useThemeColor';
import { database } from '../src/database';
import WalletModel from '../src/database/models/Wallet';

// 🚀 Nossos componentes padronizados
import CustomInput from './CustomInput';
import PrimaryButton from './PrimaryButton';
import { triggerHaptic, triggerNotificationHaptic } from '@/src/utils/haptics';

interface Wallet {
  id: string;
  name: string;
}

interface Props {
  visible: boolean;
  wallet: Wallet | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditWalletModal({ visible, wallet, onClose, onSuccess }: Props) {
  const { colors, isDark } = useThemeColor();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Preenche o nome atual quando o modal abre
  useEffect(() => {
    if (visible && wallet) {
      setName(wallet.name);
    }
  }, [visible, wallet]);

  const handleClose = () => {
    triggerHaptic();
    Keyboard.dismiss(); // 🚀 Garante que o teclado feche antes de desmontar o modal
    onClose();
  };

  async function handleSave() {
    if (!name.trim() || !wallet) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert('Atenção', 'O nome da carteira não pode ficar vazio.');
    }

    setLoading(true);
    try {
      // 🚀 Atualizando no WatermelonDB em vez de chamar a API direta.
      // Isso deixa o app super rápido e offline-first.
      await database.write(async () => {
        const walletRecord = await database.get<WalletModel>('wallets').find(wallet.id);
        await walletRecord.update((w: any) => {
          w.name = name.trim();
        });
      });

      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Erro ao atualizar carteira:", error);
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Não foi possível atualizar a carteira.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={handleClose}>
      {/* Clique fora do modal fecha o teclado/modal */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          
          {/* 🚀 O KeyboardAvoidingView envelopa apenas o form, evitando o gap inferior */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            style={styles.keyboardContainer}
          >
            <TouchableWithoutFeedback>
              <View style={[
                styles.modalContent, 
                { 
                  backgroundColor: colors.card, 
                  borderColor: colors.border,
                  borderWidth: isDark ? 1 : 0 
                }
              ]}>
                
                {/* Header */}
                <View style={styles.header}>
                  <Text style={[styles.title, { color: colors.text }]}>Editar Carteira</Text>
                  <TouchableOpacity 
                    onPress={handleClose} 
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View style={[styles.closeIconBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                      <MaterialIcons name="close" size={20} color={colors.textSub} />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Formulário Padronizado */}
                <CustomInput
                  label="Nome da Carteira"
                  leftIcon="account-balance-wallet"
                  placeholder="Ex: Nubank, Inter, Dinheiro..."
                  value={name}
                  onChangeText={setName}
                  autoFocus={true}
                />

                <PrimaryButton
                  title="Salvar Alterações"
                  onPress={handleSave}
                  isLoading={loading}
                  style={{ marginTop: 12 }}
                />
                
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>

        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    padding: 24 
  },
  keyboardContainer: {
    width: '100%',
    justifyContent: 'center',
  },
  modalContent: { 
    borderRadius: 28, 
    padding: 24, 
    // Sombras premium
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 20 
  },
  title: { 
    fontSize: 20, 
    fontWeight: '800',
    letterSpacing: -0.5 
  },
  closeIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});