import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { database } from '../src/database';
import { Q } from '@nozbe/watermelondb';
import Transaction from '../src/database/models/Transaction';
import Category from '../src/database/models/Category';
import { useAuthStore } from '../src/stores/authStore';
import { useRouter } from 'expo-router';

interface ChartData {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface MonthlyReportProps {
  walletId: string;
  selectedMonth: Date;
  updateTrigger?: any; 
}

const FALLBACK_COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#ef4444'];

export default function MonthlyReport({ walletId, selectedMonth, updateTrigger }: MonthlyReportProps) {
  const { colors, isDark } = useThemeColor();
  const hideValues = useAuthStore(state => state.hideValues);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);

  const fetchCategoryData = useCallback(async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getTime();
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59).getTime();

      const [transactions, allCategories] = await Promise.all([
        database.get<Transaction>('transactions')
          .query(
            Q.where('wallet_id', walletId),
            Q.where('type', 'expense'), 
            Q.where('transaction_date', Q.gte(startOfMonth)),
            Q.where('transaction_date', Q.lte(endOfMonth)),
            Q.where('deleted_at', Q.eq(null))
          ).fetch(),
        
        database.get<Category>('categories').query().fetch()
      ]);

      // 🚀 1. Mapeamento Duplo: Blindagem contra perda de ID
      const colorById = new Map<string, string>();
      const colorByName = new Map<string, string>();

      allCategories.forEach(cat => {
        if (cat.color) {
          colorById.set(cat.id, cat.color);
          colorByName.set(cat.name, cat.color);
        }
      });

      let total = 0;
      const categoryMap = new Map<string, { value: number; color: string; label: string }>();

      // 🚀 2. Agrupando e buscando a cor real
      for (const t of transactions) {
        const val = Number(t.amount);
        total += val;
        
        const catName = t.categoryName || 'Outros';
        // Tenta usar o getter, se falhar tenta acessar o raw diretamente
        const catId = t.categoryId || (t as any)._raw?.category_id;
        
        if (!categoryMap.has(catName)) {
          let catColor = '';

          // A. Tenta achar a cor pelo ID da Categoria (Mais preciso)
          if (catId && colorById.has(catId)) {
            catColor = colorById.get(catId)!;
          }
          // B. Tenta achar a cor pelo Nome (Fallback super seguro)
          else if (colorByName.has(catName)) {
            catColor = colorByName.get(catName)!;
          }

          categoryMap.set(catName, { label: catName, value: 0, color: catColor });
        }

        // Soma o valor à categoria existente
        categoryMap.get(catName)!.value += val;
      }

      // 🚀 3. Aplica os Fallback Colors apenas para quem REALMENTE não tem cor (Ex: "Outros")
      let fallbackIndex = 0;
      categoryMap.forEach((entry) => {
         if (!entry.color) {
             entry.color = FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length];
             fallbackIndex++;
         }
      });

      const sortedData = Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);

      const finalData: ChartData[] = [];
      if (sortedData.length > 4) {
        const top3 = sortedData.slice(0, 3);
        const othersValue = sortedData.slice(3).reduce((acc, curr) => acc + curr.value, 0);
        
        finalData.push(...top3.map((item, index) => ({ ...item, id: String(index) })));
        finalData.push({
          id: 'others',
          label: 'Outros',
          value: othersValue,
          color: isDark ? '#475569' : '#cbd5e1' // Cinza para "Outros"
        });
      } else {
        finalData.push(...sortedData.map((item, index) => ({ ...item, id: String(index) })));
      }

      setTotalExpense(total);
      setChartData(finalData);
    } catch (error) {
      console.error("Erro ao gerar Raio-X:", error);
    } finally {
      setLoading(false);
    }
  }, [walletId, selectedMonth]);

  useEffect(() => {
    fetchCategoryData();
  }, [fetchCategoryData, updateTrigger]);

  const size = 96; 
  const strokeWidth = 10;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const chartSlices = chartData.map((item) => {
    const percentage = totalExpense > 0 ? item.value / totalExpense : 0;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += percentage * circumference;
    return { ...item, strokeDasharray, strokeDashoffset, percentage };
  });

  const formatDisplayCurrency = (value: number) => {
    if (hideValues) return "R$ •••••";
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const monthName = selectedMonth.toLocaleDateString('pt-BR', { month: 'long' });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: isDark ? '#2b2f3e' : colors.border, alignItems: 'center', justifyContent: 'center', paddingVertical: 30 }]}>
         <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (totalExpense === 0) {
    return null; 
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: isDark ? '#2b2f3e' : colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialIcons name="donut-large" size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.title, { color: colors.text }]}>Raio-X de Gastos</Text>
        </View>
        <Text style={[styles.monthText, { color: colors.textSub }]}>{monthName}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.chartWrapper}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <G rotation="-90" origin={`${center}, ${center}`}>
              <Circle cx={center} cy={center} r={radius} stroke={isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'} strokeWidth={strokeWidth} fill="transparent" />
              {chartSlices.map((slice) => (
                <Circle key={slice.id} cx={center} cy={center} r={radius} stroke={slice.color} strokeWidth={strokeWidth} strokeDasharray={slice.strokeDasharray} strokeDashoffset={slice.strokeDashoffset} strokeLinecap="round" fill="transparent" />
              ))}
            </G>
          </Svg>
          <View style={styles.centerTextContainer}>
            <Text style={[styles.centerTextValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
              {hideValues ? '***' : formatDisplayCurrency(totalExpense).split(',')[0]}
            </Text>
            <Text style={[styles.centerTextLabel, { color: colors.textSub }]}>Total</Text>
          </View>
        </View>

        <View style={styles.legendContainer}>
          {chartSlices.map((item) => (
            <View key={item.id} style={styles.legendItem}>
              <View style={styles.legendLabelRow}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendLabel, { color: colors.text }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
              
              <View style={styles.legendValuesContainer}>
                <Text style={[styles.legendValue, { color: colors.text }]}>
                  {formatDisplayCurrency(item.value)}
                </Text>
                <Text style={[styles.legendPercentage, { color: colors.textSub }]}>
                  ({Math.round(item.percentage * 100)}%)
                </Text>
              </View>
              
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: colors.border }]}
        activeOpacity={0.7}
        onPress={() => router.push('/(tabs)/Transactions')} 
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>Ver Detalhes</Text>
        <MaterialIcons name="chevron-right" size={18} color={colors.textSub} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 20, padding: 14, borderWidth: 1, marginVertical: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 14, fontWeight: '700' },
  monthText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize', letterSpacing: 0.5 },
  
  content: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  chartWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  
  centerTextContainer: { position: 'absolute', alignItems: 'center', width: 60 },
  centerTextValue: { fontSize: 14, fontWeight: '800', lineHeight: 18, textAlign: 'center' },
  centerTextLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase' },
  
  legendContainer: { flex: 1, marginLeft: 16, gap: 10 },
  legendItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendLabelRow: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 },
  colorDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  legendLabel: { fontSize: 12, fontWeight: '600' },

  legendValuesContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  legendValue: { fontSize: 12, fontWeight: '700' },
  legendPercentage: { fontSize: 11, fontWeight: '600' },
  
  button: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 12, fontWeight: '600', marginRight: 4 },
});