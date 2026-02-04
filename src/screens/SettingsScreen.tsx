import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  ScrollView, 
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

// Store e API
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

// IP Centralizado (Certifique-se de que é o mesmo do seu backend)
const BASE_URL = "http://192.168.0.114:3000";

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const updateUserSetting = useAuthStore((state) => state.updateUserSetting);
  
  const [uploading, setUploading] = useState(false);

  // Lógica Inteligente: Resolve se é URL completa ou apenas nome de arquivo
  const avatarUri = (() => {
    const avatar = user?.avatar;
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return `${BASE_URL}/uploads/${avatar}`;
  })();

  // Selecionar Foto da Galeria
  const handleEditPhoto = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.3, 
    base64: true, // 🚨 ESSENCIAL: Pede para o Expo gerar a string base64
  });

  if (!result.canceled && result.assets[0].base64) {
    uploadPhotoBase64(result.assets[0].base64, 'jpg');
  }
};

const uploadPhotoBase64 = async (base64String: string, extension: string) => {
  setUploading(true);
  try {
    const response = await api.patch('/users/avatar', {
      base64: base64String,
      fileExtension: extension
    });

    if (response.data.avatar) {
      // Montamos a URL final aqui para garantir que o Header atualize
      const newAvatarUrl = `${BASE_URL}/uploads/${response.data.avatar}`;
      updateUserSetting({ avatar: newAvatarUrl });
      
      Alert.alert("Sucesso", "Foto de perfil atualizada!");
    }
  } catch (error: any) {
    console.log("ERRO NO BASE64:", error.response?.data || error.message);
    Alert.alert("Erro", "O servidor recebeu a foto, mas não conseguiu salvá-la.");
  } finally {
    setUploading(false);
  }
};

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: async () => {
          await signOut();
          router.replace('/login');
      }}
    ]);
  };

  // Componente Auxiliar de Item de Menu
  const MenuItem = ({ icon, label, isDestructive = false, onPress, showArrow = true }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconBox, isDestructive && styles.menuIconBoxDestructive]}>
        <MaterialIcons name={icon} size={22} color={isDestructive ? '#ef4444' : '#1773cf'} />
      </View>
      <Text style={[styles.menuLabel, isDestructive && styles.menuLabelDestructive]}>{label}</Text>
      {showArrow && <MaterialIcons name="chevron-right" size={24} color="#cbd5e1" />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerContainer} edges={['top']}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          <View style={{ width: 24 }} /> 
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* === SEÇÃO DO USUÁRIO === */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            {avatarUri ? (
              <Image 
                key={avatarUri}
                source={{ uri: avatarUri, cache: 'reload' }} 
                style={styles.avatarImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.editBadge} 
              onPress={handleEditPhoto}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <MaterialIcons name="photo-camera" size={16} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user?.name || 'Usuário Gestio'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@exemplo.com'}</Text>
        </View>

        {/* === MENU GERAL === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geral</Text>
          <View style={styles.card}>
            <MenuItem icon="person-outline" label="Dados Pessoais" onPress={() => router.push('/edit-profile')} />
            <View style={styles.divider} />
            <MenuItem 
              icon="account-balance-wallet" 
              label="Minhas Carteiras" 
              onPress={() => router.push('/my-wallets')}
            />
          </View>
        </View>

        {/* === PREFERÊNCIAS === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferências</Text>
          <View style={styles.card}>
            <View style={styles.menuItem}>
              <View style={[styles.menuIconBox, { backgroundColor: '#f0f9ff' }]}>
                <MaterialIcons name="notifications-none" size={22} color="#1773cf" />
              </View>
              <Text style={styles.menuLabel}>Notificações</Text>
              <Switch value={false} trackColor={{ false: "#cbd5e1", true: "#1773cf" }} thumbColor={"#FFF"} />
            </View>
            <View style={styles.divider} />
            <View style={styles.menuItem}>
              <View style={[styles.menuIconBox, { backgroundColor: '#f0f9ff' }]}>
                <MaterialIcons name="dark-mode" size={22} color="#1773cf" />
              </View>
              <Text style={styles.menuLabel}>Modo Escuro</Text>
              <Switch value={false} trackColor={{ false: "#cbd5e1", true: "#1773cf" }} thumbColor={"#FFF"} />
            </View>
          </View>
        </View>

        {/* === OUTROS === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outros</Text>
          <View style={styles.card}>
            <MenuItem icon="lock-outline" label="Segurança e Senha" onPress={() => router.push('/security')} />
            <View style={styles.divider} />
            <MenuItem icon="help-outline" label="Ajuda e Suporte" onPress={() => {}} />
            <View style={styles.divider} />
            <MenuItem 
              icon="logout" 
              label="Sair da conta" 
              isDestructive 
              showArrow={false}
              onPress={handleLogout} 
            />
          </View>
        </View>

        <Text style={styles.versionText}>Versão 1.0.0 (Beta)</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f8' },
  headerContainer: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  scrollContent: { paddingBottom: 40 },
  userSection: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#FFF' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFF' },
  avatarInitial: { fontSize: 40, fontWeight: 'bold', color: '#64748b' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1773cf', width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#f6f7f8' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' },
  card: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', elevation: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0f9ff', alignItems: 'center', justifyContent: 'center' },
  menuIconBoxDestructive: { backgroundColor: '#fef2f2' },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: '#0f172a' },
  menuLabelDestructive: { color: '#ef4444', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 68 },
  versionText: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 8 }
});