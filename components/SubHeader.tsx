import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';

interface SubHeaderProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode; // Para caso você queira colocar um botão "Salvar" à direita no futuro
}

export default function SubHeader({ 
  title, 
  showBack = true, 
  onBackPress,
  rightComponent 
}: SubHeaderProps) {
  const { colors, isDark } = useThemeColor();
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
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
      edges={['top']}
    >
      <View style={styles.headerContent}>
        
        {/* Lado Esquerdo (Botão Voltar ou Espaço Vazio) */}
        <View style={styles.sideContainer}>
          {showBack ? (
            <TouchableOpacity 
              onPress={handleBack}
              style={styles.iconButton}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholderSpace} />
          )}
        </View>

        {/* Centro (Título) */}
        <View style={styles.titleContainer}>
          <Text 
            style={[styles.headerTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        {/* Lado Direito (Componente extra ou Espaço Vazio para centralizar) */}
        <View style={[styles.sideContainer, { alignItems: 'flex-end' }]}>
          {rightComponent ? rightComponent : <View style={styles.placeholderSpace} />}
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeHeader: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
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
    height: 70, // 🚀 A MESMA altura útil do MainHeader
  },
  sideContainer: {
    width: 50, // Fixamos a largura das laterais para garantir que o título fique 100% centralizado
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'flex-start', // Alinha a seta à esquerda
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholderSpace: {
    width: 24,
    height: 24,
  }
});