import React, { useState } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

// 🚀 1. Importando nossos utilitários e botões padronizados
import { triggerHaptic } from '@/src/utils/haptics';
import PrimaryButton from './PrimaryButton';
import CreateWalletModal from './CreateWalletModal';

interface NoWalletStateProps {
  onSuccess: () => void; 
  title?: string;
  message?: string;
  fullScreen?: boolean; 
}

export default function NoWalletState({ 
  onSuccess, 
  title = "Precisa de uma Carteira", 
  message = "Para acessar essa funcionalidade, você precisa criar sua primeira carteira.",
  fullScreen = true
}: NoWalletStateProps) {
  const { colors, isDark } = useThemeColor(); 
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpenModal = () => {
    // 🚀 2. Usando o haptics inteligente (ele já sabe se deve vibrar)
    triggerHaptic();
    setModalVisible(true);
  };

  const handleSuccess = () => {
    setModalVisible(false);
    onSuccess();
  };

  const containerStyle: ViewStyle = fullScreen 
    ? { flex: 1, justifyContent: 'center' as const, padding: 24 }
    : { padding: 16 };

  return (
    <View style={[containerStyle, { backgroundColor: fullScreen ? colors.background : 'transparent' }]}>
      <View style={[
        styles.card, 
        { 
          backgroundColor: colors.card, 
          borderColor: colors.border,
          borderWidth: isDark ? 1 : 0.5,
          shadowColor: "#000",
        }
      ]}>
        
        <View style={[
          styles.iconContainer, 
          { backgroundColor: isDark ? 'rgba(23, 115, 207, 0.15)' : '#eff6ff' }
        ]}>
          <MaterialIcons name="account-balance-wallet" size={42} color={colors.primary} />
          {/* A cor da borda do badge agora pega dinamicamente a cor do card */}
          <View style={[styles.iconBadge, { backgroundColor: colors.primary, borderColor: colors.card }]}>
             <MaterialIcons name="add" size={14} color="#FFF" />
          </View>
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSub }]}>{message}</Text>
        
        {/* 🚀 3. Substituímos o botão customizado pelo PrimaryButton */}
        <PrimaryButton 
          title="Criar Carteira" 
          onPress={handleOpenModal}
          style={{ width: '100%' }}
        />
        
      </View>

      <CreateWalletModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onSuccess={handleSuccess} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28, 
    padding: 32,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 20, 
    elevation: 5,
  },
  iconContainer: {
    width: 84, 
    height: 84, 
    borderRadius: 42,
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  iconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22, 
    fontWeight: '800', 
    marginBottom: 12, 
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15, 
    textAlign: 'center', 
    marginBottom: 32, 
    lineHeight: 22,
    paddingHorizontal: 10,
  }
});