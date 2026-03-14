import React, { memo } from 'react';
import { View, Text, Image } from 'react-native'; // 🚀 StyleSheet removido (não era usado)
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

interface UserAvatarProps {
  user: {
    name?: string;
    avatar?: string | null;
  } | null;
  size?: number; 
}

// ✅ Definimos como uma função nomeada para o ESLint não reclamar do displayName
const UserAvatarComponent = ({ user, size = 40 }: UserAvatarProps) => {
  const { colors, isDark } = useThemeColor();

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
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
    return name.substring(0, 1).toUpperCase();
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
          fontSize: size * 0.42, 
          fontWeight: '800', 
          color: colors.primary,
          letterSpacing: -0.5
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
};

// ✅ Exportamos com memo e definimos o Display Name explicitamente
const UserAvatar = memo(UserAvatarComponent);
UserAvatar.displayName = 'UserAvatar'; 

export default UserAvatar;