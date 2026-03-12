import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // 🚀 Importado para o ícone de cadeado
import { router } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';

import SubHeader from '@/components/SubHeader';

export default function EditProfileScreen() {
  const user = useAuthStore(state => state.user);
  const updateUserSetting = useAuthStore(state => state.updateUserSetting);
  
  const isGuest = user?.email?.includes('@local');
  const { colors, isDark } = useThemeColor();

  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (!name.trim()) return Alert.alert('Erro', 'O nome não pode estar vazio.');

    setLoading(true);
    try {
        await updateUserSetting({ 
            name: name.trim(), 
        });

        Alert.alert('Sucesso', 'Seus dados foram atualizados!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
    } catch (error: any) {
        console.error("Erro ao atualizar perfil:", error);
        Alert.alert('Erro', 'Não foi possível salvar as alterações no banco local.');
    } finally {
        setLoading(false);
    }
  }

  // Cores dinâmicas para o modo desativado (Feedback Visual)
  const disabledBgColor = isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9';
  const buttonOpacity = loading ? 0.7 : 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SubHeader title="Dados Pessoais" />

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" 
        >
          {/* Campo: Nome Completo (Editável) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>Nome Completo</Text>
            <TextInput 
              style={[styles.input, { 
                  backgroundColor: colors.inputBg, 
                  borderColor: colors.border,
                  color: colors.text 
              }]}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              placeholderTextColor={colors.textSub}
              autoCapitalize="words"
            />
          </View>

          {/* Campo: E-mail (Desativado com Feedback Visual) */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.textSub }]}>E-mail</Text>
              {isGuest && <Text style={[styles.guestBadge, { color: colors.primary }]}>Modo Convidado</Text>}
            </View>
            
            {/* 🚀 Wrapper para o Input Desativado + Ícone */}
            <View style={[styles.disabledInputWrapper, { 
              backgroundColor: disabledBgColor, 
              borderColor: colors.border 
            }]}>
              <TextInput 
                style={[styles.inputDisabledText, { color: colors.textSub }]}
                value={isGuest ? "Conta Local (Sincronização pendente)" : user?.email}
                editable={false}
              />
              <MaterialIcons name="lock-outline" size={20} color={colors.textSub} />
            </View>
            
            <Text style={[styles.helperText, { color: colors.textSub }]}>
              O e-mail de cadastro não pode ser alterado.
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary, opacity: buttonOpacity }]} 
            onPress={handleUpdate}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Atualizar Nome</Text>
            )}
          </TouchableOpacity>
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
    padding: 20, 
    paddingBottom: 40,
    gap: 20, 
  },
  inputGroup: { 
    gap: 8 
  },
  labelRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
  guestBadge: { 
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: { 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16,
  },
  /* 🚀 Estilos do campo desativado */
  disabledInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingRight: 14, // Espaço para o ícone do cadeado
  },
  inputDisabledText: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: -4, 
  },
  button: { 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  buttonText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});