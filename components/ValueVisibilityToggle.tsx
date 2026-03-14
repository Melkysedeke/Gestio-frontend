import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuthStore } from '../src/stores/authStore';

// 🚀 Importando o seu utilitário
import { triggerSelectionHaptic } from '@/src/utils/haptics';

export default function ValueVisibilityToggle() {
  const { colors, isDark } = useThemeColor();
  const { hideValues, toggleHideValues } = useAuthStore();

  const handleToggle = () => {
    // 🚀 Usando o seu utilitário em vez do Expo direto
    triggerSelectionHaptic();
    toggleHideValues();
  };

  return (
    <TouchableOpacity 
      onPress={handleToggle} 
      style={[
        styles.button, 
        { 
          borderColor: colors.border, 
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' 
        }
      ]}
      activeOpacity={0.7}
    >
      <MaterialIcons 
        name={hideValues ? "visibility-off" : "visibility"} 
        size={20} 
        color={hideValues ? colors.primary : colors.textSub} 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});