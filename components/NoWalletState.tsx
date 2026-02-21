import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

// ✅ Importamos o Modal de criação para dentro do Empty State
import CreateWalletModal from './CreateWalletModal';

interface Props {
  onSuccess: () => void; // ✅ Agora ele pede apenas a função para atualizar a tela após criar
  title?: string;
  message?: string;
}

export default function NoWalletState({ 
  onSuccess, 
  title = "Precisa de uma Carteira", 
  message = "Para acessar essa funcionalidade, você precisa criar sua primeira carteira." 
}: Props) {
  const { colors, isDark } = useThemeColor(); 
  
  // ✅ Controle do modal interno
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { 
        backgroundColor: colors.card, 
        borderColor: colors.border,
        borderWidth: isDark ? 1 : 0 
      }]}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(23, 115, 207, 0.15)' : '#eff6ff' }]}>
          <MaterialIcons name="account-balance-wallet" size={48} color={colors.primary} />
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSub }]}>{message}</Text>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }]} 
          onPress={() => setModalVisible(true)} // ✅ Abre o modal internamente
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>+ Criar Carteira</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Modal encapsulado no componente */}
      <CreateWalletModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onSuccess={() => {
          setModalVisible(false);
          onSuccess(); // Avisa o Dashboard/Pai para recarregar os dados
        }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    elevation: 4,
  },
  iconContainer: {
    width: 80, 
    height: 80, 
    borderRadius: 40,
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20, 
    fontWeight: '800', 
    marginBottom: 8, 
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 15, 
    textAlign: 'center', 
    marginBottom: 24, 
    lineHeight: 22
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 6
  },
  buttonText: {
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 16
  }
});