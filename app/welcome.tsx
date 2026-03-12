import React, { useEffect, useState } from 'react';
import { 
  Alert,
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router'; 
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import api from '../src/services/api';

export default function WelcomeScreen() {
  const { colors, isDark } = useThemeColor();
  const router = useRouter(); 

  const signInAsGuest = useAuthStore((state) => state.signInAsGuest);
  const signIn = useAuthStore((state) => state.signIn); 
  
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.type === 'cancelled') {
         return; 
      }
      const idToken = userInfo.type === 'success' ? userInfo.data?.idToken : null;
      if (!idToken) throw new Error("Falha ao obter o token do Google");
      const response = await api.post('/users/auth/google', { idToken });
      await signIn(response.data.user, response.data.token);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error("Erro no Google Login:", error);
      Alert.alert("Erro", "Não foi possível conectar com o Google. Verifique sua conexão.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    await signInAsGuest('Visitante'); 
    setIsGuestLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle="light-content" />

      {/* 🚀 BOLHA 1: Fundo (Canto inferior direito) */}
      <View style={[
        styles.staticBubble, 
        { backgroundColor: isDark ? 'rgba(23, 115, 207, 0.08)' : 'rgba(23, 115, 207, 0.12)' }
      ]} />

      {/* 🚀 BOLHA 2: Intermediária (Canto esquerdo, no meio da tela) */}
      <View style={[
        styles.intermediateBubble, 
        { backgroundColor: isDark ? 'rgba(23, 115, 207, 0.05)' : 'rgba(23, 115, 207, 0.08)' }
      ]} />
      
      <LinearGradient
        colors={[colors.primary, isDark ? '#0f4d8b' : '#3b82f6']}
        style={styles.headerDecoration}
      >
        {/* 🚀 BOLHA 3: Dentro do Header (Translúcida e branca) */}
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
          
          <TouchableOpacity 
            style={[styles.googleButton, { 
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF', 
              borderColor: isDark ? '#334155' : '#E2E8F0' 
            }]} 
            onPress={handleGoogleLogin}
            disabled={isGoogleLoading || isGuestLoading}
            activeOpacity={0.8}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View style={styles.buttonContent}>
                <Image 
                  source={require('../assets/images/google.png')} 
                  style={styles.googleIcon} 
                />
                <Text style={[styles.googleButtonText, { color: colors.text }]}>Entrar com Google</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.rowButtons}>
            <TouchableOpacity 
              style={[styles.halfButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/Register')}
              activeOpacity={0.8}
              disabled={isGoogleLoading || isGuestLoading}
            >
              <MaterialIcons name="person-add" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>Criar Conta</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.halfButton, { 
                backgroundColor: isDark ? 'rgba(23, 115, 207, 0.1)' : '#F0F9FF',
                borderWidth: 1.5,
                borderColor: colors.primary 
              }]}
              onPress={() => router.push('/Login')}
              activeOpacity={0.7}
              disabled={isGoogleLoading || isGuestLoading}
            >
              <MaterialIcons name="login" size={20} color={colors.primary} />
              <Text style={[styles.outlineButtonText, { color: colors.primary }]}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🚀 RODAPÉ COM TEXTO MAIS CLARO */}
        <View style={styles.footer}>
          <TouchableOpacity 
            onPress={handleGuestLogin}
            disabled={isGoogleLoading || isGuestLoading}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative', 
  },
  // 🚀 BOLHA 1 (Fundo - Gigante agora)
  staticBubble: {
    position: 'absolute',
    bottom: -100, // Mais afundada
    right: -80,   // Mais cortada na borda
    width: 320,   // Era 220
    height: 320,  // Era 220
    borderRadius: 160,
    zIndex: 0, 
  },
  // 🚀 BOLHA 2 (Meio - Mais presente)
  intermediateBubble: {
    position: 'absolute',
    top: '38%',
    left: -80,   // Puxada mais pra fora
    width: 200,  // Era 120
    height: 200, // Era 120
    borderRadius: 100,
    zIndex: 0,
  },
  headerDecoration: {
    height: '28%', 
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 60,
    zIndex: 1,
    position: 'relative',
    overflow: 'hidden', 
  },
  // 🚀 BOLHA 3 (Header - Ocupando mais a lateral direita)
  headerBubble: {
    position: 'absolute',
    top: -80,   // Subiu um pouco
    right: -60, // Puxou pra direita
    width: 260, // Era 160
    height: 260,// Era 160
    borderRadius: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // Levemente mais transparente para não ofuscar o ícone
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginTop: 20, 
    zIndex: 2, 
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 20,
    zIndex: 1,
  },
  textGroup: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  bold: {
    fontWeight: '800',
  },
  buttonsWrapper: {
    width: '100%',
    gap: 16, 
  },
  googleButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleIcon: {
    width: 22,
    height: 22,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 16, 
    width: '100%',
  },
  halfButton: {
    flex: 1, 
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    marginTop: 'auto', 
    alignItems: 'center',
    marginBottom: 10,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10, // Aumentei o espaço entre o ícone e o texto
    paddingVertical: 14, // Era 12
    paddingHorizontal: 32, // Era 24 - deixa a pílula mais larga
    borderRadius: 30,
  },
  guestText: {
    fontSize: 15, // Era 14 - mais legível
    fontWeight: '700', // Era 600 - um pouco mais gordinha pra chamar atenção
  }
});