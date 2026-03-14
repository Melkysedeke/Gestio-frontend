import React, { useState } from 'react';
import { 
  Alert, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, 
  KeyboardAvoidingView, Platform, StatusBar, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router'; 
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import api from '../src/services/api';

export default function WelcomeScreen() {
  const { colors, isDark } = useThemeColor();
  const router = useRouter(); 
  const insets = useSafeAreaInsets();

  const signInAsGuest = useAuthStore((state) => state.signInAsGuest);
  const signIn = useAuthStore((state) => state.signIn); 
  
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  // --- FLUXO DO GOOGLE ---
  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.type === 'cancelled') return; 

      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error("Falha ao obter o token do Google");
      
      const response = await api.post('/users/auth/google', { idToken });
      
      await signIn(response.data.user, response.data.token);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error.code !== 'ASYNC_OP_IN_PROGRESS') {
        console.error("Erro Google Login:", error.response?.data || error.message);
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

  const isLoading = isGoogleLoading || isGuestLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* BOLHAS DE FUNDO */}
      <View style={[styles.staticBubble, { backgroundColor: isDark ? 'rgba(23, 115, 207, 0.08)' : 'rgba(23, 115, 207, 0.12)' }]} />
      <View style={[styles.intermediateBubble, { backgroundColor: isDark ? 'rgba(23, 115, 207, 0.05)' : 'rgba(23, 115, 207, 0.08)' }]} />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <LinearGradient
          colors={[colors.primary, isDark ? '#0f4d8b' : '#3b82f6']}
          style={[styles.headerDecoration, { paddingTop: insets.top }]}
        >
          <View style={styles.headerBubble} />

          <View style={styles.iconCircle}>
            <MaterialIcons name="account-balance-wallet" size={44} color="#FFF" />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.textGroup}>
            <Text style={[styles.title, { color: colors.text }]}>Gestio</Text>
            <Text style={[styles.subtitle, { color: colors.textSub }]}>
              Domine suas finanças de forma <Text style={[styles.bold, { color: colors.primary }]}>inteligente</Text> e segura.
            </Text>
          </View>
          
          <View style={styles.buttonsWrapper}>
            
            {/* 🚀 Botão do Google Padronizado com as outras telas */}
            <TouchableOpacity 
              style={[
                styles.googleButton, 
                { 
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF', 
                  borderColor: isDark ? '#334155' : '#E2E8F0' 
                },
                isLoading && { opacity: 0.7 }
              ]} 
              onPress={handleGoogleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <View style={styles.buttonContent}>
                  <Image source={require('../assets/images/google.png')} style={styles.googleIcon} />
                  <Text style={[styles.googleButtonText, { color: colors.text }]}>Entrar com Google</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.rowButtons}>
              {/* Botão de Cadastro Sólido */}
              <TouchableOpacity 
                style={[styles.halfButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/Register')}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <MaterialIcons name="person-add" size={20} color="#FFF" />
                <Text style={styles.primaryButtonText}>Criar Conta</Text>
              </TouchableOpacity>

              {/* Botão de Login Contorno */}
              <TouchableOpacity 
                style={[
                  styles.halfButton, 
                  { 
                    backgroundColor: isDark ? 'rgba(23, 115, 207, 0.1)' : '#F0F9FF',
                    borderWidth: 1.5,
                    borderColor: colors.primary 
                  }
                ]}
                onPress={() => router.push('/Login')}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <MaterialIcons name="login" size={20} color={colors.primary} />
                <Text style={[styles.outlineButtonText, { color: colors.primary }]}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Rodapé com insets */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <TouchableOpacity 
              onPress={handleGuestLogin}
              disabled={isLoading}
              activeOpacity={0.6}
              style={[styles.guestButton, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
            >
              {isGuestLoading ? (
                  <ActivityIndicator color={colors.textSub} size="small" />
              ) : (
                <>
                  <MaterialIcons name="no-accounts" size={18} color={colors.textSub} />
                  <Text style={[styles.guestText, { color: colors.textSub }]}>Entrar sem criar conta</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  staticBubble: { position: 'absolute', bottom: -100, right: -80, width: 320, height: 320, borderRadius: 160, zIndex: 0 },
  intermediateBubble: { position: 'absolute', top: '38%', left: -80, width: 200, height: 200, borderRadius: 100, zIndex: 0 },
  headerDecoration: { height: '32%', justifyContent: 'center', alignItems: 'center', borderBottomLeftRadius: 60, zIndex: 1, position: 'relative', overflow: 'hidden' },
  headerBubble: { position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  iconCircle: { width: 86, height: 86, borderRadius: 43, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginTop: 20, zIndex: 2 },
  content: { flex: 1, paddingHorizontal: 30, paddingTop: 40, paddingBottom: 20, zIndex: 1 },
  textGroup: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 36, fontWeight: '900', letterSpacing: -1, marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 24, textAlign: 'center', paddingHorizontal: 10 },
  bold: { fontWeight: '800' },
  buttonsWrapper: { width: '100%', gap: 16 },
  googleButton: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  googleIcon: { width: 22, height: 22 },
  googleButtonText: { fontSize: 16, fontWeight: '700' },
  rowButtons: { flexDirection: 'row', gap: 16, width: '100%' },
  halfButton: { flex: 1, height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  primaryButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  outlineButtonText: { fontSize: 15, fontWeight: '700' },
  footer: { marginTop: 'auto', alignItems: 'center' },
  guestButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 30 },
  guestText: { fontSize: 15, fontWeight: '700' }
});