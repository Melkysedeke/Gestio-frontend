import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, TextInput, TouchableOpacity, StyleSheet, Modal, 
  Text, FlatList, TouchableWithoutFeedback, Keyboard, ActivityIndicator 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

import { database } from '../src/database';
import { Q } from '@nozbe/watermelondb';
import Category from '../src/database/models/Category'; 
import { useAuthStore } from '../src/stores/authStore';

// 🚀 Importação do nosso utilitário de vibração
import { triggerHaptic, triggerSelectionHaptic } from '@/src/utils/haptics';

interface Props {
  searchText: string;
  onSearchChange: (text: string) => void;
  selectedType: 'all' | 'income' | 'expense';
  onTypeChange: (type: 'all' | 'income' | 'expense') => void;
  selectedCategories: string[]; 
  onCategoriesChange: (cats: string[]) => void; 
  onClearAll: () => void;
}

export default function TransactionFilters({ 
  searchText, onSearchChange, selectedType, onTypeChange, selectedCategories, onCategoriesChange, onClearAll 
}: Props) {
  const { colors, isDark } = useThemeColor();
  const user = useAuthStore(state => state.user); 
  
  const [modalVisible, setModalVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const hasActiveFilters = searchText.length > 0 || selectedType !== 'all' || selectedCategories.length > 0;

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const categoriesCollection = database.get<Category>('categories');
      let query = user?.id 
        ? categoriesCollection.query(Q.or(Q.where('user_id', null), Q.where('user_id', user.id)))
        : categoriesCollection.query(Q.where('user_id', null));

      const fetchedCategories = await query.fetch();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (modalVisible && categories.length === 0) {
      fetchCategories();
    }
  }, [modalVisible]);

  const visibleCategories = useMemo(() => {
    if (selectedType === 'all') return categories;
    return categories.filter(cat => cat.type === selectedType || cat.type === 'debts' || cat.type === 'goals');
  }, [selectedType, categories]);

  const toggleCategory = (catName: string) => {
    triggerSelectionHaptic(); // 🚀 Feedback sutil ao tocar em cada categoria
    if (selectedCategories.includes(catName)) {
      onCategoriesChange(selectedCategories.filter(c => c !== catName));
    } else {
      onCategoriesChange([...selectedCategories, catName]);
    }
  };

  const handleOpenCategories = () => {
    triggerHaptic(); // 🚀 Feedback de abertura
    setModalVisible(true);
  };

  const handleTypeChange = (type: 'all' | 'income' | 'expense') => {
    triggerSelectionHaptic(); // 🚀 Feedback de troca de pílula
    onTypeChange(type);
  };

  const handleClearAll = () => {
    triggerHaptic(); // 🚀 Feedback de ação de "limpeza"
    onClearAll();
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={20} color={colors.textSub} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Buscar..."
            placeholderTextColor={colors.textSub}
            value={searchText}
            onChangeText={onSearchChange}
            numberOfLines={1}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss} 
          />
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.typeActions}>
            <TouchableOpacity 
              onPress={handleOpenCategories} 
              style={[styles.miniChip, { backgroundColor: selectedCategories.length > 0 ? colors.primary : 'transparent', borderColor: colors.border }]}
            >
              <MaterialIcons name="label" size={16} color={selectedCategories.length > 0 ? '#FFF' : colors.textSub} />
              {selectedCategories.length > 1 && (
                <View style={[styles.badge, { borderColor: colors.card }]}>
                  <Text style={styles.badgeText}>{selectedCategories.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleTypeChange(selectedType === 'income' ? 'all' : 'income')} 
              style={[styles.miniChip, { backgroundColor: selectedType === 'income' ? colors.success : 'transparent', borderColor: colors.border }]}
            >
              <MaterialIcons name="arrow-downward" size={16} color={selectedType === 'income' ? '#FFF' : colors.success} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleTypeChange(selectedType === 'expense' ? 'all' : 'expense')} 
              style={[styles.miniChip, { backgroundColor: selectedType === 'expense' ? colors.danger : 'transparent', borderColor: colors.border }]}
            >
              <MaterialIcons name="arrow-upward" size={16} color={selectedType === 'expense' ? '#FFF' : colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {hasActiveFilters && (
          <TouchableOpacity 
            onPress={handleClearAll} 
            style={[styles.clearAllBtn, { backgroundColor: isDark ? 'rgba(255, 69, 58, 0.15)' : '#fee2e2' }]}
          >
            <MaterialIcons name="filter-list-off" size={20} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={modalVisible} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Filtrar Categoria</Text>
                  {selectedCategories.length > 0 && (
                    <TouchableOpacity onPress={() => { triggerHaptic(); onCategoriesChange([]); }}>
                      <Text style={{ color: colors.danger, fontWeight: '700' }}>Limpar ({selectedCategories.length})</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {loadingCategories ? (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator color={colors.primary} size="large" />
                  </View>
                ) : (
                  <FlatList
                    data={visibleCategories}
                    numColumns={3}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }} 
                    renderItem={({ item }) => {
                      const isSelected = selectedCategories.includes(item.name);
                      return (
                        <TouchableOpacity 
                          style={styles.catItem}
                          onPress={() => toggleCategory(item.name)}
                          activeOpacity={0.7}
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
                )}

                <TouchableOpacity 
                  style={[styles.applyButton, { backgroundColor: colors.primary }]}
                  onPress={() => { triggerHaptic(); setModalVisible(false); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyButtonText}>
                    {selectedCategories.length > 0 ? `Aplicar ${selectedCategories.length} filtros` : 'Fechar'}
                  </Text>
                </TouchableOpacity>

              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' }, 
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, height: 48, borderRadius: 16, borderWidth: 1.5 },
  input: { flex: 1, fontSize: 14, marginLeft: 8, height: '100%' },
  divider: { width: 1.5, height: 20, marginHorizontal: 6, opacity: 0.3 },
  typeActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniChip: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, position: 'relative' },
  clearAllBtn: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 1.5 },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxHeight: '75%', borderRadius: 28, padding: 24, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  loaderContainer: { paddingVertical: 40, alignItems: 'center' },
  catItem: { flex: 1/3, alignItems: 'center', marginBottom: 20 },
  catIcon: { width: 54, height: 54, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  catName: { fontSize: 11, textAlign: 'center', paddingHorizontal: 4 },
  applyButton: { height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  applyButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});