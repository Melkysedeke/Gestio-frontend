import React, { useState } from 'react';
import { 
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
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function WelcomeScreen() {
  const [name, setName] = useState('');
  const { colors, isDark } = useThemeColor();

  const signInAsGuest = useAuthStore((state) => state.signInAsGuest);
  const isLoading = useAuthStore((state) => state.isLoading);

  const handleStart = async () => {
    if (name.trim()) {
      await signInAsGuest(name.trim());
    }
  };

  // ✅ Estilo do botão calculado para evitar sujeira no JSX
  const buttonOpacity = !name.trim() ? 0.6 : 1;

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
        
        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: colors.textSub }]}>COMO PODEMOS TE CHAMAR?</Text>
          <View style={[styles.inputBox, { 
            backgroundColor: colors.card, 
            borderColor: colors.border,
            borderWidth: isDark ? 1 : 1.5 
          }]}>
            <MaterialIcons name="person-outline" size={20} color={colors.textSub} style={styles.inputIcon} />
            <TextInput 
              style={[styles.input, { color: colors.text }]} 
              placeholder="Ex: Gestio"
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
              <Text style={styles.buttonText}>Começar agora</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>

        <Text style={[styles.footerText, { color: colors.textSub }]}>
          Dados armazenados apenas no seu dispositivo.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

// ✅ Estilos Otimizados: Removido tudo que é estrutural do Inline
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
    marginBottom: 40,
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
    marginBottom: 30,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
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
  footerText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
    fontWeight: '500',
  },
});