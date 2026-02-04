import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const COLORS = {
  primary: "#1773cf",
  bgLight: "#f6f7f8",
  border: "#e2e8f0",
  textMain: "#111418",
  textGray: "#637588"
};

const BASE_URL = "http://192.168.0.114:3000";

interface MainHeaderProps {
  user: any;
  activeWallet: any;
  onPressSelector: () => void;
  onPressAdd: () => void;
}

export default function MainHeader({ user, activeWallet, onPressSelector }: MainHeaderProps) {
  const avatarUri = (() => {
    const avatar = user?.avatar;
    
    if (!avatar) return null;
    // Se já começar com http, retorna direto
    if (avatar.startsWith('http')) {
      return avatar;
    }
    // Se for só o nome do arquivo, concatena
    return `${BASE_URL}/uploads/${avatar}`;
  })();
  // Log para conferirmos no terminal se a URL limpou
  console.log("DEBUG FOTO -> URL FINAL:", avatarUri);

  return (
    <SafeAreaView style={styles.safeHeader} edges={['top']}>
      <View style={styles.headerContent}>
        
        <TouchableOpacity style={styles.walletSelector} onPress={onPressSelector}>
          <View style={styles.walletIconBox}>
            <MaterialIcons name="account-balance-wallet" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>Carteira Atual</Text>
            <View style={styles.walletNameRow}>
              <Text style={styles.walletActive} numberOfLines={1}>
                {activeWallet ? activeWallet.name : 'Nenhuma carteira'}
              </Text>
              <MaterialIcons name="expand-more" size={16} color="#9ca3af" />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.profileButton} 
          onPress={() => router.push('/settings')}
        >
          {avatarUri ? (
            <Image 
              key={avatarUri}
              source={{ 
                uri: avatarUri,
                cache: 'reload' 
              }} 
              style={styles.profileImage}
              resizeMode="cover"
              onLoad={() => console.log("✅ Imagem carregada no Header!")}
              onError={(e) => console.log("❌ ERRO NO HEADER:", e.nativeEvent.error)}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeHeader: {
    backgroundColor: '#ffffff',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 10,
    maxWidth: '78%',
    elevation: 1
  },
  walletIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(23, 115, 207, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletInfo: {
    flexShrink: 1,
  },
  walletLabel: {
    fontSize: 10,
    color: COLORS.textGray,
    fontWeight: '500',
    lineHeight: 12
  },
  walletNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  walletActive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textMain,
    lineHeight: 16,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    backgroundColor: '#ffffff'
  },
  profileImage: {
    width: '100%',
    height: '100%'
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarInitial: {
    fontWeight: 'bold',
    color: '#64748b',
    fontSize: 16
  },
});