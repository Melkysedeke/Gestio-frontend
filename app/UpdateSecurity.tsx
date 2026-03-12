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
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import api from '../src/services/api';

import SubHeader from '@/components/SubHeader';

export default function SecurityScreen() {
  const { user, purgeDatabase } = useAuthStore();
  const isGuest = user?.email?.includes('@local');
  const { colors, isDark } = useThemeColor();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  // O showConfirm não estava sendo usado no seu código original, mas vou manter caso você queira usar
  // const [showConfirm, setShowConfirm] = useState(false); 

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
      // 🚀 Lógica real de update entraria aqui
      Alert.alert('Sucesso', 'Sua senha foi atualizada!');
    } catch {
      Alert.alert('Erro', 'Falha ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      '⚠️ EXCLUIR CONTA',
      'Esta ação removerá permanentemente todos os seus dados do servidor e deste dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sim, excluir tudo', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // 🚀 1. O Guarda de Trânsito: Se for convidado, APENAS limpa o banco local e sai.
              if (isGuest) {
                await purgeDatabase(); 
                router.replace('/Welcome');
                return; // O return impede que o código continue e bata na API abaixo
              }

              // 🚀 2. Se NÃO for convidado (Conta Oficial), deleta no servidor primeiro e depois limpa o celular.
              await api.delete('/users/delete'); 
              await purgeDatabase(); 
              router.replace('/Welcome');

            } catch (error) {
              console.error("Erro ao excluir conta:", error);
              Alert.alert('Erro', 'Não foi possível excluir os dados no servidor. Verifique sua conexão.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }

  // Componente interno otimizado
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
      <TouchableOpacity onPress={onToggle} style={styles.eyeIcon} activeOpacity={0.7}>
        <MaterialIcons name={show ? "visibility" : "visibility-off"} size={22} color={colors.textSub} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* 🚀 O SubHeader substitui o seu View antigo. Ele já tem o padding e SafeArea embutido. */}
      <SubHeader title="Segurança" />

      {/* 🚀 ScrollView configurado para empurrar o conteúdo adequadamente */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!isGuest && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Alterar Senha</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSub }]}>Senha Atual</Text>
              <PasswordInput 
                value={oldPassword} 
                onChange={setOldPassword} 
                placeholder="Sua senha atual" 
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

            {/* O campo confirmar senha estava faltando, adicionei ele para a lógica fazer sentido */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSub }]}>Confirmar Nova Senha</Text>
              <PasswordInput 
                value={confirmPassword} 
                onChange={setConfirmPassword} 
                placeholder="Repita a nova senha" 
                show={showNew} // Reutilizando o toggle do showNew para facilitar
                onToggle={() => setShowNew(!showNew)} 
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]} 
              onPress={handleUpdatePassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Atualizar Senha</Text>}
            </TouchableOpacity>
          </View>
        )}

        <View style={[
          styles.dangerZone, 
          { 
            marginTop: isGuest ? 0 : 40, // Remove o gap gigante se for guest
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
            activeOpacity={0.8}
          >
            <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Excluir todos os dados</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40, // Espaço extra no fim do scroll
  },
  section: {
    marginBottom: 10,
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
    borderRadius: 12,
    overflow: 'hidden' // Garante que o input não vaze o raio da borda
  },
  passwordInput: { 
    flex: 1, 
    padding: 14, 
    fontSize: 16 
  },
  eyeIcon: { 
    padding: 14, // Maior área de toque
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: { 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 10,
    elevation: 2, // Sombra sutil para o botão de ação principal
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
    fontWeight: 'bold',
    fontSize: 14
  }
});