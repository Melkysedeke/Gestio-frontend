import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, Modal, StyleSheet, TouchableOpacity, 
  Alert, Platform, TouchableWithoutFeedback, Keyboard, Animated as RNAnimated
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // 🚀 Motor de Animação do Teclado (O padrão infalível do app)
  const keyboardPadding = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      RNAnimated.timing(keyboardPadding, {
        toValue: e.endCoordinates.height,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      RNAnimated.timing(keyboardPadding, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Preenche o nome atual quando o modal abre
  useEffect(() => {
    if (visible && wallet) {
      setName(wallet.name);
    }
  }, [visible, wallet]);

  const handleClose = () => {
    triggerHaptic();
    Keyboard.dismiss();
    onClose();
  };

  async function handleSave() {
    if (!name.trim() || !wallet) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert('Atenção', 'O nome da carteira não pode ficar vazio.');
    }

    setLoading(true);
    Keyboard.dismiss(); // Fecha o teclado antes de salvar para a animação ser limpa

    try {
      await database.write(async () => {
        const walletRecord = await database.get<WalletModel>('wallets').find(wallet.id);
        await walletRecord.update((w: any) => {
          w.name = name.trim();
        });
      });

      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      onSuccess();
      handleClose(); // handleClose já chama o onClose()
    } catch (error) {
      console.error("Erro ao atualizar carteira:", error);
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Não foi possível atualizar a carteira.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal 
      animationType="slide" // 🚀 Mudamos de fade para slide para combinar com o BottomSheet
      transparent={true} 
      visible={visible} 
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        
        {/* Fundo clicável escuro */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        {/* 🚀 Container Animado do Teclado */}
        <RNAnimated.View style={{ paddingBottom: keyboardPadding, width: '100%' }}>
          
          <View style={[
            styles.modalContent, 
            { 
              backgroundColor: colors.card, 
              paddingBottom: Math.max(insets.bottom + 20, 24) 
            }
          ]}>
            
            {/* O clique interno fecha o teclado, mas mantém o Modal */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View>
                
                {/* Tracinho de arraste padronizado */}
                <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
                
                {/* Header */}
                <View style={styles.header}>
                  <Text style={[styles.title, { color: colors.text }]}>Editar Carteira</Text>
                  <TouchableOpacity 
                    onPress={handleClose} 
                    style={styles.closeBtn}
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
                  autoFocus={Platform.OS === 'ios'} // Android se sai melhor sem autoFocus imediato
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />

                <PrimaryButton
                  title="Salvar Alterações"
                  onPress={handleSave}
                  isLoading={loading}
                  style={{ marginTop: 24 }} // Maior respiro como no CreateWallet
                />
                
              </View>
            </TouchableWithoutFeedback>
          </View>
          
        </RNAnimated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end', // 🚀 Agora fica na base da tela
  },
  modalContent: { 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    paddingHorizontal: 24, 
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
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
    marginBottom: 24 
  },
  title: { 
    fontSize: 22, 
    fontWeight: '900',
    letterSpacing: -0.5 
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
});