import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuthStore } from '../../src/stores/authStore';
import api from '../../src/services/api';
import MainHeader from '../../components/MainHeader';
import WalletSelectorModal from '../../components/WalletSelectorModal';

export default function GoalsScreen() {
  const user = useAuthStore(state => state.user);
  const updateUserSetting = useAuthStore(state => state.updateUserSetting);
  
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectorVisible, setSelectorVisible] = useState(false);

  async function fetchWallets() {
    if (!user?.id) return;
    try {
      const res = await api.get('/wallets', { params: { userId: user.id } });
      setWallets(res.data);
    } catch (e) { console.log(e); }
  }

  const handleSwitchWallet = (id: number) => {
    updateUserSetting({ last_opened_wallet: id });
    setSelectorVisible(false);
    // Aqui você buscaria os OBJETIVOS dessa nova carteira
  };

  useFocusEffect(useCallback(() => { fetchWallets(); }, [user?.last_opened_wallet]));

  const activeWallet = wallets.find(w => w.id === user?.last_opened_wallet) || wallets[0];

  return (
    <View style={styles.container}>
      
      {/* HEADER PADRÃO EM TODAS AS TELAS */}
      <MainHeader 
        user={user}
        activeWallet={activeWallet}
        onPressSelector={() => setSelectorVisible(true)}
      />

      <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
        <View style={{ marginTop: 50, alignItems: 'center' }}>
          <MaterialIcons name="flag" size={60} color="#cbd5e1" />
          <Text style={{ fontSize: 18, color: '#64748b', marginTop: 16 }}>
            Seus objetivos para {activeWallet?.name} aparecerão aqui.
          </Text>
        </View>
      </ScrollView>

      <WalletSelectorModal 
        visible={selectorVisible} 
        onClose={() => setSelectorVisible(false)} 
        onSelect={handleSwitchWallet} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f8' }
});