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
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router'; 
import * as ImagePicker from 'expo-image-picker';

import { API_BASE_URL } from '../src/config/apiConfig'; 
import { useAuthStore } from '../src/stores/authStore'; 
import api from '../src/services/api'; 
import { useThemeColor } from '@/hooks/useThemeColor'; 
import { useThemeStore } from '../src/stores/themeStore';   

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const updateUserSetting = useAuthStore((state) => state.updateUserSetting);
  
  const { colors, isDark } = useThemeColor();
  const { toggleTheme } = useThemeStore();

  const [uploading, setUploading] = useState(false);

  const avatarUri = (() => {
    const avatar = user?.avatar;
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return `${API_BASE_URL}/uploads/${avatar}`;
  })();

  const handleEditPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true, 
    });

    if (!result.canceled && result.assets[0].base64) {
      const uriParts = result.assets[0].uri.split('.');
      const extension = uriParts[uriParts.length - 1].toLowerCase();
      uploadPhotoBase64(result.assets[0].base64, extension);
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
        const newAvatarUrl = `${API_BASE_URL}/uploads/${response.data.avatar}`;
        updateUserSetting({ avatar: newAvatarUrl });
        Alert.alert("Sucesso", "Foto de perfil atualizada!");
      }
    } catch (error) { 
      console.error("Erro upload:", error); 
      Alert.alert("Erro", "Falha ao salvar a foto.");
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

  // Helper simples para os itens do menu
  const MenuItem = ({ icon, label, isDestructive = false, onPress, showArrow = true }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[
          styles.menuIconBox, 
          isDestructive 
            ? styles.menuIconBoxDestructive 
            : { backgroundColor: isDark ? colors.border : '#f0f9ff' }
        ]}>
        <MaterialIcons 
            name={icon} 
            size={22} 
            color={isDestructive ? colors.danger : colors.primary} 
        />
      </View>
      <Text style={[
          styles.menuLabel, 
          { color: isDestructive ? colors.danger : colors.text }
        ]}>
        {label}
      </Text>
      {showArrow && <MaterialIcons name="chevron-right" size={24} color={colors.textSub} />}
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.card} />
      
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <SafeAreaView 
            style={[styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]} 
            edges={['top']}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Meu Perfil</Text>
            <View style={styles.headerButton} />
          </View>
        </SafeAreaView>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              {avatarUri ? (
                <Image 
                  key={avatarUri}
                  source={{ uri: avatarUri }} 
                  style={[styles.avatarImage, { borderColor: colors.card }]} 
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border, borderColor: colors.card }]}>
                  <Text style={[styles.avatarInitial, { color: colors.textSub }]}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]} 
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

            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Usuário Gestio'}</Text>
            <Text style={[styles.userEmail, { color: colors.textSub }]}>{user?.email || 'email@exemplo.com'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Geral</Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <MenuItem icon="person-outline" label="Dados Pessoais" onPress={() => router.push('/update-profile')} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <MenuItem 
                icon="account-balance-wallet" 
                label="Minhas Carteiras" 
                onPress={() => router.push('/my-wallets')}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Preferências</Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              
              {/* ALTERAÇÃO AQUI: Agora é um MenuItem que leva para a nova página */}
              <MenuItem 
                icon="notifications-none" 
                label="Notificações" 
                onPress={() => router.push('/update-notifications')} 
              />
              
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              
              {/* O Switch de Modo Escuro permanece aqui pois é simples */}
              <View style={styles.menuItem}>
                <View style={[styles.menuIconBox, { backgroundColor: isDark ? colors.border : '#f0f9ff' }]}>
                  <MaterialIcons name="dark-mode" size={22} color={colors.primary} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Modo Escuro</Text>
                <Switch 
                    value={isDark} 
                    onValueChange={toggleTheme} 
                    trackColor={{ false: colors.border, true: colors.primary }} 
                    thumbColor={"#FFF"} 
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Outros</Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <MenuItem icon="lock-outline" label="Segurança e Senha" onPress={() => router.push('/update-security')} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <MenuItem icon="help-outline" label="Ajuda e Suporte" onPress={() => router.push('/help')} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <MenuItem 
                icon="logout" 
                label="Sair da conta" 
                isDestructive 
                showArrow={false}
                onPress={handleLogout} 
              />
            </View>
          </View>

          <Text style={[styles.versionText, { color: colors.textSub }]}>Versão 1.0.0 (Beta)</Text>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { borderBottomWidth: 1 },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 16,
    paddingHorizontal: 20 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerButton: { width: 40, alignItems: 'flex-start' },
  
  scrollContent: { paddingBottom: 40 },
  userSection: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 4 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 4 },
  avatarInitial: { fontSize: 40, fontWeight: 'bold' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  userName: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  userEmail: { fontSize: 14, marginBottom: 12 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' },
  card: { borderRadius: 16, overflow: 'hidden', elevation: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuIconBoxDestructive: { backgroundColor: '#fef2f2' },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
  divider: { height: 1, marginLeft: 68 },
  versionText: { textAlign: 'center', fontSize: 12, marginTop: 8 }
});