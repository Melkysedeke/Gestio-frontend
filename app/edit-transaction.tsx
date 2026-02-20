import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, StatusBar 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAuthStore } from '../src/stores/authStore';
import api from '../src/services/api';
import { useThemeColor } from '@/hooks/useThemeColor'; // Garanta que o caminho do hook está certo

export default function EditTransactionScreen() {
  const params = useLocalSearchParams();
  const user = useAuthStore(state => state.user);
  const { colors, isDark } = useThemeColor();

  // Estados de Dados
  const [loadingData, setLoadingData] = useState(true); 
  const [transactionData, setTransactionData] = useState<any>(null); 
  
  // Estados do Formulário
  const [amountRaw, setAmountRaw] = useState(''); 
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date());
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  // Tipo base (receita ou despesa para cores)
  const type = (transactionData?.type || params.type || 'expense') as 'expense' | 'income';
  const themeColor = type === 'expense' ? '#fa6238' : '#0bda5b';

  // --- BUSCA DADOS REAIS DO BANCO ---
  useEffect(() => {
    async function fetchData() {
      try {
        if (!params.id) return;

        // 1. Busca Transação
        const transRes = await api.get(`/transactions/${params.id}`);
        const trans = transRes.data;
        
        // 2. Busca Categorias
        const catRes = await api.get('/categories');
        const allCats = catRes.data;

        setTransactionData(trans);

        // Preenche formulário
        const val = parseFloat(String(trans.amount));
        setAmountRaw((val * 100).toFixed(0));
        setDescription(trans.description);
        setDate(new Date(trans.transaction_date));

        // --- LÓGICA DE DECISÃO E FILTRO ---
        const hasDebt = trans.debt_id && Number(trans.debt_id) > 0;
        const hasGoal = trans.goal_id && Number(trans.goal_id) > 0;

        let filteredCats = [];

        if (hasDebt) {
            // Caso 1: DÍVIDA -> Filtra tipo 'debts'
            filteredCats = allCats.filter((c: any) => c.type === 'debts');
        
        } else if (hasGoal) {
            // Caso 2: OBJETIVO -> Filtra tipo 'investment'
            filteredCats = allCats.filter((c: any) => c.type === 'investment');
            
            // Fallback: Se não achar 'investment', tenta por nome
            if (filteredCats.length === 0) {
               filteredCats = allCats.filter((c: any) => 
                  c.name.toLowerCase().includes('invest') || 
                  c.name.toLowerCase().includes('resgate') ||
                  c.name.toLowerCase().includes('meta')
               );
            }
            // Último recurso: mostra a categoria atual
            if (filteredCats.length === 0) {
               filteredCats = allCats.filter((c:any) => c.id === trans.category_id);
            }

        } else {
            // Caso 3: NORMAL -> Filtra pelo tipo (income/expense)
            filteredCats = allCats.filter((cat: any) => cat.type === trans.type);
        }

        // Define as categorias na tela
        if (filteredCats.length > 0) {
            setDbCategories(filteredCats);
            
            // Tenta selecionar a categoria que já estava salva
            const currentCat = filteredCats.find((c:any) => c.id === Number(trans.category_id));
            if (currentCat) {
                setSelectedCategoryId(currentCat.id);
            } else {
                setSelectedCategoryId(filteredCats[0].id);
            }
        } else {
            // Fallback extremo
            setDbCategories(allCats);
            setSelectedCategoryId(trans.category_id);
        }

      } catch (error) {
        Alert.alert("Erro", "Falha ao carregar os dados.");
        router.back();
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [params.id]);

  // --- MEMO DO ESTADO DE TRAVAMENTO ---
  const isLinked = useMemo(() => {
      const isDebt = transactionData?.debt_id && Number(transactionData.debt_id) > 0;
      const isGoal = transactionData?.goal_id && Number(transactionData.goal_id) > 0;
      return !!isDebt || !!isGoal;
  }, [transactionData]);

  // --- HANDLERS ---
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
    
    if (finalAmount <= 0) return Alert.alert('Erro', 'Valor inválido');
    if (!selectedCategoryId) return Alert.alert('Erro', 'Selecione uma categoria');

    setSaving(true);
    try {
      const payload = {
        wallet_id: transactionData?.wallet_id || user?.last_opened_wallet,
        category_id: selectedCategoryId,
        type: type,
        amount: finalAmount, 
        description: description,
        transaction_date: date.toISOString(),
        // Mantém os vínculos inalterados (segurança)
        debt_id: transactionData?.debt_id || null,
        goal_id: transactionData?.goal_id || null
      };

      await api.put(`/transactions/${params.id}`, payload);
      router.back();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Não foi possível atualizar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    let message = 'Tem certeza?';
    if (transactionData?.debt_id) message = 'Esta transação paga uma dívida. Ao excluir, o saldo devedor voltará.';
    if (transactionData?.goal_id) message = 'Esta transação é um aporte/resgate de objetivo. O saldo da meta será ajustado.';

    Alert.alert(
      'Excluir',
      message,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: async () => {
            try {
              await api.delete(`/transactions/${params.id}`);
              router.back();
            } catch (error) { Alert.alert('Erro', 'Falha ao excluir.'); }
        }}
      ]
    );
  }

  if (loadingData) {
      return (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background}}>
              <ActivityIndicator size="large" color={themeColor} />
          </View>
      );
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
            <MaterialIcons name="event" size={14} color="#FFF" />
            <Text style={styles.headerDateText}>
              {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* FORMULÁRIO */}
        <View style={styles.form}>
          
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.textSub }]}>
                Descrição {isLinked ? '(Vinculado)' : '(Opcional)'}
            </Text>
            {isLinked && (
              <View style={[styles.lockBadge, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                <MaterialIcons name="lock" size={12} color={colors.textSub} />
                <Text style={[styles.lockText, { color: colors.textSub }]}>AUTOMÁTICO</Text>
              </View>
            )}
          </View>
          
          <TextInput
            style={[
              styles.inputCompact, 
              { 
                backgroundColor: isLinked ? (isDark ? '#1e293b' : '#f1f5f9') : colors.inputBg,
                borderColor: colors.border,
                color: isLinked ? colors.textSub : colors.text
              }
            ]}
            value={description}
            onChangeText={setDescription}
            editable={!isLinked} 
            placeholder="Ex: Aluguel"
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

          <Text style={[styles.label, { color: colors.textSub }]}>Categoria</Text>
          <View style={styles.categoryGrid}>
            {dbCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                const activeColor = cat.color || themeColor;
                const itemBg = isSelected ? (activeColor + '15') : (isDark ? colors.card : '#f8fafc');
                const itemBorder = isSelected ? activeColor : (isDark ? colors.border : 'transparent');

                return (
                  <TouchableOpacity
                    key={cat.id}
                    disabled={isLinked} 
                    style={[
                      styles.categoryItemSmall,
                      { backgroundColor: itemBg, borderColor: itemBorder, opacity: isLinked && !isSelected ? 0.5 : 1 }
                    ]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: isSelected ? 'transparent' : (activeColor + '15') }]}>
                      <MaterialIcons name={cat.icon || 'help-outline'} size={18} color={isSelected ? activeColor : (cat.color || colors.textSub)} />
                    </View>
                    <Text numberOfLines={1} style={[styles.categoryTextSmall, { color: isSelected ? activeColor : colors.textSub, fontWeight: isSelected ? '700' : '400' }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
            })}
            
            {dbCategories.length === 0 && (
                <Text style={{textAlign: 'center', width: '100%', marginTop: 10, color: colors.textSub}}>
                    {isLinked 
                        ? "Categoria técnica não encontrada." 
                        : "Nenhuma categoria disponível."}
                </Text>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: themeColor }]} 
            onPress={handleUpdate} 
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Salvar Alterações</Text>}
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
  
  headerDateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  headerDateText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  
  form: { padding: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, marginTop: 15 },
  label: { fontSize: 13, fontWeight: '600' }, 
  
  lockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  lockText: { fontSize: 10, fontWeight: '800' },
  
  inputCompact: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginTop: 6 },
  
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  categoryItemSmall: { width: '23%', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  categoryTextSmall: { fontSize: 10, marginTop: 4, textAlign: 'center' },
  
  saveButton: { marginTop: 35, paddingVertical: 16, borderRadius: 15, alignItems: 'center', elevation: 3 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});