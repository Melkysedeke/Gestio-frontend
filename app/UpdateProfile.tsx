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

// 🚀 Componentes Padronizados
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
    
    if (!name.trim()) {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert('Erro', 'O nome não pode estar vazio.');
    }

    setLoading(true);
    try {
        await updateUserSetting({ 
            name: name.trim(), 
            email: user?.email
        });

        triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Sucesso', 'Seus dados foram atualizados!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
    } catch (error: any) {
        console.error("Erro ao atualizar perfil:", error);
        triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
        const msg = error.response?.data?.error || 'Não foi possível salvar as alterações.';
        Alert.alert('Erro', msg);
    } finally {
        setLoading(false);
    }
  }

  const disabledBgColor = isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9';

  return (
    // 🚀 Trocamos SafeAreaView por View. O SubHeader já protege o topo!
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent"
        translucent
      />

      <SubHeader title="Dados Pessoais" />

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // Compensa a altura do Header
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
  container: { 
    flex: 1 
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
  inputGroup: { 
    marginBottom: 16 
  },
  labelRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  label: { 
    fontSize: 13, 
    fontWeight: '700',
    marginLeft: 4,
    letterSpacing: 0.3
  },
  guestBadge: { 
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  disabledInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 14, 
  },
  disabledIconLeft: {
    marginRight: 10
  },
  inputDisabledText: {
    flex: 1,
    fontSize: 15,
  },
  helperText: {
    fontSize: 11,
    marginTop: 6, 
    marginLeft: 4,
  }
});