import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Banco de Dados e Models
import { database } from '../src/database';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function EditDebtScreen() {
  const { id } = useLocalSearchParams();
  const { colors, isDark } = useThemeColor();
  
  const [title, setTitle] = useState('');
  const [amountRaw, setAmountRaw] = useState(''); 
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [type, setType] = useState<'payable' | 'receivable'>('payable');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadDebt() {
      if (!id) return;
      try {
        const debt = await database.get('debts').find(id as string) as any;
        
        setTitle(debt.title);
        const rawValue = (debt.amount * 100).toFixed(0);
        setAmountRaw(rawValue);
        setName(debt.entityName || '');
        setDate(new Date(debt.dueDate));
        setType(debt.type);
      } catch {
        Alert.alert('Erro', 'Não foi possível encontrar este registro.');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    loadDebt();
  }, [id]);

  const themeColor = type === 'payable' ? colors.danger : colors.primary;
  const nameLabel = type === 'payable' ? 'Devo para:' : 'Quem me deve:';

  const handleAmountChange = (text: string) => {
    const onlyNumbers = text.replace(/\D/g, "");
    setAmountRaw(onlyNumbers);
  };

  const getFormattedAmount = () => {
    if (!amountRaw) return "0,00";
    const value = parseInt(amountRaw) / 100;
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  async function handleUpdate() {
    const finalAmount = amountRaw ? parseInt(amountRaw) / 100 : 0;
    if (!title || finalAmount <= 0) {
        return Alert.alert('Atenção', 'Preencha o título e um valor válido.');
    }

    setSaving(true);
    try {
      const debtRecord = await database.get('debts').find(id as string);
      await database.write(async () => {
        await debtRecord.update((d: any) => {
          d.title = title.trim();
          d.entityName = name.trim();
          d.amount = finalAmount;
          d.dueDate = date;
        });
      });
      router.back();
    } catch {
      Alert.alert('Erro', 'Falha ao atualizar registro local.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert('Excluir', 'Tem certeza que deseja apagar este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try {
          const debtRecord = await database.get('debts').find(id as string);
          await database.write(async () => {
            await debtRecord.markAsDeleted();
          });
          router.back();
        } catch {
          Alert.alert('Erro', 'Falha ao excluir.');
        }
      }}
    ]);
  }

  if (loading) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar backgroundColor={themeColor} barStyle="light-content" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { backgroundColor: themeColor }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerAction}>
              <MaterialIcons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Registro</Text>
            <TouchableOpacity onPress={handleDelete} style={styles.headerAction}>
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
            activeOpacity={0.7}
          >
            <MaterialIcons name="event" size={14} color="#FFF" />
            <Text style={styles.headerDateText}>
              Vencimento: {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textSub }]}>Título</Text>
          <TextInput 
            style={[styles.inputCompact, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} 
            value={title} 
            onChangeText={setTitle} 
            placeholderTextColor={colors.textSub}
          />

          <Text style={[styles.label, { color: colors.textSub }]}>{nameLabel}</Text>
          <TextInput 
            style={[styles.inputCompact, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} 
            value={name} 
            onChangeText={setName} 
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

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: themeColor }]} 
            onPress={handleUpdate}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.infoText, { color: colors.textSub }]}>
            Alterar o valor total aqui recalculará a barra de progresso na tela anterior.
          </Text>
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
  headerTitle: { fontSize: 16, color: '#FFF', fontWeight: 'bold' },
  amountContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 15 
  },
  currencySymbol: { fontSize: 24, color: 'rgba(255,255,255,0.8)', marginRight: 5 },
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
  headerDateText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  form: { padding: 24 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 15 },
  inputCompact: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
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
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  infoText: { textAlign: 'center', fontSize: 11, marginTop: 20, paddingHorizontal: 20 }
});