import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, StatusBar 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Banco de Dados e Models
import { database } from '../src/database';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import Transaction from '../src/database/models/Transaction';
import Category from '../src/database/models/Category';

export default function AddTransactionScreen() {
  const params = useLocalSearchParams();
  const isEditing = !!params.id;
  const user = useAuthStore(state => state.user);
  
  const { colors, isDark } = useThemeColor();

  const [loadingData, setLoadingData] = useState(isEditing);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [amountRaw, setAmountRaw] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);

  const type = (transaction?.type || params.type || 'expense') as 'expense' | 'income';
  const themeColor = type === 'expense' ? colors.danger : colors.success;

  const isLinked = useMemo(() => {
    return !!(transaction?.debtId || (transaction as any)?._raw?.debt_id);
  }, [transaction]);

  useEffect(() => {
    async function fetchData() {
      try {
        let transObj: Transaction | null = null;
        if (isEditing) {
          transObj = await database.get<Transaction>('transactions').find(params.id as string);
          setTransaction(transObj);
          setAmountRaw((Number(transObj.amount) * 100).toFixed(0));
          setDescription(transObj.description || '');
          setDate(new Date(transObj.transactionDate));
        }

        const allCats = await database.get<Category>('categories').query().fetch();
        let filtered: Category[] = [];

        if (isLinked || (transObj as any)?._raw?.debt_id) {
          filtered = allCats.filter(c => c.type === 'debts');
        } else {
          filtered = allCats.filter(c => c.type === type);
        }
        setDbCategories(filtered);

        if (transObj) {
          const currentCat = filtered.find(c => c.name === transObj.categoryName);
          if (currentCat) setSelectedCategoryId(currentCat.id);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, [params.id, type, isLinked]);

  const handleAmountChange = (text: string) => {
    const onlyNumbers = text.replace(/\D/g, "");
    setAmountRaw(onlyNumbers);
  };

  const getFormattedAmount = () => {
    if (!amountRaw) return "0,00";
    const value = parseInt(amountRaw) / 100;
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  async function handleSave() {
    const finalAmount = amountRaw ? parseInt(amountRaw) / 100 : 0;
    if (finalAmount <= 0) return Alert.alert('Erro', 'Valor inválido');
    if (!selectedCategoryId) return Alert.alert('Erro', 'Selecione uma categoria');

    setSaving(true);
    try {
      const selectedCategory = dbCategories.find(c => c.id === selectedCategoryId);
      const walletId = user?.settings?.last_opened_wallet;

      if (!walletId) {
        setSaving(false);
        return Alert.alert("Erro", "Nenhuma carteira selecionada. Crie uma carteira primeiro.");
      }

      await database.write(async () => {
        const wallet = await database.get('wallets').find(walletId);

        if (isEditing && transaction) {
          const oldAmount = Number(transaction.amount);
          const difference = finalAmount - oldAmount;

          await transaction.update((t: any) => {
            t.amount = finalAmount;
            t.description = description || selectedCategory?.name;
            t.transactionDate = date;
            
            if (!isLinked && selectedCategory) {
              t.categoryName = selectedCategory.name;
              t.categoryIcon = selectedCategory.icon;
            }
          });

          await wallet.update((w: any) => {
            if (type === 'expense') w.balance -= difference;
            else w.balance += difference;
          });
        } else {
          await database.get('transactions').create((t: any) => {
            t._raw.wallet_id = walletId; 
            t._raw.user_id = user?.id;
            t.amount = finalAmount;
            t.type = type;
            t.description = description.trim() || selectedCategory?.name || 'Transação';
            t.categoryName = selectedCategory?.name;
            t.categoryIcon = selectedCategory?.icon;
            t.transactionDate = date.getTime();
          });

          await wallet.update((w: any) => {
            if (type === 'expense') w.balance -= finalAmount;
            else w.balance += finalAmount;
          });
        }
      });

      router.back();
    } catch {
      Alert.alert('Erro', 'Falha ao salvar registro.');
    } finally {
      setSaving(false);
    }
  }

  // ✅ Constantes dinâmicas calculadas antes do render
  const inputBgColor = isLinked ? (isDark ? '#1e293b' : '#f1f5f9') : colors.inputBg;
  const inputTextColor = isLinked ? colors.textSub : colors.text;

  if (loadingData) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={themeColor} />
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={themeColor} barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={[styles.header, { backgroundColor: themeColor }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerAction}>
                <MaterialIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditing ? 'Editar Registro' : 'Novo Registro'}</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput 
              style={styles.amountInput} 
              value={getFormattedAmount()} 
              onChangeText={handleAmountChange} 
              keyboardType="numeric" 
            />
          </View>
          
          <TouchableOpacity 
            style={styles.headerDateButton} 
            onPress={() => !isLinked && setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="event" size={14} color="#FFF" />
            <Text style={styles.headerDateText}>{date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
            {!isLinked && <MaterialIcons name="arrow-drop-down" size={20} color="#FFF" />}
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textSub }]}>Descrição {isLinked ? '(Bloqueada)' : '(Opcional)'}</Text>
          <TextInput 
            style={[
              styles.inputCompact, 
              { 
                backgroundColor: inputBgColor, 
                borderColor: colors.border, 
                color: inputTextColor 
              }
            ]} 
            value={description} 
            onChangeText={setDescription} 
            editable={!isLinked}
          />

          {showDatePicker && (
              <DateTimePicker 
                  value={date} 
                  mode="date" 
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, d) => { setShowDatePicker(false); if(d) setDate(d); }} 
              />
          )}

          <Text style={[styles.sectionLabel, { color: colors.textSub }]}>
            Categoria {isLinked && '(Vínculo com Dívida)'}
          </Text>
          
          <View style={styles.categoryGrid}>
            {dbCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              const catColor = cat.color || colors.textSub;
              const isCatDisabled = isLinked && !isSelected;
              
              return (
                <TouchableOpacity 
                  key={cat.id} 
                  disabled={isLinked} 
                  style={[
                    styles.categoryItemSmall, 
                    { 
                      backgroundColor: isSelected ? (catColor + '25') : (isDark ? '#1e293b' : '#f8fafc'), 
                      borderColor: isSelected ? catColor : 'transparent',
                      opacity: isCatDisabled ? 0.3 : 1
                    }
                  ]} 
                  onPress={() => setSelectedCategoryId(cat.id)}
                >
                  <View style={[styles.iconCircle, { backgroundColor: isSelected ? 'transparent' : (catColor + '15') }]}>
                    <MaterialIcons name={(cat.icon as any) || 'help-outline'} size={18} color={catColor} />
                  </View>
                  <Text numberOfLines={1} style={[styles.categoryTextSmall, { color: isSelected ? colors.text : colors.textSub, fontWeight: isSelected ? '700' : '400' }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: themeColor }]} 
            onPress={handleSave} 
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Confirmar</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1 },
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
    width: 32 // Para balancear com o ícone de close
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
    padding: 20 
  },
  label: { 
    fontSize: 13, 
    fontWeight: '600', 
    marginBottom: 6, 
    marginTop: 15 
  },
  sectionLabel: { 
    fontSize: 13, 
    fontWeight: '600', 
    marginBottom: 6, 
    marginTop: 20 
  },
  inputCompact: { 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16 
  },
  categoryGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    marginTop: 4 
  },
  categoryItemSmall: { 
    width: '23%', 
    paddingVertical: 12, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1 
  },
  categoryTextSmall: { 
    fontSize: 10, 
    marginTop: 4, 
    textAlign: 'center' 
  },
  iconCircle: { 
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    alignItems: 'center', 
    justifyContent: 'center' 
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
  }
});