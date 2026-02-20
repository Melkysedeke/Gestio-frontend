import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Linking, Platform 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';

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
    question: 'Posso exportar meus dados?', 
    answer: 'Atualmente estamos trabalhando nessa funcionalidade para versões futuras.' 
  },
  { 
    question: 'O aplicativo funciona offline?', 
    answer: 'Algumas funções sim, mas para sincronizar os dados e salvar no banco, é necessário internet.' 
  },
];

export default function HelpScreen() {
  const { colors, isDark } = useThemeColor();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleContact = (type: 'whatsapp' | 'email') => {
    if (type === 'email') {
      Linking.openURL('mailto:suporte@gestio.com?subject=Ajuda Gestio');
    } else {
      // Exemplo de link para WhatsApp (substitua pelo número real se tiver)
      Linking.openURL('https://wa.me/5571982903278');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Ajuda e Suporte</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* CONTACT CARDS */}
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
             <MaterialIcons name="email" size={28} color="#1773cf" />
             <Text style={[styles.contactText, { color: colors.text }]}>E-mail</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ SECTION */}
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
                  <View style={[styles.faqBody, { borderTopColor: colors.border }]}>
                    <Text style={[styles.faqAnswer, { color: colors.textSub }]}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* APP INFO */}
        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: colors.textSub }]}>Gestio Mobile v1.0.0</Text>
        </View>

      </ScrollView>
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
  
  content: { padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 },
  
  contactRow: { flexDirection: 'row', gap: 12 },
  contactCard: {
    flex: 1, padding: 20, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', gap: 8
  },
  contactText: { fontWeight: '600', fontSize: 14 },

  faqContainer: { gap: 8 },
  faqItem: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  faqQuestion: { fontSize: 15, fontWeight: '600', flex: 1, paddingRight: 10 },
  faqBody: { padding: 16, borderTopWidth: 1, backgroundColor: 'rgba(0,0,0,0.02)' },
  faqAnswer: { fontSize: 14, lineHeight: 20 },

  footer: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  versionText: { fontSize: 12 }
});