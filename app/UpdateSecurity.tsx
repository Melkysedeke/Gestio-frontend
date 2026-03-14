import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ScrollView,
  StatusBar,
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import api from '../src/services/api';

// 🚀 Componentes Padronizados
import SubHeader from '@/components/SubHeader';
import CustomInput from '@/components/CustomInput';
import PrimaryButton from '@/components/PrimaryButton';
import { triggerNotificationHaptic } from '@/src/utils/haptics';

export default function SecurityScreen() {
  const { user, purgeDatabase } = useAuthStore();
  const isGuest = user?.email?.includes('@local');
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);

  async function handleUpdatePassword() {
    if (isGuest) return;
    const oldP = oldPassword.trim();
    const newP = newPassword.trim();
    const confP = confirmPassword.trim();

    if (!oldP || !newP || !confP) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert('Atenção', 'Preencha todos os campos.');
    }
    if (newP !== confP) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      return Alert.alert('Erro', 'As senhas não coincidem.');
    }
    if (newP.length < 6) { // Adicionando validação básica sugerida pelo placeholder
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert('Atenção', 'A nova senha deve ter no mínimo 6 caracteres.');
    }

    setLoading(true);
    try {
      // 🚀 Requisição direta e síncrona para o seu Backend
      const response = await api.put('/users/update-password', { 
        oldPassword: oldP, 
        newPassword: newP 
      });
      
      // 🚀 Se a sua API retorna um novo token após trocar a senha (Boa prática de segurança)
      // if (response.data.token) {
      //   useAuthStore.getState().setSession(user, response.data.token);
      // }
      
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Sua senha foi atualizada com segurança!');
      
      // Limpa os campos após sucesso
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error: any) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      const errorMessage = error.response?.data?.error || 'Falha ao atualizar senha. Verifique sua conexão.';
      Alert.alert('Erro', errorMessage);
      console.log("Erro completo na troca de senha:", error.response?.data || error.message);
      
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteAccount() {
    triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning); // Vibração de alerta grave
    
    Alert.alert(
      '⚠️ EXCLUIR CONTA',
      'Esta ação removerá permanentemente todos os seus dados do servidor e deste dispositivo. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sim, excluir tudo', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              if (isGuest) {
                await purgeDatabase(); 
                router.replace('/Welcome');
                return; 
              }

              await api.delete('/users/delete'); 
              await purgeDatabase(); 
              router.replace('/Welcome');

            } catch (error) {
              console.error("Erro ao excluir conta:", error);
              triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Erro', 'Não foi possível excluir os dados no servidor. Verifique sua conexão.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }

  return (
    // 🚀 Trocamos SafeAreaView por View. O SubHeader já protege o topo!
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent 
      />
      
      <SubHeader title="Segurança" />

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // Compensa a altura do Header
      >
        <ScrollView 
          // 🚀 O insets.bottom protege a barra inferior (Home Indicator)
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!isGuest && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Alterar Senha</Text>
              
              <CustomInput
                label="Senha Atual"
                leftIcon="lock"
                placeholder="Digite sua senha atual"
                isPassword={true}
                value={oldPassword}
                onChangeText={setOldPassword}
                containerStyle={{ marginBottom: 16 }}
              />
              
              <CustomInput
                label="Nova Senha"
                leftIcon="lock-outline"
                placeholder="Mínimo de 6 caracteres"
                isPassword={true}
                value={newPassword}
                onChangeText={setNewPassword}
                containerStyle={{ marginBottom: 16 }}
              />

              <CustomInput
                label="Confirmar Nova Senha"
                leftIcon="check-circle-outline"
                placeholder="Repita a nova senha"
                isPassword={true}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                containerStyle={{ marginBottom: 24 }}
              />

              <PrimaryButton 
                title="Atualizar Senha" 
                onPress={handleUpdatePassword}
                isLoading={loading}
              />
            </View>
          )}

          <View style={[
            styles.dangerZone, 
            { 
              marginTop: isGuest ? 0 : 40,
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fff1f1', 
              borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca' 
            }
          ]}>
            <View style={styles.dangerHeader}>
              <MaterialIcons name="report-problem" size={20} color={colors.danger} />
              <Text style={[styles.dangerTitle, { color: colors.danger }]}>Zona de Perigo</Text>
            </View>
            <Text style={[styles.dangerDesc, { color: isDark ? '#fca5a5' : '#7f1d1d' }]}>
              Excluir a conta removerá permanentemente todos os dados financeiros salvos neste dispositivo e na nuvem.
            </Text>
            
            <PrimaryButton 
              title="Excluir todos os dados" 
              variant="danger"
              onPress={handleDeleteAccount}
              disabled={loading}
              style={{ height: 48 }} 
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    marginBottom: 20,
    letterSpacing: -0.5
  },
  dangerZone: { 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1.5, 
  },
  dangerHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 12 
  },
  dangerTitle: { 
    fontSize: 16, 
    fontWeight: '800' 
  },
  dangerDesc: { 
    fontSize: 14, 
    marginBottom: 20, 
    lineHeight: 20,
    opacity: 0.9
  },
});