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
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView, // ✅ Novo import
  Platform              // ✅ Novo import
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { database } from '../src/database'; 
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateWalletModal({ visible, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const user = useAuthStore(state => state.user);
  const updateUserSetting = useAuthStore(state => state.updateUserSetting);

  const { colors, isDark } = useThemeColor();

  useEffect(() => {
    if (visible) {
      setName('');
      setLoading(false);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!name.trim()) return Alert.alert("Atenção", "Dê um nome para sua carteira.");
    if (!user) return;

    setLoading(true);
    Keyboard.dismiss();

    try {
      let newWalletId = '';

      await database.write(async () => {
        const walletsCollection = database.get('wallets');
        const newWallet = await walletsCollection.create((w: any) => {
          w.name = name.trim();
          w.balance = 0;
          w._raw.user_id = user.id; 
        });
        newWalletId = newWallet.id;
      });

      if (newWalletId) {
        await updateUserSetting({ last_opened_wallet: newWalletId });
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error("❌ Erro ao criar carteira:", error);
      Alert.alert('Erro', 'Não foi possível criar a carteira. Tente novamente.');
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
      {/* ✅ ENVOLVENDO TUDO COM KeyboardAvoidingView */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        // No iOS usamos 'padding'. No Android em modais transparentes, 'padding' ou 'height' costumam funcionar melhor.
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} 
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                  
                  <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
                  
                  <View style={styles.header}>
                      <Text style={[styles.title, { color: colors.text }]}>Nova Carteira</Text>
                      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                          <MaterialIcons name="close" size={24} color={colors.textSub} />
                      </TouchableOpacity>
                  </View>

                  <Text style={[styles.label, { color: colors.textSub }]}>Nome da Carteira</Text>
                  
                  <TextInput 
                      style={[
                          styles.input, 
                          { 
                              backgroundColor: isDark ? colors.background : '#F1F5F9', 
                              borderColor: colors.border, 
                              color: colors.text 
                          }
                      ]}
                      placeholder="Ex: Nubank, Carteira Física, Investimentos..."
                      placeholderTextColor={colors.textSub}
                      value={name}
                      onChangeText={setName}
                      autoFocus={visible} 
                      returnKeyType="done"
                      onSubmitEditing={handleCreate}
                  />

                  <TouchableOpacity 
                      style={[styles.createButton, { backgroundColor: colors.primary }]} 
                      onPress={handleCreate}
                      disabled={loading}
                      activeOpacity={0.8}
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
      </KeyboardAvoidingView>
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
    opacity: 0.5
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
  closeBtn: {
    padding: 4,
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
    elevation: 2, 
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});