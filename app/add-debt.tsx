import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Banco de Dados e Stores
import { database } from '../src/database';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function AddDebtScreen() {
  const params = useLocalSearchParams();
  const type = (params.type as 'debt' | 'loan') || 'debt';
  
  const user = useAuthStore(state => state.user);
  const { colors, isDark } = useThemeColor();
  
  const [title, setTitle] = useState('');
  const [amountRaw, setAmountRaw] = useState(''); 
  const [name, setName] = useState(''); 
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDebt = type === 'debt';
  const themeColor = isDebt ? colors.danger : colors.primary; 
  const displayTitle = isDebt ? 'Nova Dívida' : 'Novo Empréstimo';
  const nameLabel = isDebt ? 'Devo para quem?' : 'Quem me deve?';

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

  async function handleSave() {
    const finalAmount = amountRaw ? parseInt(amountRaw) / 100 : 0;
    const walletId = user?.settings?.last_opened_wallet;
    
    if ((!title.trim() && !name.trim()) || finalAmount <= 0) {
      return Alert.alert('Atenção', 'Informe um valor válido e uma descrição.');
    }

    if (!walletId) {
      return Alert.alert('Erro', 'Selecione uma carteira ativa antes de salvar.');
    }

    setLoading(true);
    try {
      const dbType = isDebt ? 'payable' : 'receivable';

      await database.write(async () => {
        await database.get('debts').create((d: any) => {
          d._raw.wallet_id = walletId;
          d.type = dbType;
          d.title = title.trim() || (isDebt ? 'Dívida' : 'Empréstimo');
          d.entityName = name.trim();
          d.amount = finalAmount;
          d.totalPaid = 0;
          d.isPaid = false;
          d.dueDate = date;
        });
      });

      router.back();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao salvar no banco local.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar backgroundColor={themeColor} barStyle="light-content" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={[styles.header, { backgroundColor: themeColor }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerAction}>
              <MaterialIcons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{displayTitle}</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.amountInput}
              value={getFormattedAmount()}
              onChangeText={handleAmountChange}
              placeholder="0,00"
              placeholderTextColor="rgba(255,255,255,0.6)"
              keyboardType="numeric"
              autoFocus
            />
          </View>

          <TouchableOpacity 
            style={styles.headerDateButton} 
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="event" size={14} color="#FFF" />
            <Text style={styles.headerDateText}>
              Vencimento: {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textSub }]}>Título (O que é?)</Text>
          <TextInput 
            style={[
              styles.inputCompact, 
              { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }
            ]} 
            value={title} 
            onChangeText={setTitle} 
            placeholder="Ex: Aluguel, Empréstimo do Banco"
            placeholderTextColor={colors.textSub}
          />

          <Text style={[styles.label, { color: colors.textSub }]}>{nameLabel}</Text>
          <TextInput 
            style={[
              styles.inputCompact, 
              { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }
            ]} 
            value={name} 
            onChangeText={setName} 
            placeholder="Nome da pessoa ou empresa" 
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
            style={[styles.saveButton, { backgroundColor: themeColor }]} 
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Confirmar</Text>
            )}
          </TouchableOpacity>
          
          <Text style={[styles.infoText, { color: colors.textSub }]}>
            Ao registrar pagamentos na tela de dívidas, o saldo da sua carteira será atualizado e uma transação será gerada automaticamente.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1
  },
  header: { 
    paddingTop: Platform.OS === 'ios' ? 60 : 50, 
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
  headerPlaceholder: {
    width: 32
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
  infoText: { 
    textAlign: 'center', 
    fontSize: 11, 
    marginTop: 20, 
    paddingHorizontal: 20, 
    lineHeight: 16 
  }
});