// src/components/CustomInput.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  TextInputProps,
  ViewStyle,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

// 🚀 1. Importando o haptic sutil para ações de UI
import { triggerSelectionHaptic } from '@/src/utils/haptics';

interface CustomInputProps extends TextInputProps {
  label?: string;
  leftIcon?: keyof typeof MaterialIcons.glyphMap; 
  isPassword?: boolean; 
  containerStyle?: ViewStyle; 
}

export default function CustomInput({ 
  label, 
  leftIcon, 
  isPassword = false, 
  containerStyle,
  ...rest 
}: CustomInputProps) {
  const { colors, isDark } = useThemeColor();
  
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleTogglePassword = () => {
    triggerSelectionHaptic(); // 🚀 2. Vibração curta ao mostrar/esconder senha
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.inputGroup, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}

      <View 
        style={[
          styles.inputWrapper, 
          { 
            backgroundColor: isFocused && isDark ? 'rgba(255,255,255,0.02)' : colors.card, 
            borderColor: isFocused ? colors.primary : colors.border 
          }
        ]}
      >
        {leftIcon && (
          <MaterialIcons 
            name={leftIcon} 
            size={20} 
            color={isFocused ? colors.primary : colors.textSub} 
            style={styles.inputIconLeft} 
          />
        )}

        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholderTextColor={colors.textSub}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword ? !isPasswordVisible : rest.secureTextEntry}
          // 🚀 3. Deixa o cursor e a seleção de texto com a cor primária do app
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity 
            style={styles.inputIconRight} 
            onPress={handleTogglePassword}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons 
              name={isPasswordVisible ? "visibility" : "visibility-off"} 
              size={22} 
              // O ícone fica aceso (cor primária) se a senha estiver visível
              color={isPasswordVisible ? colors.primary : colors.textSub} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    gap: 6,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14, // Arredondado levemente mais moderno, como os cards
    borderWidth: 1.5, 
    height: 52,
    paddingHorizontal: 14,
    // Transição suave não existe de forma nativa simples no StyleSheet, 
    // mas a troca de cor de borda já passa essa sensação de foco
  },
  inputIconLeft: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    ...Platform.select({
      // Evita cortes de fonte no Android
      android: { paddingVertical: 0 }
    })
  },
  inputIconRight: {
    padding: 8,
    marginRight: -6, 
  },
});