import React, { useMemo, useRef, useEffect } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

import { triggerSelectionHaptic } from '@/src/utils/haptics';

interface MonthSelectorProps {
  selectedDate: Date;
  onMonthChange: (date: Date) => void;
}

export default function MonthSelector({ selectedDate, onMonthChange }: MonthSelectorProps) {
  const { colors, isDark } = useThemeColor();
  const scrollViewRef = useRef<ScrollView>(null);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300); 
    return () => clearTimeout(timer);
  }, []);

  const handlePress = (date: Date) => {
    // 🚀 Substituído pela nossa função inteligente que respeita o usuário
    triggerSelectionHaptic();
    onMonthChange(date);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {months.map((date, index) => {
          const isSelected = 
            date.getMonth() === selectedDate.getMonth() && 
            date.getFullYear() === selectedDate.getFullYear();

          const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })
            .replace('.', '')
            .substring(0, 3);
            
          const isCurrentYear = date.getFullYear() === new Date().getFullYear();
          const yearLabel = !isCurrentYear ? `'${String(date.getFullYear()).slice(-2)}` : '';

          return (
            <TouchableOpacity 
              key={`${date.getTime()}-${index}`} 
              activeOpacity={0.8}
              style={[
                styles.item, 
                { 
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
                !isSelected && isDark && { backgroundColor: '#1E293B' }
              ]}
              onPress={() => handlePress(date)}
            >
              <Text style={[styles.text, { color: isSelected ? '#FFF' : colors.text }]}>
                {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
              </Text>
              
              {yearLabel ? (
                <Text style={[styles.yearText, { color: isSelected ? 'rgba(255,255,255,0.7)' : colors.textSub }]}>
                  {yearLabel}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    // Container limpo, permitindo que a tela pai (Dashboard/Home) defina as margens
  },
  scrollContent: { 
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingVertical: 2, // 🚀 Pequeno respiro essencial para não cortar a sombra (elevation) no Android
  },
  item: { 
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 14,
    paddingVertical: 4, 
    borderRadius: 20, 
    borderWidth: 1.5,
    marginRight: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  text: { 
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  yearText: {
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 3,
  }
});