import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuthStore } from '../src/stores/authStore';
import { API_BASE_URL } from '../src/config/apiConfig';

// ✅ Importando os modais para dentro do Header
import WalletSelectorModal from './WalletSelectorModal'
import CreateWalletModal from './CreateWalletModal';

interface MainHeaderProps {
  activeWallet: any;
  // ✅ Agora o Header só precisa avisar a tela pai: "Ei, a carteira mudou, recarregue os dados!"
  onWalletChange: () => void; 
}

export default function MainHeader({ activeWallet, onWalletChange }: MainHeaderProps) {
  const { colors, isDark } = useThemeColor();
  
  const user = useAuthStore(state => state.user);
  const hideValues = useAuthStore(state => state.hideValues);
  const toggleHideValues = useAuthStore(state => state.toggleHideValues);
  const updateUserSetting = useAuthStore(state => state.updateUserSetting);

  // ✅ Estados locais dos modais
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [createWalletVisible, setCreateWalletVisible] = useState(false);

  // ✅ Lógica inteligente de clique
  const handlePressSelector = () => {
    if (!activeWallet) {
      setCreateWalletVisible(true); // Se não tem carteira, abre direto a criação
    } else {
      setSelectorVisible(true); // Se tem, abre a lista
    }
  };

  const renderAvatar = () => {
    // 1. Verifica se existe avatar e se não é o padrão local
    if (user?.avatar && user.avatar !== 'default' && !user.avatar.includes('@local')) {
      // 🚀 MONTA A URL IGUAL AO SETTINGS
      const avatarUri = user.avatar.startsWith('http') || user.avatar.startsWith('data:image')
        ? user.avatar 
        : `${API_BASE_URL}/uploads/${user.avatar}`;

      return (
        <Image 
          source={{ uri: avatarUri }} 
          style={styles.profileImage}
          resizeMode="cover"
        />
      );
    }

    // 2. Fallback para a inicial se tiver nome
    if (user?.name) {
      return (
        <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
          <Text style={[styles.avatarInitial, { color: colors.primary }]}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      );
    }

    // 3. Fallback final (ícone genérico)
    return (
      <View style={[styles.avatarCircle, { backgroundColor: colors.border }]}>
        <MaterialIcons name="person" size={24} color={colors.textSub} />
      </View>
    );
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

            <TouchableOpacity 
              onPress={toggleHideValues} 
              style={[styles.visibilityButton, { borderColor: colors.border, backgroundColor: isDark ? colors.background : '#f8fafc' }]}
              activeOpacity={0.7}
            >
              <MaterialIcons 
                name={hideValues ? "visibility-off" : "visibility"} 
                size={20} 
                color={colors.textSub} 
              />
            </TouchableOpacity>
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
            {renderAvatar()}
          </TouchableOpacity>

        </View>
      </SafeAreaView>

      {/* ✅ Modais Injetados Globalmente Aqui */}
      <WalletSelectorModal 
        visible={selectorVisible} 
        onClose={() => setSelectorVisible(false)} 
        onSelect={async (id) => { 
          await updateUserSetting({ last_opened_wallet: id }); 
          setSelectorVisible(false); 
          onWalletChange(); // Avisa a tela (ex: Dashboard) para recarregar
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
          onWalletChange(); // Avisa a tela (ex: Dashboard) para recarregar
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
    flexShrink: 1, // ✅ Troque 'flex: 1' por 'flexShrink: 1'
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
    width: 150, // ✅ ADICIONADO: Força o botão a cortar o texto com "..." mais cedo
  },
  visibilityButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, // ✅ ADICIONADO: Impede que o botão do olho seja esmagado ou deformado
  },
  walletIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  walletInfo: { flexShrink: 1 },
  walletLabel: { fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  walletNameRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 2,
    flexShrink: 1 // ✅ ADICIONADO: Restaura a corrente de encolhimento para o texto cortar!
  },
  walletActive: { fontSize: 12, fontWeight: 'bold', flexShrink: 1 }, // ✅ flexShrink permite o "..."
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: { width: '100%', height: '100%' },
  avatarCircle: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarInitial: {
    fontWeight: 'bold',
    fontSize: 18
  },
});