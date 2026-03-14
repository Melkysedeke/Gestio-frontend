import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics'; // 🚀 Feedback tátil!
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuthStore } from '../src/stores/authStore';

import WalletSelectorModal from './WalletSelectorModal';
import CreateWalletModal from './CreateWalletModal';
import UserAvatar from './UserAvatar'; 

interface MainHeaderProps {
  activeWallet: any;
  onWalletChange: () => void; 
}

export default function MainHeader({ activeWallet, onWalletChange }: MainHeaderProps) {
  const { colors, isDark } = useThemeColor();
  const router = useRouter();
  
  const { user, hideValues, toggleHideValues, updateUserSetting } = useAuthStore();

  const [selectorVisible, setSelectorVisible] = useState(false);
  const [createWalletVisible, setCreateWalletVisible] = useState(false);

  const handlePressSelector = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!activeWallet) {
      setCreateWalletVisible(true);
    } else {
      setSelectorVisible(true); 
    }
  };

  const handleToggleHide = () => {
    Haptics.selectionAsync();
    toggleHideValues();
  };

  return (
    <>
      <SafeAreaView 
          style={[styles.safeHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]} 
          edges={['top']}
      >
        <View style={styles.headerContent}>
          
          <View style={styles.leftContainer}>
            <TouchableOpacity 
              style={[
                styles.walletSelector, 
                { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', 
                  borderColor: colors.border 
                }
              ]} 
              onPress={handlePressSelector}
              activeOpacity={0.7}
            >
              <View style={[styles.walletIconBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(23, 115, 207, 0.08)' }]}>
                <MaterialIcons name="account-balance-wallet" size={18} color={colors.primary} />
              </View>
              
              <View style={styles.walletInfo}>
                <Text style={[styles.walletLabel, { color: colors.textSub }]}>Carteira</Text>
                <View style={styles.walletNameRow}>
                  <Text style={[styles.walletActive, { color: colors.text }]} numberOfLines={1}>
                    {activeWallet?.name || 'Criar'}
                  </Text>
                  <MaterialIcons name="expand-more" size={16} color={colors.textSub} />
                </View>
              </View>
            </TouchableOpacity>

            {activeWallet && (
              <TouchableOpacity 
                onPress={handleToggleHide} 
                style={[
                  styles.visibilityButton, 
                  { 
                    borderColor: colors.border, 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' 
                  }
                ]}
                activeOpacity={0.7}
              >
                <MaterialIcons 
                  name={hideValues ? "visibility-off" : "visibility"} 
                  size={20} 
                  color={hideValues ? colors.primary : colors.textSub} 
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[
              styles.profileButton, 
              { 
                borderColor: colors.primary, 
                borderWidth: 1.5,
                backgroundColor: colors.card
              }
            ]} 
            onPress={() => router.push('/Settings')} 
            activeOpacity={0.8}
          >
            <UserAvatar user={user} size={42} />
          </TouchableOpacity>

        </View>
      </SafeAreaView>

      <WalletSelectorModal 
        visible={selectorVisible} 
        onClose={() => setSelectorVisible(false)} 
        onSelect={async (id) => { 
          await updateUserSetting({ last_opened_wallet: id }); 
          setSelectorVisible(false); 
          onWalletChange(); 
        }} 
        onAddPress={() => {
          setSelectorVisible(false);
          setCreateWalletVisible(true);
        }}
      />

      <CreateWalletModal 
        visible={createWalletVisible} 
        onClose={() => setCreateWalletVisible(false)} 
        onSuccess={() => {
          setCreateWalletVisible(false);
          onWalletChange(); 
        }} 
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeHeader: {
    ...Platform.select({
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.03, 
        shadowRadius: 8 
      },
      android: { elevation: 2 },
    }),
    borderBottomWidth: 1,
    zIndex: 100, 
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 70, 
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1, 
    marginRight: 12,
  },
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16, 
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 8,
    maxWidth: 200, 
    minWidth: 120,
  },
  visibilityButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletIconBox: { 
    width: 32, 
    height: 32, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  walletInfo: { flexShrink: 1 },
  walletLabel: { 
    fontSize: 8, 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    letterSpacing: 0.8 
  },
  walletNameRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 2,
  },
  walletActive: { 
    fontSize: 13, 
    fontWeight: 'bold' 
  },
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 4 
      },
      android: { elevation: 4 },
    }),
  },
});