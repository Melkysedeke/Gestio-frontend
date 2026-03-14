import React from 'react';
import { 
  View, Text, Modal, StyleSheet, TouchableOpacity, 
  TouchableWithoutFeedback, Dimensions 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';

// 🚀 Importando utilitário de haptics
import { triggerHaptic, triggerSelectionHaptic } from '@/src/utils/haptics';

export type SheetContext = 'index' | 'transactions' | 'debts' | 'goals';

interface Props {
  visible: boolean;
  context: SheetContext; 
  onClose: () => void;
}

const { width } = Dimensions.get('window');
const BUTTON_WIDTH = (width - 40 - 12) / 2; 

export default function ActionSheet({ visible, context, onClose }: Props) {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();

  const handleNavigate = (route: string) => {
    triggerSelectionHaptic(); // 🚀 Feedback na hora de escolher a ação
    onClose();
    
    // Pequeno atraso para a animação do modal não engasgar a navegação
    setTimeout(() => {
        router.push(route as any);
    }, 200);
  };

  const handleClose = () => {
    triggerHaptic(); // 🚀 Feedback ao fechar/cancelar
    onClose();
  };

  const getTitle = () => {
    switch (context) {
        case 'debts': return 'Nova Pendência';
        case 'goals': return 'Novo Objetivo';
        case 'transactions': return 'Nova Transação';
        default: return 'O que deseja adicionar?';
    }
  };

  const buttonStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border
  };

  // --- COMPONENTES DOS BOTÕES ---

  const TransactionButtons = () => (
    <>
      <TouchableOpacity 
        style={[styles.squareButton, buttonStyle]} 
        onPress={() => handleNavigate('/AddTransaction?type=expense')}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(250, 98, 56, 0.15)' : '#fef2f2' }]}>
          <MaterialIcons name="money-off" size={28} color="#fa6238" />
        </View>
        <Text style={[styles.actionLabel, { color: colors.text }]}>Despesa</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.squareButton, buttonStyle]} 
        onPress={() => handleNavigate('/AddTransaction?type=income')}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(11, 218, 91, 0.15)' : '#ecfdf5' }]}>
          <MaterialIcons name="attach-money" size={28} color="#0bda5b" />
        </View>
        <Text style={[styles.actionLabel, { color: colors.text }]}>Receita</Text>
      </TouchableOpacity>
    </>
  );

  const DebtButtons = () => (
    <>
      <TouchableOpacity 
        style={[styles.squareButton, buttonStyle]} 
        onPress={() => handleNavigate('/AddDebt?type=debt')}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed' }]}>
          <MaterialIcons name="remove-circle-outline" size={28} color="#ea580c" />
        </View>
        <Text style={[styles.actionLabel, { color: colors.text }]}>Dívida</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.squareButton, buttonStyle]} 
        onPress={() => handleNavigate('/AddDebt?type=loan')}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(23, 115, 207, 0.15)' : '#eff6ff' }]}>
          <MaterialIcons name="add-circle-outline" size={28} color="#1773cf" />
        </View>
        <Text style={[styles.actionLabel, { color: colors.text }]}>Empréstimo</Text>
      </TouchableOpacity>
    </>
  );

  const GoalButton = () => (
    // 🚀 Corrigido o erro de sintaxe do JSX no retorno do botão
    <TouchableOpacity 
        style={[styles.fullWidthButton, buttonStyle]} 
        onPress={() => handleNavigate('/AddGoal')} 
        activeOpacity={0.7}
    >
      <View style={[styles.iconBoxSmall, { backgroundColor: isDark ? 'rgba(217, 70, 239, 0.15)' : '#fdf4ff' }]}>
          <MaterialIcons name="flag" size={24} color="#d946ef" />
      </View>
      <Text style={[styles.actionLabelRow, { color: colors.text }]}>Criar Novo Objetivo</Text>
      <MaterialIcons name="chevron-right" size={20} color={colors.textSub} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide" // Slide dá uma sensação nativa melhor para Bottom Sheets
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[
                styles.sheet, 
                { 
                  backgroundColor: colors.card,
                  paddingBottom: Math.max(insets.bottom + 20, 32)
                }
              ]}>
              
              <View style={styles.handleContainer}>
                  <View style={[styles.handle, { backgroundColor: colors.border }]} />
              </View>
              
              <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>

              <View style={styles.grid}>
                {context === 'index' && (
                  <>
                    <TransactionButtons />
                    <DebtButtons />
                    <GoalButton /> 
                  </>
                )}

                {context === 'transactions' && <TransactionButtons />}
                {context === 'debts' && <DebtButtons />}
                {context === 'goals' && <GoalButton />}
              </View>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 32, // 🚀 Aumentado para combinar com os novos modais
    borderTopRightRadius: 32,
    paddingHorizontal: 20, 
    paddingTop: 10,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  handleContainer: { alignItems: 'center', marginBottom: 20, marginTop: 6 },
  handle: {
    width: 48, // 🚀 Aumentado para facilitar visualmente o arraste
    height: 5, 
    borderRadius: 3, 
  },
  title: {
    fontSize: 18, 
    fontWeight: '800', 
    marginBottom: 24, 
    textAlign: 'center',
    letterSpacing: -0.3
  },
  grid: {
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    gap: 12
  },
  squareButton: {
    width: BUTTON_WIDTH,
    borderWidth: 1.5, // 🚀 Borda ligeiramente mais visível
    borderRadius: 24, 
    paddingVertical: 24, 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4,
  },
  fullWidthButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5, 
    borderRadius: 20, 
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4,
  },
  iconBox: {
    width: 56, // 🚀 Maior destaque para os ícones principais
    height: 56, 
    borderRadius: 28, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 12
  },
  iconBoxSmall: {
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 14
  },
  actionLabel: {
    fontSize: 14, 
    fontWeight: '700', 
    letterSpacing: 0.3
  },
  actionLabelRow: {
    fontSize: 15, 
    fontWeight: '700', 
    letterSpacing: 0.3
  }
});