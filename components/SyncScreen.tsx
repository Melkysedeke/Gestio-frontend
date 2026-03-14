import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

const { width } = Dimensions.get('window');

interface SyncScreenProps {
  message?: string;
  subMessage?: string;
}

export default function SyncScreen({ 
  message = "Sincronizando seus dados", 
  subMessage = "Isso pode levar alguns segundos..." 
}: SyncScreenProps) {
  const { colors, isDark } = useThemeColor();

  // Animações
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Animação de pulsar do ícone da nuvem (loop infinito)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();

    // 2. Animação da barra de progresso (Simulação inteligente)
    // Vai de 0 a 85% em 3 segundos. O restante acontece quando o componente for desmontado.
    Animated.timing(progressAnim, {
      toValue: 85, 
      duration: 3500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width não suporta native driver, mas é super leve aqui
    }).start();

  }, []);

  // Interpolação para a largura da barra
  const barWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#010B19' : '#FFFFFF' }]}>
      
      {/* Ícone Animado */}
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
        <View style={[styles.iconBg, { backgroundColor: isDark ? 'rgba(23, 115, 207, 0.15)' : '#e0f2fe' }]}>
          <MaterialIcons name="cloud-sync" size={48} color={colors.primary} />
        </View>
      </Animated.View>

      {/* Textos */}
      <Text style={[styles.title, { color: colors.text }]}>{message}</Text>
      <Text style={[styles.subtitle, { color: colors.textSub }]}>{subMessage}</Text>

      {/* Barra de Progresso */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: colors.primary,
                width: barWidth 
              }
            ]} 
          />
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.8,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});