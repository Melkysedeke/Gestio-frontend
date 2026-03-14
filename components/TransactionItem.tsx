import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import Transaction from '../src/database/models/Transaction';

interface Props {
  item: Transaction;
  hideValues: boolean;
  formatCurrency: (val: number) => string;
}

export default function TransactionItem({ item, hideValues, formatCurrency }: Props) {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();

  const isIncome = item.type === 'income';
  const itemColor = isIncome ? colors.success : colors.danger;
  const iconBgColor = isIncome 
    ? (isDark ? 'rgba(11, 218, 91, 0.1)' : '#ecfdf5') 
    : (isDark ? 'rgba(250, 98, 56, 0.1)' : '#fef2f2');
  
  const rawItem = (item as any)._raw;
  const isLinked = !!(rawItem?.debt_id || rawItem?.goal_id);
  const linkedBadgeBg = isDark ? '#334155' : '#e2e8f0';

  const dateStr = new Date(item.transactionDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/EditTransaction', params: { id: item.id } })}
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.leftSide}>
        <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
          <MaterialIcons name={(item.categoryIcon || 'attach-money') as any} size={20} color={itemColor} />
        </View>
        
        <View style={styles.textContainer}> 
           <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                  {item.categoryName || 'Geral'}
              </Text>
              {isLinked && (
                <View style={[styles.badge, { backgroundColor: linkedBadgeBg }]}>
                  <MaterialIcons name="lock" size={8} color={colors.textSub} />
                  <Text style={[styles.badgeText, { color: colors.textSub }]}>Vinculado</Text>
                </View>
              )}
          </View>
          <Text style={[styles.subtitle, { color: colors.textSub }]} numberOfLines={1}>
              {dateStr} {item.description ? `• ${item.description}` : ''}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.amount, { color: itemColor }]}>
        {isIncome ? '+' : '-'} {hideValues ? '***' : formatCurrency(item.amount)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  leftSide: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  textContainer: { flex: 1, marginRight: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  title: { fontSize: 15, fontWeight: '700' }, 
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, gap: 2 },
  badgeText: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  subtitle: { fontSize: 12 },
  amount: { fontSize: 16, fontWeight: '900', marginLeft: 4 },
});