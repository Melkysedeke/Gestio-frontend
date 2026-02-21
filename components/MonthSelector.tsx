import React, { useMemo, useRef, useEffect } from 'react'; // ✅ Adicionado useRef e useEffect
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

interface MonthSelectorProps {
  selectedDate: Date;
  onMonthChange: (date: Date) => void;
}

export default function MonthSelector({ selectedDate, onMonthChange }: MonthSelectorProps) {
  const { colors } = useThemeColor();
  const scrollViewRef = useRef<ScrollView>(null); // ✅ Referência para o Scroll

  const months = useMemo(() => {
    const list = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setDate(1); 
      d.setMonth(d.getMonth() - i);
      list.push(new Date(d));
    }
    return list.reverse(); 
  }, []);

  // ✅ Efeito para rolar para o final ao montar o componente
  useEffect(() => {
    // Um pequeno timeout garante que o layout foi calculado antes do scroll
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef} // ✅ Atribui a referência
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {months.map((date, index) => {
          const isSelected = 
            date.getMonth() === selectedDate.getMonth() && 
            date.getFullYear() === selectedDate.getFullYear();

          const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
          const yearLabel = date.getFullYear() !== new Date().getFullYear() ? `'${String(date.getFullYear()).slice(-2)}` : '';

          return (
            <TouchableOpacity 
              key={index} 
              activeOpacity={0.7}
              style={[
                styles.item, 
                { 
                  backgroundColor: isSelected ? colors.primary : colors.card, 
                  borderColor: isSelected ? colors.primary : colors.border 
                }
              ]}
              onPress={() => onMonthChange(date)}
            >
              <Text style={[styles.text, { color: isSelected ? '#FFF' : colors.textSub }]}>
                {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {yearLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 4 },
  scrollContent: { gap: 10, paddingRight: 20 },
  item: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center'
  },
  text: { fontSize: 13, fontWeight: '700' },
});