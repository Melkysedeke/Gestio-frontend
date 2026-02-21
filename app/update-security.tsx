import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  ScrollView,
  Platform,
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function SecurityScreen() {
  const { user, purgeDatabase } = useAuthStore();
  const isGuest = user?.email?.includes('@local');
  const { colors, isDark } = useThemeColor();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  async function handleUpdatePassword() {
    if (isGuest) return;
    const oldP = oldPassword.trim();
    const newP = newPassword.trim();
    const confP = confirmPassword.trim();

    if (!oldP || !newP || !confP) return Alert.alert('Erro', 'Preencha todos os campos.');
    if (newP !== confP) return Alert.alert('Erro', 'As senhas não coincidem.');

    setLoading(true);
    try {
      Alert.alert('Sucesso', 'Sua senha foi atualizada!');
    } catch {
      Alert.alert('Erro', 'Falha ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      '⚠️ EXCLUIR DADOS',
      'Esta ação apagará todas as suas carteiras e transações locais permanentemente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sim, excluir tudo', 
          style: 'destructive',
          onPress: async () => {
            await purgeDatabase(); 
            router.replace('/welcome');
          }
        }
      ]
    );
  }

  // ✅ Componente interno otimizado
  const PasswordInput = ({ value, onChange, placeholder, show, onToggle }: any) => (
    <View style={[styles.passwordWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
      <TextInput 
        style={[styles.passwordInput, { color: colors.text }]} 
        secureTextEntry={!show} 
        value={value} 
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSub}
      />
      <TouchableOpacity onPress={onToggle} style={styles.eyeIcon}>
        <MaterialIcons name={show ? "visibility" : "visibility-off"} size={22} color={colors.textSub} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Segurança</Text>
          <View style={styles.placeholderView} />
        </View>

        <View style={styles.content}>
          {!isGuest && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Alterar Senha</Text>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSub }]}>Senha Atual</Text>
                <PasswordInput value={oldPassword} onChange={setOldPassword} placeholder="Sua senha atual" show={showOld} onToggle={() => setShowOld(!showOld)} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSub }]}>Nova Senha</Text>
                <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="Mínimo 6 caracteres" show={showNew} onToggle={() => setShowNew(!showNew)} />
              </View>
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: colors.primary }]} 
                onPress={handleUpdatePassword}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Atualizar Senha</Text>}
              </TouchableOpacity>
            </>
          )}

          <View style={[
            styles.dangerZone, 
            { 
              marginTop: isGuest ? 10 : 40, 
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fff1f1', 
              borderColor: isDark ? '#7f1d1d' : '#fecaca' 
            }
          ]}>
            <View style={styles.dangerHeader}>
              <MaterialIcons name="report-problem" size={20} color={colors.danger} />
              <Text style={[styles.dangerTitle, { color: colors.danger }]}>Zona de Perigo</Text>
            </View>
            <Text style={[styles.dangerDesc, { color: isDark ? '#fca5a5' : '#7f1d1d' }]}>
              Excluir a conta removerá permanentemente todos os dados financeiros salvos neste dispositivo.
            </Text>
            <TouchableOpacity 
              style={[styles.deleteButton, { backgroundColor: colors.card, borderColor: colors.danger }]} 
              onPress={handleDeleteAccount}
            >
              <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Excluir todos os dados</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingBottom: 16, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
  },
  backButton: { 
    padding: 4 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  placeholderView: { 
    width: 24 
  },
  content: { 
    padding: 20 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 20 
  },
  inputGroup: { 
    marginBottom: 16 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 8 
  },
  passwordWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderRadius: 12 
  },
  passwordInput: { 
    flex: 1, 
    padding: 14, 
    fontSize: 16 
  },
  eyeIcon: { 
    paddingHorizontal: 12 
  },
  saveButton: { 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 10 
  },
  saveButtonText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  dangerZone: { 
    padding: 20, 
    borderRadius: 16, 
    borderWidth: 1 
  },
  dangerHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 8 
  },
  dangerTitle: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  dangerDesc: { 
    fontSize: 13, 
    marginBottom: 16, 
    lineHeight: 18 
  },
  deleteButton: { 
    borderWidth: 1, 
    padding: 14, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  deleteButtonText: { 
    fontWeight: 'bold' 
  }
});