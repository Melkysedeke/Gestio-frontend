import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../src/stores/authStore';
import api from '../src/services/api';
import { useThemeColor } from '@/hooks/useThemeColor'; // <--- Hook de Tema

export default function AddDebtLoanScreen() {
  const params = useLocalSearchParams();
  const type = (params.type as 'debt' | 'loan') || 'debt';
  
  const user = useAuthStore(state => state.user);
  const { colors } = useThemeColor(); // <--- Cores Dinâmicas
  
  const [title, setTitle] = useState('');
  // amountRaw guarda apenas os números: "1050" = 10,50
  const [amountRaw, setAmountRaw] = useState(''); 
  const [name, setName] = useState(''); 
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDebt = type === 'debt';
  const themeColor = isDebt ? '#fa6238' : '#0bda5b'; 
  const displayTitle = isDebt ? 'Nova Dívida' : 'Novo Empréstimo';
  const nameLabel = isDebt ? 'Devo para quem?' : 'Quem me deve?';

  // --- LÓGICA DE MÁSCARA MONETÁRIA (Direita para Esquerda) ---
  const handleAmountChange = (text: string) => {
    // 1. Remove tudo que não for número
    const onlyNumbers = text.replace(/\D/g, "");
    setAmountRaw(onlyNumbers);
  };

  const getFormattedAmount = () => {
    if (!amountRaw) return "0,00";
    const value = parseInt(amountRaw) / 100;
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };
  // ------------------------------------------------------------

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  async function handleSave() {
    // Converte o valor bruto ("1234") para float (12.34)
    const finalAmount = amountRaw ? parseInt(amountRaw) / 100 : 0;
    
    if ((!title.trim() && !name.trim()) || finalAmount <= 0) {
      return Alert.alert('Atenção', 'Informe um valor válido e uma descrição (Título ou Nome).');
    }

    if (!user?.last_opened_wallet) {
      return Alert.alert('Erro', 'Selecione uma carteira ativa antes de salvar.');
    }

    setLoading(true);
    try {
      const dbType = type === 'debt' ? 'payable' : 'receivable';

      await api.post('/debts', {
        wallet_id: user.last_opened_wallet,
        type: dbType,
        title: title.trim(),
        entity_name: name.trim(),
        amount: finalAmount, // Manda o float correto
        due_date: date.toISOString() 
      });

      router.back();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Falha ao salvar.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <StatusBar backgroundColor={themeColor} barStyle="light-content" />
      
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: themeColor }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{displayTitle}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.amountInput}
              value={getFormattedAmount()} // Exibe formatado
              onChangeText={handleAmountChange} // Limpa e guarda cru
              placeholder="0,00"
              placeholderTextColor="rgba(255,255,255,0.6)"
              keyboardType="numeric"
              autoFocus
            />
          </View>

          <TouchableOpacity 
            style={styles.headerDateButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons name="event" size={14} color="#FFF" />
            <Text style={styles.headerDateText}>
              Vencimento: {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* FORMULÁRIO */}
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textSub }]}>Título (O que é?)</Text>
          <TextInput 
            style={[styles.inputCompact, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} 
            value={title} 
            onChangeText={setTitle} 
            placeholder="Ex: Aluguel, Boleto Internet"
            placeholderTextColor={colors.textSub}
          />

          <Text style={[styles.label, { color: colors.textSub }]}>{nameLabel} (Opcional)</Text>
          <TextInput 
            style={[styles.inputCompact, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} 
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
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Confirmar</Text>
            )}
          </TouchableOpacity>
          
          <Text style={[styles.infoText, { color: colors.textSub }]}>
            Uma transação será criada no extrato automaticamente quando você registrar pagamentos parciais ou totais.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { 
    paddingTop: Platform.OS === 'ios' ? 60 : 50, 
    paddingBottom: 25, 
    paddingHorizontal: 20, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    alignItems: 'center' 
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 10 },
  headerTitle: { fontSize: 16, color: '#FFF', fontWeight: 'bold' },
  
  amountContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  currencySymbol: { fontSize: 24, color: 'rgba(255,255,255,0.8)', marginRight: 5 },
  amountInput: { fontSize: 42, fontWeight: 'bold', color: '#FFF', minWidth: 120, textAlign: 'center' },
  
  headerDateButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20,
    gap: 6
  },
  headerDateText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  form: { padding: 24 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 15 },
  inputCompact: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  
  saveButton: { marginTop: 35, paddingVertical: 16, borderRadius: 15, alignItems: 'center', elevation: 3 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  infoText: { textAlign: 'center', fontSize: 11, marginTop: 20, paddingHorizontal: 20, lineHeight: 16 }
});