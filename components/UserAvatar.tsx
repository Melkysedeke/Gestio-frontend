import React from 'react';
import { View, Text, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor'; // 🚀 Hook do Tema!

interface UserAvatarProps {
  user: {
    name?: string;
    avatar?: string | null;
  } | null;
  size?: number; 
}

export default function UserAvatar({ user, size = 40 }: UserAvatarProps) {
  // Chamamos o hook global para pegar as cores atualizadas
  const { colors, isDark } = useThemeColor();

  const dynamicStyles = {
    container: {
      width: '100%',  // Ocupa 100% da "caixa" (TouchableOpacity) do elemento pai
      height: '100%', // Isso permite que o MainHeader controle o tamanho geral 
      borderRadius: size / 2, 
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    } as const,
    initialText: {
      fontSize: size * 0.4, 
      fontWeight: 'bold',
      color: colors.primary,
    } as const,
  };

  if (user?.avatar && user.avatar !== 'default' && !user.avatar.includes('@local')) {
    return (
      <Image 
        source={{ uri: user.avatar }} 
        style={dynamicStyles.container}
        resizeMode="cover"
      />
    );
  }

  if (user?.name) {
    return (
      <View style={[dynamicStyles.container, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
        <Text style={dynamicStyles.initialText}>
          {user.name.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <View style={[dynamicStyles.container, { backgroundColor: colors.border }]}>
      <MaterialIcons name="person" size={size * 0.6} color={colors.textSub} />
    </View>
  );
}