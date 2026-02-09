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
import api from '../src/services/api';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor'; // <--- Hook

export default function SecurityScreen() {
  const { signOut } = useAuthStore();
  const { colors, isDark } = useThemeColor(); // <--- Cores dinâmicas

  // Estados Inputs
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados Visibilidade
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  async function handleUpdatePassword() {
    const oldP = oldPassword.trim();
    const newP = newPassword.trim();
    const confP = confirmPassword.trim();

    if (!oldP || !newP || !confP) {
      return Alert.alert('Erro', 'Preencha todos os campos de senha.');
    }

    if (newP !== confP) {
      return Alert.alert('Erro', 'As novas senhas não coincidem.');
    }

    if (newP.length < 6) { 
      return Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres.');
    }

    setLoading(true);
    try {
      await api.put('/users/password', { 
        oldPassword: oldP, 
        newPassword: newP 
      });
      Alert.alert('Sucesso', 'Sua senha foi atualizada com sucesso!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Não foi possível atualizar a senha.';
      Alert.alert('Falha na Atualização', msg);
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      '⚠️ EXCLUIR CONTA',
      'Esta ação é irreversível. Todas as suas carteiras, transações e dados serão apagados para sempre.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sim, excluir tudo', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/users/delete'); 
              await signOut();
              router.replace('/login'); 
            } catch (_err) {
              Alert.alert('Erro', 'Não foi possível excluir sua conta agora.');
            }
          }
        }
      ]
    );
  }

  // Helper para renderizar input de senha com estilo dinâmico
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.card} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={[
            styles.header, 
            { backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1 }
        ]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Segurança</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Alterar Senha</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>Senha Atual</Text>
            <PasswordInput 
              value={oldPassword} 
              onChange={setOldPassword} 
              placeholder="Digite a senha atual"
              show={showOld}
              onToggle={() => setShowOld(!showOld)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>Nova Senha</Text>
            <PasswordInput 
              value={newPassword} 
              onChange={setNewPassword} 
              placeholder="Mínimo 6 caracteres"
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>Confirmar Nova Senha</Text>
            <PasswordInput 
              value={confirmPassword} 
              onChange={setConfirmPassword} 
              placeholder="Repita a nova senha"
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]} 
            onPress={handleUpdatePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Atualizar Senha</Text>
            )}
          </TouchableOpacity>

          {/* ZONA DE PERIGO */}
          <View style={[
              styles.dangerZone, 
              { 
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fff1f1', // Vermelho bem suave no dark
                borderColor: isDark ? '#7f1d1d' : '#fecaca' 
              }
          ]}>
            <View style={styles.dangerHeader}>
              <MaterialIcons name="report-problem" size={20} color={colors.danger} />
              <Text style={[styles.dangerTitle, { color: colors.danger }]}>Zona de Perigo</Text>
            </View>
            <Text style={[styles.dangerDesc, { color: isDark ? '#fca5a5' : '#7f1d1d' }]}>
              Ao excluir sua conta, todos os seus dados financeiros serão removidos permanentemente de nossos servidores.
            </Text>
            
            <TouchableOpacity 
                style={[
                    styles.deleteButton, 
                    { backgroundColor: colors.card, borderColor: colors.danger }
                ]} 
                onPress={handleDeleteAccount}
            >
              <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Excluir minha conta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container removido daqui pois está inline para usar colors.background
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  content: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  
  saveButton: { 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  dangerZone: { 
    marginTop: 40, 
    padding: 20, 
    borderRadius: 16,
    borderWidth: 1,
  },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dangerTitle: { fontSize: 16, fontWeight: 'bold' },
  dangerDesc: { fontSize: 13, marginBottom: 16, lineHeight: 18 },
  
  deleteButton: { 
    borderWidth: 1,
    padding: 14, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  deleteButtonText: { fontWeight: 'bold' }
});