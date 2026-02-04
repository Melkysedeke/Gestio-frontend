import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function RootLayout() {
  const { user, isLoading, loadStorageData } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadStorageData();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const currentRoute = segments[0];
    
    console.log("=== NAVIGATION DEBUG ===");
    console.log("Segmento Atual:", currentRoute);
    console.log("Usuário logado:", !!user);

    const inAuthGroup = currentRoute === '(tabs)';
    const inProfile = currentRoute === 'profile';
    const inLoginOrRegister = currentRoute === 'login' || currentRoute === 'register';

    if (!user) {
      // Se não tem usuário e não está no login, força login
      if (!inLoginOrRegister) {
        console.log("Redirecionando para Login...");
        router.replace('/login');
      }
    } else {
      // Se TEM usuário e está no login/registro ou na raiz vazia, manda pro App
      if (inLoginOrRegister || !currentRoute) {
        console.log("Usuário autenticado, indo para Dashboard...");
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      {/* Adicione o profile aqui para o Stack reconhecer a rota explicitamente */}
      <Stack.Screen name="profile" options={{ headerShown: false }} />
    </Stack>
  );
}