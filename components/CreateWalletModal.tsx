import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../src/services/api';
import { useThemeColor } from '@/hooks/useThemeColor';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateWalletModal({ visible, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors } = useThemeColor(); 

  useEffect(() => {
    if (!visible) {
      setName('');
      setLoading(false);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      setLoading(true);
      await api.post('/wallets/', { 
        name: name,
        balance: 0,
        color: '#1773cf'
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error("❌ Erro ao criar:", error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível criar a carteira.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                
                <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
                
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Nova Carteira</Text>
                    <TouchableOpacity onPress={onClose}>
                        <MaterialIcons name="close" size={24} color={colors.textSub} />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.label, { color: colors.textSub }]}>Nome da Carteira</Text>
                
                <TextInput 
                    style={[
                        styles.input, 
                        { 
                            backgroundColor: colors.inputBg, 
                            borderColor: colors.border, 
                            color: colors.text 
                        }
                    ]}
                    placeholder="Ex: Nubank, Carteira Física..."
                    placeholderTextColor={colors.textSub}
                    value={name}
                    onChangeText={setName}
                    autoFocus={visible} 
                />

                <TouchableOpacity 
                    style={[styles.createButton, { backgroundColor: colors.primary }]} 
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.createButtonText}>Criar Carteira</Text>
                    )}
                </TouchableOpacity>

            </View>
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
  modalContent: {
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
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 32, 
  },
  createButton: {
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