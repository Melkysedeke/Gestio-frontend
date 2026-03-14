import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, 
  KeyboardAvoidingView, Platform, ScrollView, Image, StatusBar, Keyboard 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuthActions } from '@/hooks/useAuthActions'; 

// Componentes Reutilizáveis
import SubHeader from '@/components/SubHeader';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';
import CustomInput from '@/components/CustomInput';
import PrimaryButton from '@/components/PrimaryButton';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColor(); 
  const insets = useSafeAreaInsets();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { 
    handleEmailLogin, 
    handleGoogleLogin, 
    handleGuestLogin, 
    isEmailLoading, 
    isGoogleLoading, 
    isGuestLoading, 
    isAnyLoading 
  } = useAuthActions();

  // 🚀 A mágica acontece aqui: desativamos o behavior do iOS na tela pai se o modal estiver aberto.
  const keyboardBehavior = Platform.OS === 'ios' ? (isModalVisible ? undefined : 'padding') : undefined;

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
        behavior={keyboardBehavior} 
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
                  onPress={() => {
                    Keyboard.dismiss(); // 👈 Adicione isso! Oculta o teclado de Login antes de abrir o Modal
                    setIsModalVisible(true);
                  }}
                  activeOpacity={0.7}
                  disabled={isAnyLoading}
>
                  <Text style={[styles.forgotText, { color: colors.primary }]}>Esqueceu a senha?</Text>
                </TouchableOpacity>
              </View>
              
              <PrimaryButton 
                title="Entrar" 
                onPress={() => handleEmailLogin(email, password)} 
                isLoading={isEmailLoading} 
                disabled={isAnyLoading}
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
                disabled={isAnyLoading}
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

              {/* Botão de Convidado */}
              <TouchableOpacity 
                onPress={handleGuestLogin} 
                style={styles.guestButton} 
                disabled={isAnyLoading}
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
                <TouchableOpacity onPress={() => router.push('/Register')} disabled={isAnyLoading}>
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
  iconContainer: { 
    width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5
  },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 6, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, textAlign: 'center', opacity: 0.8 },
  form: { width: '100%', gap: 16 },
  forgotButton: { alignSelf: 'flex-end', padding: 8, marginTop: -4 },
  forgotText: { fontSize: 13, fontWeight: '700' },
  googleSection: { width: '100%', alignItems: 'center' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, opacity: 0.5 },
  dividerText: { marginHorizontal: 12, fontSize: 12, fontWeight: 'bold', opacity: 0.5 },
  googleButton: { height: 56, width: '100%', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  googleButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  googleIcon: { width: 22, height: 22 },
  googleButtonText: { fontSize: 16, fontWeight: '700' },
  guestButton: { marginTop: 20, padding: 10 },
  guestText: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  footer: { marginTop: 'auto', paddingTop: 20, alignItems: 'center', marginBottom: 20 },
  registerRow: { flexDirection: 'row', alignItems: 'center' },
  footerText: { fontSize: 14 },
  registerText: { fontWeight: 'bold', fontSize: 14 },
});