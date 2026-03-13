import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, StatusBar, Modal, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { useAuthStore } from '../src/stores/authStore';
import { authService } from '../src/services/authService';
import api from '../src/services/api';
import { useThemeColor } from '@/hooks/useThemeColor';
import SubHeader from '@/components/SubHeader';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
  const signIn = useAuthStore((state) => state.signIn);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // --- 🚀 ESTADOS DO MODAL DE ESQUECI A SENHA ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [isForgotPwdVisible, setIsForgotPwdVisible] = useState(false);

  // --- FLUXO DE LOGIN COM E-MAIL ---
  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Atenção", "Preencha todos os campos");
    setLoading(true);
    try {
      const { user, token } = await authService.login({ email, password });
      Alert.alert("Bem-vindo de volta", "Acesso concedido!");
      await signIn(user, token);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert("Erro no Acesso", error.message || "E-mail ou senha incorretos.");
    } finally {
      setLoading(false); 
    }
  };

  // --- FLUXO DO GOOGLE ---
  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.type === 'cancelled') return; 

      const idToken = userInfo.type === 'success' ? userInfo.data?.idToken : null;
      if (!idToken) throw new Error("Falha ao obter o token do Google");

      const response = await api.post('/users/auth/google', { idToken });
      await signIn(response.data.user, response.data.token);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível entrar com o Google.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // --- 🚀 PASSO 1: SOLICITAR CÓDIGO (OTP) ---
  const handleSendCode = async () => {
    if (!forgotEmail) return Alert.alert('Atenção', 'Digite seu e-mail para receber o código.');
    setIsForgotLoading(true);
    try {
      await api.post('/users/forgot-password', { email: forgotEmail });
      Alert.alert('E-mail enviado!', 'Verifique sua caixa de entrada (e o spam).');
      setForgotStep(2); // Avança para a tela de digitar o código
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Não foi possível enviar o código.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // --- 🚀 PASSO 2: REDEFINIR A SENHA ---
  const handleResetPassword = async () => {
    if (!forgotEmail || !forgotToken || !forgotNewPassword) {
      return Alert.alert('Atenção', 'Preencha todos os campos para redefinir.');
    }
    setIsForgotLoading(true);
    try {
      await api.post('/users/reset-password', { 
        email: forgotEmail, 
        token: forgotToken, 
        newPassword: forgotNewPassword 
      });
      Alert.alert('Sucesso!', 'Sua senha foi alterada com sucesso.');
      closeModal(); // Fecha o modal e limpa tudo
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Código inválido ou expirado.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // --- FUNÇÃO PARA ABRIR/FECHAR MODAL LIMPANDO OS DADOS ---
  const openModal = () => {
    setForgotEmail(email); // Se ele já digitou o e-mail no login, a gente já preenche pra ele!
    setForgotStep(1);
    setForgotToken('');
    setForgotNewPassword('');
    setIsForgotPwdVisible(false)
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <Animated.View entering={FadeInUp.delay(50).duration(600).springify()}>
        <SubHeader title="Acessar Conta" />
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <View style={styles.main}>
            
            <Animated.View entering={FadeInDown.delay(100).duration(800).springify()} style={styles.heroSection}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="account-balance-wallet" size={28} color="#FFFFFF" />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Bem-vindo(a) de volta!</Text>
              <Text style={[styles.subtitle, { color: colors.textSub }]}>Gerencie suas finanças com segurança.</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(800).springify()} style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>E-mail</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialIcons name="mail-outline" size={20} color={colors.textSub} style={styles.inputIconLeft} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="gestio@exemplo.com"
                    placeholderTextColor={colors.textSub}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Senha</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialIcons name="lock-outline" size={20} color={colors.textSub} style={styles.inputIconLeft} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Sua senha"
                    placeholderTextColor={colors.textSub}
                    secureTextEntry={!isPasswordVisible}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity style={styles.inputIconRight} onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                    <MaterialIcons name={isPasswordVisible ? "visibility" : "visibility-off"} size={22} color={colors.textSub} />
                  </TouchableOpacity>
                </View>
                
                {/* 🚀 BOTÃO ABRE O MODAL AGORA */}
                <TouchableOpacity style={styles.forgotButton} onPress={openModal}>
                  <Text style={[styles.forgotText, { color: colors.primary }]}>Esqueceu a senha?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.loginButton, { backgroundColor: colors.primary }]} 
                onPress={handleLogin} 
                disabled={loading || isGoogleLoading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>Entrar</Text>}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.googleSection}>
              <View style={styles.dividerContainer}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textSub }]}>OU</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              <TouchableOpacity 
                style={[styles.googleButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
                onPress={handleGoogleLogin}
                disabled={isGoogleLoading || loading}
                activeOpacity={0.8}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <View style={styles.googleButtonContent}>
                    <Image source={require('../assets/images/google.png')} style={styles.googleIcon} />
                    <Text style={[styles.googleButtonText, { color: colors.text }]}>Entrar com Google</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={{ flex: 1 }} />

            <Animated.View entering={FadeInDown.delay(400).duration(800)}>
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textSub }]}>Não tem conta? </Text>
                <TouchableOpacity onPress={() => router.push('/Register')}>
                  <Text style={[styles.registerText, { color: colors.primary }]}>Registre-se agora</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ========================================================= */}
      {/* 🚀 MODAL DE RECUPERAÇÃO DE SENHA (BOTTOM SHEET) 🚀        */}
      {/* ========================================================= */}
      <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        
        {/* Envolvemos a tela toda para fechar o teclado ao clicar fora */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            
            {/* O SEGREDO ESTÁ AQUI: 'padding' para ambos os sistemas */}
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} 
              style={{ width: '100%' }}
            >
              
              {/* Impede que o clique DENTRO do modal feche o teclado acidentalmente */}
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                  
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Recuperar Senha</Text>
                    <TouchableOpacity onPress={closeModal} style={styles.closeModalButton}>
                      <MaterialIcons name="close" size={24} color={colors.textSub} />
                    </TouchableOpacity>
                  </View>

                  {forgotStep === 1 ? (
                    // --- CONTEÚDO DO PASSO 1 (PEDIR E-MAIL) ---
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
                          value={forgotEmail}
                          onChangeText={setForgotEmail}
                        />
                      </View>
                      <TouchableOpacity style={[styles.loginButton, { backgroundColor: colors.primary }]} onPress={handleSendCode} disabled={isForgotLoading}>
                        {isForgotLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>Enviar Código</Text>}
                      </TouchableOpacity>

                      {/* 🚀 NOVO BOTÃO DE ATALHO DE UX */}
                      <TouchableOpacity style={styles.backStepButton} onPress={() => setForgotStep(2)}>
                        <Text style={[styles.forgotText, { color: colors.textSub, textAlign: 'center' }]}>
                          Já recebi um código
                        </Text>
                      </TouchableOpacity>

                    </Animated.View>
                  ) : (
                    // --- CONTEÚDO DO PASSO 2 (CÓDIGO E NOVA SENHA) ---
                    <Animated.View entering={FadeInDown.duration(400)}>
                      <Text style={[styles.modalDesc, { color: colors.textSub }]}>
                        Digite o e-mail, o código recebido e a sua nova senha.
                      </Text>
                      
                      {/* 🚀 CAMPO DE E-MAIL ADICIONADO AO PASSO 2 */}
                      <View style={[
                        styles.inputWrapper, 
                        { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12, opacity: 0.6 } // Opacidade reduzida para indicar que está travado
                      ]}>
                        <MaterialIcons name="mail-outline" size={20} color={colors.textSub} style={styles.inputIconLeft} />
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          placeholder="Seu e-mail"
                          placeholderTextColor={colors.textSub}
                          value={forgotEmail}
                          editable={false} // 🚀 Impede que o usuário tente digitar de novo
                        />
                      </View>

                      <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12 }]}>
                        <MaterialIcons name="vpn-key" size={20} color={colors.textSub} style={styles.inputIconLeft} />
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          placeholder="Código recebido"
                          placeholderTextColor={colors.textSub}
                          autoCapitalize="none"
                          maxLength={8} // 🚀 AQUI ESTÁ A CORREÇÃO!
                          value={forgotToken}
                          onChangeText={setForgotToken}
                        />
                      </View>

                      <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 20 }]}>
                        <MaterialIcons name="lock-outline" size={20} color={colors.textSub} style={styles.inputIconLeft} />
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          placeholder="Sua nova senha"
                          placeholderTextColor={colors.textSub}
                          secureTextEntry={!isForgotPwdVisible}
                          value={forgotNewPassword}
                          onChangeText={setForgotNewPassword}
                        />
                        {/* 🚀 BOTÃO DO OLHINHO */}
                        <TouchableOpacity 
                          style={styles.inputIconRight} 
                          onPress={() => setIsForgotPwdVisible(!isForgotPwdVisible)}
                        >
                          <MaterialIcons 
                            name={isForgotPwdVisible ? "visibility" : "visibility-off"} 
                            size={22} 
                            color={colors.textSub} 
                          />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity style={[styles.loginButton, { backgroundColor: colors.primary }]} onPress={handleResetPassword} disabled={isForgotLoading}>
                        {isForgotLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>Redefinir Senha</Text>}
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.backStepButton} onPress={() => setForgotStep(1)}>
                        <Text style={[styles.forgotText, { color: colors.textSub, textAlign: 'center' }]}>Voltar para solicitar código</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                </View>
              </TouchableWithoutFeedback>
              
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: 16 },
  main: { flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  
  heroSection: { marginBottom: 32, alignItems: 'center' },
  iconContainer: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16, elevation: 4 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center' },
  
  form: { width: '100%', gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: 'bold', marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, height: 48, paddingHorizontal: 12 },
  inputIconLeft: { marginRight: 8 },
  input: { flex: 1, height: '100%', fontSize: 15 },
  inputIconRight: { padding: 8, marginLeft: 4, justifyContent: 'center', alignItems: 'center' },
  
  forgotButton: { alignSelf: 'flex-end', marginTop: 2, padding: 4 },
  forgotText: { fontSize: 13, fontWeight: '600' },
  
  loginButton: { marginTop: 8, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  googleSection: { width: '100%' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 12, fontSize: 12, fontWeight: 'bold' },
  googleButton: { height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  googleButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  googleIcon: { width: 22, height: 22 },
  googleButtonText: { fontSize: 15, fontWeight: '700' },

  footer: { marginTop: 24, marginBottom: 8, flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14 },
  registerText: { fontWeight: 'bold', fontSize: 14 },

  // --- ESTILOS DO MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeModalButton: {
    padding: 4,
  },
  modalDesc: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  backStepButton: {
    marginTop: 16,
    padding: 8,
  }
});