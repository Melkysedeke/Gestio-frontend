import React, { useState, useMemo } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Modal, Text, FlatList, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

// DICA: Em uma versão futura, você pode trocar isso por uma busca no database.get('categories')
const CATEGORY_LIST = [
  { name: 'Alimentação', icon: 'restaurant', type: 'expense' },
  { name: 'Transporte', icon: 'directions-bus', type: 'expense' },
  { name: 'Casa', icon: 'home', type: 'expense' },
  { name: 'Compras', icon: 'shopping-cart', type: 'expense' },
  { name: 'Saúde', icon: 'local-hospital', type: 'expense' },
  { name: 'Lazer', icon: 'movie', type: 'expense' },
  { name: 'Educação', icon: 'school', type: 'expense' },
  { name: 'Salário', icon: 'attach-money', type: 'income' },
  { name: 'Freelance', icon: 'computer', type: 'income' },
  { name: 'Investimento', icon: 'trending-up', type: 'income' },
  { name: 'Presente', icon: 'card-giftcard', type: 'income' },
  { name: 'Dívida', icon: 'receipt-long', type: 'debts' },
  { name: 'Empréstimo', icon: 'handshake', type: 'debts' },
  { name: 'Objetivo', icon: 'savings', type: 'goals' },
  { name: 'Outros', icon: 'more-horiz', type: 'expense' },
];

interface Props {
  searchText: string;
  onSearchChange: (text: string) => void;
  selectedType: 'all' | 'income' | 'expense';
  onTypeChange: (type: 'all' | 'income' | 'expense') => void;
  selectedCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  onClearAll: () => void;
}

export default function TransactionFilters({ 
  searchText, onSearchChange, selectedType, onTypeChange, selectedCategory, onCategoryChange, onClearAll 
}: Props) {
  const { colors, isDark } = useThemeColor();
  const [modalVisible, setModalVisible] = useState(false);

  const hasActiveFilters = searchText.length > 0 || selectedType !== 'all' || selectedCategory !== null;

  const visibleCategories = useMemo(() => {
    if (selectedType === 'all') return CATEGORY_LIST;
    return CATEGORY_LIST.filter(cat => cat.type === selectedType || cat.type === 'debts' || cat.type === 'goals');
  }, [selectedType]);

  const getChipStyle = (isActive: boolean) => ({
    backgroundColor: isActive ? colors.primary : (isDark ? 'rgba(255,255,255,0.05)' : '#FFF'),
    borderColor: isActive ? colors.primary : colors.border,
  });

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={20} color={colors.textSub} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Buscar transação..."
            placeholderTextColor={colors.textSub}
            value={searchText}
            onChangeText={onSearchChange}
          />
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.typeActions}>
            {/* Botão de Categoria */}
            <TouchableOpacity 
              onPress={() => setModalVisible(true)} 
              style={[styles.miniChip, getChipStyle(!!selectedCategory)]}
            >
              <MaterialIcons 
                name="label" 
                size={16} 
                color={selectedCategory ? '#FFF' : colors.textSub} 
              />
            </TouchableOpacity>

            {/* Botão de Entrada */}
            <TouchableOpacity 
              onPress={() => onTypeChange(selectedType === 'income' ? 'all' : 'income')} 
              style={[styles.miniChip, getChipStyle(selectedType === 'income')]}
            >
              <MaterialIcons 
                name="arrow-downward" 
                size={16} 
                color={selectedType === 'income' ? '#FFF' : colors.success} 
              />
            </TouchableOpacity>

            {/* Botão de Saída */}
            <TouchableOpacity 
              onPress={() => onTypeChange(selectedType === 'expense' ? 'all' : 'expense')} 
              style={[styles.miniChip, getChipStyle(selectedType === 'expense')]}
            >
              <MaterialIcons 
                name="arrow-upward" 
                size={16} 
                color={selectedType === 'expense' ? '#FFF' : colors.danger} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {hasActiveFilters && (
          <TouchableOpacity 
            onPress={onClearAll} 
            style={[styles.clearAllBtn, { backgroundColor: isDark ? 'rgba(255, 69, 58, 0.1)' : '#fee2e2' }]}
          >
            <MaterialIcons name="filter-list-off" size={20} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={modalVisible} animationType="fade" transparent statusBarTranslucent>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filtrar por Categoria</Text>
              <TouchableOpacity onPress={() => { onCategoryChange(null); setModalVisible(false); }}>
                <Text style={{ color: colors.danger, fontWeight: '700' }}>Limpar</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={visibleCategories}
              numColumns={3}
              keyExtractor={(item) => item.name}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedCategory === item.name;
                return (
                  <TouchableOpacity 
                    style={styles.catItem}
                    onPress={() => { onCategoryChange(item.name); setModalVisible(false); }}
                  >
                    <View style={[
                      styles.catIcon, 
                      { backgroundColor: isSelected ? colors.primary : (isDark ? '#334155' : '#f1f5f9') }
                    ]}>
                      <MaterialIcons 
                        name={item.icon as any} 
                        size={22} 
                        color={isSelected ? '#FFF' : colors.primary} 
                      />
                    </View>
                    <Text 
                      numberOfLines={1} 
                      style={[
                        styles.catName, 
                        { color: isSelected ? colors.text : colors.textSub, fontWeight: isSelected ? '800' : '500' }
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchBar: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    height: 48, 
    borderRadius: 16, 
    borderWidth: 1 
  },
  input: { flex: 1, fontSize: 14, marginLeft: 8, height: '100%' },
  divider: { width: 1, height: 20, marginHorizontal: 8 },
  typeActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniChip: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  clearAllBtn: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxHeight: '60%', borderRadius: 28, padding: 24, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  catItem: { flex: 1/3, alignItems: 'center', marginBottom: 20 },
  catIcon: { width: 54, height: 54, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  catName: { fontSize: 11, textAlign: 'center' }
});