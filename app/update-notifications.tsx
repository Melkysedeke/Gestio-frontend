import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, StatusBar 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function NotificationsScreen() {
  const { colors, isDark } = useThemeColor();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notificações</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* CONTEÚDO DE BLOQUEIO / EM BREVE */}
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(23, 115, 207, 0.1)' : '#f0f9ff' }]}>
           <MaterialIcons name="construction" size={60} color={colors.primary} />
        </View>

        <Text style={[styles.mainText, { color: colors.text }]}>
          Em Desenvolvimento
        </Text>
        
        <Text style={[styles.subText, { color: colors.textSub }]}>
          Estamos preparando uma central de alertas inteligente para você não perder nenhum vencimento ou meta.
        </Text>

        <View style={[styles.infoBadge, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
           <MaterialIcons name="auto-awesome" size={16} color={colors.textSub} />
           <Text style={[styles.badgeText, { color: colors.textSub }]}>Disponível nas próximas atualizações</Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]} 
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Voltar para o Início</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: 'bold' },
  
  content: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 40,
    paddingBottom: 60 
  },
  iconCircle: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  mainText: {
    fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 12
  },
  subText: {
    fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 30
  },
  infoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    marginBottom: 40
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF', fontSize: 16, fontWeight: 'bold'
  }
});