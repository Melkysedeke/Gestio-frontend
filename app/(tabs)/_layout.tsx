import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs, useSegments, router } from 'expo-router'; 
import { MaterialIcons } from '@expo/vector-icons';

// Componentes e Stores
import ActionSheet from '../../components/ActionSheet';
import { useAuthStore } from '../../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor'; 

// Componente do Botão Central Customizado
const CustomTabBarButton = ({ onPress, style, focused, borderColor }: any) => (
  <TouchableOpacity
    style={[styles.customButtonContainer, style]}
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
          tabBarActiveTintColor: colors.primary, // Cor Ativa Dinâmica
          tabBarInactiveTintColor: colors.textSub, // Cor Inativa Dinâmica
          
          tabBarStyle: {
            display: hasWallets ? 'flex' : 'none',
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0,
            // Fundo dinâmico (com leve transparência no claro, sólido no escuro para contraste)
            backgroundColor: isDark ? colors.card : 'rgba(255, 255, 255, 0.95)',
            borderTopWidth: 1, 
            borderTopColor: colors.border, 
            elevation: 0,
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
            tabBarIcon: () => null, // Remove ícone padrão
            tabBarButton: (props) => (
              <CustomTabBarButton
                {...props}
                onPress={() => setActionSheetVisible(true)}
                // Passamos a cor da borda para combinar com o fundo da TabBar
                borderColor={isDark ? colors.card : '#f6f7f8'} 
              />
            )
          }}
          listeners={() => ({
            tabPress: (e) => {
              e.preventDefault(); // Impede navegação real para a rota 'add'
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
        // O ActionSheet atual já usa o router internamente, 
        // mas se a prop onNavigate ainda existir no seu componente antigo, mantenha-a.
        // Se atualizou para a versão nova que enviei antes, pode remover onNavigate.
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
        shadowOffset: { width: 0, height: 4 }, // Sombra reduzida para ficar mais sutil
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  customButton: {
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: '#1773cf', // Mantém azul padrão ou use colors.primary se quiser dinâmico
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 4, 
    // borderColor é passado via props inline para ser dinâmico
    shadowColor: '#1773cf', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 4, 
    elevation: 5,
  }
});