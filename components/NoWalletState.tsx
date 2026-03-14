import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '@/hooks/useThemeColor';

// Import do Modal (Certifique-se que o caminho está correto no seu projeto)
import CreateWalletModal from './CreateWalletModal';

interface NoWalletStateProps {
  onSuccess: () => void; // Callback para recarregar dados no pai
  title?: string;
  message?: string;
  fullScreen?: boolean; // Se true, ocupa a tela toda. Se false, age como um card.
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };

  const handleSuccess = () => {
    setModalVisible(false);
    onSuccess();
  };

  // Container dinâmico baseado na prop fullScreen
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
        {/* Ícone com gradiente simulado */}
        <View style={[
          styles.iconContainer, 
          { backgroundColor: isDark ? 'rgba(23, 115, 207, 0.15)' : '#eff6ff' }
        ]}>
          <MaterialIcons name="account-balance-wallet" size={42} color={colors.primary} />
          <View style={[styles.iconBadge, { backgroundColor: colors.primary }]}>
             <MaterialIcons name="add" size={14} color="#FFF" />
          </View>
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSub }]}>{message}</Text>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            { 
              backgroundColor: colors.primary, 
              shadowColor: colors.primary 
            }
          ]} 
          onPress={handleOpenModal}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Criar Carteira</Text>
        </TouchableOpacity>
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
    borderRadius: 28, // Bordas mais arredondadas seguindo a tendência atual
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
    borderColor: 'transparent', // No código real, seria a cor do card
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
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 6
  },
  buttonText: {
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 16,
    letterSpacing: 0.5,
  }
});