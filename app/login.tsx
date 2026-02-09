import React, { useState } from 'react';
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
  ScrollView,
  // Image // Adicionei Image caso queira usar logo em vez de ícone
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

// Importações da nossa arquitetura
import { useAuthStore } from '../src/stores/authStore';
import { authService } from '../src/services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Atenção", "Preencha todos os campos");
    }

    setLoading(true);

    try {
      // 1. Usamos o Service (que já trata erros e JSON)
      // Nota: Certifique-se que o authService.ts está apontando para a rota certa 
      // (ex: '/users/signin' ou '/sessions')
      const { user, token } = await authService.login({ email, password });

      // 2. Salvamos no estado global
      await signIn(user, token);

      // 3. Redirecionamos para o App
      router.replace('/(tabs)');

    } catch (error: any) {
      // O authService já devolve mensagens amigáveis
      Alert.alert("Erro no Acesso", error.message);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

          <Animated.View
            entering={FadeInUp.delay(200).duration(1000).springify()}
            style={styles.header}
          >
             {/* Espaço reservado para header se precisar */}
          </Animated.View>

          <View style={styles.main}>

            {/* Hero Section */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(1000).springify()}
              style={styles.heroSection}
            >
              <View style={styles.iconContainer}>
                 {/* Se quiser usar a logo real aqui, troque o Icon por Image */}
                 {/* <Image source={require('../assets/images/Gestio-removebg-preview.png')} style={{width: 50, height: 50}} resizeMode="contain" /> */}
                <MaterialIcons name="account-balance-wallet" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.title}>Bem-vindo(a)</Text>
              <Text style={styles.subtitle}>Gerencie suas finanças com segurança.</Text>
            </Animated.View>

            {/* Formulário */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(1000).springify()}
              style={styles.form}
            >
              {/* Input Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="mail-outline" size={20} color="#637588" style={styles.inputIconLeft} />
                  <TextInput
                    style={styles.input}
                    placeholder="gestio@example.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Input Senha */}
              <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.label}>Senha</Text>
                </View>

                <View style={styles.inputWrapper}>
                  <MaterialIcons name="lock-outline" size={20} color="#637588" style={styles.inputIconLeft} />
                  <TextInput
                    style={styles.input}
                    placeholder="sua senha"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!isPasswordVisible}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    style={styles.inputIconRight}
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    <MaterialIcons
                      name={isPasswordVisible ? "visibility" : "visibility-off"}
                      size={22}
                      color="#637588"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotButton}>
                  <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
                </TouchableOpacity>
              </View>

              {/* Botão Login */}
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Entrar</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Footer */}
            <Animated.View entering={FadeInDown.delay(600).duration(1000).springify()}>
              <View style={styles.footer}>
                <Text style={styles.footerText}>Não tem conta? </Text>
                <TouchableOpacity onPress={() => router.push('/register')}>
                  <Text style={styles.registerText}>Registre-se agora</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContainer: { flexGrow: 1, paddingBottom: 24 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },

  main: { flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },

  heroSection: { marginBottom: 40, alignItems: 'center' },
  iconContainer: {
    width: 64, height: 64, backgroundColor: '#1773cf', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    shadowColor: '#1773cf', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  title: { fontSize: 30, fontWeight: 'bold', color: '#111418', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#637588', textAlign: 'center' },

  form: { width: '100%', gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500', color: '#111418', marginBottom: 6 },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    height: 50,
    paddingHorizontal: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  inputIconLeft: { marginRight: 8 },
  input: { flex: 1, height: '100%', fontSize: 16, color: '#111418' },
  inputIconRight: { padding: 8, marginLeft: 4, justifyContent: 'center', alignItems: 'center' },

  forgotButton: { alignSelf: 'flex-end', marginTop: 4 },
  forgotText: { fontSize: 14, fontWeight: '500', color: '#1773cf' },

  loginButton: {
    marginTop: 16, backgroundColor: '#1773cf', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1773cf', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  footer: { marginTop: 40, marginBottom: 16, flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: '#637588', fontSize: 14 },
  registerText: { color: '#1773cf', fontWeight: 'bold', fontSize: 14 },
});