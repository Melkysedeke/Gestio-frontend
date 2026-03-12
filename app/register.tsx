import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, StatusBar 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { useAuthStore } from '../src/stores/authStore';
import { authService } from '../src/services/authService';
import api from '../src/services/api';
import { useThemeColor } from '@/hooks/useThemeColor';
import SubHeader from '@/components/SubHeader';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
  const signIn = useAuthStore((state) => state.signIn);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7, 
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri); 
    }
  };

  async function handleRegister() {
    if (!name || !email || !password || !confirmPassword) {
      return Alert.alert('Atenção', 'Preencha todos os campos.');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Erro', 'As senhas não coincidem.');
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);

      if (selectedImage) {
        const filename = selectedImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('avatar', {
          uri: selectedImage,
          name: filename || `avatar-${Date.now()}.jpg`,
          type,
        } as any);
      }

      const { user, token } = await authService.register(formData);
      
      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      await signIn(user, token);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao registrar.');
    } finally {
      setLoading(false);
    }
  }

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
      Alert.alert("Erro", "Não foi possível registrar com o Google.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* 🚀 SUBHEADER MUDOU DE TEXTO E ASSUMIU O PAPEL DO TÍTULO */}
      <Animated.View entering={FadeInUp.delay(50).duration(600).springify()}>
        <SubHeader title="Criar Conta" />
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <View style={styles.main}>

            {/* FOTO MAIS COMPACTA */}
            <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.imageUploadContainer}>
              <View style={styles.imageUploadWrapper}>
                <TouchableOpacity 
                  style={[styles.imagePicker, { backgroundColor: colors.card, borderColor: colors.border }]} 
                  onPress={handleAddPhoto}
                >
                  {selectedImage ? (
                    <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                  ) : (
                    <MaterialIcons name="add-a-photo" size={28} color={colors.textSub} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]} onPress={handleAddPhoto}>
                    <MaterialIcons name="edit" size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
              <Text style={[styles.imageUploadLabel, { color: colors.textSub }]}>
                {selectedImage ? 'Toque para trocar' : 'Foto (Opcional)'}
              </Text>
            </Animated.View>

            {/* FORMULÁRIO COM GAPS MENORES */}
            <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Nome completo</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialIcons name="person" size={20} color={colors.textSub} style={styles.inputIconLeft} />
                  <TextInput 
                    style={[styles.input, { color: colors.text }]} 
                    placeholder="Seu nome" 
                    placeholderTextColor={colors.textSub} 
                    value={name} 
                    onChangeText={setName} 
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>E-mail</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialIcons name="mail" size={20} color={colors.textSub} style={styles.inputIconLeft} />
                  <TextInput 
                    style={[styles.input, { color: colors.text }]} 
                    placeholder="exemplo@email.com" 
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
                  <MaterialIcons name="lock" size={20} color={colors.textSub} style={styles.inputIconLeft} />
                  <TextInput 
                    style={[styles.input, { color: colors.text }]} 
                    placeholder="Mínimo 6 caracteres" 
                    placeholderTextColor={colors.textSub} 
                    secureTextEntry={!showPassword} 
                    value={password} 
                    onChangeText={setPassword} 
                  />
                  <TouchableOpacity style={styles.inputIconRight} onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={22} color={colors.textSub} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Confirme senha</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialIcons name="lock" size={20} color={colors.textSub} style={styles.inputIconLeft} />
                  <TextInput 
                    style={[styles.input, { color: colors.text }]} 
                    placeholder="Repita a senha" 
                    placeholderTextColor={colors.textSub} 
                    secureTextEntry={!showConfirmPassword} 
                    value={confirmPassword} 
                    onChangeText={setConfirmPassword} 
                  />
                  <TouchableOpacity style={styles.inputIconRight} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <MaterialIcons name={showConfirmPassword ? "visibility" : "visibility-off"} size={22} color={colors.textSub} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.registerButton, { backgroundColor: colors.primary }]} 
                onPress={handleRegister} 
                disabled={loading || isGoogleLoading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Text style={styles.registerButtonText}>Criar Conta</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* SEÇÃO DO GOOGLE MAIS ESPREMIDA */}
            <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.googleSection}>
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
                    <Text style={[styles.googleButtonText, { color: colors.text }]}>Registrar com Google</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={{ flex: 1 }} />

            {/* FOOTER */}
            <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSub }]}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => router.push('/Login')}>
                <Text style={[styles.loginLinkText, { color: colors.primary }]}>Entrar</Text>
              </TouchableOpacity>
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
  main: { flex: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  
  // Imagem menor e com gap menor
  imageUploadContainer: { alignItems: 'center', marginBottom: 20, gap: 8 },
  imageUploadWrapper: { position: 'relative' },
  imagePicker: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  editBadge: { position: 'absolute', bottom: 0, right: -4, padding: 5, borderRadius: 999, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  imageUploadLabel: { fontSize: 13, fontWeight: '500' },
  
  // Formulário compacto
  form: { width: '100%', gap: 14 },
  inputGroup: { gap: 4 },
  label: { fontSize: 13, fontWeight: 'bold', marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, height: 48, paddingHorizontal: 12 },
  inputIconLeft: { marginRight: 8 },
  input: { flex: 1, height: '100%', fontSize: 15 },
  inputIconRight: { padding: 8, marginLeft: 4, justifyContent: 'center', alignItems: 'center' },
  
  // Botões
  registerButton: { height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 2, marginTop: 4 },
  registerButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  
  googleSection: { width: '100%' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 12, fontSize: 12, fontWeight: 'bold' },
  googleButton: { height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  googleButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  googleIcon: { width: 22, height: 22 },
  googleButtonText: { fontSize: 15, fontWeight: '700' },
  
  // Rodapé
  footer: { marginTop: 16, flexDirection: 'row', justifyContent: 'center', paddingBottom: 8 },
  footerText: { fontSize: 14 },
  loginLinkText: { fontWeight: 'bold', fontSize: 14, marginLeft: 4 }
});