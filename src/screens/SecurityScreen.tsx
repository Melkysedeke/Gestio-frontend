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
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function SecurityScreen() {
  const { signOut } = useAuthStore();

  // Estados para os valores dos inputs
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados para visibilidade das senhas
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  async function handleUpdatePassword() {
    // Limpando espaços acidentais
    const oldP = oldPassword.trim();
    const newP = newPassword.trim();
    const confP = confirmPassword.trim();

    if (!oldP || !newP || !confP) {
      return Alert.alert('Erro', 'Preencha todos os campos de senha.');
    }

    if (newP !== confP) {
      return Alert.alert('Erro', 'As novas senhas não coincidem.');
    }

    if (newP.length < 1) { //tamanho mínimo
      return Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres/ tamanho mínimo atual 2.');
    }

    setLoading(true);
    try {
      await api.put('/users/update-password', { 
        oldPassword: oldP, 
        newPassword: newP 
      });

      Alert.alert('Sucesso', 'Sua senha foi atualizada com sucesso!');
      
      // Limpa os campos após o sucesso
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
              await api.delete('/users/profile'); 
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Segurança</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Alterar Senha</Text>
        
        {/* Senha Atual */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Senha Atual</Text>
          <View style={styles.passwordWrapper}>
            <TextInput 
              style={styles.passwordInput} 
              secureTextEntry={!showOld} 
              value={oldPassword} 
              onChangeText={setOldPassword}
              placeholder="Digite a senha atual"
            />
            <TouchableOpacity onPress={() => setShowOld(!showOld)} style={styles.eyeIcon}>
              <MaterialIcons name={showOld ? "visibility" : "visibility-off"} size={22} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Nova Senha */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nova Senha</Text>
          <View style={styles.passwordWrapper}>
            <TextInput 
              style={styles.passwordInput} 
              secureTextEntry={!showNew} 
              value={newPassword} 
              onChangeText={setNewPassword}
              placeholder="Mínimo 6 caracteres/atual 2 caracteres"
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeIcon}>
              <MaterialIcons name={showNew ? "visibility" : "visibility-off"} size={22} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirmar Nova Senha */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirmar Nova Senha</Text>
          <View style={styles.passwordWrapper}>
            <TextInput 
              style={styles.passwordInput} 
              secureTextEntry={!showConfirm} 
              value={confirmPassword} 
              onChangeText={setConfirmPassword}
              placeholder="Repita a nova senha"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
              <MaterialIcons name={showConfirm ? "visibility" : "visibility-off"} size={22} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, loading && { opacity: 0.7 }]} 
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
        <View style={styles.dangerZone}>
          <View style={styles.dangerHeader}>
            <MaterialIcons name="report-problem" size={20} color="#ef4444" />
            <Text style={styles.dangerTitle}>Zona de Perigo</Text>
          </View>
          <Text style={styles.dangerDesc}>
            Ao excluir sua conta, todos os seus dados financeiros serão removidos permanentemente de nossos servidores.
          </Text>
          
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteButtonText}>Excluir minha conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f8' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#FFF' 
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  
  content: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#0f172a',
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  
  saveButton: { 
    backgroundColor: '#1773cf', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 10,
    elevation: 2,
    shadowColor: '#1773cf',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  dangerZone: { 
    marginTop: 40, 
    padding: 20, 
    backgroundColor: '#fff1f1', 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dangerTitle: { fontSize: 16, fontWeight: 'bold', color: '#b91c1c' },
  dangerDesc: { fontSize: 13, color: '#7f1d1d', marginBottom: 16, lineHeight: 18 },
  
  deleteButton: { 
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 14, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  deleteButtonText: { color: '#ef4444', fontWeight: 'bold' }
});