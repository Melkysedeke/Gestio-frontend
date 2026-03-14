// src/components/ForgotPasswordModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';
import api from '../src/services/api';

// 🚀 Usando os componentes do Design System para manter a coesão visual e haptics
import CustomInput from './CustomInput';
import PrimaryButton from './PrimaryButton';
import { triggerHaptic, triggerNotificationHaptic } from '@/src/utils/haptics';
import * as Haptics from 'expo-haptics'; 

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  initialEmail?: string; 
}

export default function ForgotPasswordModal({ visible, onClose, initialEmail = '' }: ForgotPasswordModalProps) {
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reseta o estado quando o modal abre
  useEffect(() => {
    if (visible) {
      setEmail(initialEmail);
      setStep(1);
      setToken('');
      setNewPassword('');
    }
  }, [visible, initialEmail]);

  const handleSendCode = async () => {
    if (!email) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert('Atenção', 'Digite seu e-mail para receber o código.');
    }
    
    setIsLoading(true);
    try {
      await api.post('/users/forgot-password', { email });
      
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      Alert.alert('E-mail enviado!', 'Verifique sua caixa de entrada.');
      setStep(2);
    } catch (error: any) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', error.response?.data?.error || 'Não foi possível enviar o código.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email || !token || !newPassword) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert('Atenção', 'Preencha todos os campos.');
    }

    setIsLoading(true);
    try {
      await api.post('/users/reset-password', { email, token, newPassword });
      
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso!', 'Sua senha foi alterada.');
      onClose(); 
    } catch (error: any) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', error.response?.data?.error || 'Código inválido ou expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    triggerHaptic();
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      {/* Clicar fora fecha o teclado primeiro; se já estiver fechado, não faz nada extra */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          
          {/* 🚀 Solução para o GAP: 
            O behavior 'padding' só no iOS. O Android se resolve sozinho se o manifest estiver config.
            Aplicamos o KeyboardAvoidingView englobando APENAS o conteúdo que sobe.
          */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            style={styles.keyboardContainer}
          >
            <TouchableWithoutFeedback>
              <View style={[
                styles.modalContent, 
                { 
                  backgroundColor: colors.background,
                  // Respiro base + insets da barra de navegação (Home indicator)
                  paddingBottom: Math.max(insets.bottom, 24) 
                }
              ]}>
                
                {/* Header do Modal */}
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {step === 1 ? 'Recuperar Senha' : 'Nova Senha'}
                  </Text>
                  <TouchableOpacity onPress={handleClose} style={styles.closeModalButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <View style={[styles.closeIconBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                      <MaterialIcons name="close" size={20} color={colors.textSub} />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Passo 1: Solicitar Código */}
                {step === 1 ? (
                  <Animated.View entering={FadeInDown.duration(400)}>
                    <Text style={[styles.modalDesc, { color: colors.textSub }]}>
                      Enviaremos um código de verificação seguro para o seu e-mail.
                    </Text>
                    
                    <CustomInput
                      label="E-mail de cadastro"
                      leftIcon="mail-outline"
                      placeholder="exemplo@email.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                    
                    <PrimaryButton 
                      title="Enviar Código" 
                      onPress={handleSendCode} 
                      isLoading={isLoading}
                      style={{ marginTop: 12 }}
                    />

                    <TouchableOpacity 
                      style={styles.backStepButton} 
                      onPress={() => { triggerHaptic(); setStep(2); }}
                    >
                      <Text style={[styles.forgotText, { color: colors.textSub }]}>
                        Já tenho um código
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>

                ) : (

                  /* Passo 2: Redefinir Senha */
                  <Animated.View entering={FadeInDown.duration(400)}>
                    <Text style={[styles.modalDesc, { color: colors.textSub }]}>
                      Digite o código recebido no seu e-mail e crie uma nova senha de acesso.
                    </Text>
                    
                    <CustomInput
                      label="Código de Verificação"
                      leftIcon="vpn-key"
                      placeholder="Ex: 123456"
                      autoCapitalize="none"
                      maxLength={8}
                      value={token}
                      onChangeText={setToken}
                    />

                    <CustomInput
                      label="Nova Senha"
                      leftIcon="lock-outline"
                      placeholder="Mínimo de 6 caracteres"
                      isPassword={true}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />

                    <PrimaryButton 
                      title="Confirmar Nova Senha" 
                      onPress={handleResetPassword} 
                      isLoading={isLoading}
                      style={{ marginTop: 12 }}
                    />
                    
                    <TouchableOpacity 
                      style={styles.backStepButton} 
                      onPress={() => { triggerHaptic(); setStep(1); }}
                    >
                      <Text style={[styles.forgotText, { color: colors.textSub }]}>
                        Voltar para envio de e-mail
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
                
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
    justifyContent: 'flex-end' 
  },
  keyboardContainer: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalContent: { 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    paddingHorizontal: 24,
    paddingTop: 24,
    // Sombra para destacar o modal
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: '900',
    letterSpacing: -0.5, 
  },
  closeModalButton: { 
    padding: 4 
  },
  closeIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDesc: { 
    fontSize: 15, 
    marginBottom: 20, 
    lineHeight: 22 
  },
  backStepButton: { 
    marginTop: 20, 
    padding: 10,
    alignItems: 'center'
  },
  forgotText: { 
    fontSize: 14, 
    fontWeight: '700',
    textDecorationLine: 'underline'
  }
});