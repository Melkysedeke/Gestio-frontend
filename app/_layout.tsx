import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router'; 
import * as SplashScreenNative from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '../src/stores/authStore';
import { useThemeStore } from '../src/stores/themeStore';
import { useThemeColor } from '@/hooks/useThemeColor';

import AnimatedSplashScreen from '../components/SplashScreen'; 

SplashScreenNative.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);
  
  // Conexão direta com a store
  const { user, loadStorageData } = useAuthStore();
  const _hasHydrated = useThemeStore(state => state._hasHydrated);
  
  const router = useRouter();
  const { isDark } = useThemeColor();

  const [fontsLoaded] = useFonts({
    ...MaterialIcons.font,
  });

  // 1. Carga de dados inicial
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

  // 2. Redirecionamento após a Splash
  useEffect(() => {
    if (appIsReady && fontsLoaded && _hasHydrated && splashAnimationFinished) {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/welcome'); 
      }
    }
  }, [appIsReady, fontsLoaded, _hasHydrated, splashAnimationFinished, user]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && fontsLoaded && _hasHydrated) {
      await SplashScreenNative.hideAsync();
    }
  }, [appIsReady, fontsLoaded, _hasHydrated]);

  if (!fontsLoaded || !appIsReady || !_hasHydrated) {
    return null;
  }

  // ✅ Constante para a cor dinâmica (evita re-criação de string no render)
  const rootBackgroundColor = isDark ? '#010B19' : '#FFFFFF';

  return (
    <SafeAreaProvider>
      <View 
        style={[styles.container, { backgroundColor: rootBackgroundColor }]} 
        onLayout={onLayoutRootView}
      >
        {/* SÓ MONTA O STACK QUANDO A ANIMAÇÃO TERMINAR */}
        {splashAnimationFinished && (
          <Stack screenOptions={{ freezeOnBlur: false, headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="welcome" /> 
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="index" />
          </Stack>
        )}

        {/* SPLASH ANIMADA POR CIMA */}
        {!splashAnimationFinished && (
          <View style={StyleSheet.absoluteFill}>
            <AnimatedSplashScreen 
              onFinish={() => setSplashAnimationFinished(true)} 
            />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

// ✅ Alocação de memória permanente e blindada
const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});