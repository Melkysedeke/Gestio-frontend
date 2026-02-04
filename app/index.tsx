import React, { useState } from 'react';
// Remova o { Redirect } se ele estiver aqui sem uso
import SplashScreen from '../src/screens/SplashScreen';
import LoginScreen from '../src/screens/LoginScreen';
import RegisterScreen from '../src/screens/RegisterScreen';

export default function AppEntry() {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'login' | 'register'>('splash');

  if (currentScreen === 'splash') {
    return (
      <SplashScreen 
        onFinish={() => setCurrentScreen('login')} 
      />
    );
  }

  if (currentScreen === 'register') {
    return (
      <RegisterScreen 
        onBackToLogin={() => setCurrentScreen('login')}
      />
    );
  }

  return (
    <LoginScreen 
      onNavigateToRegister={() => setCurrentScreen('register')}
    />
  );
}