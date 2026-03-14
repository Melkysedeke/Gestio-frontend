import React from 'react';
import { 
  View, Text, Modal, StyleSheet, TouchableOpacity, 
  TouchableWithoutFeedback, Platform, Dimensions 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';

import { triggerHaptic, triggerSelectionHaptic } from '@/src/utils/haptics';

export type SheetContext = 'index' | 'transactions' | 'debts' | 'goals';

interface Props {
  visible: boolean;
  context: SheetContext; 
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export default function ActionSheet({ visible, context, onClose }: Props) {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();

  const handleNavigate = (route: string) => {
    triggerSelectionHaptic();
    onClose();
    setTimeout(() => {
        router.push(route as any);
    }, Platform.OS === 'ios' ? 10 : 150);
  };

  const handleClose = () => {
    triggerHaptic();
    onClose();
  };

  const ActionItem = ({ icon, label, color, route, bg }: any) => (
    <TouchableOpacity 
      style={styles.actionItem} 
      onPress={() => handleNavigate(route)}
      activeOpacity={0.6}
    >
      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color: colors.text }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={handleClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <View style={[
          styles.sheet, 
          { 
            backgroundColor: colors.card, 
            paddingBottom: Math.max(insets.bottom + 20, 32) // Aumentado para não colar na TabBar
          }
        ]}>
          <View style={styles.handleBar}><View style={[styles.handle, { backgroundColor: colors.border }]} /></View>
          
          {/* Trocamos ScrollView por uma View com distribuição Space-Around */}
          <View style={[
            styles.compactContainer,
            context !== 'index' && { justifyContent: 'center', gap: 20 }
          ]}>
            {(context === 'index' || context === 'transactions') && (
              <ActionItem icon="money-off" label="Despesa" color="#fa6238" bg={isDark ? 'rgba(250, 98, 56, 0.12)' : '#fef2f2'} route="/AddTransaction?type=expense" />
            )}
            {(context === 'index' || context === 'transactions') && (
              <ActionItem icon="attach-money" label="Receita" color="#0bda5b" bg={isDark ? 'rgba(11, 218, 91, 0.12)' : '#ecfdf5'} route="/AddTransaction?type=income" />
            )}
            {(context === 'index' || context === 'debts') && (
              <ActionItem icon="remove-circle-outline" label="Dívida" color="#ea580c" bg={isDark ? 'rgba(234, 88, 12, 0.12)' : '#fff7ed'} route="/AddDebt?type=debt" />
            )}
            {(context === 'index' || context === 'debts') && (
              <ActionItem icon="add-circle-outline" label="Empréstimo" color="#1773cf" bg={isDark ? 'rgba(23, 115, 207, 0.12)' : '#eff6ff'} route="/AddDebt?type=loan" />
            )}
            {(context === 'index' || context === 'goals') && (
              <ActionItem icon="flag" label="Objetivo" color="#d946ef" bg={isDark ? 'rgba(217, 70, 239, 0.12)' : '#fdf4ff'} route="/AddGoal" />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 12 },
  handleBar: { alignItems: 'center', marginBottom: 20 },
  handle: { width: 36, height: 4, borderRadius: 2, opacity: 0.5 },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly', // 🚀 Distribui os 5 itens perfeitamente
    width: '100%',
    paddingHorizontal: 8
  },
  actionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: (width - 32) / 5, // 🚀 Divide a tela exatamente por 5
  },
  iconCircle: {
    width: 48, // 🚀 Reduzido para não estourar
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 9, 
    fontWeight: '800',
    textTransform: 'uppercase',
    textAlign: 'center'
  }
});