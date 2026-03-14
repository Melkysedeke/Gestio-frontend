// src/components/CustomInput.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  TextInputProps,
  ViewStyle
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

interface CustomInputProps extends TextInputProps {
  label?: string;
  leftIcon?: keyof typeof MaterialIcons.glyphMap; // Tipagem correta para os ícones
  isPassword?: boolean; // Se true, ele mesmo cria o botão do "olhinho"
  containerStyle?: ViewStyle; // Para margens externas, se necessário
}

export default function CustomInput({ 
  label, 
  leftIcon, 
  isPassword = false, 
  containerStyle,
  ...rest // Pega o resto das propriedades do TextInput (value, onChangeText, etc)
}: CustomInputProps) {
  const { colors } = useThemeColor();
  
  // Estados internos do componente
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={[styles.inputGroup, containerStyle]}>
      {/* Renderiza a Label só se ela for passada */}
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}

      <View 
        style={[
          styles.inputWrapper, 
          { 
            backgroundColor: colors.card, 
            // Muda a cor da borda se estiver focado!
            borderColor: isFocused ? colors.primary : colors.border 
          }
        ]}
      >
        {/* Ícone da esquerda */}
        {leftIcon && (
          <MaterialIcons 
            name={leftIcon} 
            size={20} 
            // O ícone acende com a cor primária quando focado
            color={isFocused ? colors.primary : colors.textSub} 
            style={styles.inputIconLeft} 
          />
        )}

        {/* O Input em si */}
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholderTextColor={colors.textSub}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword ? !isPasswordVisible : rest.secureTextEntry}
          {...rest}
        />

        {/* Ícone da direita (Olhinho da senha gerado automaticamente) */}
        {isPassword && (
          <TouchableOpacity 
            style={styles.inputIconRight} 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name={isPasswordVisible ? "visibility" : "visibility-off"} 
              size={22} 
              color={colors.textSub} 
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
    fontWeight: 'bold',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5, // 1.5 dá um destaque melhor no foco
    height: 52,
    paddingHorizontal: 14,
  },
  inputIconLeft: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  inputIconRight: {
    padding: 8,
    marginRight: -6, // Compensa o padding para o ícone ficar bem alinhado à direita
  },
});