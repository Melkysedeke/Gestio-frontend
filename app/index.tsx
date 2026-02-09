import React, { useState } from 'react';
import { useRouter } from 'expo-router'; // Use router imperativo
import SplashScreen from '../components/SplashScreen';
import { useAuthStore } from '../src/stores/authStore';

export default function AppEntry() {
  const [showSplash, setShowSplash] = useState(true);
  const { user } = useAuthStore();
  const router = useRouter();

  const handleFinish = () => {
    setShowSplash(false);
    if (user) {
      router.replace('/(tabs)'); // Se já estiver logado, vai pra Home
    } else {
      router.replace('/login');  // Se não, vai pro Login
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleFinish} />;
  }

  return null; // Retorna null enquanto o router faz a troca
}