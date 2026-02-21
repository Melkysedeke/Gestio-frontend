import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Banco de Dados e Stores
import { database } from '../src/database';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function AddGoalScreen() {
  const user = useAuthStore(state => state.user);
  const { colors } = useThemeColor(); 
  
  const THEME_COLOR = colors.primary; 

  const [name, setName] = useState('');
  const [amountRaw, setAmountRaw] = useState(''); 
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

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

  async function handleSave() {
    const targetAmount = amountRaw ? parseInt(amountRaw) / 100 : 0;
    
    if (!name.trim()) {
      return Alert.alert('Atenção', 'Dê um nome ao seu objetivo.');
    }
    
    if (targetAmount <= 0) {
      return Alert.alert('Atenção', 'O valor da meta deve ser maior que zero.');
    }

    const walletId = user?.settings?.last_opened_wallet;
    if (!walletId) {
      return Alert.alert('Erro', 'Nenhuma carteira selecionada. Crie ou selecione uma carteira primeiro.');
    }

    setLoading(true);
    try {
      await database.write(async () => {
        await database.get('goals').create((g: any) => {
          g.name = name.trim();
          g.targetAmount = targetAmount;
          g.currentAmount = 0; 
          g.deadline = date; 
          g.color = THEME_COLOR;
          g._raw.wallet_id = walletId; 
        });
      });

      router.back();
    } catch (error: any) {
      console.error("Erro ao criar objetivo:", error);
      Alert.alert('Erro', 'Falha ao salvar o objetivo no banco de dados local.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar backgroundColor={THEME_COLOR} barStyle="light-content" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={[styles.header, { backgroundColor: THEME_COLOR }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerAction}>
              <MaterialIcons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Novo Objetivo</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.amountInput}
              value={getFormattedAmount()}
              onChangeText={handleAmountChange}
              placeholder="0,00"
              placeholderTextColor="rgba(255,255,255,0.6)"
              keyboardType="numeric"
              autoFocus
            />
          </View>
          <Text style={styles.subtitleHeader}>Qual é o valor da meta?</Text>

          <TouchableOpacity 
            style={styles.headerDateButton} 
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="flag" size={14} color="#FFF" />
            <Text style={styles.headerDateText}>
              Meta para: {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textSub }]}>Nome do Objetivo</Text>
          <TextInput 
            style={[
                styles.inputCompact, 
                { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }
            ]} 
            value={name} 
            onChangeText={setName} 
            placeholder="Ex: Viagem para Europa, PS5"
            placeholderTextColor={colors.textSub}
          />

          {showDatePicker && (
            <DateTimePicker 
              value={date} 
              mode="date" 
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange} 
              minimumDate={new Date()} 
            />
          )}

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: THEME_COLOR }]} 
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Criar Objetivo</Text>
            )}
          </TouchableOpacity>
          
          <Text style={[styles.infoText, { color: colors.textSub }]}>
            O valor inserido acima é apenas a sua META final. O seu objetivo começará com saldo R$ 0,00. 
            Você poderá guardar dinheiro nele a qualquer momento.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1
  },
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
  headerTitle: { 
    fontSize: 16, 
    color: '#FFF', 
    fontWeight: 'bold' 
  },
  headerPlaceholder: {
    width: 32
  },
  amountContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 10 
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
  subtitleHeader: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 12, 
    marginBottom: 20 
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
    padding: 24 
  },
  label: { 
    fontSize: 13, 
    fontWeight: '600', 
    marginBottom: 6, 
    marginTop: 15 
  },
  inputCompact: { 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16 
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
  },
  infoText: { 
    textAlign: 'center', 
    fontSize: 11, 
    marginTop: 20, 
    paddingHorizontal: 20, 
    lineHeight: 16 
  }
});