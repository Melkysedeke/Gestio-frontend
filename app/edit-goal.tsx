import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Banco de Dados e Models
import { database } from '../src/database';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor'; 
import Goal from '../src/database/models/Goal';
import Wallet from '../src/database/models/Wallet';

export default function EditGoalScreen() {
  const params = useLocalSearchParams();
  const { colors, isDark } = useThemeColor(); 
  
  const THEME_COLOR = colors.primary;

  const [goalRecord, setGoalRecord] = useState<Goal | null>(null);
  const [name, setName] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [date, setDate] = useState(new Date());
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true); 
  const [saving, setSaving] = useState(false);  

  useEffect(() => {
    async function fetchGoal() {
      if (!params.id) return;
      
      try {
        const goal = await database.get<Goal>('goals').find(params.id as string);
        setGoalRecord(goal);
        setName(goal.name);
        
        const targetAmount = Number(goal.targetAmount || (goal as any)._raw.target_amount || 0);
        setAmountRaw((targetAmount * 100).toFixed(0)); 
        
        const deadline = Number(goal.deadline || (goal as any)._raw.deadline);
        setDate(new Date(deadline));

      } catch {
        Alert.alert('Erro', 'Objetivo não encontrado.');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    fetchGoal();
  }, [params.id]);

  const handleAmountChange = (text: string) => {
    const onlyNumbers = text.replace(/\D/g, "");
    setAmountRaw(onlyNumbers);
  };

  const getFormattedAmount = () => {
    if (!amountRaw) return "0,00";
    const value = parseInt(amountRaw) / 100;
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  async function handleUpdate() {
    const finalAmount = amountRaw ? parseInt(amountRaw) / 100 : 0;
    
    if (!name.trim() || finalAmount <= 0) {
      return Alert.alert('Atenção', 'Informe um nome e um valor meta válido.');
    }

    if (!goalRecord) return;

    setSaving(true);
    try {
      await database.write(async () => {
        await goalRecord.update((g: any) => {
          g.name = name.trim();
          g.targetAmount = finalAmount;
          g.deadline = date;
        });
      });
      router.back();
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o objetivo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert(
      'Excluir Objetivo',
      'Tem certeza? O saldo acumulado neste objetivo será devolvido para sua carteira atual.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir e Estornar', 
          style: 'destructive', 
          onPress: async () => {
            if (!goalRecord) return;
            setSaving(true);
            try {
              await database.write(async () => {
                const currentAmount = Number(goalRecord.currentAmount || (goalRecord as any)._raw.current_amount || 0);
                
                if (currentAmount > 0) {
                  const walletId = (goalRecord as any)._raw.wallet_id;
                  const wallet = await database.get<Wallet>('wallets').find(walletId);
                  
                  await wallet.update((w: any) => {
                    w.balance += currentAmount;
                  });

                  await database.get('transactions').create((t: any) => {
                    t.amount = currentAmount;
                    t.type = 'income';
                    t.description = `Estorno de exclusão: ${goalRecord.name}`;
                    t.categoryName = 'Estornos';
                    t.categoryIcon = 'settings-backup-restore';
                    t._raw.wallet_id = walletId;
                    t.transactionDate = Date.now();
                  });
                }
                await goalRecord.markAsDeleted();
              });
              router.back();
            } catch {
              Alert.alert('Erro', 'Falha ao excluir o objetivo.');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar backgroundColor={THEME_COLOR} barStyle="light-content" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: THEME_COLOR }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerAction}>
              <MaterialIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Objetivo</Text>
            <TouchableOpacity onPress={handleDelete} style={styles.headerAction}>
              <MaterialIcons name="delete-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.amountInput}
              value={getFormattedAmount()}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
          </View>

          <TouchableOpacity 
            style={styles.headerDateButton} 
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="flag" size={14} color="#FFF" />
            <Text style={styles.headerDateText}>
              Meta para: {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* FORMULÁRIO */}
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textSub }]}>Nome do Objetivo</Text>
          <TextInput 
            style={[
              styles.inputCompact, 
              { 
                backgroundColor: isDark ? colors.background : '#F1F5F9', 
                borderColor: colors.border, 
                color: colors.text 
              }
            ]} 
            value={name} 
            onChangeText={setName} 
            placeholder="Ex: Viagem para Europa"
            placeholderTextColor={colors.textSub}
          />

          {showDatePicker && (
            <DateTimePicker 
              value={date} 
              mode="date" 
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange} 
            />
          )}

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: THEME_COLOR }]} 
            onPress={handleUpdate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  scrollContent: { 
    flexGrow: 1 
  },
  header: { 
    paddingTop: 60, 
    paddingBottom: 25, 
    paddingHorizontal: 20, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    alignItems: 'center' 
  },
  headerTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: '100%', 
    marginBottom: 10 
  },
  headerAction: {
    padding: 4
  },
  headerTitle: { 
    fontSize: 16, 
    color: '#FFF', 
    fontWeight: 'bold' 
  },
  amountContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 15 
  },
  currencySymbol: { 
    fontSize: 24, 
    color: 'rgba(255,255,255,0.8)', 
    marginRight: 5 
  },
  amountInput: { 
    fontSize: 42, 
    fontWeight: 'bold', 
    color: '#FFF', 
    minWidth: 120, 
    textAlign: 'center' 
  },
  headerDateButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    gap: 6 
  },
  headerDateText: { 
    color: '#FFF', 
    fontSize: 13, 
    fontWeight: '600' 
  },
  form: { 
    padding: 24 
  },
  label: { 
    fontSize: 13, 
    fontWeight: '600', 
    marginBottom: 6, 
    marginTop: 15 
  },
  inputCompact: { 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16 
  },
  saveButton: { 
    marginTop: 35, 
    paddingVertical: 16, 
    borderRadius: 15, 
    alignItems: 'center', 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  saveButtonText: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
});