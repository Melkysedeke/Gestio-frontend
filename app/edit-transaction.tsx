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

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams();
  const { colors, isDark } = useThemeColor();

  // Estados de Dados
  const [loadingData, setLoadingData] = useState(true);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  
  // Estados do Formulário
  const [amountRaw, setAmountRaw] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const type = (transaction?.type || 'expense') as 'expense' | 'income';
  const themeColor = type === 'expense' ? colors.danger : colors.success;

  // Identificação de Vínculos
  const isLinkedDebt = useMemo(() => !!(transaction?.debtId || (transaction as any)?._raw?.debt_id), [transaction]);
  const isLinkedGoal = useMemo(() => !!(transaction?.goalId || (transaction as any)?._raw?.goal_id), [transaction]);
  const isLinked = isLinkedDebt || isLinkedGoal;

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const trans = await database.get<Transaction>('transactions').find(id as string);
        const rawData = (trans as any)._raw;

        setTransaction(trans);
        setAmountRaw((Number(rawData.amount) * 100).toFixed(0));
        setDescription(rawData.description || '');
        setDate(new Date(rawData.transaction_date));

        const allCats = await database.get<Category>('categories').query().fetch();
        
        let filtered: Category[] = [];

        if (rawData.debt_id) {
          filtered = allCats.filter(c => c.type === 'debts');
        } else if (rawData.goal_id) {
          filtered = allCats.filter(c => c.type === 'goals');
          if (filtered.length === 0) {
            filtered = [{ id: 'goal-cat', name: 'Objetivo', icon: 'savings', color: colors.primary } as any];
          }
        } else {
          filtered = allCats.filter(c => c.type === trans.type);
        }
        setDbCategories(filtered);

        const currentCat = allCats.find(c => c.name === rawData.category_name);
        if (currentCat) {
          setSelectedCategoryId(currentCat.id);
        } else if (rawData.goal_id) {
          setSelectedCategoryId(filtered[0]?.id || 'goal-cat');
        }

      } catch {
        router.back();
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, [id, colors.primary]);

  const getFormattedAmount = () => {
    if (!amountRaw) return "0,00";
    const value = parseInt(amountRaw) / 100;
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  async function handleUpdate() {
    const finalAmount = amountRaw ? parseInt(amountRaw) / 100 : 0;
    if (finalAmount <= 0) return Alert.alert('Erro', 'Valor inválido');
    if (!transaction) return;

    setSaving(true);
    try {
      const oldAmount = Number((transaction as any)._raw.amount);
      const selectedCategory = dbCategories.find(c => c.id === selectedCategoryId);

      await database.write(async () => {
        if (isLinkedDebt) {
          const debtId = (transaction as any)._raw.debt_id;
          const debt = await database.get('debts').find(debtId);
          await debt.update((d: any) => {
            const diff = finalAmount - oldAmount;
            d.totalPaid = (Number(d.totalPaid) || 0) + diff;
            d.isPaid = d.totalPaid >= d.amount - 0.01;
          });
        } else if (isLinkedGoal) {
          const goalId = (transaction as any)._raw.goal_id;
          const goal = await database.get('goals').find(goalId);
          await goal.update((g: any) => {
            const diff = finalAmount - oldAmount;
            const currentAmount = Number(g.currentAmount || g._raw.current_amount || 0);
            if (type === 'expense') g.currentAmount = currentAmount + diff;
            else g.currentAmount = currentAmount - diff;
          });
        }

        await transaction.update((t: any) => {
          t.amount = finalAmount;
          t.description = description;
          t.transactionDate = date;
          if (!isLinked && selectedCategory) {
            t.categoryName = selectedCategory.name;
            t.categoryIcon = selectedCategory.icon;
          }
        });

        const walletId = (transaction as any)._raw.wallet_id;
        const wallet = await database.get('wallets').find(walletId);
        await wallet.update((w: any) => {
          const diff = finalAmount - oldAmount;
          if (type === 'expense') w.balance -= diff;
          else w.balance += diff;
        });
      });

      router.back();
    } catch {
      Alert.alert('Erro', 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!transaction) return;
    Alert.alert('Excluir', 'Deseja apagar este registo? O valor será estornado.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try {
          await database.write(async () => {
            const amount = Number((transaction as any)._raw.amount);
            const walletId = (transaction as any)._raw.wallet_id;
            const wallet = await database.get('wallets').find(walletId);

            if (isLinkedDebt) {
              const debtId = (transaction as any)._raw.debt_id;
              const debt = await database.get('debts').find(debtId);
              await debt.update((d: any) => {
                d.totalPaid -= amount;
                d.isPaid = false;
              });
            } else if (isLinkedGoal) {
              const goalId = (transaction as any)._raw.goal_id;
              const goal = await database.get('goals').find(goalId);
              await goal.update((g: any) => {
                const currentAmount = Number(g.currentAmount || g._raw.current_amount || 0);
                if (type === 'expense') g.currentAmount = currentAmount - amount;
                else g.currentAmount = currentAmount + amount;
              });
            }

            await wallet.update((w: any) => {
              if (type === 'expense') w.balance += amount;
              else w.balance -= amount;
            });

            await transaction.markAsDeleted();
          });
          router.back();
        } catch { Alert.alert('Erro', 'Falha ao excluir.'); }
      }}
    ]);
  }

  // ✅ Constantes dinâmicas para limpeza do render e correção do Dark Mode
  const linkedBadgeBg = isDark ? '#334155' : '#e2e8f0';
  const inputBgColor = isLinked 
    ? (isDark ? '#334155' : '#f1f5f9') 
    : (isDark ? '#1e293b' : '#f8fafc'); // Corrige o fundo branco no modo escuro
  const inputTextColor = isLinked ? colors.textSub : colors.text;

  if (loadingData) return <View style={styles.center}><ActivityIndicator size="large" color={themeColor} /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={themeColor} barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={[styles.header, { backgroundColor: themeColor }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerAction}><MaterialIcons name="close" size={24} color="#FFF" /></TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Registo</Text>
            <TouchableOpacity onPress={handleDelete} style={styles.headerAction}><MaterialIcons name="delete-outline" size={24} color="#FFF" /></TouchableOpacity>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput 
              style={styles.amountInput} 
              value={getFormattedAmount()} 
              onChangeText={(t) => setAmountRaw(t.replace(/\D/g, ""))}
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
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.textSub }]}>Descrição</Text>
            {isLinked && (
              <View style={[styles.linkedBadge, { backgroundColor: linkedBadgeBg }]}>
                <MaterialIcons name="lock" size={10} color={colors.textSub} />
                <Text style={[styles.linkedText, { color: colors.textSub }]}>Vinculado</Text>
              </View>
            )}
          </View>
          
          <TextInput 
            style={[
              styles.inputCompact, 
              { 
                backgroundColor: inputBgColor, 
                color: inputTextColor,
                borderColor: colors.border // ✅ Borda dinâmica baseada no tema
              }
            ]} 
            value={description} 
            onChangeText={setDescription} 
            editable={!isLinked}
            placeholder="Ex: Supermercado..."
            placeholderTextColor={colors.textSub} // ✅ Placeholder visível em qualquer tema
          />

          <View style={styles.sectionLabelRow}>
            <Text style={[styles.label, { color: colors.textSub }]}>Categoria</Text>
            {isLinked && (
               <View style={[styles.linkedBadge, { backgroundColor: linkedBadgeBg }]}>
                 <MaterialIcons name="lock" size={10} color={colors.textSub} />
                 <Text style={[styles.linkedText, { color: colors.textSub }]}>Vinculado</Text>
               </View>
            )}
          </View>
          
          <View style={styles.categoryGrid}>
            {dbCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              const catColor = cat.color || colors.textSub;
              const isCatDisabled = isLinked && !isSelected;
              
              return (
                <TouchableOpacity 
                  key={cat.id} 
                  disabled={isLinked} 
                  onPress={() => setSelectedCategoryId(cat.id)}
                  style={[
                    styles.categoryItemSmall, 
                    { 
                      backgroundColor: isSelected ? (catColor + '15') : (isDark ? '#1e293b' : '#f8fafc'), 
                      borderColor: isSelected ? catColor : 'transparent',
                      opacity: isCatDisabled ? 0.2 : 1 
                    }
                  ]} 
                >
                  <View style={[styles.iconCircle, { backgroundColor: isSelected ? 'transparent' : (catColor + '10') }]}>
                    <MaterialIcons name={(cat.icon as any) || 'help-outline'} size={20} color={catColor} />
                  </View>
                  <Text numberOfLines={1} style={[styles.categoryTextSmall, { color: isSelected ? colors.text : colors.textSub, fontWeight: isSelected ? 'bold' : '400' }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: themeColor }]} 
            onPress={handleUpdate}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Guardar Alterações</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker 
          value={date} 
          mode="date" 
          display="default" 
          onChange={(e, d) => { setShowDatePicker(false); if(d) setDate(d); }} 
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1 },
  header: { 
    paddingTop: 60, 
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
  labelRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  sectionLabelRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 6,
    marginTop: 20
  },
  label: { 
    fontSize: 13, 
    fontWeight: '600' 
  },
  linkedBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12, 
    gap: 4 
  },
  linkedText: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    textTransform: 'uppercase' 
  },
  inputCompact: { 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16, 
    // ✅ borderColor: '#EEEEEE' removido daqui (agora é dinâmico)
  },
  categoryGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10, 
    marginTop: 10 
  },
  categoryItemSmall: { 
    width: '22%', 
    paddingVertical: 12, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1.5 
  },
  iconCircle: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 4 
  },
  categoryTextSmall: { 
    fontSize: 10, 
    textAlign: 'center' 
  },
  saveButton: { 
    marginTop: 30, 
    paddingVertical: 16, 
    borderRadius: 15, 
    alignItems: 'center' 
  },
  saveButtonText: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
  }
});