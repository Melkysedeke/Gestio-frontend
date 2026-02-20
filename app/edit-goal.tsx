import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../src/services/api';
import { useThemeColor } from '@/hooks/useThemeColor'; // <--- Hook

const THEME_COLOR = '#1773cf';

export default function EditGoalScreen() {
  const params = useLocalSearchParams();
  const { colors } = useThemeColor(); // <--- Cores Dinâmicas
  
  const [name, setName] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [date, setDate] = useState(new Date());
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false); // Para carregar dados
  const [saving, setSaving] = useState(false);   // Para salvar

  // --- CARREGAR DADOS REAIS ---
  // É melhor buscar do banco do que confiar nos params para edição
  useEffect(() => {
    async function fetchGoal() {
      setLoading(true);
      try {
        const response = await api.get(`/goals/${params.id}`);
        const goal = response.data;
        
        setName(goal.name);
        setAmountRaw((goal.target_amount * 100).toFixed(0)); // Converte para centavos
        setDate(new Date(goal.deadline));
      } catch (error) {
        // Se falhar o fetch (ex: offline), tenta usar os params como fallback
        if (params.name) setName(String(params.name));
        if (params.target_amount) setAmountRaw((parseFloat(String(params.target_amount)) * 100).toFixed(0));
        if (params.deadline) setDate(new Date(String(params.deadline)));
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchGoal();
  }, [params.id]);

  // --- MÁSCARA MONETÁRIA ---
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

    setSaving(true);
    try {
      await api.put(`/goals/${params.id}`, {
        name: name.trim(),
        target_amount: finalAmount,
        deadline: date.toISOString(),
        color: THEME_COLOR 
      });

      router.back();
    } catch (error: any) {
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
            setSaving(true);
            try {
              await api.delete(`/goals/${params.id}`);
              router.back();
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir.');
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
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background}}>
              <ActivityIndicator size="large" color={THEME_COLOR} />
          </View>
      );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <StatusBar backgroundColor={THEME_COLOR} barStyle="light-content" />
      
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: THEME_COLOR }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Objetivo</Text>
            <TouchableOpacity onPress={handleDelete}>
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
            style={[styles.inputCompact, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} 
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
  header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 10 },
  headerTitle: { fontSize: 16, color: '#FFF', fontWeight: 'bold' },
  
  amountContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  currencySymbol: { fontSize: 24, color: 'rgba(255,255,255,0.8)', marginRight: 5 },
  amountInput: { fontSize: 42, fontWeight: 'bold', color: '#FFF', minWidth: 120, textAlign: 'center' },
  
  headerDateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  headerDateText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  form: { padding: 24 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 15 },
  inputCompact: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  
  saveButton: { marginTop: 35, paddingVertical: 16, borderRadius: 15, alignItems: 'center', elevation: 3 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});