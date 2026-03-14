import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '../src/stores/authStore';
import { authService } from '../src/services/authService';
import api from '../src/services/api';
import { useThemeColor } from '@/hooks/useThemeColor';

// Componentes Reutilizáveis
import SubHeader from '@/components/SubHeader';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';
import CustomInput from '@/components/CustomInput';
import PrimaryButton from '@/components/PrimaryButton'; 

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColor(); 
  const insets = useSafeAreaInsets();
  
  // States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false); // Adicionado
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Auth Store Actions
  const signInAsGuest = useAuthStore((state) => state.signInAsGuest);
  const signIn = useAuthStore((state) => state.signIn); 

  const handleLogin = async () => {
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert("Atenção", "Preencha todos os campos");
    }
    setLoading(true);
    try {
      const { user, token } = await authService.login({ 
        email: email.trim(), 
        password 
      });
      await signIn(user, token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = error.response?.data?.message || "E-mail ou senha incorretos.";
      Alert.alert("Erro no Acesso", msg);
    } finally {
      setLoading(false); 
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || (userInfo as any).idToken;
      if (!idToken) throw new Error("Token não obtido");
      
      const response = await api.post('/users/auth/google', { idToken });
      await signIn(response.data.user, response.data.token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error.code !== 'ASYNC_OP_IN_PROGRESS') {
        Alert.alert("Erro", "Não foi possível entrar com o Google.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await signInAsGuest('Visitante'); 
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert("Erro", "Falha ao acessar como convidado.");
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        translucent 
        backgroundColor="transparent" 
      />
      
      <Animated.View entering={FadeInUp.delay(50).duration(600).springify()}>
        <SubHeader title="Acessar Conta" />
      </Animated.View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContainer, 
            { paddingBottom: insets.bottom + 20 }
          ]} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.main}>
            
            <Animated.View entering={FadeInDown.delay(100).duration(800).springify()} style={styles.heroSection}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="account-balance-wallet" size={28} color="#FFFFFF" />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Bem-vindo(a) de volta!</Text>
              <Text style={[styles.subtitle, { color: colors.textSub }]}>Gerencie suas finanças com segurança.</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(800).springify()} style={styles.form}>
              <CustomInput
                label="E-mail"
                leftIcon="mail-outline"
                placeholder="gestio@exemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <View>
                <CustomInput
                  label="Senha"
                  leftIcon="lock-outline"
                  placeholder="Sua senha"
                  isPassword={true}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity 
                  style={styles.forgotButton} 
                  onPress={() => setIsModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.forgotText, { color: colors.primary }]}>Esqueceu a senha?</Text>
                </TouchableOpacity>
              </View>
              
              <PrimaryButton 
                title="Entrar" 
                onPress={handleLogin} 
                isLoading={loading} 
                disabled={isGoogleLoading || isGuestLoading}
                style={{ marginTop: 8 }}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.googleSection}>
              <View style={styles.dividerContainer}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textSub }]}>OU</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.googleButton, 
                  { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.card, 
                    borderColor: colors.border 
                  }
                ]} 
                onPress={handleGoogleLogin}
                disabled={isGoogleLoading || loading || isGuestLoading}
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

              {/* Botão de Convidado abaixo do Google */}
              <TouchableOpacity 
                onPress={handleGuestLogin} 
                style={styles.guestButton} 
                disabled={isGuestLoading || loading || isGoogleLoading}
              >
                {isGuestLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.guestText, { color: colors.textSub }]}>Entrar como convidado</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.footer}>
              <View style={styles.registerRow}>
                <Text style={[styles.footerText, { color: colors.textSub }]}>Não tem conta? </Text>
                <TouchableOpacity onPress={() => router.push('/Register')}>
                  <Text style={[styles.registerText, { color: colors.primary }]}>Registre-se agora</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ForgotPasswordModal 
        visible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
        initialEmail={email} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1 },
  main: { flex: 1, paddingHorizontal: 24, paddingTop: 10 },
  heroSection: { marginBottom: 32, alignItems: 'center' },
  iconContainer: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 6, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, textAlign: 'center', opacity: 0.8 },
  form: { width: '100%', gap: 16 },
  forgotButton: { alignSelf: 'flex-end', padding: 4, marginTop: 4 },
  forgotText: { fontSize: 13, fontWeight: '700' },
  googleSection: { width: '100%', alignItems: 'center' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, opacity: 0.5 },
  dividerText: { marginHorizontal: 12, fontSize: 12, fontWeight: 'bold', opacity: 0.5 },
  googleButton: { height: 54, width: '100%', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  googleButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  googleIcon: { width: 20, height: 20 },
  googleButtonText: { fontSize: 15, fontWeight: '700' },
  guestButton: { marginTop: 16, padding: 8 },
  guestText: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  footer: { marginTop: 30, alignItems: 'center', marginBottom: 20 },
  registerRow: { flexDirection: 'row', alignItems: 'center' },
  footerText: { fontSize: 14 },
  registerText: { fontWeight: 'bold', fontSize: 14 },
});