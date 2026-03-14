import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, 
  LayoutAnimation, UIManager, Platform 
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { database } from '../src/database';
import { Q } from '@nozbe/watermelondb';
import Transaction from '../src/database/models/Transaction';
import Category from '../src/database/models/Category';
import { useAuthStore } from '../src/stores/authStore';
import { useRouter } from 'expo-router';

// 🚀 Habilita a animação fluida no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  
  // 🚀 Estado que controla se o card está aberto ou fechado
  const [isExpanded, setIsExpanded] = useState(true);

  // 🚀 Função para animar a expansão/retração
  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const fetchCategoryData = useCallback(async () => {
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

      for (const t of transactions) {
        const val = Number(t.amount);
        total += val;
        
        const catName = t.categoryName || 'Outros';
        const catId = t.categoryId || (t as any)._raw?.category_id;
        
        if (!categoryMap.has(catName)) {
          let catColor = '';
          if (catId && colorById.has(catId)) {
            catColor = colorById.get(catId)!;
          } else if (colorByName.has(catName)) {
            catColor = colorByName.get(catName)!;
          }
          categoryMap.set(catName, { label: catName, value: 0, color: catColor });
        }
        categoryMap.get(catName)!.value += val;
      }

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
          color: isDark ? '#475569' : '#cbd5e1'
        });
      } else {
        finalData.push(...sortedData.map((item, index) => ({ ...item, id: String(index) })));
      }

      // Suaviza a transição de "vazio" para "com dados"
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTotalExpense(total);
      setChartData(finalData);
      setIsInitialLoading(false);
    } catch (error) {
      console.error("Erro ao gerar Raio-X:", error);
      setIsInitialLoading(false);
    }
  }, [walletId, selectedMonth, isDark]);

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

  if (isInitialLoading && chartData.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: isDark ? '#2b2f3e' : colors.border, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }]}>
         <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // 🚀 REMOVIDO: O if que retornava `null`. Agora o card sempre existe, mas fica vazio ou recolhido.

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: isDark ? '#2b2f3e' : colors.border, overflow: 'hidden' }]}>
      
      {/* 🚀 Header transformado em botão para expandir/recolher */}
      <TouchableOpacity 
        style={styles.header} 
        activeOpacity={0.6} 
        onPress={toggleExpand}
      >
        <View style={styles.titleRow}>
          <MaterialIcons name="donut-large" size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.title, { color: colors.text }]}>Gastos</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.monthText, { color: colors.textSub }]}>{monthName}</Text>
          <MaterialIcons 
            name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={20} 
            color={colors.textSub} 
          />
        </View>
      </TouchableOpacity>

      {/* 🚀 Conteúdo Expansível */}
      {isExpanded && (
        totalExpense > 0 ? (
          // Tem gastos: Mostra o gráfico e o botão
          <View>
            <View style={styles.content}>
              <View style={styles.chartWrapper}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                  <G rotation="-90" origin={`${center}, ${center}`}>
                    <Circle 
                      cx={center} cy={center} r={radius} 
                      stroke={isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'} 
                      strokeWidth={strokeWidth} fill="transparent" 
                    />
                    {chartSlices.map((slice) => (
                      <Circle 
                        key={slice.id} cx={center} cy={center} r={radius} 
                        stroke={slice.color} strokeWidth={strokeWidth} 
                        strokeDasharray={slice.strokeDasharray} 
                        strokeDashoffset={slice.strokeDashoffset} 
                        strokeLinecap="round" fill="transparent" 
                      />
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
        ) : (
          // Sem gastos: Mostra uma mensagem amigável de vazio
          <View style={styles.emptyStateContainer}>
             <MaterialIcons name="insert-chart-outlined" size={32} color={colors.border} style={{ marginBottom: 8 }} />
             <Text style={[styles.emptyStateText, { color: colors.textSub }]}>Nenhum gasto registrado neste mês.</Text>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 14, padding: 16, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, // Margem reduzida para ficar melhor recolhido
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 14, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  monthText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  content: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  chartWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  
  centerTextContainer: { position: 'absolute', alignItems: 'center', width: 64 },
  centerTextValue: { fontSize: 14, fontWeight: '900', textAlign: 'center' },
  centerTextLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', opacity: 0.6 },
  
  legendContainer: { flex: 1, marginLeft: 20, gap: 12 },
  legendItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendLabelRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  legendLabel: { fontSize: 12, fontWeight: '700' },

  legendValuesContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendValue: { fontSize: 12, fontWeight: '800' },
  legendPercentage: { fontSize: 10, fontWeight: '600', opacity: 0.7 },
  
  button: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 12, fontWeight: '700', marginRight: 4 },

  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  emptyStateText: { fontSize: 12, fontWeight: '600' }
});