import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons'; 
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';
// 🚀 1. Importar a API
import api from '../src/services/api';

// Componentes Padronizados
import SubHeader from '@/components/SubHeader';
import CustomInput from '@/components/CustomInput';
import PrimaryButton from '@/components/PrimaryButton';
import { triggerNotificationHaptic } from '@/src/utils/haptics';

export default function EditProfileScreen() {
  const user = useAuthStore(state => state.user);
  const updateUserSetting = useAuthStore(state => state.updateUserSetting);
  
  const isGuest = user?.email?.includes('@local');
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    Keyboard.dismiss();
    const newName = name.trim();
    if (!newName) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert('Erro', 'O nome não pode estar vazio.');
    }
    if (newName === user?.name) {
      // Se não mudou nada, apenas volta
      return router.back();
    }
    setLoading(true);
    try {
      // 🚀 2. Envia para o backend PRIMEIRO (se não for convidado)
      if (!isGuest) {
        await api.put('/users/update-profile', { 
          name: newName,
          email: user?.email // O backend pede o email mesmo que não vá alterar
        });
      }
      // 🚀 3. Atualiza o banco local (WatermelonDB e Estado do Zustand)
      await updateUserSetting({ 
          name: newName, 
          // Não passamos o e-mail aqui se ele for o mesmo, para evitar 'dirty marks' desnecessárias
      });
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Seus dados foram atualizados!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      // Captura mensagem de erro do servidor, se existir
      const msg = error.response?.data?.error || 'Não foi possível salvar as alterações.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  const disabledBgColor = isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent"
        translucent
      />

      <SubHeader title="Dados Pessoais" />

      {/* 🚀 O KeyboardAvoidingView DEVE envolver apenas o ScrollView */}
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" 
        >
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Perfil</Text>

            <CustomInput
              label="Nome Completo"
              leftIcon="person-outline"
              value={name}
              onChangeText={setName}
              placeholder="Como prefere ser chamado"
              autoCapitalize="words"
              containerStyle={{ marginBottom: 16 }}
            />

            {/* Campo: E-mail (Desativado com Feedback Visual) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.textSub }]}>E-mail de Cadastro</Text>
                {isGuest && <Text style={[styles.guestBadge, { color: colors.primary }]}>Modo Convidado</Text>}
              </View>
              
              <View style={[styles.disabledInputWrapper, { 
                backgroundColor: disabledBgColor, 
                borderColor: colors.border 
              }]}>
                <MaterialIcons name="mail-outline" size={20} color={colors.textSub} style={styles.disabledIconLeft} />
                <Text style={[styles.inputDisabledText, { color: colors.textSub }]} numberOfLines={1}>
                  {isGuest ? "Conta Local (Sincronização pendente)" : user?.email}
                </Text>
                <MaterialIcons name="lock-outline" size={18} color={colors.textSub} />
              </View>
              
              <Text style={[styles.helperText, { color: colors.textSub }]}>
                O e-mail de acesso não pode ser alterado por segurança.
              </Text>
            </View>

            <PrimaryButton 
              title="Salvar Alterações" 
              onPress={handleUpdate}
              isLoading={loading}
              style={{ marginTop: 24 }}
            />
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  section: { marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 20, letterSpacing: -0.5 },
  inputGroup: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', marginLeft: 4, letterSpacing: 0.3 },
  guestBadge: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  disabledInputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, height: 52, paddingHorizontal: 14 },
  disabledIconLeft: { marginRight: 10 },
  inputDisabledText: { flex: 1, fontSize: 15 },
  helperText: { fontSize: 11, marginTop: 6, marginLeft: 4 }
});