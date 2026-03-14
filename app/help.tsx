import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Linking, 
  Platform 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuthStore } from '../src/stores/authStore';

// 🚀 Utilitários Padronizados
import { triggerHaptic, triggerSelectionHaptic } from '@/src/utils/haptics';
import SubHeader from '@/components/SubHeader'; 

const FAQ_ITEMS = [
  { 
    question: 'Como criar uma carteira?', 
    answer: 'Toque no nome da carteira no topo da tela inicial e selecione "Adicionar Carteira".' 
  },
  { 
    question: 'Como funcionam os Objetivos?', 
    answer: 'Objetivos funcionam como cofrinhos. Ao depositar neles, o valor sai do seu saldo disponível. Ao resgatar, o valor volta para a carteira.' 
  },
  { 
    question: 'O aplicativo funciona offline?', 
    answer: 'Sim! Agora o Gestio utiliza um banco de dados local (WatermelonDB). Seus dados ficam salvos no seu celular e serão sincronizados quando você criar uma conta oficial.' 
  },
  { 
    question: 'Meus dados estão seguros?', 
    answer: 'No modo convidado, os dados residem apenas no seu aparelho. Recomendamos criar uma conta oficial para garantir o backup na nuvem.' 
  },
];

export default function HelpScreen() {
  const user = useAuthStore(state => state.user);
  const isGuest = user?.email?.includes('@local');
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    triggerSelectionHaptic(); // Feedback ao expandir FAQ
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleContact = (type: 'whatsapp' | 'email') => {
    triggerHaptic(); // Feedback ao iniciar contato externo
    if (type === 'email') {
      Linking.openURL('mailto:melkybahia88@gmail.com?subject=Ajuda Gestio');
    } else {
      Linking.openURL('https://wa.me/5571982903278');
    }
  };

  const guestWarningBg = isDark ? 'rgba(23, 115, 207, 0.1)' : '#e0f2fe';
  const faqBodyBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent 
      />

      <SubHeader title="Ajuda e Suporte" />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 40) }]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* AVISO MODO CONVIDADO */}
        {isGuest && (
          <View style={[styles.guestWarning, { backgroundColor: guestWarningBg, borderColor: isDark ? colors.primary : '#bae6fd' }]}>
            <MaterialIcons name="cloud-off" size={20} color={colors.primary} />
            <Text style={[styles.guestWarningText, { color: colors.text }]}>
              Você está usando uma <Text style={styles.bold}>Conta Local</Text>. O suporte técnico pode ter limitações para acessar seus registros.
            </Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Fale Conosco</Text>
        
        <View style={styles.contactRow}>
          <TouchableOpacity 
            style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]} 
            onPress={() => handleContact('whatsapp')}
            activeOpacity={0.7}
          >
             <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(11, 218, 91, 0.1)' : '#ecfdf5' }]}>
                <MaterialIcons name="chat" size={26} color="#0bda5b" />
             </View>
             <Text style={[styles.contactText, { color: colors.text }]}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]} 
            onPress={() => handleContact('email')}
            activeOpacity={0.7}
          >
             <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(23, 115, 207, 0.1)' : '#f0f9ff' }]}>
                <MaterialIcons name="email" size={26} color={colors.primary} />
             </View>
             <Text style={[styles.contactText, { color: colors.text }]}>E-mail</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSub, marginTop: 12 }]}>Perguntas Frequentes</Text>
        
        <View style={styles.faqContainer}>
          {FAQ_ITEMS.map((item, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <View key={index} style={[styles.faqItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity 
                  style={styles.faqHeader} 
                  onPress={() => toggleExpand(index)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.question}</Text>
                  <MaterialIcons 
                    name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                    size={24} 
                    color={colors.textSub} 
                  />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={[styles.faqBody, { borderTopColor: colors.border, backgroundColor: faqBodyBg }]}>
                    <Text style={[styles.faqAnswer, { color: colors.textSub }]}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: colors.textSub }]}>Gestio Mobile v1.0.0 (Offline Mode)</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    marginBottom: 16,
    letterSpacing: 1
  },
  guestWarning: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 24,
    alignItems: 'center'
  },
  bold: { fontWeight: 'bold' },
  guestWarningText: { fontSize: 13, flex: 1, lineHeight: 18, fontWeight: '500' },
  contactRow: { 
    flexDirection: 'row', 
    gap: 12,
    marginBottom: 24, 
  },
  contactCard: {
    flex: 1, 
    padding: 16, 
    borderRadius: 20, 
    borderWidth: 1,
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center'
  },
  contactText: { fontWeight: '700', fontSize: 14 },
  faqContainer: { gap: 10 },
  faqItem: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  faqHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 18 
  },
  faqQuestion: { fontSize: 15, fontWeight: '700', flex: 1, paddingRight: 10 },
  faqBody: { padding: 18, borderTopWidth: 1 },
  faqAnswer: { fontSize: 14, lineHeight: 22, fontWeight: '400' },
  footer: { alignItems: 'center', marginTop: 40, marginBottom: 10 },
  versionText: { fontSize: 11, fontWeight: '600' }
});