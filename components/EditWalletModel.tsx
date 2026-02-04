import React, { useState, useEffect } from 'react';
import { 
  View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../src/services/api';

interface Wallet {
  id: number;
  name: string;
}

interface Props {
  visible: boolean;
  wallet: Wallet | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditWalletModal({ visible, wallet, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Preenche o nome atual quando o modal abre
  useEffect(() => {
    if (wallet) setName(wallet.name);
  }, [wallet]);

  async function handleSave() {
    if (!name.trim() || !wallet) return;

    setLoading(true);
    try {
      await api.put(`/wallets/${wallet.id}`, { name });
      onSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a carteira.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>Editar Carteira</Text>
                <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#64748b" /></TouchableOpacity>
              </View>

              <Text style={styles.label}>Novo Nome</Text>
              <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName} 
                autoFocus={true}
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Salvar Alterações</Text>}
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  container: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, elevation: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  label: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 24 },
  saveButton: { backgroundColor: '#1773cf', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});