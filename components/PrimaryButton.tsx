import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacityProps,
  ViewStyle
} from 'react-native';
import * as Haptics from 'expo-haptics'; // Opcional: melhora muito a UX
import { useThemeColor } from '@/hooks/useThemeColor';

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  isLoading?: boolean;
  variant?: 'primary' | 'danger' | 'outline'; // Para diferentes contextos
}

export default function PrimaryButton({ 
  title, 
  isLoading = false, 
  variant = 'primary',
  style, 
  disabled, 
  onPress,
  ...rest 
}: PrimaryButtonProps) {
  const { colors } = useThemeColor();

  const isDisabled = disabled || isLoading;

  // Função para lidar com o clique e adicionar vibração leve
  const handlePress = (e: any) => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Feedback sutil
      onPress(e);
    }
  };

  // Lógica dinâmica de cores baseada na variant
  const getVariantStyle = () => {
    switch (variant) {
      case 'danger':
        return { backgroundColor: colors.danger };
      case 'outline':
        return { 
          backgroundColor: 'transparent', 
          borderWidth: 1.5, 
          borderColor: colors.primary,
          elevation: 0,
          shadowOpacity: 0 
        };
      default:
        return { backgroundColor: colors.primary };
    }
  };

  const getTextStyle = () => {
    if (variant === 'outline') return { color: colors.primary };
    return { color: '#FFFFFF' };
  };

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        getVariantStyle() as ViewStyle,
        isDisabled && styles.disabled, 
        style 
      ]} 
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : "#FFFFFF"} />
      ) : (
        <Text 
          style={[styles.buttonText, getTextStyle()]}
          allowFontScaling={false}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56, // Altura levemente maior para facilitar o toque (conforto)
    borderRadius: 16, // Bordas mais modernas, combinando com o seu SplashScreen
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    // Sombra sutil
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  disabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700', // Um pouco mais pesado que 'bold' em algumas fontes
    letterSpacing: 0.3,
  },
});