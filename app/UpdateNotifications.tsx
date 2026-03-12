import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, StatusBar 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';

import SubHeader from '@/components/SubHeader';

export default function NotificationsScreen() {
  const { colors, isDark } = useThemeColor();

  // Constantes dinâmicas calculadas antes do return
  const iconCircleBg = isDark ? 'rgba(23, 115, 207, 0.1)' : '#f0f9ff';
  const badgeBg = isDark ? '#334155' : '#f1f5f9';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* HEADER PADRONIZADO */}
      <SubHeader title="Notificações" />

      {/* CONTEÚDO DE BLOQUEIO / EM BREVE */}
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: iconCircleBg }]}>
            <MaterialIcons name="construction" size={60} color={colors.primary} />
        </View>

        <Text style={[styles.mainText, { color: colors.text }]}>
          Em Desenvolvimento
        </Text>
        
        <Text style={[styles.subText, { color: colors.textSub }]}>
          Estamos preparando uma central de alertas inteligente para você não perder nenhum vencimento ou meta.
        </Text>

        <View style={[styles.infoBadge, { backgroundColor: badgeBg }]}>
            <MaterialIcons name="auto-awesome" size={16} color={colors.textSub} />
            <Text style={[styles.badgeText, { color: colors.textSub }]}>
              Disponível nas próximas atualizações
            </Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]} 
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Voltar para o Início</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  // 🚀 Removidos os estilos de header antigos que não eram mais usados
  content: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 40,
    paddingBottom: 60 
  },
  iconCircle: {
    width: 120, 
    height: 120, 
    borderRadius: 60,
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 24,
  },
  mainText: {
    fontSize: 22, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 12
  },
  subText: {
    fontSize: 15, 
    textAlign: 'center', 
    lineHeight: 22, 
    marginBottom: 30
  },
  infoBadge: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20,
    marginBottom: 40
  },
  badgeText: { 
    fontSize: 12, 
    fontWeight: '600' 
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold'
  }
});