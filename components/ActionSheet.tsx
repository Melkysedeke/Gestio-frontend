import React from 'react';
import { 
  View, Text, Modal, StyleSheet, TouchableOpacity, 
  TouchableWithoutFeedback 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Define quais contextos existem
type SheetContext = 'index' | 'transactions' | 'debts' | 'goals';

interface Props {
  visible: boolean;
  context: SheetContext; // Recebe o contexto atual
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export default function ActionSheet({ visible, context, onClose, onNavigate }: Props) {
  
  const handlePress = (route: string) => {
    onClose();
    // Pequeno delay para a modal fechar suavemente antes de navegar
    setTimeout(() => onNavigate(route), 300);
  };

  // Lógica para decidir o título
  const getTitle = () => {
    if (context === 'debts') return 'Nova Pendência';
    if (context === 'goals') return 'Novo Objetivo';
    if (context === 'index') return 'O que deseja adicionar?';
    return 'Nova Transação';
  };

  // Renderiza botões de Transação (Reutilizável)
  const renderTransactionButtons = () => (
    <>
      <TouchableOpacity 
        style={styles.actionButton} 
        onPress={() => handlePress('/add-transaction?type=expense')}
      >
        <View style={[styles.iconBox, { backgroundColor: '#fef2f2' }]}>
          <MaterialIcons name="money-off" size={28} color="#fa6238" />
        </View>
        <Text style={styles.actionLabel}>Despesa</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.actionButton} 
        onPress={() => handlePress('/add-transaction?type=income')}
      >
        <View style={[styles.iconBox, { backgroundColor: '#ecfdf5' }]}>
          <MaterialIcons name="attach-money" size={28} color="#0bda5b" />
        </View>
        <Text style={styles.actionLabel}>Receita</Text>
      </TouchableOpacity>
    </>
  );

  // Renderiza botões de Dívida/Empréstimo (Reutilizável)
  const renderDebtLoanButtons = () => (
    <>
      <TouchableOpacity 
        style={styles.actionButton} 
        onPress={() => handlePress('/add-debt-loan?type=debt')}
      >
        <View style={[styles.iconBox, { backgroundColor: '#fff7ed' }]}>
          <MaterialIcons name="remove-circle-outline" size={28} color="#ea580c" />
        </View>
        <Text style={styles.actionLabel}>Nova Dívida</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.actionButton} 
        onPress={() => handlePress('/add-debt-loan?type=loan')}
      >
        <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
          <MaterialIcons name="add-circle-outline" size={28} color="#1773cf" />
        </View>
        <Text style={styles.actionLabel}>Novo Empréstimo</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              
              <View style={styles.handle} />
              
              <Text style={styles.title}>{getTitle()}</Text>

              <View style={styles.grid}>
                
                {/* LÓGICA DE EXIBIÇÃO:
                    1. Index (Home): Mostra TUDO (4 botões)
                    2. Transactions: Só Despesa/Receita
                    3. Debts: Só Dívida/Empréstimo
                    4. Goals: Só Objetivo
                */}

                {context === 'index' && (
                  <>
                    {renderTransactionButtons()}
                    {renderDebtLoanButtons()}
                  </>
                )}

                {context === 'transactions' && renderTransactionButtons()}

                {context === 'debts' && renderDebtLoanButtons()}

                {context === 'goals' && (
                  <TouchableOpacity 
                    style={[styles.actionButton, { width: '100%' }]} 
                    onPress={() => handlePress('/add-goal')}
                  >
                    <View style={[styles.iconBox, { backgroundColor: '#fdf4ff' }]}>
                      <MaterialIcons name="flag" size={28} color="#d946ef" />
                    </View>
                    <Text style={styles.actionLabel}>Criar Novo Objetivo</Text>
                  </TouchableOpacity>
                )}

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
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, elevation: 20,
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 24
  },
  title: {
    fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 24, textAlign: 'center'
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16
  },
  // Ajuste dinâmico: Se tiver 4 botões (Home), usa ~47%. Se tiver 2, também usa 47%.
  actionButton: {
    width: '47%', 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#f1f5f9',
    borderRadius: 16, 
    padding: 16, 
    alignItems: 'center', 
    gap: 8, 
    elevation: 2, // Sombra leve
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  iconBox: {
    width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4
  },
  actionLabel: {
    fontSize: 13, fontWeight: '600', color: '#334155'
  }
});