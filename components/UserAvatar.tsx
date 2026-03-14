import React from 'react';
import { View, Text, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

interface UserAvatarProps {
  user: {
    name?: string;
    avatar?: string | null;
  } | null;
  size?: number; 
}

export default function UserAvatar({ user, size = 40 }: UserAvatarProps) {
  const { colors, isDark } = useThemeColor();

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2, // 🚀 Círculo perfeito! Acaba com o visual "troncho"
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
    
    // 🚀 A MÁGICA CONTRA O ACHATAMENTO:
    // Garante que nenhum elemento pai consiga esmagar ou esticar o avatar
    flexShrink: 0, 
    flexGrow: 0,
    aspectRatio: 1, 
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const nameParts = name.trim().split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (user?.avatar && user.avatar !== 'default' && !user.avatar.includes('@local')) {
    return (
      <View style={containerStyle}>
        <Image 
          source={{ uri: user.avatar }} 
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (user?.name && user.name.toLowerCase() !== 'visitante') {
    return (
      <View style={[
        containerStyle, 
        { backgroundColor: isDark ? 'rgba(23, 115, 207, 0.15)' : '#e0f2fe' } 
      ]}>
        <Text style={{ 
          fontSize: size * 0.4, 
          fontWeight: '700', 
          color: colors.primary 
        }}>
          {getInitials(user.name)}
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      containerStyle, 
      { backgroundColor: isDark ? colors.card : '#f1f5f9' }
    ]}>
      <MaterialIcons name="person" size={size * 0.6} color={colors.textSub} />
    </View>
  );
}