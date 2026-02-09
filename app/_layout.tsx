import React, { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/authStore';

// Importa seu componente animado
import AnimatedSplashScreen from '../components/SplashScreen'; 

// Impede que a Splash Nativa suma automaticamente
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);
  
  const { user, loadStorageData } = useAuthStore();
  const router = useRouter();

  // Carregar Fontes
  const [fontsLoaded] = useFonts({
    ...MaterialIcons.font,
  });

  // 1. Inicialização (Carregar Dados + Fontes)
  useEffect(() => {
    async function prepare() {
      try {
        await loadStorageData();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  // 2. Redirecionamento Silencioso (Acontece por baixo da Splash)
  useEffect(() => {
    if (appIsReady && fontsLoaded) {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
  }, [appIsReady, fontsLoaded, user]);

  // 3. Callback para esconder a Splash Nativa (Branca) assim que a View montar
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  if (!fontsLoaded || !appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {/* O App (Stack) é renderizado SEMPRE. 
         Assim o roteador já existe para receber o router.replace acima.
      */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>

      {/* A Splash Animada é renderizada POR CIMA (Absolute).
         Ela só some quando a animação termina.
      */}
      {!splashAnimationFinished && (
        <AnimatedSplashScreen 
          onFinish={() => setSplashAnimationFinished(true)} 
        />
      )}
    </View>
  );
}