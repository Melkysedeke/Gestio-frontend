import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../src/stores/authStore';
import api from '../src/services/api';

const THEME_COLOR = '#1773cf'; // Azul padrão para Objetivos

export default function AddGoalScreen() {
  const user = useAuthStore(state => state.user);
  
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  async function handleSave() {
    const cleanTarget = target.replace(',', '.');
    
    if (!name.trim() || !target || parseFloat(cleanTarget) <= 0) {
      return Alert.alert('Atenção', 'Informe um nome e um valor meta válido.');
    }

    if (!user?.last_opened_wallet) {
      return Alert.alert('Erro', 'Nenhuma carteira selecionada.');
    }

    setLoading(true);
    try {
      await api.post('/goals', {
        wallet_id: user.last_opened_wallet,
        name: name.trim(),
        target_amount: parseFloat(cleanTarget),
        deadline: date.toISOString(),
        color: THEME_COLOR 
      });

      router.back();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Falha ao criar objetivo.';
      Alert.alert('Erro', msg);
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
        
        <View style={[styles.header, { backgroundColor: THEME_COLOR }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Novo Objetivo</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.amountInput}
              value={target}
              onChangeText={setTarget}
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
            <MaterialIcons name="flag" size={14} color="#FFF" />
            <Text style={styles.headerDateText}>
              Meta para: {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nome do Objetivo</Text>
          <TextInput 
            style={styles.inputCompact} 
            value={name} 
            onChangeText={setName} 
            placeholder="Ex: Viagem para Europa, PS5"
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
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Definir Meta</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.infoText}>
            O valor guardado neste objetivo será deduzido do saldo disponível da sua carteira.
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
  
  headerDateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  headerDateText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  form: { padding: 24 },
  label: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginBottom: 6, marginTop: 15 },
  inputCompact: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 16, color: '#0f172a' },
  
  saveButton: { marginTop: 35, paddingVertical: 16, borderRadius: 15, alignItems: 'center', elevation: 3 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  infoText: { textAlign: 'center', color: '#94a3b8', fontSize: 11, marginTop: 20, paddingHorizontal: 20, lineHeight: 16 }
});