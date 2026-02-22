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
  StatusBar,
  ActivityIndicator, // ✅ Importado para mostrar loading na foto
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router'; 
import * as ImagePicker from 'expo-image-picker';

import { API_BASE_URL } from '../src/config/apiConfig'; 
import { useAuthStore } from '../src/stores/authStore'; 
import { useThemeColor } from '@/hooks/useThemeColor'; 
import { useThemeStore } from '../src/stores/themeStore';   

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const updateUserSetting = useAuthStore((state) => state.updateUserSetting);
  const signOut = useAuthStore((state) => state.signOut);
  const setTheme = useThemeStore((state) => state.setTheme);
  
  const isGuest = user?.email?.includes('@local');
  const { colors, isDark } = useThemeColor();

  // ✅ Estado de loading para a foto
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleThemeSwitch = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };

  const handleEditPhoto = async () => {
    if (isGuest) {
      Alert.alert(
        "Recurso Indisponível", 
        "Registre uma conta para personalizar sua foto."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setIsUploadingPhoto(true);
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await updateUserSetting({ avatar: base64Image });
      }
    } catch (error) {
      console.error("Erro ao alterar foto:", error);
      Alert.alert("Erro", "Não foi possível alterar a foto de perfil.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: async () => {
          await signOut();
          router.replace('/welcome');
      }}
    ]);
  };

  const MenuItem = ({ icon, label, isDestructive = false, onPress, showArrow = true }: any) => {
    const iconBoxBg = isDestructive 
      ? styles.menuIconBoxDestructive.backgroundColor 
      : (isDark ? 'rgba(23, 115, 207, 0.1)' : '#f0f9ff');

    return (
      <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.menuIconBox, { backgroundColor: iconBoxBg }]}>
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
  };

  const renderAvatar = () => {
    if (user?.avatar && user.avatar !== 'default' && !user.avatar.includes('@local')) {
      const avatarUri = user.avatar.startsWith('http') || user.avatar.startsWith('data:image')
        ? user.avatar 
        : `${API_BASE_URL}/uploads/${user.avatar}`;
      return (
        <Image 
          source={{ uri: avatarUri }} 
          style={styles.avatarImage} 
          resizeMode="cover"
        />
      );
    }

    if (user?.name) {
      return (
        <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
          <Text style={[styles.avatarInitial, { color: colors.primary }]}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
        <MaterialIcons name="person" size={40} color={colors.textSub} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView 
          style={[styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]} 
          edges={['top']}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Meu Perfil</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarWrapper, { borderColor: colors.card }]}>
              {isUploadingPhoto ? (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                renderAvatar()
              )}
            </View>
            <TouchableOpacity 
              style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]} 
              onPress={handleEditPhoto}
              disabled={isUploadingPhoto}
            >
              <MaterialIcons name="photo-camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Usuário Gestio'}</Text>
          
          {isGuest ? (
             <View style={[styles.guestBadge, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                <MaterialIcons name="cloud-off" size={12} color={colors.textSub} />
                <Text style={[styles.guestBadgeText, { color: colors.textSub }]}>Modo Convidado</Text>
             </View>
          ) : (
            <Text style={[styles.userEmail, { color: colors.textSub }]}>{user?.email}</Text>
          )}

          {isGuest && (
            <TouchableOpacity 
              style={[styles.registerButton, { backgroundColor: colors.primary }]}
              onPress={() => Alert.alert("Registro", "Em breve você poderá converter sua conta local em oficial!")}
            >
              <MaterialIcons name="person-add" size={18} color="#FFF" />
              <Text style={styles.registerButtonText}>Criar Conta Oficial</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Geral</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <MenuItem icon="person-outline" label="Dados Pessoais" onPress={() => router.push('/update-profile')} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuItem icon="account-balance-wallet" label="Minhas Carteiras" onPress={() => router.push('/my-wallets')} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Preferências</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <MenuItem icon="notifications-none" label="Notificações" onPress={() => router.push('/update-notifications')} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.menuItem}>
              <View style={[styles.menuIconBox, { backgroundColor: isDark ? 'rgba(23, 115, 207, 0.1)' : '#f0f9ff' }]}>
                <MaterialIcons name="dark-mode" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>Modo Escuro</Text>
              <Switch 
                  value={isDark} 
                  onValueChange={handleThemeSwitch} 
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
            
            {!isGuest && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <MenuItem 
                  icon="logout" 
                  label="Sair da conta" 
                  isDestructive 
                  showArrow={false} 
                  onPress={handleLogout} 
                />
              </>
            )}
          </View>
        </View>

        <Text style={[styles.versionText, { color: colors.textSub }]}>Versão 1.0.0 (Beta)</Text>
      </ScrollView>
    </View>
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
  headerPlaceholder: { width: 40 },
  scrollContent: { paddingBottom: 40 },
  userSection: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatarWrapper: {
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    borderWidth: 4,
    overflow: 'hidden', 
    elevation: 5,
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 4,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 40, fontWeight: 'bold' },
  editBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    width: 34, 
    height: 34, 
    borderRadius: 17, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 3 
  },
  userName: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  userEmail: { fontSize: 14, marginBottom: 12 },
  guestBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 12, 
    marginBottom: 16 
  },
  guestBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  registerButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 25, 
    elevation: 2,
  },
  registerButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '700', 
    marginBottom: 12, 
    marginLeft: 4, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  card: { borderRadius: 16, overflow: 'hidden', elevation: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  menuIconBox: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  menuIconBoxDestructive: { backgroundColor: '#fef2f2' },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
  divider: { height: 1, marginLeft: 68 },
  versionText: { textAlign: 'center', fontSize: 11, marginTop: 8 }
});