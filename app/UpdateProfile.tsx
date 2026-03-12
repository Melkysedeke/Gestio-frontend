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
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function EditProfileScreen() {
  const user = useAuthStore(state => state.user);
  const updateUserSetting = useAuthStore(state => state.updateUserSetting);
  
  const isGuest = user?.email?.includes('@local');
  const { colors, isDark } = useThemeColor();

  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (!name.trim()) return Alert.alert('Erro', 'O nome não pode estar vazio.');

    setLoading(true);
    try {
        await updateUserSetting({ 
            name: name.trim(), 
        });

        Alert.alert('Sucesso', 'Seus dados foram atualizados!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
    } catch (error: any) {
        console.error("Erro ao atualizar perfil:", error);
        Alert.alert('Erro', 'Não foi possível salvar as alterações no banco local.');
    } finally {
        setLoading(false);
    }
  }

  // ✅ Constantes para evitar objetos literais no render
  const buttonOpacity = loading ? 0.7 : 1;
  const emailInputBg = isGuest ? colors.border : colors.inputBg;
  const emailTextColor = isGuest ? colors.textSub : colors.text;
  const emailOpacity = isGuest ? 0.7 : 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Dados Pessoais</Text>
        <View style={styles.placeholderView} /> 
      </View>

      <View style={styles.form}>
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
            placeholderTextColor={colors.textSub}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.textSub }]}>E-mail</Text>
            {isGuest && <Text style={[styles.guestBadge, { color: colors.primary }]}>Modo Convidado</Text>}
          </View>
          <TextInput 
            style={[styles.input, { 
                backgroundColor: emailInputBg, 
                borderColor: colors.border,
                color: emailTextColor,
                opacity: emailOpacity
            }]}
            value={isGuest ? "Conta Local (Sincronização pendente)" : user?.email}
            editable={false}
            placeholderTextColor={colors.textSub}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary, opacity: buttonOpacity }]} 
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>
              Atualizar Nome
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 60,
    paddingBottom: 20 
  },
  backButton: { 
    padding: 4 
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  placeholderView: { 
    width: 24 
  },
  form: { 
    padding: 20, 
    gap: 20 
  },
  inputGroup: { 
    gap: 8 
  },
  labelRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
  guestBadge: { 
    fontSize: 10 
  },
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
  buttonText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});