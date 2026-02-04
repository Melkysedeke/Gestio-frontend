import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  withDelay,
  runOnJS,
  withRepeat,
  Easing,
  ReduceMotion
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: "#1773cf",
  bgLight: "#f8fafc",
  textMain: "#0f172a",
  textSub: "#64748b"
};

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  // --- Valores Animados ---
  const logoScale = useSharedValue(0); // Pop do conjunto todo
  const spinnerRotation = useSharedValue(0); // Rotação do loading (NOVO)
  
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const containerOpacity = useSharedValue(1);
  const blobScale = useSharedValue(1);

  useEffect(() => {
    
    // 1. Iniciar Rotação do Spinner (Infinito) (NOVO)
    spinnerRotation.value = withRepeat(
      withTiming(360, { // Gira 360 graus
        duration: 1500, // em 1.5 segundos (ajuste a velocidade aqui)
        easing: Easing.linear, // Velocidade constante
        reduceMotion: ReduceMotion.Never
      }),
      -1 // Repete para sempre
    );

    // 2. Logo POP (O conjunto todo aparece com efeito elástico)
    logoScale.value = withSpring(1, { 
      damping: 12, // Um pouco menos elástico para não ficar "bobo"
      stiffness: 120,
      reduceMotion: ReduceMotion.Never 
    });

    // 3. Texto Slide Up
    textOpacity.value = withDelay(400, withTiming(1, { duration: 800, reduceMotion: ReduceMotion.Never }));
    textTranslateY.value = withDelay(400, withTiming(0, { duration: 800, easing: Easing.out(Easing.exp), reduceMotion: ReduceMotion.Never }));

    // 4. Blobs de fundo
    blobScale.value = withRepeat(withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.Never }), -1, true);

    // 5. Encerrar após 3 segundos
    const timeout = setTimeout(() => {
      handleFinish();
    }, 3000);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFinish = () => {
    // Saída suave (Fade out e zoom in)
    containerOpacity.value = withTiming(0, { duration: 500, reduceMotion: ReduceMotion.Never }, () => {
      runOnJS(onFinish)();
    });
    logoScale.value = withTiming(1.3, { duration: 500, reduceMotion: ReduceMotion.Never });
  };

  // --- Estilos Animados ---
  
  // Estilo que aplica o "POP" em todo o conjunto do logo
  const logoPopStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }]
  }));

  // Estilo que faz o spinner girar (NOVO)
  const spinnerRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${spinnerRotation.value}deg` }]
  }));

  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value, transform: [{ translateY: textTranslateY.value }] }));
  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const blobStyle = useAnimatedStyle(() => ({ transform: [{ scale: blobScale.value }] }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Background Blobs */}
      <Animated.View style={[styles.blobBottom, blobStyle]} />
      <Animated.View style={[styles.blobTop, blobStyle]} />

      {/* Conteúdo Central */}
      <View style={styles.contentContainer}>
        
        {/* Wrapper que recebe o efeito "POP" */}
        <Animated.View style={[styles.logoWrapper, logoPopStyle]}>
          
          {/* 1. O Brilho azul (fundo) */}
          <View style={styles.logoGlow} />

          {/* 2. O Spinner Giratório (NOVO) - Fica entre o brilho e o círculo branco */}
          <Animated.View style={[styles.spinnerBorder, spinnerRotateStyle]} />

          {/* 3. O Círculo Branco com o Ícone (Frente) */}
          <View style={styles.logoContainer}>
            <Image 
                source={require('../../assets/images/Gestio-removebg-preview.png')} /* Ajuste o caminho se necessário */
                style={styles.logoImage}
                resizeMode="contain"
            />
            </View>

        </Animated.View>

        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={styles.title}>Gestio</Text>
          <Text style={styles.subtitle}>Gestão de Finanças Pessoais</Text>
        </Animated.View>
      </View>

      {/* Footer */}
      {/* <Animated.View style={[styles.footer, textStyle]}>
        <MaterialIcons name="lock-outline" size={16} color={COLORS.textSub} />
        <Text style={styles.footerText}>BANK GRADE SECURITY</Text>
      </Animated.View> */}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.bgLight, alignItems: 'center', justifyContent: 'center', position: 'absolute', width: '100%', height: '100%', zIndex: 999,
  },
  blobBottom: {
    position: 'absolute', bottom: -width * 0.2, right: -width * 0.2, width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4, backgroundColor: COLORS.primary, opacity: 0.05,
  },
  blobTop: {
    position: 'absolute', top: -width * 0.2, left: -width * 0.2, width: width * 0.6, height: width * 0.6, borderRadius: width * 0.3, backgroundColor: COLORS.primary, opacity: 0.05,
  },
  contentContainer: { alignItems: 'center', gap: 40 },
  
  // Wrapper centraliza tudo
  logoWrapper: {
    alignItems: 'center', justifyContent: 'center',
    width: 130, height: 130, // Definindo tamanho fixo para facilitar o alinhamento absoluto
  },
  // Brilho de fundo
  logoGlow: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.primary, opacity: 0.15,
  },
  
  // O SPINNER (NOVO)
  spinnerBorder: {
    position: 'absolute',
    width: 128, // Ligeiramente maior que o círculo branco (120)
    height: 128,
    borderRadius: 64,
    borderWidth: 4, // Espessura do loading
    borderColor: COLORS.primary, // Cor da parte visível
    // O truque do loading: deixar 2 lados transparentes
    borderTopColor: 'transparent', 
    borderLeftColor: 'transparent',
  },

  // O círculo branco central
  logoContainer: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
    // Removi a borda cinza estática que tinha antes para o spinner brilhar sozinho
  },

  logoImage: {
    width: 80,  // Um pouco menor que o container (120) para ter respiro
    height: 80,
  },
  
  textContainer: { alignItems: 'center' },
  title: { fontSize: 42, fontWeight: '800', color: COLORS.textMain, letterSpacing: -1, marginBottom: 8 },
  subtitle: { fontSize: 16, fontWeight: '500', color: COLORS.textSub, letterSpacing: 0.5 },
  footer: { position: 'absolute', bottom: 60, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: 0.8 },
  footerText: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, color: COLORS.textSub, textTransform: 'uppercase' }
});