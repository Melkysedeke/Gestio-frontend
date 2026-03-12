import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, StatusBar
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

  // --- FLUXO DE LOGIN COM E-MAIL ---
  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Atenção", "Preencha todos os campos");
    }

    setLoading(true);

    try {
      const { user, token } = await authService.login({ email, password });
      
      Alert.alert("Bem-vindo de volta", "Acesso concedido!");
      await signIn(user, token);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error("❌ Erro no Acesso:", error.message);
      Alert.alert("Erro no Acesso", error.message || "E-mail ou senha incorretos.");
    } finally {
      setLoading(false); 
    }
  };

  // --- 🚀 FLUXO DO GOOGLE ---
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
      console.error("Erro no Google Login:", error);
      Alert.alert("Erro", "Não foi possível entrar com o Google.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* 🚀 SUBHEADER */}
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
                
                {/* 🚀 BOTÃO ESQUECI A SENHA */}
                <TouchableOpacity style={styles.forgotButton} onPress={() => Alert.alert('Em breve', 'Recuperação de senha será ativada.')}>
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

            {/* 🚀 SEÇÃO DO GOOGLE */}
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

            {/* FOOTER */}
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
  
  forgotButton: { alignSelf: 'flex-end', marginTop: 2 },
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
});