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
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuthStore } from '../src/stores/authStore';

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

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleContact = (type: 'whatsapp' | 'email') => {
    if (type === 'email') {
      Linking.openURL('mailto:suporte@gestio.com?subject=Ajuda Gestio');
    } else {
      Linking.openURL('https://wa.me/5571982903278');
    }
  };

  // ✅ Constantes de cor calculadas fora do loop
  const guestWarningBg = isDark ? 'rgba(23, 115, 207, 0.1)' : '#e0f2fe';
  const faqBodyBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Ajuda e Suporte</Text>
        <View style={styles.placeholderView} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* AVISO MODO CONVIDADO */}
        {isGuest && (
          <View style={[styles.guestWarning, { backgroundColor: guestWarningBg, borderColor: colors.primary }]}>
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
          >
             <MaterialIcons name="chat" size={28} color="#0bda5b" />
             <Text style={[styles.contactText, { color: colors.text }]}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]} 
            onPress={() => handleContact('email')}
          >
             <MaterialIcons name="email" size={28} color={colors.primary} />
             <Text style={[styles.contactText, { color: colors.text }]}>E-mail</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSub, marginTop: 24 }]}>Perguntas Frequentes</Text>
        
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
  container: { 
    flex: 1 
  },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backButton: { 
    padding: 4 
  },
  placeholderView: { 
    width: 24 
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  content: { 
    padding: 20 
  },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    marginBottom: 12 
  },
  guestWarning: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 24,
    alignItems: 'center'
  },
  bold: {
    fontWeight: 'bold'
  },
  guestWarningText: { 
    fontSize: 13, 
    flex: 1, 
    lineHeight: 18 
  },
  contactRow: { 
    flexDirection: 'row', 
    gap: 12 
  },
  contactCard: {
    flex: 1, 
    padding: 20, 
    borderRadius: 16, 
    borderWidth: 1,
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8
  },
  contactText: { 
    fontWeight: '600', 
    fontSize: 14 
  },
  faqContainer: { 
    gap: 8 
  },
  faqItem: { 
    borderRadius: 12, 
    borderWidth: 1, 
    overflow: 'hidden' 
  },
  faqHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16 
  },
  faqQuestion: { 
    fontSize: 15, 
    fontWeight: '600', 
    flex: 1, 
    paddingRight: 10 
  },
  faqBody: { 
    padding: 16, 
    borderTopWidth: 1 
  },
  faqAnswer: { 
    fontSize: 14, 
    lineHeight: 20 
  },
  footer: { 
    alignItems: 'center', 
    marginTop: 40, 
    marginBottom: 20 
  },
  versionText: { 
    fontSize: 12 
  }
});