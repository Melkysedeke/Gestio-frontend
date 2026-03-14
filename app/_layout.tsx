import { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router'; 
import * as SplashScreenNative from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '../src/stores/authStore';
import { useThemeStore } from '../src/stores/themeStore';
import { useThemeColor } from '@/hooks/useThemeColor';

import AnimatedSplashScreen from '../components/SplashScreen'; 
import SyncScreen from '../components/SyncScreen'; // 🚀 O componente de barra de progresso
import { syncData } from '../src/services/SyncService';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '851200563468-g76lrcpv0dds5gd1ql47b5qju7jtpmf9.apps.googleusercontent.com',
  iosClientId: 'com.googleusercontent.apps.851200563468-0ep8e2cuvo9jci6e81813u3gbvq41u3s', 
  offlineAccess: true,
  forceCodeForRefreshToken: true, 
});

SplashScreenNative.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);
  
  // 🚀 Máquina de estados da sincronização: 'idle' | 'syncing' | 'done'
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'done'>('idle');
  // 🚀 Guarda o ID do usuário que já teve os dados sincronizados
  const lastSyncedUserId = useRef<string | null>(null);
  
  const { user, token, loadStorageData, hapticsEnabled } = useAuthStore();
  const _hasHydrated = useThemeStore(state => state._hasHydrated);
  
  const router = useRouter();
  const { isDark } = useThemeColor();

  const [fontsLoaded] = useFonts({
    ...MaterialIcons.font,
  });

  // 1. Carga Básica (Storage & Fontes)
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
  }, [loadStorageData]);

  // 2. O Interceptador de Sessão (A "Cortina")
  const currentUserId = user?.id || null;
  const isGuest = user?.email?.includes('@local');

  useEffect(() => {
    if (!appIsReady) return;

    if (!currentUserId) {
      lastSyncedUserId.current = null;
      setSyncState('idle');
      return;
    }

    const needsSync = !isGuest && token && lastSyncedUserId.current !== currentUserId;

    if (needsSync && syncState !== 'syncing') {
      setSyncState('syncing');

      const doInitialSync = async () => {
        const startTime = Date.now(); // 🚀 Marca a hora que começou
        try {
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000));
          await Promise.race([syncData(), timeoutPromise]);
          
          if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
          console.log("Sync inicial falhou/timeout. Liberando offline:", error);
        } finally {
          // 🚀 TEMPO MÍNIMO DE TELA (Ex: 2.5 segundos)
          // Dá tempo da animação da barra rolar e do Dashboard carregar os dados lá atrás
          const elapsedTime = Date.now() - startTime;
          const minDisplayTime = 2500; 
          
          if (elapsedTime < minDisplayTime) {
            await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsedTime));
          }

          lastSyncedUserId.current = currentUserId;
          setSyncState('done');
        }
      };

      doInitialSync();
    } else if (!needsSync && syncState !== 'done') {
      lastSyncedUserId.current = currentUserId;
      setSyncState('done');
    }

  }, [appIsReady, currentUserId, isGuest, token, syncState, hapticsEnabled]);

  // 3. Roteamento Inteligente (Carrega por trás da cortina)
  useEffect(() => {
    const canRoute = appIsReady && fontsLoaded && _hasHydrated && splashFinished;
    if (!canRoute) return;

    if (!currentUserId) {
      // 1. Sem usuário -> Autenticação
      router.replace('/Welcome'); 
    } else if (syncState === 'done') {
      // 2. Com usuário E Sincronização Local concluída -> Dashboard
      // Aqui temos certeza absoluta de que o banco local já tem os dados da nuvem
      router.replace('/(tabs)');
    }
  }, [appIsReady, fontsLoaded, _hasHydrated, splashFinished, currentUserId, syncState, router]);

  // Ocultar a Splash Nativa
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && fontsLoaded && _hasHydrated) {
      await SplashScreenNative.hideAsync();
    }
  }, [appIsReady, fontsLoaded, _hasHydrated]);

  if (!fontsLoaded || !appIsReady || !_hasHydrated) return null;

  const rootBackgroundColor = isDark ? '#010B19' : '#FFFFFF';

  return (
    <SafeAreaProvider>
      <View style={[styles.container, { backgroundColor: rootBackgroundColor }]} onLayout={onLayoutRootView}>
        <Stack screenOptions={{ freezeOnBlur: false, headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="Welcome" /> 
          <Stack.Screen name="Login" />
          <Stack.Screen name="Register" />
          <Stack.Screen name="index" />
        </Stack>

        {/* 🚀 Overlay de Carregamento */}
        {(!splashFinished || syncState === 'syncing') && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: rootBackgroundColor, zIndex: 999 }]}>
            {!splashFinished ? (
              <AnimatedSplashScreen onFinish={() => setSplashFinished(true)} />
            ) : (
              <SyncScreen 
                message="Atualizando seu cofre..." 
                subMessage="Buscando as informações da sua conta."
              />
            )}
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});