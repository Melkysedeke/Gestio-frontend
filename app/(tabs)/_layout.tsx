import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs, usePathname } from 'expo-router'; 
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Componentes e Stores
import ActionSheet from '../../components/ActionSheet';
import { useAuthStore } from '../../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor'; 

export default function TabLayout() {
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  
  const pathname = usePathname();
  const hasWallets = useAuthStore(state => state.hasWallets);
  const { colors } = useThemeColor();
  const insets = useSafeAreaInsets(); 

  const lastSegment = pathname.split('/').pop()?.toLowerCase() || 'index';
  const currentTabName = lastSegment === '' ? 'index' : lastSegment;
  
  const validContexts = ['index', 'transactions', 'debts', 'goals'];
  const sheetContext = validContexts.includes(currentTabName) 
      ? (currentTabName as 'index' | 'transactions' | 'debts' | 'goals') 
      : 'index';
  const TAB_BAR_BASE_HEIGHT = 65; 
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0);

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
            paddingBottom: bottomPadding + 4, 
            paddingTop: 8, 
          },
          tabBarLabelStyle: { 
            fontSize: 10, 
            fontWeight: '600', 
            marginTop: 2, // Aproxima o texto do ícone
            marginBottom: Platform.OS === 'android' ? 4 : 0, // Micro respiro extra no Android
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
          name="Transactions"
          options={{
            title: 'Transações',
            tabBarIcon: ({ color }) => <MaterialIcons name="receipt-long" size={26} color={color} />
          }}
        />

        <Tabs.Screen
          name="Add"
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
        />

        <Tabs.Screen
          name="Debts"
          options={{
            title: 'Dívidas',
            tabBarIcon: ({ color }) => <MaterialIcons name="money-off" size={26} color={color} />
          }}
        />

        <Tabs.Screen
          name="Goals"
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

const CustomTabBarButton = ({ onPress, borderColor, buttonColor, style, ...props }: any) => (
  <TouchableOpacity
    {...props} 
    style={[style, styles.customButtonContainer]} 
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
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  customButton: {
    width: 60, 
    height: 60, 
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