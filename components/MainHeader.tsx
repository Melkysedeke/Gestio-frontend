import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { API_BASE_URL } from '../src/config/apiConfig';
import { useThemeColor } from '../hooks/useThemeColor';

interface MainHeaderProps {
  user: any;
  activeWallet: any;
  onPressSelector: () => void;
  // onPressAdd?: () => void; // Removido
}

export default function MainHeader({ user, activeWallet, onPressSelector }: MainHeaderProps) {
  const { colors, isDark } = useThemeColor();

  const avatarUri = React.useMemo(() => {
    const avatar = user?.avatar;
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return `${API_BASE_URL}/uploads/${avatar}`;
  }, [user?.avatar]);

  return (
    <SafeAreaView 
        style={[styles.safeHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]} 
        edges={['top']}
    >
      <View style={styles.headerContent}>
        
        {/* ESQUERDA: Seletor de Carteira */}
        <TouchableOpacity 
          style={[styles.walletSelector, { backgroundColor: isDark ? colors.background : '#f8fafc', borderColor: colors.border }]} 
          onPress={onPressSelector}
          activeOpacity={0.7}
        >
          <View style={[styles.walletIconBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(23, 115, 207, 0.08)' }]}>
            <MaterialIcons name="account-balance-wallet" size={20} color={colors.primary} />
          </View>
          
          <View style={styles.walletInfo}>
            <Text style={[styles.walletLabel, { color: colors.textSub }]}>Carteira Atual</Text>
            <View style={styles.walletNameRow}>
              <Text style={[styles.walletActive, { color: colors.text }]} numberOfLines={1}>
                {activeWallet?.name || 'Criar Carteira'}
              </Text>
              <MaterialIcons name="expand-more" size={16} color={colors.textSub} />
            </View>
          </View>
        </TouchableOpacity>

        {/* DIREITA: Botão de Perfil */}
        <TouchableOpacity 
          style={[styles.profileButton, { borderColor: colors.border, backgroundColor: isDark ? colors.background : '#f8fafc' }]} 
          onPress={() => router.push('/settings')} // Rota de perfil
          activeOpacity={0.8}
        >
          {avatarUri ? (
            <Image 
              source={{ uri: avatarUri }} 
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
              <Text style={[styles.avatarInitial, { color: colors.textSub }]}>
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
    borderBottomWidth: 1,
    zIndex: 100, 
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 64, 
  },
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14, 
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 10,
    maxWidth: '75%', // Aumentei um pouco já que removemos o botão +
  },
  walletIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletInfo: {
    flexShrink: 1,
  },
  walletLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  walletNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  walletActive: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%'
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarInitial: {
    fontWeight: '800',
    fontSize: 18
  },
});