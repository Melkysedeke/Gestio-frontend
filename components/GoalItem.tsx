import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

// Hooks e Stores
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/authStore';
import Goal from '@/src/database/models/Goal';

interface GoalItemProps {
  item: Goal;
  onDeposit: (goal: Goal) => void;
  onWithdraw: (goal: Goal) => void;
}

export default function GoalItem({ item, onDeposit, onWithdraw }: GoalItemProps) {
  const { colors, isDark } = useThemeColor();
  const { hideValues, hapticsEnabled } = useAuthStore();

  const current = Number(item.currentAmount || (item as any)._raw.current_amount || 0);
  const target = Number(item.targetAmount || (item as any)._raw.target_amount || 0);
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isCompleted = progress >= 100;

  const deadline = new Date(item.deadline || (item as any)._raw.deadline);

  const THEME_COLOR = colors.primary;
  const SUCCESS_COLOR = colors.success;
  const DANGER_COLOR = colors.danger;
  const iconBgColor = isDark ? 'rgba(23, 115, 207, 0.12)' : '#f0f9ff';

  const formatCurrency = (val: number) => {
    if (hideValues) return "R$ •••";
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const triggerHaptic = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={() => {
          triggerHaptic();
          router.push({ pathname: '/EditGoal', params: { id: item.id } });
        }}
        style={styles.mainTouchable}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
            <MaterialIcons name="savings" size={18} color={THEME_COLOR} />
          </View>
          
          <View style={styles.infoContent}>
            <View style={styles.titleRow}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.deadlineText, { color: colors.textSub }]}>
                {deadline.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
              </Text>
            </View>

            <View style={styles.amountRow}>
              <Text style={[styles.currentValue, { color: colors.text }]}>
                {formatCurrency(current)}
              </Text>
              <Text style={[styles.targetValue, { color: colors.textSub }]}>
                / {formatCurrency(target)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#2d3748' : '#e2e8f0' }]}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${progress}%`, backgroundColor: isCompleted ? SUCCESS_COLOR : THEME_COLOR }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: isCompleted ? SUCCESS_COLOR : THEME_COLOR }]}>
             {hideValues ? '••%' : `${progress.toFixed(0)}%`}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => { triggerHaptic(); onWithdraw(item); }}
        >
          <MaterialIcons name="vertical-align-bottom" size={14} color={DANGER_COLOR} />
          <Text style={[styles.actionText, { color: DANGER_COLOR }]}>Resgatar</Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => { triggerHaptic(); onDeposit(item); }}
        >
          <MaterialIcons name="vertical-align-top" size={14} color={THEME_COLOR} />
          <Text style={[styles.actionText, { color: THEME_COLOR }]}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginVertical: 3,
    borderWidth: 1,
    overflow: 'hidden', // Importante para manter o design limpo
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1 }
    })
  },
  mainTouchable: {
    padding: 12,
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: 10,
    gap: 12 
  },
  iconBox: { 
    width: 32, 
    height: 32, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  infoContent: { flex: 1 },
  titleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  cardTitle: { 
    fontSize: 13, 
    fontWeight: '600',
    flex: 1,
    marginRight: 8
  },
  deadlineText: { 
    fontSize: 10, 
    textTransform: 'uppercase',
    fontWeight: '500'
  },
  amountRow: { 
    flexDirection: 'row', 
    alignItems: 'baseline', 
    marginTop: 2,
    gap: 4
  },
  currentValue: { 
    fontSize: 15, 
    fontWeight: '800' 
  },
  targetValue: { 
    fontSize: 11, 
    fontWeight: '400' 
  },
  progressSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  progressBarBg: { 
    flex: 1,
    height: 6, 
    borderRadius: 3, 
    overflow: 'hidden' 
  },
  progressBarFill: { 
    height: '100%', 
    borderRadius: 3 
  },
  progressText: { 
    fontSize: 10, 
    fontWeight: '900',
    width: 30,
    textAlign: 'right'
  },
  cardActions: { 
    flexDirection: 'row', 
    borderTopWidth: 1,
    height: 38,
    alignItems: 'center'
  },
  actionButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100%',
    gap: 6 
  },
  divider: {
    width: 1,
    height: '50%',
  },
  actionText: { 
    fontSize: 11, 
    fontWeight: '700' 
  },
});