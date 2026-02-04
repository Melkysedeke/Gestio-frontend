import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../src/stores/authStore';
import api from '../src/services/api';

export default function AddDebtLoanScreen() {
  const params = useLocalSearchParams();
  const type = (params.type as 'debt' | 'loan') || 'debt';
  
  const user = useAuthStore(state => state.user);
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState(''); 
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDebt = type === 'debt';
  const themeColor = isDebt ? '#fa6238' : '#1773cf'; 
  const displayTitle = isDebt ? 'Nova Dívida' : 'Novo Empréstimo';
  const nameLabel = isDebt ? 'Devo para quem?' : 'Quem me deve?';

  async function handleSave() {
    const cleanAmount = amount.replace(',', '.');
    if (!title || !amount || parseFloat(cleanAmount) <= 0) {
      return Alert.alert('Atenção', 'Preencha o título e um valor válido.');
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
        amount: parseFloat(cleanAmount),
        due_date: date.toISOString().split('T')[0]
      });

      router.back();
    } catch (error: any) {
      Alert.alert('Erro', 'Falha ao salvar no banco de dados.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={{ flex: 1, backgroundColor: '#FFF' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        
        {/* Header com Valor e Data (Novo Padrão) */}
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
              value={amount}
              onChangeText={setAmount}
              placeholder="0,00"
              placeholderTextColor="rgba(255,255,255,0.6)"
              keyboardType="numeric"
              autoFocus
            />
          </View>

          {/* Seletor de Data movido para o Header */}
          <TouchableOpacity 
            style={styles.headerDateButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons name="event" size={14} color="#FFF" />
            <Text style={styles.headerDateText}>
              Vencimento: {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Título (O que é?)</Text>
          <TextInput 
            style={styles.inputCompact} 
            value={title} 
            onChangeText={setTitle} 
            placeholder="Ex: Empréstimo do banco"
          />

          <Text style={styles.label}>{nameLabel}</Text>
          <TextInput 
            style={styles.inputCompact} 
            value={name} 
            onChangeText={setName} 
            placeholder="Nome da pessoa ou empresa" 
          />

          {showDatePicker && (
            <DateTimePicker 
              value={date} 
              mode="date" 
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => { setShowDatePicker(false); if(d) setDate(d); }} 
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
              <Text style={styles.saveButtonText}>Criar {isDebt ? 'Dívida' : 'Empréstimo'}</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.infoText}>
            Uma transação de saldo só será criada quando você realizar um abatimento.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center' },
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
  label: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginBottom: 6, marginTop: 15 },
  inputCompact: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 16, color: '#0f172a' },
  
  saveButton: { marginTop: 35, paddingVertical: 16, borderRadius: 15, alignItems: 'center', elevation: 3 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  infoText: { textAlign: 'center', color: '#94a3b8', fontSize: 11, marginTop: 20, paddingHorizontal: 20 }
});