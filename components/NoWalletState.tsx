import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  onCreateWallet: () => void;
  title?: string;
  message?: string;
}

export default function NoWalletState({ 
  onCreateWallet, 
  title = "Precisa de uma Carteira", 
  message = "Para acessar essa funcionalidade, você precisa criar sua primeira carteira." 
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="account-balance-wallet" size={48} color="#1773cf" />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{message}</Text>
        
        <TouchableOpacity style={styles.button} onPress={onCreateWallet}>
          <Text style={styles.buttonText}>+ Criar Carteira</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f6f7f8' // Mesma cor de fundo das telas
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: "#000", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4,
  },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20, fontWeight: '800', color: '#111418', marginBottom: 8, textAlign: 'center'
  },
  subtitle: {
    fontSize: 15, color: '#637588', textAlign: 'center', marginBottom: 24, lineHeight: 22
  },
  button: {
    backgroundColor: '#1773cf',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#1773cf', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6
  },
  buttonText: {
    color: '#FFF', fontWeight: 'bold', fontSize: 16
  }
});