import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  StatusBar 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../src/services/api';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor'; // <--- Hook de Tema

export default function EditProfileScreen() {
  const user = useAuthStore(state => state.user);
  const updateUserSetting = useAuthStore(state => state.updateUserSetting);
  
  // Hook de Cores
  const { colors, isDark } = useThemeColor();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (!name || !email) return Alert.alert('Erro', 'Campos vazios.');

    setLoading(true);
    try {
        const response = await api.put('/users/profile', { name, email });
        
        // Atualiza o store local e o banco (se necessário)
        await updateUserSetting({ 
           name: response.data.name, 
           email: response.data.email 
        });

        Alert.alert('Sucesso', 'Seus dados foram atualizados!');
        router.back();
    } catch (error: any) {
        Alert.alert('Erro', error.response?.data?.error || 'Falha na conexão.');
    } finally {
        setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Dados Pessoais</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <View style={styles.form}>
        
        {/* INPUT NOME */}
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
            placeholderTextColor={colors.textSub} // Placeholder cor correta
          />
        </View>

        {/* INPUT EMAIL */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSub }]}>E-mail</Text>
          <TextInput 
            style={[styles.input, { 
                backgroundColor: colors.inputBg, 
                borderColor: colors.border,
                color: colors.text 
            }]}
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            placeholderTextColor={colors.textSub}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]} 
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 60, // Ajuste conforme SafeArea se necessário
    paddingBottom: 20 
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  form: { padding: 20, gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16,
  },
  button: { 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});