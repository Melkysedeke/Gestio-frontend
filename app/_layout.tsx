import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router'; 
import * as SplashScreenNative from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '../src/stores/authStore';
import { useThemeStore } from '../src/stores/themeStore';
import { useThemeColor } from '@/hooks/useThemeColor';

import AnimatedSplashScreen from '../components/SplashScreen'; 
import { syncData } from '../src/services/SyncService'; // 🚀 Importação da Sincronização

SplashScreenNative.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [isSyncingInitial, setIsSyncingInitial] = useState(false); // 🚀 Controlo de Sincronia
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);
  
  // 🚀 Extraímos também o token da store
  const { user, token, loadStorageData } = useAuthStore();
  const _hasHydrated = useThemeStore(state => state._hasHydrated);
  
  const router = useRouter();
  const { isDark } = useThemeColor();

  const [fontsLoaded] = useFonts({
    ...MaterialIcons.font,
  });

  // 1. Carga de dados local inicial (WatermelonDB + AsyncStorage)
  useEffect(() => {
    async function prepare() {
      try {
        await loadStorageData();
      } catch (e) {
        console.warn('Erro ao carregar dados locais:', e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  // 2. Sincronização Obrigatória Pós-Carga
  useEffect(() => {
    async function performInitialSync() {
      // Só tenta sincronizar se o banco local foi carregado e o utilizador está autenticado
      if (appIsReady && user && token) {
        setIsSyncingInitial(true);
        try {
          await syncData();
        } catch {
        } finally {
          setIsSyncingInitial(false);
        }
      }
    }
    
    performInitialSync();
  }, [appIsReady, user, token]);

  // 3. Lógica de Redirecionamento
  useEffect(() => {
    const canNavigate = appIsReady && fontsLoaded && _hasHydrated && splashAnimationFinished;
    
    if (canNavigate) {
      if (user) {
        // Se houver utilizador logado, aguardamos que a sincronização termine!
        if (!isSyncingInitial) {
          router.replace('/(tabs)');
        }
      } else {
        router.replace('/welcome'); 
      }
    }
  }, [appIsReady, fontsLoaded, _hasHydrated, splashAnimationFinished, user, isSyncingInitial]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && fontsLoaded && _hasHydrated) {
      await SplashScreenNative.hideAsync();
    }
  }, [appIsReady, fontsLoaded, _hasHydrated]);

  if (!fontsLoaded || !appIsReady || !_hasHydrated) {
    return null;
  }

  const rootBackgroundColor = isDark ? '#010B19' : '#FFFFFF';

  return (
    <SafeAreaProvider>
      <View 
        style={[styles.container, { backgroundColor: rootBackgroundColor }]} 
        onLayout={onLayoutRootView}
      >
        {/* 🚀 O STACK FICA SEMPRE MONTADO para o router não se perder nas rotas */}
        <Stack screenOptions={{ freezeOnBlur: false, headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="welcome" /> 
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="index" />
        </Stack>

        {/* 🚀 A SPLASH E O LOADING CONTINUAM POR CIMA DE TUDO (ABSOLUTE) */}
        {(!splashAnimationFinished || isSyncingInitial) && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: rootBackgroundColor, justifyContent: 'center', alignItems: 'center', zIndex: 999 }]}>
            <AnimatedSplashScreen 
              onFinish={() => setSplashAnimationFinished(true)} 
            />
            
            {/* Feedback visual elegante durante a sincronização longa */}
            {isSyncingInitial && splashAnimationFinished && (
              <View style={styles.syncContainer}>
                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#010B19'} />
                <Text style={[styles.syncText, { color: isDark ? '#A0AEC0' : '#4A5568' }]}>
                  Atualizando suas informações...
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  syncContainer: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  syncText: {
    fontSize: 14,
    fontWeight: '500',
  }
});