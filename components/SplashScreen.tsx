import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  withDelay,
  withRepeat,
  Easing,
  ReduceMotion
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor'; // <--- Hook de Tema

const { width } = Dimensions.get('window');

// Carregamento estático
const LOGO_SOURCE = require('../assets/images/Gestio-removebg-preview.png');

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  // --- Hook de Tema ---
  const { colors, isDark } = useThemeColor();

  // --- Valores Animados ---
  const logoScale = useSharedValue(0.1); 
  const logoOpacity = useSharedValue(0);
  
  const spinnerRotation = useSharedValue(0); 
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const containerOpacity = useSharedValue(1);
  const blobScale = useSharedValue(1);

  // Gatilho da Animação
  const startLogoAnimation = () => {
    logoScale.value = withSpring(1, { damping: 12, stiffness: 120 });
    logoOpacity.value = withTiming(1, { duration: 300 });
  };

  useEffect(() => {
    // 1. Animações independentes
    spinnerRotation.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear, reduceMotion: ReduceMotion.Never }), -1 
    );
    
    textOpacity.value = withDelay(400, withTiming(1, { duration: 800, reduceMotion: ReduceMotion.Never }));
    textTranslateY.value = withDelay(400, withTiming(0, { duration: 800, easing: Easing.out(Easing.exp), reduceMotion: ReduceMotion.Never }));
    blobScale.value = withRepeat(withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.Never }), -1, true);

    // 2. Fallback de Segurança
    const fallbackTimeout = setTimeout(() => {
        if (logoOpacity.value === 0) {
            startLogoAnimation();
        }
    }, 500);

    // 3. Saída
    const exitTimeout = setTimeout(() => {
      startExitAnimation();
    }, 3000);

    return () => {
        clearTimeout(exitTimeout);
        clearTimeout(fallbackTimeout);
    };
  }, []);

  const startExitAnimation = () => {
    containerOpacity.value = withTiming(0, { duration: 500 });
    logoScale.value = withTiming(1.5, { duration: 500 });

    setTimeout(() => {
      onFinish();
    }, 500);
  };

  // --- Estilos Animados ---
  const logoPopStyle = useAnimatedStyle(() => ({ 
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value
  }));

  const spinnerRotateStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${spinnerRotation.value}deg` }] }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value, transform: [{ translateY: textTranslateY.value }] }));
  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const blobStyle = useAnimatedStyle(() => ({ transform: [{ scale: blobScale.value }] }));

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background }, containerStyle]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* Blobs de fundo com cor dinâmica */}
      <Animated.View style={[styles.blobBottom, { backgroundColor: colors.primary }, blobStyle]} />
      <Animated.View style={[styles.blobTop, { backgroundColor: colors.primary }, blobStyle]} />

      <View style={styles.contentContainer}>
        <Animated.View style={[styles.logoWrapper, logoPopStyle]}>
          <View style={[styles.logoGlow, { backgroundColor: colors.primary }]} />
          
          <Animated.View style={[
              styles.spinnerBorder, 
              { borderColor: colors.primary }, // Apenas define a cor visível, as transparentes ficam no StyleSheet
              spinnerRotateStyle
            ]} 
          />
          
          <View style={[
              styles.logoContainer, 
              { 
                backgroundColor: colors.card, // Card adapta ao tema
                shadowColor: colors.primary 
              }
            ]}>
            <Animated.Image 
                source={LOGO_SOURCE}
                style={styles.logoImage}
                resizeMode="contain"
                fadeDuration={0}
                onLoad={startLogoAnimation} 
            /> 
          </View>
        </Animated.View>

        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={[styles.title, { color: colors.text }]}>Gestio</Text>
          <Text style={[styles.subtitle, { color: colors.textSub }]}>Gestão de Finanças Pessoais</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'absolute', 
    width: '100%', 
    height: '100%', 
    zIndex: 9999 
  },
  blobBottom: { 
    position: 'absolute', 
    bottom: -width * 0.2, 
    right: -width * 0.2, 
    width: width * 0.8, 
    height: width * 0.8, 
    borderRadius: width * 0.4, 
    opacity: 0.05 
  },
  blobTop: { 
    position: 'absolute', 
    top: -width * 0.2, 
    left: -width * 0.2, 
    width: width * 0.6, 
    height: width * 0.6, 
    borderRadius: width * 0.3, 
    opacity: 0.05 
  },
  contentContainer: { alignItems: 'center', gap: 40 },
  logoWrapper: { alignItems: 'center', justifyContent: 'center', width: 130, height: 130 },
  logoGlow: { 
    position: 'absolute', 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    opacity: 0.15 
  },
  spinnerBorder: { 
    position: 'absolute', 
    width: 128, 
    height: 128, 
    borderRadius: 64, 
    borderWidth: 4, 
    borderTopColor: 'transparent', 
    borderLeftColor: 'transparent' 
    // borderColor será injetado dinamicamente
  },
  logoContainer: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 20, 
    elevation: 10 
  },
  logoImage: { width: 80, height: 80 },
  textContainer: { alignItems: 'center' },
  title: { 
    fontSize: 42, 
    fontWeight: '800', 
    letterSpacing: -1, 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 16, 
    fontWeight: '500', 
    letterSpacing: 0.5 
  },
});