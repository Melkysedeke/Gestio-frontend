import React from 'react';
import ProfileScreen from '../src/screens/SettingsScreen';
import { Stack } from 'expo-router';

export default function ProfileRoute() {
  return (
    <>
      {/* Configura o Header nativo para mostrar o botão de voltar automaticamente */}
      <Stack.Screen 
        options={{
          headerShown: true, // Mostra o header
          headerTitle: '',   // Tira o título padrão
          headerBackTitle: 'Voltar', // Texto do botão voltar (iOS)
          headerTransparent: true, // Deixa transparente para não atrapalhar seu design
          headerTintColor: '#0f172a', // Cor da seta
        }} 
      />
      <ProfileScreen />
    </>
  );
}