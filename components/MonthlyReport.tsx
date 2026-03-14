import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ChartData {
  id: string;
  label: string;
  value: number;
  color: string;
}

const MOCK_DATA: ChartData[] = [
  { id: '1', label: 'Alimentação', value: 45, color: '#3b82f6' },
  { id: '2', label: 'Transporte', value: 30, color: '#10b981' },
  { id: '3', label: 'Lazer', value: 25, color: '#f97316' },
];

export default function MonthlyReport() {
  const { colors, isDark } = useThemeColor();
  
  // Configurações do SVG
  const size = 110; // Reduzi levemente para compactar
  const strokeWidth = 12;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Cálculo total para o centro
  const totalValue = MOCK_DATA.reduce((acc, item) => acc + item.value, 0);

  let currentOffset = 0;
  const chartSlices = MOCK_DATA.map((item) => {
    const percentage = item.value / totalValue;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    
    // Adicionamos o valor ao offset para a próxima fatia
    currentOffset += percentage * circumference;
    
    return { ...item, strokeDasharray, strokeDashoffset };
  });

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.card, 
        borderColor: isDark ? '#2b2f3e' : colors.border 
      }
    ]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialIcons name="insights" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.title, { color: colors.text }]}>Raio-X Mensal</Text>
        </View>
        <Text style={[styles.monthText, { color: colors.textSub }]}>Outubro</Text>
      </View>

      <View style={styles.content}>
        {/* Gráfico de Rosca */}
        <View style={styles.chartWrapper}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <G rotation="-90" origin={`${center}, ${center}`}>
              {/* Trilho de fundo */}
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {chartSlices.map((slice) => (
                <Circle
                  key={slice.id}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              ))}
            </G>
          </Svg>
          <View style={styles.centerTextContainer}>
            <Text style={[styles.centerTextValue, { color: colors.text }]}>{totalValue}%</Text>
            <Text style={[styles.centerTextLabel, { color: colors.textSub }]}>Gasto</Text>
          </View>
        </View>

        {/* Legenda Refinada */}
        <View style={styles.legendContainer}>
          {MOCK_DATA.map((item) => (
            <View key={item.id} style={styles.legendItem}>
              <View style={styles.legendLabelRow}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendLabel, { color: colors.text }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
              <Text style={[styles.legendValue, { color: colors.textSub }]}>{item.value}%</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: colors.border }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>Detalhes da Categoria</Text>
        <MaterialIcons name="chevron-right" size={18} color={colors.textSub} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  monthText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  centerTextValue: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  centerTextLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  legendContainer: {
    flex: 1,
    marginLeft: 20,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  button: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
});