import { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
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
  const [isSyncingInitial, setIsSyncingInitial] = useState(false);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);
  
  const { user, token, loadStorageData, hapticsEnabled } = useAuthStore();
  const _hasHydrated = useThemeStore(state => state._hasHydrated);
  
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
  
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [fontsLoaded] = useFonts({
    ...MaterialIcons.font,
  });

  // 1. Carga de dados local inicial
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

  // 2. Sincronização com Proteção de Tempo
  useEffect(() => {
    async function performInitialSync() {
      const isGuest = user?.email?.includes('@local');

      if (appIsReady && user && token && !isGuest) {
        setIsSyncingInitial(true);

        syncTimeoutRef.current = setTimeout(() => {
          setIsSyncingInitial(false);
          console.log("⏳ Sync demorando... liberando modo offline.");
        }, 8000);

        try {
          await syncData();
          if (hapticsEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } catch (error) {
          console.log("Sync inicial falhou, entrando em modo offline.", error);
        } finally {
          setIsSyncingInitial(false);
          if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        }
      }
    }
    
    performInitialSync();

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [appIsReady, user, token, hapticsEnabled]);

  // 3. Redirecionamento Centralizado
  useEffect(() => {
    const canNavigate = appIsReady && fontsLoaded && _hasHydrated && splashAnimationFinished;
    
    if (canNavigate && !isSyncingInitial) {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/Welcome'); 
      }
    }
  }, [appIsReady, fontsLoaded, _hasHydrated, splashAnimationFinished, user, isSyncingInitial, router]);

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
        <Stack screenOptions={{ freezeOnBlur: false, headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="Welcome" /> 
          <Stack.Screen name="Login" />
          <Stack.Screen name="Register" />
          <Stack.Screen name="index" />
        </Stack>

        {(!splashAnimationFinished || isSyncingInitial) && (
          <View 
            style={[
                StyleSheet.absoluteFill, 
                { backgroundColor: rootBackgroundColor, justifyContent: 'center', alignItems: 'center', zIndex: 999 }
            ]}
          >
            {!splashAnimationFinished ? (
              <AnimatedSplashScreen 
                onFinish={() => setSplashAnimationFinished(true)} 
              />
            ) : (
              <View style={styles.syncContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.syncText, { color: colors.textSub }]}>
                  Sincronizando seus dados...
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
  container: { flex: 1 },
  syncContainer: { 
    alignItems: 'center', 
    gap: 16,
    paddingHorizontal: 40 
  },
  syncText: { 
    fontSize: 14, 
    fontWeight: '700', 
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    opacity: 0.8
  }
});