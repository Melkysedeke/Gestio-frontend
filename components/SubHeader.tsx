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
      edges={['top']}
    >
      <View style={styles.headerContent}>
        
        {/* Lado Esquerdo */}
        <View style={styles.sideContainer}>
          {showBack && (
            <TouchableOpacity 
              onPress={handleBack}
              style={styles.iconButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 20 }}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Centro (Título) */}
        <View style={styles.titleContainer}>
          <Text 
            style={[styles.headerTitle, { color: colors.text }]}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {title}
          </Text>
        </View>

        {/* Lado Direito */}
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
    height: 70, 
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'flex-start', 
    justifyContent: 'center',
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  }
});