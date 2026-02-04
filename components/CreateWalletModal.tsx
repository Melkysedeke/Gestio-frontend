import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../src/services/api';
import { useAuthStore } from '../src/stores/authStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateWalletModal({ visible, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 👇 Pegamos o usuário E a função de atualizar settings
  const { user, updateUserSetting } = useAuthStore();

  async function handleCreate() {
    if (!name.trim()) return Alert.alert('Atenção', 'Dê um nome para sua carteira');
    
    if (!user?.id) return Alert.alert('Erro', 'Usuário não identificado.');

    setLoading(true);
    try {
      // 👇 Capturamos a resposta para pegar o ID da nova carteira
      const response = await api.post('/wallets', {
        userId: user.id,
        name: name,
        balance: 0 
      });
      
      const newWallet = response.data;

      // 👇 O PULO DO GATO:
      // Avisamos o App que a última carteira aberta é essa nova que acabamos de criar.
      // Isso faz o Dashboard selecioná-la automaticamente.
      updateUserSetting({ last_opened_wallet: newWallet.id });
      
      setName(''); 
      onSuccess(); 
      onClose();   

    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível criar a carteira.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {/* Evita que o clique no modal feche ele */}
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.container}
            >
              
              <View style={styles.handleBar} />
              
              <View style={styles.header}>
                <Text style={styles.title}>Nova Carteira</Text>
                <TouchableOpacity onPress={onClose}>
                  <MaterialIcons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Nome da Carteira</Text>
              <TextInput 
                style={styles.input}
                placeholder="Ex: Nubank, Carteira Física..."
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
                autoFocus={true} // Foca no input assim que abre
              />

              <TouchableOpacity 
                style={styles.createButton} 
                onPress={handleCreate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.createButtonText}>Criar Carteira</Text>
                )}
              </TouchableOpacity>

            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end', 
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 32, 
  },
  createButton: {
    backgroundColor: '#1773cf',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});