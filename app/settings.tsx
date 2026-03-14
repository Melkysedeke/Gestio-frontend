import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView, 
  Switch,
  Alert,
  StatusBar,
  ActivityIndicator, 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router'; 
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '../src/stores/authStore'; 
import { useThemeColor } from '@/hooks/useThemeColor'; 
import { useThemeStore } from '../src/stores/themeStore';  
import api from '../src/services/api'; 

import SubHeader from '@/components/SubHeader';
import UserAvatar from '../components/UserAvatar'; 

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const updateUserSetting = useAuthStore((state) => state.updateUserSetting);
  const signOut = useAuthStore((state) => state.signOut);
  const setTheme = useThemeStore((state) => state.setTheme);
  
  const isGuest = user?.email?.includes('@local');
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleThemeSwitch = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };

  const handleEditPhoto = async () => {
    if (isGuest) {
      Alert.alert(
        "Recurso Indisponível", 
        "Registre uma conta oficial para personalizar sua foto e salvar na nuvem.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Criar Conta", onPress: () => router.push('/Register') }
        ]
      );
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permissão Necessária", "Precisamos de acesso à sua galeria para alterar a foto de perfil.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], 
        allowsEditing: true,
        aspect: [1, 1], // Força o corte quadrado 1:1 na galeria
        quality: 0.5, 
      });

      if (!result.canceled && result.assets[0].uri) {
        setIsUploadingPhoto(true);
        
        const localUri = result.assets[0].uri;
        const filename = localUri.split('/').pop() || 'avatar.jpg';
        
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        const formData = new FormData();
        formData.append('avatar', {
          uri: localUri,
          name: filename,
          type
        } as any);

        const response = await api.patch('/users/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const newAvatarUrl = response.data.avatar;
        await updateUserSetting({ avatar: newAvatarUrl });
      }
    } catch (error: any) {
      console.error("Erro ao alterar foto:", error);
      Alert.alert("Erro", "Não foi possível alterar a foto de perfil. Verifique sua conexão.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: async () => {
          await signOut();
          router.replace('/Welcome');
      }}
    ]);
  };

  const MenuItem = ({ icon, label, isDestructive = false, onPress, showArrow = true, rightElement }: any) => {
    const iconBoxBg = isDestructive 
      ? styles.menuIconBoxDestructive.backgroundColor 
      : (isDark ? 'rgba(23, 115, 207, 0.1)' : '#f0f9ff');

    return (
      <TouchableOpacity 
        style={styles.menuItem} 
        onPress={onPress} 
        activeOpacity={0.7}
        disabled={!onPress}
      >
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
        {rightElement ? rightElement : (showArrow && <MaterialIcons name="chevron-right" size={24} color={colors.textSub} />)}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <Stack.Screen options={{ headerShown: false }} />

      <SubHeader title="Meu Perfil" />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 40) }]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userSection}>
          
          <View style={styles.avatarContainer}>
            {/* 🚀 Ring corrigido para não amassar o Avatar */}
            <View style={[styles.avatarRing, { borderColor: colors.card }]}>
              {isUploadingPhoto ? (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <UserAvatar user={user} size={100} />
              )}
            </View>

            <TouchableOpacity 
              style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]} 
              onPress={handleEditPhoto}
              disabled={isUploadingPhoto}
              activeOpacity={0.8}
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
              onPress={() => router.push('/Register')}
              activeOpacity={0.8}
              >
              <MaterialIcons name="person-add" size={18} color="#FFF" />
              <Text style={styles.registerButtonText}>Criar Conta Oficial</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Geral</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <MenuItem icon="person-outline" label="Dados Pessoais" onPress={() => router.push('/UpdateProfile')} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuItem icon="account-balance-wallet" label="Minhas Carteiras" onPress={() => router.push('/MyWallets')} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Preferências</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <MenuItem icon="notifications-none" label="Notificações" onPress={() => router.push('/UpdateNotifications')} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <MenuItem 
              icon="dark-mode" 
              label="Modo Escuro" 
              showArrow={false}
              rightElement={
                <Switch 
                  value={isDark} 
                  onValueChange={handleThemeSwitch} 
                  trackColor={{ false: colors.border, true: colors.primary }} 
                  thumbColor={"#FFF"} 
                />
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Outros</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <MenuItem icon="lock-outline" label="Segurança e Senha" onPress={() => router.push('/UpdateSecurity')} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuItem icon="help-outline" label="Ajuda e Suporte" onPress={() => router.push('/Help')} />
            
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { }, 
  userSection: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  
  avatarContainer: { position: 'relative', marginBottom: 16 },
  
  // 🚀 O anel não tem mais overflow: hidden nem height/width fixo para não amassar a foto
  avatarRing: {
    padding: 2, 
    borderRadius: 60, // Garantia de círculo perfeito independente do conteúdo
    borderWidth: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 4,
    backgroundColor: 'transparent', 
    alignItems: 'center',
    justifyContent: 'center'
  },

  avatarPlaceholder: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  
  editBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: -4, // Ajustado levemente para acomodar o novo ring
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