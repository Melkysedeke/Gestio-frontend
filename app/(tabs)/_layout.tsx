import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
// ✅ Trocamos useSegments por usePathname
import { Tabs, usePathname } from 'expo-router'; 
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Componentes e Stores
import ActionSheet from '../../components/ActionSheet';
import { useAuthStore } from '../../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor'; 

export default function TabLayout() {
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  
  // ✅ Usamos o pathname para evitar o erro de Tuple do TypeScript
  const pathname = usePathname();
  
  const hasWallets = useAuthStore(state => state.hasWallets);
  const { colors } = useThemeColor();
  
  const insets = useSafeAreaInsets(); 

  // ✅ Pega o nome da aba atual com segurança
  const lastSegment = pathname.split('/').pop();
  const currentTabName = lastSegment || 'index';
  
  const validContexts = ['index', 'transactions', 'debts', 'goals'];
  const sheetContext = validContexts.includes(currentTabName) 
      ? (currentTabName as 'index' | 'transactions' | 'debts' | 'goals') 
      : 'index';

  // Cálculos dinâmicos
  const TAB_BAR_BASE_HEIGHT = 60; 
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 10; 

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
            backgroundColor: colors.card,
            borderTopWidth: 1, 
            borderTopColor: colors.border, 
            elevation: 0,
            shadowOpacity: 0,
            height: TAB_BAR_BASE_HEIGHT + bottomPadding,
            paddingBottom: bottomPadding, 
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

        <Tabs.Screen
          name="add"
          options={{
            title: '',
            tabBarIcon: () => null,
            tabBarButton: (props) => (
              <CustomTabBarButton
                {...props}
                onPress={() => setActionSheetVisible(true)}
                borderColor={colors.background} 
                buttonColor={colors.primary}
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

// Componente do Botão Central (Mantido igual)
const CustomTabBarButton = ({ onPress, borderColor, buttonColor }: any) => (
  <TouchableOpacity
    style={styles.customButtonContainer}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.customButton, { 
      borderColor: borderColor, 
      backgroundColor: buttonColor 
    }]}> 
      <MaterialIcons name="add" size={32} color="#FFF" />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  customButtonContainer: {
    top: -30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  customButton: {
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 4, 
    elevation: 5,
  }
});