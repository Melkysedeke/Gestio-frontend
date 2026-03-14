// src/components/ForgotPasswordModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';
import api from '../src/services/api';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  initialEmail?: string; // Para preencher o e-mail se o usuário já tiver digitado no login
}

export default function ForgotPasswordModal({ visible, onClose, initialEmail = '' }: ForgotPasswordModalProps) {
  const { colors } = useThemeColor();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPwdVisible, setIsPwdVisible] = useState(false);

  // 🚀 Atualiza o e-mail inicial sempre que o modal for aberto
  useEffect(() => {
    if (visible) {
      setEmail(initialEmail);
      setStep(1);
      setToken('');
      setNewPassword('');
      setIsPwdVisible(false);
    }
  }, [visible, initialEmail]);

  const handleSendCode = async () => {
    if (!email) return Alert.alert('Atenção', 'Digite seu e-mail para receber o código.');
    setIsLoading(true);
    try {
      await api.post('/users/forgot-password', { email });
      Alert.alert('E-mail enviado!', 'Verifique sua caixa de entrada.');
      setStep(2);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Não foi possível enviar o código.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email || !token || !newPassword) {
      return Alert.alert('Atenção', 'Preencha todos os campos.');
    }
    setIsLoading(true);
    try {
      await api.post('/users/reset-password', { 
        email, 
        token, 
        newPassword 
      });
      Alert.alert('Sucesso!', 'Sua senha foi alterada.');
      onClose(); // Fecha o modal após sucesso
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Código inválido ou expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <TouchableWithoutFeedback>
              <View style={[
                styles.modalContent, 
                { 
                  backgroundColor: colors.background,
                  paddingBottom: Math.max(insets.bottom + 20, 30) 
                }
              ]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Recuperar Senha</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeModalButton}>
                    <MaterialIcons name="close" size={24} color={colors.textSub} />
                  </TouchableOpacity>
                </View>

                {step === 1 ? (
                  <Animated.View entering={FadeInDown.duration(400)}>
                    <Text style={[styles.modalDesc, { color: colors.textSub }]}>
                      Enviaremos um código de verificação para o seu e-mail.
                    </Text>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 20 }]}>
                      <MaterialIcons name="mail-outline" size={20} color={colors.textSub} style={styles.inputIconLeft} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Digite seu e-mail"
                        placeholderTextColor={colors.textSub}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: colors.primary }]} 
                      onPress={handleSendCode} 
                      disabled={isLoading}
                    >
                      {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionButtonText}>Enviar Código</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.backStepButton} onPress={() => setStep(2)}>
                      <Text style={[styles.forgotText, { color: colors.textSub, textAlign: 'center' }]}>
                        Já recebi um código
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ) : (
                  <Animated.View entering={FadeInDown.duration(400)}>
                    <Text style={[styles.modalDesc, { color: colors.textSub }]}>
                      Digite o código recebido e a sua nova senha.
                    </Text>
                    
                    <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12, opacity: 0.6 }]}>
                      <MaterialIcons name="mail-outline" size={20} color={colors.textSub} style={styles.inputIconLeft} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={email}
                        editable={false} 
                      />
                    </View>

                    <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12 }]}>
                      <MaterialIcons name="vpn-key" size={20} color={colors.textSub} style={styles.inputIconLeft} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Código recebido"
                        placeholderTextColor={colors.textSub}
                        autoCapitalize="none"
                        maxLength={8}
                        value={token}
                        onChangeText={setToken}
                      />
                    </View>

                    <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 20 }]}>
                      <MaterialIcons name="lock-outline" size={20} color={colors.textSub} style={styles.inputIconLeft} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Nova senha"
                        placeholderTextColor={colors.textSub}
                        secureTextEntry={!isPwdVisible}
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                      <TouchableOpacity onPress={() => setIsPwdVisible(!isPwdVisible)}>
                        <MaterialIcons name={isPwdVisible ? "visibility" : "visibility-off"} size={22} color={colors.textSub} />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: colors.primary }]} 
                      onPress={handleResetPassword} 
                      disabled={isLoading}
                    >
                      {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionButtonText}>Redefinir Senha</Text>}
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.backStepButton} onPress={() => setStep(1)}>
                      <Text style={[styles.forgotText, { color: colors.textSub, textAlign: 'center' }]}>Voltar</Text>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  closeModalButton: { padding: 4 },
  modalDesc: { fontSize: 15, marginBottom: 24, lineHeight: 22 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, height: 52, paddingHorizontal: 14 },
  inputIconLeft: { marginRight: 10 },
  input: { flex: 1, height: '100%', fontSize: 15 },
  actionButton: { borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  backStepButton: { marginTop: 20, padding: 10 },
  forgotText: { fontSize: 14, fontWeight: '600' }
});