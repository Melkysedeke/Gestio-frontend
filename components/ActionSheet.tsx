import React from 'react';
import { 
  View, Text, Modal, StyleSheet, TouchableOpacity, 
  TouchableWithoutFeedback, Dimensions 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor'; // <--- Hook Importado

// Define quais contextos existem
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
  const { colors, isDark } = useThemeColor(); // <--- Cores Dinâmicas

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
        // @ts-ignore
        router.push(route);
    }, 100);
  };

  const getTitle = () => {
    switch (context) {
        case 'debts': return 'Nova Pendência';
        case 'goals': return 'Novo Objetivo';
        case 'transactions': return 'Nova Transação';
        default: return 'O que deseja adicionar?';
    }
  };

  // --- Helpers de Estilo Dinâmico ---
  const buttonStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border
  };

  // --- COMPONENTES DOS BOTÕES ---

  const TransactionButtons = () => (
    <>
      <TouchableOpacity 
        style={[styles.squareButton, buttonStyle]} 
        onPress={() => handleNavigate('/add-transaction?type=expense')}
      >
        <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(250, 98, 56, 0.15)' : '#fef2f2' }]}>
          <MaterialIcons name="money-off" size={28} color="#fa6238" />
        </View>
        <Text style={[styles.actionLabel, { color: colors.text }]}>Despesa</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.squareButton, buttonStyle]} 
        onPress={() => handleNavigate('/add-transaction?type=income')}
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
        onPress={() => handleNavigate('/add-debt?type=debt')}
      >
        <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed' }]}>
          <MaterialIcons name="remove-circle-outline" size={28} color="#ea580c" />
        </View>
        <Text style={[styles.actionLabel, { color: colors.text }]}>Dívida</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.squareButton, buttonStyle]} 
        onPress={() => handleNavigate('/add-debt?type=loan')}
      >
        <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(23, 115, 207, 0.15)' : '#eff6ff' }]}>
          <MaterialIcons name="add-circle-outline" size={28} color="#1773cf" />
        </View>
        <Text style={[styles.actionLabel, { color: colors.text }]}>Empréstimo</Text>
      </TouchableOpacity>
    </>
  );

  const GoalButton = () => (
    <TouchableOpacity 
        style={[styles.fullWidthButton, buttonStyle]} 
        onPress={() => handleNavigate('/add-goal')} 
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
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: colors.card }]}>
              
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
    // backgroundColor: '#FFF',  <-- Removido, agora é dinâmico
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24,
    paddingHorizontal: 20, 
    paddingBottom: 40,
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
    width: 40, 
    height: 4, 
    // backgroundColor: '#e2e8f0', <-- Removido, agora é dinâmico
    borderRadius: 2, 
  },
  title: {
    fontSize: 18, 
    fontWeight: '800', 
    // color: '#0f172a', <-- Removido
    marginBottom: 24, 
    textAlign: 'center'
  },
  grid: {
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    gap: 12
  },
  
  squareButton: {
    width: BUTTON_WIDTH,
    // backgroundColor: '#fff', <-- Removido
    borderWidth: 1, 
    // borderColor: '#f1f5f9', <-- Removido
    borderRadius: 20, 
    paddingVertical: 20, 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4,
  },
  
  fullWidthButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#fff', <-- Removido
    borderWidth: 1, 
    // borderColor: '#f1f5f9', <-- Removido
    borderRadius: 20, 
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4,
  },

  iconBox: {
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 10
  },
  iconBoxSmall: {
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12
  },

  actionLabel: {
    fontSize: 13, 
    fontWeight: '600', 
    // color: '#334155' <-- Removido
  },
  actionLabelRow: {
    fontSize: 14, 
    fontWeight: '700', 
    // color: '#334155' <-- Removido
  }
});