import React, { useState } from 'react';
import { 
  Alert,
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router'; // ✅ Importado o router
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function WelcomeScreen() {
  const [name, setName] = useState('');
  const { colors, isDark } = useThemeColor();
  const router = useRouter(); // ✅ Inicializado o router

  const signInAsGuest = useAuthStore((state) => state.signInAsGuest);
  const isLoading = useAuthStore((state) => state.isLoading);

  const handleStart = async () => {
    if (name.trim()) {
      await signInAsGuest(name.trim());
    }
  };

  const buttonOpacity = !name.trim() ? 0.6 : 1;
  const secondaryBtnBg = isDark ? '#1e293b' : '#f1f5f9';

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <LinearGradient
        colors={[colors.primary, isDark ? '#0f4d8b' : '#3b82f6']}
        style={styles.headerDecoration}
      >
        <View style={styles.iconCircle}>
          <MaterialIcons name="account-balance-wallet" size={40} color="#FFF" />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.textGroup}>
          <Text style={[styles.title, { color: colors.text }]}>Bem-vindo ao Gestio</Text>
          <Text style={[styles.subtitle, { color: colors.textSub }]}>
            Sua jornada financeira começa aqui, de forma <Text style={[styles.bold, { color: colors.primary }]}>privada</Text> e segura.
          </Text>
        </View>
        
        {/* FLUXO DE CONVIDADO */}
        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: colors.textSub }]}>ENTRAR COMO CONVIDADO</Text>
          <View style={[styles.inputBox, { 
            backgroundColor: colors.card, 
            borderColor: colors.border,
            borderWidth: isDark ? 1 : 1.5 
          }]}>
            <MaterialIcons name="person-outline" size={20} color={colors.textSub} style={styles.inputIcon} />
            <TextInput 
              style={[styles.input, { color: colors.text }]} 
              placeholder="Como podemos te chamar?"
              placeholderTextColor={colors.textSub}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.button, 
            { backgroundColor: colors.primary, opacity: buttonOpacity }
          ]} 
          onPress={handleStart}
          disabled={!name.trim() || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Começar offline</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>

        {/* DIVISOR */}
        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSub }]}>OU</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* FLUXO ONLINE (SUPABASE) */}
        <View style={styles.authButtonsContainer}>
          <TouchableOpacity 
            style={[styles.secondaryButton, { backgroundColor: secondaryBtnBg }]}
            onPress={() => Alert.alert("Em desenvolvimento","Aguarde para registrar sua conta e assegurar suas informações!")}
            // onPress={() => router.push('/register')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="cloud-upload" size={18} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Criar Conta Oficial</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.outlineButton, { borderColor: colors.border }]}
            onPress={() => Alert.alert("Em desenvolvimento","Aguarde para acessar sua conta e recuperar suas informações!")} 
            // onPress={() => router.push('/login')}
            activeOpacity={0.7}
          >
            <Text style={[styles.outlineButtonText, { color: colors.textSub }]}>Já tenho uma conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerDecoration: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 60,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  textGroup: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    lineHeight: 24,
  },
  bold: {
    fontWeight: 'bold',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 58,
    borderRadius: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  // ✅ Novos estilos para o divisor e botões de Auth
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  authButtonsContainer: {
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  outlineButton: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});