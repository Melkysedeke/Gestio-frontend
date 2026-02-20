import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs, useSegments } from 'expo-router'; 
import { MaterialIcons } from '@expo/vector-icons';

// Componentes e Stores
import ActionSheet from '../../components/ActionSheet'; // Ajuste o caminho se necessário
import { useAuthStore } from '../../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor'; 

// Componente do Botão Central Customizado
const CustomTabBarButton = ({ onPress, style, borderColor }: any) => (
  <TouchableOpacity
    // Removemos 'style' daqui para evitar estilos padrões do React Navigation que possam ter background
    style={styles.customButtonContainer}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.customButton, { borderColor: borderColor }]}> 
      <MaterialIcons name="add" size={32} color="#FFF" />
    </View>
  </TouchableOpacity>
);

export default function TabLayout() {
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const segments = useSegments();
  
  const hasWallets = useAuthStore(state => state.hasWallets);
  const { colors, isDark } = useThemeColor(); 

  const currentTabName = segments[1] || 'index';
  const sheetContext = ['index', 'transactions', 'debts', 'goals'].includes(currentTabName) 
      ? (currentTabName as 'index' | 'transactions' | 'debts' | 'goals') 
      : 'index';

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSub,
          
          tabBarStyle: {
            display: hasWallets ? 'flex' : 'none',
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0,
            backgroundColor: isDark ? colors.card : 'rgba(255, 255, 255, 0.95)',
            borderTopWidth: 1, 
            borderTopColor: colors.border, 
            elevation: 0, // Remove sombra da barra no Android
            shadowOpacity: 0, // Remove sombra da barra no iOS
            height: Platform.OS === 'ios' ? 85 : 70,
            paddingBottom: Platform.OS === 'ios' ? 25 : 10, 
            paddingTop: 10,
          },
          tabBarLabelStyle: { 
            fontSize: 10, 
            fontWeight: '600', 
            marginTop: 4 
          }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarIcon: ({ color }) => <MaterialIcons name="grid-view" size={26} color={color} />
          }}
        />

        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Transações',
            tabBarIcon: ({ color }) => <MaterialIcons name="receipt-long" size={26} color={color} />
          }}
        />

        {/* Botão Central (ActionSheet) */}
        <Tabs.Screen
          name="add"
          options={{
            title: '',
            tabBarIcon: () => null,
            tabBarButton: (props) => (
              <CustomTabBarButton
                {...props}
                onPress={() => setActionSheetVisible(true)}
                // Usamos background dinâmico para simular o "recorte"
                borderColor={isDark ? colors.card : '#f6f7f8'} 
              />
            )
          }}
          listeners={() => ({
            tabPress: (e) => {
              e.preventDefault();
              setActionSheetVisible(true);
            },
          })}
        />

        <Tabs.Screen
          name="debts"
          options={{
            title: 'Dívidas',
            tabBarIcon: ({ color }) => <MaterialIcons name="money-off" size={26} color={color} />
          }}
        />

        <Tabs.Screen
          name="goals"
          options={{
            title: 'Objetivos',
            tabBarIcon: ({ color }) => <MaterialIcons name="flag" size={26} color={color} />
          }}
        />
      </Tabs>

      <ActionSheet
        visible={actionSheetVisible}
        context={sheetContext}
        onClose={() => setActionSheetVisible(false)}
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
    // REMOVIDO: Shadows/Elevation daqui. Isso causava a "caixa fantasma".
  },
  customButton: {
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: '#1773cf', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 4, 
    
    // A sombra fica APENAS aqui (no círculo)
    shadowColor: '#1773cf', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 4, 
    elevation: 5,
  }
});