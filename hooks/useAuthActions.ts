import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { useAuthStore } from '../src/stores/authStore';
import { authService } from '../src/services/authService';
import api from '../src/services/api';

export const useAuthActions = () => {
  const router = useRouter();
  
  // Estados de Carregamento Separados
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  // Ações da Store
  const signIn = useAuthStore((state) => state.signIn);
  const signInAsGuest = useAuthStore((state) => state.signInAsGuest);
  const hapticsEnabled = useAuthStore((state) => state.hapticsEnabled);

  // Auxiliar para Haptics Respeitando a Configuração do Usuário
  const triggerHaptic = (type: Haptics.NotificationFeedbackType) => {
    if (hapticsEnabled) Haptics.notificationAsync(type);
  };

  const triggerImpact = (style: Haptics.ImpactFeedbackStyle) => {
    if (hapticsEnabled) Haptics.impactAsync(style);
  }

  // --- FLUXO 1: LOGIN COM E-MAIL E SENHA ---
  const handleEmailLogin = async (email: string, pass: string) => {
    if (!email || !pass) {
      triggerHaptic(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert("Atenção", "Preencha todos os campos");
    }

    setIsEmailLoading(true);
    try {
      const { user, token } = await authService.login({ 
        email: email.trim(), 
        password: pass 
      });
      await signIn(user, token);
      triggerHaptic(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error: any) {
      triggerHaptic(Haptics.NotificationFeedbackType.Error);
      const msg = error.response?.data?.message || "E-mail ou senha incorretos.";
      Alert.alert("Erro no Acesso", msg);
    } finally {
      setIsEmailLoading(false);
    }
  };

  // --- FLUXO 2: REGISTRO COM E-MAIL E SENHA ---
  const handleEmailRegister = async (name: string, email: string, pass: string, confirmPass: string, selectedImage: string | null) => {
    if (!name || !email || !pass || !confirmPass) {
      triggerHaptic(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
    }
    
    if (pass !== confirmPass) {
      triggerHaptic(Haptics.NotificationFeedbackType.Error);
      return Alert.alert('Erro', 'As senhas não coincidem.');
    }

    setIsEmailLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', pass);

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
      triggerHaptic(Haptics.NotificationFeedbackType.Success);
      await signIn(user, token);
      router.replace('/(tabs)');
    } catch (error: any) {
      triggerHaptic(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro ao Registrar', error.message || 'Falha ao criar conta. Verifique os dados.');
    } finally {
      setIsEmailLoading(false);
    }
  };

  // --- FLUXO 3: GOOGLE SIGN-IN ---
  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      // Proteção contra o usuário cancelar o modal no iOS
      if (userInfo.type === 'cancelled') return; 

      const idToken = userInfo.data?.idToken || (userInfo as any).idToken;
      if (!idToken) throw new Error("Token não obtido do Google");
      
      const response = await api.post('/users/auth/google', { idToken });
      await signIn(response.data.user, response.data.token);
      
      triggerHaptic(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error.code !== 'ASYNC_OP_IN_PROGRESS' && error.code !== 'SIGN_IN_CANCELLED') {
        console.error("Erro Google Login:", error.response?.data || error.message);
        Alert.alert("Erro", "Não foi possível entrar com o Google.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // --- FLUXO 4: CONVIDADO ---
  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    try {
      triggerImpact(Haptics.ImpactFeedbackStyle.Medium);
      await signInAsGuest('Visitante'); 
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert("Erro", "Falha ao acessar como convidado.");
    } finally {
      setIsGuestLoading(false);
    }
  };

  // Estado global de loading para bloquear a tela inteira se necessário
  const isAnyLoading = isEmailLoading || isGoogleLoading || isGuestLoading;

  return {
    handleEmailLogin,
    handleEmailRegister,
    handleGoogleLogin,
    handleGuestLogin,
    isEmailLoading,
    isGoogleLoading,
    isGuestLoading,
    isAnyLoading
  };
};