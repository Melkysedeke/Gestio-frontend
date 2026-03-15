import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

interface DebtItemProps {
  type: 'debt' | 'loan';
  title: string;
  description?: string;
  totalValue: number;
  remainingValue: number;
  dueDate: Date | string | number;
  createdAt: Date | string | number;
  onPay: () => void;
}

export default function DebtItem({ 
  type, title, description, totalValue, remainingValue, dueDate, createdAt, onPay 
}: DebtItemProps) {
  const { colors, isDark } = useThemeColor();

  const safeDueDate = dueDate ? new Date(dueDate) : new Date();
  const safeCreatedAt = createdAt ? new Date(createdAt) : new Date();

  const paidValue = totalValue - remainingValue;
  const progressPercentage = Math.max(0, Math.min(100, (paidValue / totalValue) * 100));
  
  const isDebt = type === 'debt';
  const mainColor = isDebt ? '#f97316' : '#3b82f6';
  const bgIconColor = isDark ? `${mainColor}20` : `${mainColor}15`; 

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatShortDate = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  const today = new Date();
  const daysUntilDue = Math.ceil((safeDueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  let badgeText = `Vence ${formatShortDate(safeDueDate)}`;
  let badgeColor = colors.textSub;

  if (daysUntilDue < 0 && remainingValue > 0) {
    badgeText = 'Atrasado';
    badgeColor = '#ef4444';
  } else if (daysUntilDue <= 5 && remainingValue > 0) {
    badgeText = `${daysUntilDue} dias`;
    badgeColor = '#f59e0b';
  }

  return (
    <View style={[styles.card, { 
      backgroundColor: colors.card, 
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.2 : 0.05,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    }]}>
      
      {/* CABEÇALHO COMPACTO */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: bgIconColor }]}>
            <MaterialIcons 
              name={isDebt ? 'money-off' : 'account-balance-wallet'} 
              size={16} 
              color={mainColor} 
            />
          </View>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
              <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
            </View>
            <Text style={[styles.description, { color: colors.textSub }]} numberOfLines={1}>
              {description || 'Particular'}
            </Text>
          </View>
        </View>
      </View>

      {/* CORPO: VALORES E PROGRESSO MESCLADOS */}
      <View style={styles.body}>
        <View style={styles.valueRow}>
          <Text style={[styles.remainingValue, { color: colors.text }]}>
            {formatCurrency(remainingValue)}
          </Text>
          <Text style={[styles.totalValue, { color: colors.textSub }]}>
             / {formatCurrency(totalValue)}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${progressPercentage}%`, backgroundColor: mainColor }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSub }]}>
            {progressPercentage.toFixed(0)}%
          </Text>
        </View>
      </View>

      {/* RODAPÉ ULTRA COMPACTO */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.createdAt, { color: colors.textSub }]}>
          Criado {formatShortDate(safeCreatedAt)}
        </Text>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: remainingValue <= 0 ? (isDark ? '#334155' : '#e2e8f0') : mainColor }]} 
          activeOpacity={0.8}
          onPress={onPay}
          disabled={remainingValue <= 0}
        >
          {remainingValue <= 0 ? (
            <Text style={[styles.buttonText, { color: colors.textSub }]}>Quitado</Text>
          ) : (
            <>
              <FontAwesome5 name="hand-holding-usd" size={10} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.buttonText}>Abater</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14, // Menos arredondado
    borderWidth: 1,
    padding: 12, // Padding ainda menor
    marginVertical: 5,
  },
  header: {
    marginBottom: 10, // Espaço bem reduzido
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 32, // Ícone mini
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 6,
  },
  description: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.8,
  },
  body: {
    marginBottom: 10, 
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  remainingValue: {
    fontSize: 16, // Fonte menor, mas ainda em destaque
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  totalValue: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    height: 4, // Barra super fina
    borderRadius: 2,
    flex: 1,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    width: 28, // Fixa a largura para alinhar
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8, // Padding mínimo no footer
  },
  createdAt: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.7,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, // Botão bem estreito
    paddingVertical: 6, // Botão mais baixo
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 11, // Texto do botão mini
    fontWeight: '700',
  },
});