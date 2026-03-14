import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, StatusBar 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '../src/stores/authStore';
import { authService } from '../src/services/authService';
import api from '../src/services/api';
import { useThemeColor } from '@/hooks/useThemeColor';

import SubHeader from '@/components/SubHeader';
import CustomInput from '@/components/CustomInput';
import PrimaryButton from '@/components/PrimaryButton';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
  const signIn = useAuthStore((state) => state.signIn);
  const signInAsGuest = useAuthStore((state) => state.signInAsGuest);
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedImage(result.assets[0].uri); 
    }
  };

  async function handleRegister() {
    if (!name || !email || !password || !confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert('Atenção', 'Preencha todos os campos.');
    }
    if (password !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return Alert.alert('Erro', 'As senhas não coincidem.');
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);

      if (selectedImage) {
        const uriParts = selectedImage.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('avatar', {
          uri: Platform.OS === 'ios' ? selectedImage.replace('file://', '') : selectedImage,
          name: `avatar.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      const { user, token } = await authService.register(formData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await signIn(user, token);
      router.replace('/(tabs)');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro ao Registrar', error.message || 'Falha ao criar conta.');
    } finally {
      setLoading(false);
    }
  }

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
        Alert.alert("Erro", "Não foi possível registrar com o Google.");
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
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      
      <Animated.View entering={FadeInUp.delay(50).duration(600).springify()}>
        <SubHeader title="Criar Conta" />
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={[styles.scrollContainer, { paddingBottom: insets.bottom + 20 }]} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.main}>

            <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.imageUploadContainer}>
              <View style={styles.imageUploadWrapper}>
                <TouchableOpacity style={[styles.imagePicker, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleAddPhoto}>
                  {selectedImage ? <Image source={{ uri: selectedImage }} style={styles.previewImage} /> : <MaterialIcons name="add-a-photo" size={28} color={colors.primary} />}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]} onPress={handleAddPhoto}>
                  <MaterialIcons name="edit" size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
              <Text style={[styles.imageUploadLabel, { color: colors.textSub }]}>Foto de perfil (opcional)</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} style={styles.form}>
              <CustomInput label="Nome Completo" leftIcon="person-outline" placeholder="Ex: João Silva" value={name} onChangeText={setName} />
              <CustomInput label="E-mail" leftIcon="mail-outline" placeholder="joao@email.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
              <CustomInput label="Senha" leftIcon="lock-outline" placeholder="Mínimo 6 caracteres" isPassword value={password} onChangeText={setPassword} />
              <CustomInput label="Confirmar Senha" leftIcon="lock-reset" placeholder="Repita sua senha" isPassword value={confirmPassword} onChangeText={setConfirmPassword} />
              <PrimaryButton title="Criar minha conta" onPress={handleRegister} isLoading={loading} disabled={isGoogleLoading || isGuestLoading} style={{ marginTop: 10 }} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.googleSection}>
              <View style={styles.dividerContainer}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textSub }]}>OU</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              <TouchableOpacity 
                style={[styles.googleButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.card, borderColor: colors.border }]} 
                onPress={handleGoogleLogin}
                disabled={isGoogleLoading || loading || isGuestLoading}
              >
                {isGoogleLoading ? <ActivityIndicator color={colors.primary} /> : (
                  <View style={styles.googleButtonContent}>
                    <Image source={require('../assets/images/google.png')} style={styles.googleIcon} />
                    <Text style={[styles.googleButtonText, { color: colors.text }]}>Registrar com Google</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Botão de Convidado adicionado logo abaixo do Google */}
              <TouchableOpacity 
                onPress={handleGuestLogin} 
                style={styles.guestButton} 
                disabled={isGuestLoading || loading || isGoogleLoading}
              >
                {isGuestLoading ? <ActivityIndicator size="small" color={colors.primary} /> : (
                  <Text style={[styles.guestText, { color: colors.textSub }]}>Entrar como convidado</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSub }]}>Já possui uma conta? </Text>
              <TouchableOpacity onPress={() => router.push('/Login')}>
                <Text style={[styles.loginLinkText, { color: colors.primary }]}>Fazer Login</Text>
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
  scrollContainer: { flexGrow: 1 },
  main: { flex: 1, paddingHorizontal: 24, paddingTop: 10 },
  imageUploadContainer: { alignItems: 'center', marginBottom: 24, gap: 10 },
  imageUploadWrapper: { position: 'relative' },
  imagePicker: { width: 90, height: 90, borderRadius: 45, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  editBadge: { position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  imageUploadLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  form: { width: '100%', gap: 4 },
  googleSection: { width: '100%', alignItems: 'center' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, opacity: 0.5 },
  dividerText: { marginHorizontal: 12, fontSize: 12, fontWeight: '800', opacity: 0.6 },
  googleButton: { height: 52, width: '100%', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  googleButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  googleIcon: { width: 20, height: 20 },
  googleButtonText: { fontSize: 15, fontWeight: '700' },
  guestButton: { marginTop: 16, padding: 8 },
  guestText: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  footer: { marginTop: 24, flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  footerText: { fontSize: 14 },
  loginLinkText: { fontWeight: 'bold', fontSize: 14, marginLeft: 4 }
});