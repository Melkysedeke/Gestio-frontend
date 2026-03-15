import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// 🚀 Hooks de Estilo e Estado
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/authStore'; 

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
  type, 
  title, 
  description, 
  totalValue, 
  remainingValue, 
  dueDate, 
  createdAt, 
  onPay 
}: DebtItemProps) {
  const { colors, isDark } = useThemeColor();
  
  // 🚀 Obtém o estado de visibilidade e haptics do seu Store
  const hideValues = useAuthStore(state => state.hideValues);
  const hapticsEnabled = useAuthStore(state => state.hapticsEnabled);

  // Tratamento de Datas
  const safeDueDate = dueDate ? new Date(dueDate) : new Date();
  const safeCreatedAt = createdAt ? new Date(createdAt) : new Date();

  // Lógica de Progresso
  const paidValue = totalValue - remainingValue;
  const progressPercentage = Math.max(0, Math.min(100, (paidValue / totalValue) * 100));
  
  const isDebt = type === 'debt';
  const mainColor = isDebt ? '#f97316' : '#3b82f6';
  const bgIconColor = isDark ? `${mainColor}20` : `${mainColor}15`; 

  // 🚀 Formatador que respeita o estado do Store
  const formatValue = (val: number) => {
    if (hideValues) return 'R$ •••••';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  // Lógica de Vencimento
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.ceil((safeDueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  
  let badgeText = `Vence ${formatShortDate(safeDueDate)}`;
  let badgeColor = colors.textSub;

  if (remainingValue > 0) {
    if (daysUntilDue < 0) {
      badgeText = 'Atrasado';
      badgeColor = '#ef4444';
    } else if (daysUntilDue <= 5) {
      badgeText = daysUntilDue === 0 ? 'Vence hoje' : `Em ${daysUntilDue} dias`;
      badgeColor = '#f59e0b';
    }
  } else {
    badgeText = 'Liquidado';
    badgeColor = '#10b981';
  }

  const handlePress = () => {
    // 🚀 Respeita a configuração de haptics do usuário
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPay();
  };

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
      
      {/* CABEÇALHO */}
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

      {/* CORPO: VALORES E PROGRESSO */}
      <View style={styles.body}>
        <View style={styles.valueRow}>
          <Text style={[styles.remainingValue, { color: colors.text }]}>
            {formatValue(remainingValue)}
          </Text>
          <Text style={[styles.totalValue, { color: colors.textSub }]}>
             / {formatValue(totalValue)}
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
            {!hideValues ? `${progressPercentage.toFixed(0)}%` : '••%'}
          </Text>
        </View>
      </View>

      {/* RODAPÉ */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.createdAt, { color: colors.textSub }]}>
          Criado {formatShortDate(safeCreatedAt)}
        </Text>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            { backgroundColor: remainingValue <= 0 ? (isDark ? '#1e293b' : '#f1f5f9') : mainColor }
          ]} 
          activeOpacity={0.7}
          onPress={handlePress}
          disabled={remainingValue <= 0}
        >
          {remainingValue <= 0 ? (
            <Text style={[styles.buttonText, { color: colors.textSub, opacity: 0.6 }]}>Quitado</Text>
          ) : (
            <>
              <FontAwesome5 name="hand-holding-usd" size={10} color="#fff" style={{ marginRight: 6 }} />
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
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 2,
  },
  header: {
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
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
    fontSize: 16,
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
    height: 4,
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
    width: 30,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  createdAt: {
    fontSize: 10,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});