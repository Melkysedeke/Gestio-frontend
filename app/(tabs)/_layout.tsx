import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs, router, useSegments } from 'expo-router'; // <--- 1. Importe useSegments
import { MaterialIcons } from '@expo/vector-icons';
import ActionSheet from '../../components/ActionSheet';

const CustomTabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity style={styles.customButtonContainer} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.customButton}>
      {/* Ícone fixo */}
      <MaterialIcons name="add" size={32} color="#FFF" />
    </View>
  </TouchableOpacity>
);

export default function TabLayout() {
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  
  // 👇 2. Descobrir em qual aba estamos
  const segments = useSegments(); 
  // O segments retorna algo como ['(tabs)', 'transactions']. Pegamos o último.
  // Se estiver na raiz, pode ser undefined, então assumimos 'index'.
  const currentTab = (segments[1] || 'index') as 'index' | 'transactions' | 'debts' | 'goals';

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: '#1773cf',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            position: 'absolute', bottom: 0, left: 0, right: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderTopWidth: 1, borderTopColor: '#e2e8f0', elevation: 0,
            height: Platform.OS === 'ios' ? 85 : 70, 
            paddingBottom: Platform.OS === 'ios' ? 25 : 10, paddingTop: 10,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 4 }
        }}
      >
        <Tabs.Screen 
          name="index" 
          options={{ title: 'Início', tabBarIcon: ({ color }) => <MaterialIcons name="grid-view" size={26} color={color} /> }} 
        />

        <Tabs.Screen 
          name="transactions" 
          options={{ title: 'Transações', tabBarIcon: ({ color }) => <MaterialIcons name="receipt-long" size={26} color={color} /> }} 
        />

        <Tabs.Screen
          name="add"
          options={{
            title: '',
            tabBarIcon: () => null,
            tabBarButton: (props) => (
              <CustomTabBarButton 
                {...props} 
                onPress={() => setActionSheetVisible(true)} 
              />
            )
          }}
          listeners={() => ({ tabPress: (e) => e.preventDefault() })}
        />

        <Tabs.Screen 
          name="debts" 
          options={{ title: 'Dívidas', tabBarIcon: ({ color }) => <MaterialIcons name="money-off" size={26} color={color} /> }} 
        />

        <Tabs.Screen 
          name="goals" 
          options={{ title: 'Objetivos', tabBarIcon: ({ color }) => <MaterialIcons name="flag" size={26} color={color} /> }} 
        />
      </Tabs>

      {/* 👇 3. Passamos o 'currentTab' para o ActionSheet */}
      <ActionSheet 
        visible={actionSheetVisible} 
        context={currentTab} 
        onClose={() => setActionSheetVisible(false)}
        onNavigate={(route) => {
          // Fecha o menu
          setActionSheetVisible(false);
          // 🚀 NAVEGA PARA A ROTA RECEBIDA (Ex: /add-transaction?type=expense)
          router.push(route as any);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  customButtonContainer: {
    top: -30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  
  customButton: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#1773cf',
    alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#f6f7f8',
    shadowColor: '#1773cf', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  }
});