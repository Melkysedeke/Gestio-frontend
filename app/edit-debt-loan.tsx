import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../src/services/api';

export default function EditDebtLoanScreen() {
  const { id } = useLocalSearchParams();
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [type, setType] = useState<'payable' | 'receivable'>('payable');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadDebt() {
      try {
        const response = await api.get(`/debts/${id}`);
        const debt = response.data;
        setTitle(debt.title);
        setAmount(String(debt.amount));
        setName(debt.entity_name || '');
        setDate(new Date(debt.due_date));
        setType(debt.type);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar os dados.');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    loadDebt();
  }, [id]);

  const themeColor = type === 'payable' ? '#fa6238' : '#1773cf';
  const nameLabel = type === 'payable' ? 'Devo para:' : 'Quem me deve:';

  async function handleUpdate() {
    const cleanAmount = amount.replace(',', '.');
    if (!title || !amount || parseFloat(cleanAmount) <= 0) {
        return Alert.alert('Atenção', 'Preencha o título e um valor válido.');
    }

    setSaving(true);
    try {
      await api.put(`/debts/${id}`, {
        title: title.trim(),
        entity_name: name.trim(),
        amount: parseFloat(cleanAmount),
        due_date: date.toISOString().split('T')[0]
      });
      router.back();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert('Excluir', 'Tem certeza que deseja apagar este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/debts/${id}`);
          router.back();
        } catch (error) {
          Alert.alert('Erro', 'Falha ao excluir.');
        }
      }}
    ]);
  }

  if (loading) return (
    <View style={styles.center}>
        <ActivityIndicator size="large" color="#1773cf" />
    </View>
  );

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
            <Text style={styles.headerTitle}>Editar Registro</Text>
            <TouchableOpacity onPress={handleDelete}>
              <MaterialIcons name="delete-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

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
          <Text style={styles.label}>Título</Text>
          <TextInput 
            style={styles.inputCompact} 
            value={title} 
            onChangeText={setTitle} 
          />

          <Text style={styles.label}>{nameLabel}</Text>
          <TextInput 
            style={styles.inputCompact} 
            value={name} 
            onChangeText={setName} 
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
            onPress={handleUpdate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.infoText}>
            Alterar o valor total aqui recalculará a barra de progresso na tela anterior.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
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