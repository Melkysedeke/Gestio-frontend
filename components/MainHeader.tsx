import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
  
  const user = useAuthStore(state => state.user);
  const hideValues = useAuthStore(state => state.hideValues);
  const toggleHideValues = useAuthStore(state => state.toggleHideValues);
  const updateUserSetting = useAuthStore(state => state.updateUserSetting);

  const [selectorVisible, setSelectorVisible] = useState(false);
  const [createWalletVisible, setCreateWalletVisible] = useState(false);

  const handlePressSelector = () => {
    if (!activeWallet) {
      setCreateWalletVisible(true);
    } else {
      setSelectorVisible(true); 
    }
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
                  backgroundColor: isDark ? colors.background : '#f8fafc', 
                  borderColor: colors.border 
                }
              ]} 
              onPress={handlePressSelector}
              activeOpacity={0.7}
            >
              <View style={[styles.walletIconBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(23, 115, 207, 0.08)' }]}>
                <MaterialIcons name="account-balance-wallet" size={20} color={colors.primary} />
              </View>
              
              <View style={styles.walletInfo}>
                <Text style={[styles.walletLabel, { color: colors.textSub }]}>Carteira Atual</Text>
                <View style={styles.walletNameRow}>
                  <Text style={[styles.walletActive, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                    {activeWallet?.name || 'Criar Carteira'}
                  </Text>
                  <MaterialIcons name="expand-more" size={16} color={colors.textSub} />
                </View>
              </View>
            </TouchableOpacity>

            {activeWallet && (
              <TouchableOpacity 
                onPress={toggleHideValues} 
                style={[
                  styles.visibilityButton, 
                  { 
                    borderColor: colors.border, 
                    backgroundColor: isDark ? colors.background : '#f8fafc' 
                  }
                ]}
                activeOpacity={0.7}
              >
                <MaterialIcons 
                  name={hideValues ? "visibility-off" : "visibility"} 
                  size={20} 
                  color={colors.textSub} 
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[
              styles.profileButton, 
              { 
                borderColor: colors.border, 
                backgroundColor: isDark ? colors.background : '#f8fafc' 
              }
            ]} 
            onPress={() => router.push('/settings')} 
            activeOpacity={0.8}
          >
            <UserAvatar user={user} size={46} />
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
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 3 },
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
    height: 70, 
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    paddingRight: 10,
  },
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14, 
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 10,
    flexShrink: 1, 
    width: 150, 
  },
  visibilityButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, 
  },
  walletIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  walletInfo: { flexShrink: 1 },
  walletLabel: { fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  walletNameRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 2,
    flexShrink: 1 
  },
  walletActive: { fontSize: 12, fontWeight: 'bold', flexShrink: 1 },
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
});