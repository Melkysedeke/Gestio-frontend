import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../src/services/api';
import { useAuthStore } from '../src/stores/authStore';

export default function EditProfileScreen() {
  const user = useAuthStore(state => state.user);
const updateUserSetting = useAuthStore(state => state.updateUserSetting);;
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (!name || !email) return Alert.alert('Erro', 'Campos vazios.');

    setLoading(true);
    try {
        const response = await api.put('/users/profile', { name, email });
        await useAuthStore.getState().updateUserSetting({ 
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>Dados Pessoais</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput 
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput 
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && { opacity: 0.7 }]} 
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
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 20 
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  form: { padding: 20, gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  input: { 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16,
    backgroundColor: '#f8fafc'
  },
  button: { 
    backgroundColor: '#1773cf', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});