import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAuthStore } from '../src/stores/authStore';
import api from '../src/services/api';

export default function EditTransactionScreen() {
  const params = useLocalSearchParams();
  const user = useAuthStore(state => state.user);

  // Estados dos Inputs
  const [amount, setAmount] = useState(String(params.amount || ''));
  const [description, setDescription] = useState(String(params.description || ''));
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(Number(params.category_id) || null);
  const [date, setDate] = useState(params.transaction_date ? new Date(String(params.transaction_date)) : new Date());
  
  // Estados de Controle
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  const type = (params.type as 'expense' | 'income') || 'expense';
  const themeColor = type === 'expense' ? '#fa6238' : '#0bda5b';

  // --- CORREÇÃO AQUI ---
  // Usamos .includes() para pegar tanto "Dívida: ..." quanto "Pgto Dívida: ..."
  const isDebtOrLoan = useMemo(() => {
    return description.includes('Dívida') || description.includes('Empréstimo');
  }, [description]);

  // Carregamento de categorias com filtro corrigido
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await api.get('/categories');
        
        // Verificação mais robusta
        const isDebt = description.includes('Dívida');     // Pega "Pgto Dívida"
        const isLoan = description.includes('Empréstimo'); // Pega "Receb. Empréstimo"

        const filtered = response.data.filter((cat: any) => {
          // Se for Dívida, mostra SÓ a categoria de Dívida
          if (isDebt) return cat.type === 'debts' && (cat.name === 'Dívida' || cat.name === 'Pagamento de Dívida');
          
          // Se for Empréstimo, mostra SÓ a categoria de Empréstimo
          if (isLoan) return cat.type === 'debts' && (cat.name === 'Empréstimo' || cat.name === 'Recebimento de Empréstimo');
          
          // Caso contrário, mostra as categorias normais (Despesa ou Receita)
          return cat.type === type;
        });

        setDbCategories(filtered);
        
        // Seleção automática se só sobrar uma categoria (o que deve acontecer agora)
        if ((isDebt || isLoan) && filtered.length > 0) {
          // Se a categoria atual não estiver na lista filtrada, seleciona a primeira disponível
          const currentIsAvailable = filtered.find((c: any) => c.id === selectedCategoryId);
          if (!currentIsAvailable) {
             setSelectedCategoryId(filtered[0].id);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      } finally {
        setFetchingCategories(false);
      }
    }
    loadCategories();
  }, [type, description]);

  // Handler para mudança de data
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); 
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  async function handleUpdate() {
    const cleanAmount = amount.replace(',', '.');
    
    // Validações
    if (!amount || parseFloat(cleanAmount) <= 0) return Alert.alert('Erro', 'Valor inválido');
    if (!selectedCategoryId) return Alert.alert('Erro', 'Selecione uma categoria');

    setLoading(true);
    try {
      // Lógica de Fallback para descrição
      const selectedCategory = dbCategories.find(c => c.id === selectedCategoryId);
      const finalDescription = description.trim() || selectedCategory?.name || (type === 'expense' ? 'Despesa' : 'Receita');

      await api.put(`/transactions/${params.id}`, {
        wallet_id: user?.last_opened_wallet,
        category_id: selectedCategoryId,
        type: type,
        amount: parseFloat(cleanAmount),
        description: finalDescription,
        transaction_date: date.toISOString(),
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível atualizar o registro.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    Alert.alert(
      'Excluir Registro',
      'Tem certeza? Se este for um abatimento, o saldo da dívida será recalculado automaticamente no sistema.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive', 
          onPress: async () => {
            setLoading(true);
            try {
              await api.delete(`/transactions/${params.id}`);
              router.back();
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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
              <MaterialIcons name="close" size={24} color="#FFF" />
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
              {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Descrição {isDebtOrLoan ? '(Bloqueado)' : '(Opcional)'}</Text>
            {isDebtOrLoan && (
              <View style={styles.lockBadge}>
                <MaterialIcons name="lock" size={10} color="#94a3b8" />
                <Text style={styles.lockText}>VINCULADO</Text>
              </View>
            )}
          </View>
          
          <TextInput
            style={[
              styles.inputCompact, 
              isDebtOrLoan && styles.inputDisabled
            ]}
            value={description}
            onChangeText={setDescription}
            editable={!isDebtOrLoan}
            placeholder="Ex: Aluguel"
          />

          {showDatePicker && (
            <DateTimePicker 
              value={date} 
              mode="date" 
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
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
                    disabled={isDebtOrLoan}
                    style={[
                      styles.categoryItemSmall,
                      isSelected && { backgroundColor: themeColor + '15', borderColor: themeColor, borderWidth: 1 }
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
                    <Text numberOfLines={1} style={[styles.categoryTextSmall, isSelected && { color: themeColor, fontWeight: '700' }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
            {/* Fallback visual caso não encontre categoria e seja dívida */}
            {dbCategories.length === 0 && !fetchingCategories && (
                 <Text style={{color: '#94a3b8', fontSize: 12, marginTop: 10}}>
                    Nenhuma categoria encontrada para este tipo de registro.
                 </Text>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: themeColor }]} 
            onPress={handleUpdate} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Salvar Alterações</Text>}
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
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, marginTop: 15 },
  label: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginBottom: 6, marginTop: 15 },
  lockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  lockText: { fontSize: 9, color: '#94a3b8', fontWeight: '800' },
  inputCompact: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 16, color: '#0f172a' },
  inputDisabled: { backgroundColor: '#f1f5f9', color: '#94a3b8', borderColor: '#e2e8f0' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  categoryItemSmall: { width: '23%', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  iconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  categoryTextSmall: { fontSize: 10, marginTop: 4, color: '#64748b', textAlign: 'center' },
  saveButton: { marginTop: 35, paddingVertical: 16, borderRadius: 15, alignItems: 'center', elevation: 3 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});