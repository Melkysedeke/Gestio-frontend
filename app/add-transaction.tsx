import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, StatusBar 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAuthStore } from '../src/stores/authStore';
import api from '../src/services/api';
import { useThemeColor } from '@/hooks/useThemeColor'; // <--- Hook de Tema

export default function AddTransactionScreen() {
  const params = useLocalSearchParams();
  const type = (params.type as 'expense' | 'income') || 'expense';
  const user = useAuthStore(state => state.user);
  
  const { colors, isDark } = useThemeColor(); // <--- Cores Dinâmicas

  // Estados dos Inputs
  const [amountRaw, setAmountRaw] = useState(''); // Guarda apenas números "1234"
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date());
  
  // Estados de Controle
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  const themeColor = type === 'expense' ? '#fa6238' : '#0bda5b';

  // --- MÁSCARA MONETÁRIA (Igual AddDebt) ---
  const handleAmountChange = (text: string) => {
    const onlyNumbers = text.replace(/\D/g, "");
    setAmountRaw(onlyNumbers);
  };

  const getFormattedAmount = () => {
    if (!amountRaw) return "0,00";
    const value = parseInt(amountRaw) / 100;
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };
  // ----------------------------------------

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
    const finalAmount = amountRaw ? parseInt(amountRaw) / 100 : 0;
    
    // Validações
    if (finalAmount <= 0) return Alert.alert('Erro', 'Valor inválido');
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
        amount: finalAmount,
        description: finalDescription, 
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
            <Text style={styles.headerTitle}>
              {type === 'expense' ? 'Nova Despesa' : 'Nova Receita'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.amountInput}
              value={getFormattedAmount()}
              onChangeText={handleAmountChange}
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
            <MaterialIcons name="event" size={14} color="#FFF" />
            <Text style={styles.headerDateText}>
              {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* FORMULÁRIO */}
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textSub }]}>Descrição (Opcional)</Text>
          <TextInput
            style={[styles.inputCompact, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            value={description}
            onChangeText={setDescription}
            placeholder={type === 'expense' ? 'Ex: Mercado' : 'Ex: Freelance'}
            placeholderTextColor={colors.textSub}
          />

          {showDatePicker && (
            <DateTimePicker 
              value={date} 
              mode="date" 
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => { setShowDatePicker(false); if(d) setDate(d); }} 
            />
          )}

          <Text style={[styles.label, { color: colors.textSub }]}>Categoria</Text>
          <View style={styles.categoryGrid}>
            {fetchingCategories ? (
              <ActivityIndicator color={themeColor} style={{ marginVertical: 20, width: '100%' }} />
            ) : (
              dbCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                
                // Cores dinâmicas para o item da categoria
                const itemBg = isSelected 
                    ? (themeColor + '15') 
                    : (isDark ? colors.card : '#f8fafc');
                
                const itemBorder = isSelected 
                    ? themeColor 
                    : (isDark ? colors.border : 'transparent');

                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryItemSmall,
                      { backgroundColor: itemBg, borderColor: itemBorder }
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
                        color={isSelected ? themeColor : (cat.color || colors.textSub)} 
                      />
                    </View>
                    <Text 
                      numberOfLines={1}
                      style={[
                        styles.categoryTextSmall, 
                        { color: isSelected ? themeColor : colors.textSub, fontWeight: isSelected ? '700' : '400' }
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

  form: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 15 },
  inputCompact: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  categoryItemSmall: { 
    width: '23%', 
    paddingVertical: 12, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
  },
  categoryTextSmall: { fontSize: 10, marginTop: 4, textAlign: 'center' },
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