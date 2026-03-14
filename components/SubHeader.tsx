import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';

// 🚀 Importação do nosso utilitário centralizado
import { triggerHaptic } from '@/src/utils/haptics';

interface SubHeaderProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode; 
}

export default function SubHeader({ 
  title, 
  showBack = true, 
  onBackPress,
  rightComponent 
}: SubHeaderProps) {
  const { colors } = useThemeColor();
  const router = useRouter();

  const handleBack = () => {
    // 🚀 Feedback tátil ao voltar (respeita a config global)
    triggerHaptic();

    if (onBackPress) {
      onBackPress();
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)'); 
      }
    }
  };

  return (
    <SafeAreaView 
      style={[
        styles.safeHeader, 
        { 
          backgroundColor: colors.card, 
          borderBottomColor: colors.border 
        }
      ]} 
      edges={['top']} // 🛡️ Garante o Edge-to-Edge perfeito no topo
    >
      <View style={styles.headerContent}>
        
        {/* Lado Esquerdo: Botão Voltar */}
        <View style={styles.sideContainer}>
          {showBack && (
            <TouchableOpacity 
              onPress={handleBack}
              style={styles.iconButton}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 30 }}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Centro: Título Dinâmico */}
        <View style={styles.titleContainer}>
          <Text 
            style={[styles.headerTitle, { color: colors.text }]}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {title}
          </Text>
        </View>

        {/* Lado Direito: Ações Extras (Salvar, etc) */}
        <View style={[styles.sideContainer, { alignItems: 'flex-end' }]}>
          {rightComponent}
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeHeader: {
    ...Platform.select({
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.04, 
        shadowRadius: 4 
      },
      android: { elevation: 3 }, 
    }),
    borderBottomWidth: 1,
    zIndex: 100, 
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 64, // Altura padrão de sistema para headers secundários
  },
  sideContainer: {
    width: 50, 
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'flex-start', 
    justifyContent: 'center',
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  }
});