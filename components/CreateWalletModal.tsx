import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Animated as RNAnimated // 🚀 Importado explicitamente
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { database } from '../src/database'; 
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';

// Componentes globais e utilitários
import CustomInput from './CustomInput';
import PrimaryButton from './PrimaryButton';
import { triggerHaptic, triggerNotificationHaptic } from '@/src/utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateWalletModal({ visible, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const user = useAuthStore(state => state.user);
  const updateUserSetting = useAuthStore(state => state.updateUserSetting);

  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();

  // 🚀 1. Motor de Animação do Teclado
  const keyboardPadding = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      RNAnimated.timing(keyboardPadding, {
        toValue: e.endCoordinates.height,
        duration: 250,
        useNativeDriver: false, // 🚀 Atualiza fisicamente o layout para empurrar as coisas no Android
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

  useEffect(() => {
    if (visible) {
      setName('');
      setLoading(false);
    }
  }, [visible]);

  const handleClose = () => {
    triggerHaptic();
    Keyboard.dismiss();
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert("Atenção", "Dê um nome para sua carteira.");
    }
    if (!user) return;

    setLoading(true);
    Keyboard.dismiss();

    try {
      let newWalletId = '';

      await database.write(async () => {
        const walletsCollection = database.get('wallets');
        const newWallet = await walletsCollection.create((w: any) => {
          w.name = name.trim();
          w.balance = 0;
          w._raw.user_id = user.id; 
        });
        newWalletId = newWallet.id;
      });

      if (newWalletId) {
        await updateUserSetting({ last_opened_wallet: newWalletId });
        
        triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error("❌ Erro ao criar carteira:", error);
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Não foi possível criar a carteira. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        
        {/* Fundo clicável para fechar o Modal */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        {/* 🚀 2. Container Animado que empurra o conteúdo para cima */}
        <RNAnimated.View style={{ paddingBottom: keyboardPadding, width: '100%' }}>
          
          <View style={[
              styles.modalContent, 
              { 
                backgroundColor: colors.card,
                paddingBottom: Math.max(insets.bottom + 20, 24) 
              }
            ]}>
            
            {/* O clique interno fecha o teclado, mas preserva o Modal aberto */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View>
                
                {/* Tracinho de arraste */}
                <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
                
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Nova Carteira</Text>
                    <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <View style={[styles.closeIconBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                          <MaterialIcons name="close" size={20} color={colors.textSub} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* 🚀 Adicionamos autoFocus=false no Android para o teclado não saltar assim que abre. Se quiser pular etapas, pode manter true */}
                <CustomInput
                  label="Nome da Carteira"
                  leftIcon="account-balance-wallet"
                  placeholder="Ex: Nubank, Física, Investimentos..."
                  value={name}
                  onChangeText={setName}
                  autoFocus={Platform.OS === 'ios'} 
                  returnKeyType="done"
                  onSubmitEditing={handleCreate}
                />

                <PrimaryButton
                  title="Criar Carteira"
                  onPress={handleCreate}
                  isLoading={loading}
                  style={{ marginTop: 24 }}
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end', 
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    shadowColor: "#000",
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
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
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