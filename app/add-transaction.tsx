import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAuthStore } from '../src/stores/authStore';
import api from '../src/services/api';

export default function AddTransactionScreen() {
  const params = useLocalSearchParams();
  const type = (params.type as 'expense' | 'income') || 'expense';
  const user = useAuthStore(state => state.user);

  // Estados dos Inputs
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date());
  
  // Estados de Controle
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  const themeColor = type === 'expense' ? '#fa6238' : '#0bda5b';

  // --- BUSCA DINÂMICA DE CATEGORIAS ---
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await api.get('/categories/');
        const filtered = response.data.filter((cat: any) => cat.type === type);
        setDbCategories(filtered);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      } finally {
        setFetchingCategories(false);
      }
    }
    loadCategories();
  }, [type]);

  async function handleSave() {
    const cleanAmount = amount.replace(',', '.');
    
    // Validações
    if (!amount || parseFloat(cleanAmount) <= 0) return Alert.alert('Erro', 'Valor inválido');
    // REMOVIDO: if (!description.trim()) return Alert.alert('Erro', 'Insira uma descrição'); 
    if (!selectedCategoryId) return Alert.alert('Erro', 'Selecione uma categoria');

    setLoading(true);
    try {
      // Lógica de Fallback: Se não tiver descrição, usa o nome da categoria selecionada
      const selectedCategory = dbCategories.find(c => c.id === selectedCategoryId);
      const finalDescription = description.trim() || selectedCategory?.name || (type === 'expense' ? 'Despesa' : 'Receita');

      await api.post('/transactions/', {
        wallet_id: user?.last_opened_wallet,
        category_id: selectedCategoryId,
        type: type,
        amount: parseFloat(cleanAmount),
        description: finalDescription, // Usa a descrição tratada
        transaction_date: date.toISOString(),
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Não foi possível salvar.');
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
        
        <View style={[styles.header, { backgroundColor: themeColor }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {type === 'expense' ? 'Nova Despesa' : 'Nova Receita'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0,00"
              placeholderTextColor="rgba(255,255,255,0.6)"
              autoFocus
            />
          </View>

          <TouchableOpacity 
            style={styles.headerDateButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons name="calendar-today" size={14} color="#FFF" />
            <Text style={styles.headerDateText}>
              {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {/* Label atualizada para indicar opcional */}
          <Text style={styles.label}>Descrição (Opcional)</Text>
          <TextInput
            style={styles.inputCompact}
            value={description}
            onChangeText={setDescription}
            placeholder={type === 'expense' ? 'Ex: Mercado' : 'Ex: Freelance'}
          />

          {showDatePicker && (
            <DateTimePicker 
              value={date} 
              mode="date" 
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => { setShowDatePicker(false); if(d) setDate(d); }} 
            />
          )}

          <Text style={styles.label}>Categoria</Text>
          <View style={styles.categoryGrid}>
            {fetchingCategories ? (
              <ActivityIndicator color={themeColor} style={{ marginVertical: 20, width: '100%' }} />
            ) : (
              dbCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryItemSmall,
                      isSelected && { 
                        backgroundColor: themeColor + '15', 
                        borderColor: themeColor,
                        borderWidth: 1 
                      }
                    ]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                  >
                    <View style={[
                      styles.iconCircle, 
                      { backgroundColor: isSelected ? 'transparent' : (cat.color + '15') }
                    ]}>
                      <MaterialIcons 
                        name={cat.icon || 'help-outline'} 
                        size={18} 
                        color={isSelected ? themeColor : (cat.color || '#94a3b8')} 
                      />
                    </View>
                    <Text 
                      numberOfLines={1}
                      style={[
                        styles.categoryTextSmall, 
                        isSelected && { color: themeColor, fontWeight: '700' }
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: themeColor }]} 
            onPress={handleSave} 
            disabled={loading || fetchingCategories}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Confirmar</Text>}
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

  form: { padding: 20 },
  label: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginBottom: 6, marginTop: 15 },
  inputCompact: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 16, color: '#0f172a' },
  
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  categoryItemSmall: { 
    width: '23%', 
    paddingVertical: 12, 
    backgroundColor: '#f8fafc', 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: 'transparent' 
  },
  categoryTextSmall: { fontSize: 10, marginTop: 4, color: '#64748b', textAlign: 'center' },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  saveButton: { marginTop: 35, paddingVertical: 16, borderRadius: 15, alignItems: 'center', elevation: 3 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});