import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/useThemeColor';

// 🚀 Componente Padronizado
import SubHeader from '@/components/SubHeader';

export default function NotificationsScreen() {
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();
  
  const iconCircleBg = isDark ? 'rgba(23, 115, 207, 0.1)' : '#f0f9ff';
  const badgeBg = isDark ? '#334155' : '#f1f5f9';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent 
      />
      
      <SubHeader title="Notificações e Alertas" />

      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        
        <View style={styles.comingSoonContainer}>
          <View style={[styles.iconCircle, { backgroundColor: iconCircleBg }]}>
              <MaterialIcons name="notifications-active" size={56} color={colors.primary} />
          </View>

          <Text style={[styles.mainText, { color: colors.text }]}>
            Em Desenvolvimento
          </Text>
          
          <Text style={[styles.subText, { color: colors.textSub }]}>
            Estamos preparando uma central de alertas inteligente para você não perder nenhum vencimento ou meta financeira.
          </Text>

          <View style={[styles.infoBadge, { backgroundColor: badgeBg }]}>
              <MaterialIcons name="auto-awesome" size={16} color={colors.textSub} />
              <Text style={[styles.badgeText, { color: colors.textSub }]}>
                Disponível nas próximas atualizações
              </Text>
          </View>
        </View>
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  comingSoonContainer: {
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: -40, // Compensa visualmente o header para parecer mais centralizado
  },
  iconCircle: {
    width: 100, 
    height: 100, 
    borderRadius: 50,
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 24,
  },
  mainText: {
    fontSize: 22, 
    fontWeight: '900', 
    textAlign: 'center', 
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subText: {
    fontSize: 15, 
    textAlign: 'center', 
    lineHeight: 22, 
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  infoBadge: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20,
  },
  badgeText: { 
    fontSize: 12, 
    fontWeight: '700' 
  }
});