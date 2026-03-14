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

// 🚀 1. Atualizamos as Props para trabalhar com Array
interface Props {
  searchText: string;
  onSearchChange: (text: string) => void;
  selectedType: 'all' | 'income' | 'expense';
  onTypeChange: (type: 'all' | 'income' | 'expense') => void;
  selectedCategories: string[]; // Agora é um array!
  onCategoriesChange: (cats: string[]) => void; // Atualiza o array inteiro
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

  // Considera ativo se tiver texto, tipo diferente de 'all' ou pelo menos 1 categoria selecionada
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

  const getChipStyle = (isActive: boolean) => ({
    backgroundColor: isActive ? colors.primary : (isDark ? 'rgba(255,255,255,0.05)' : '#FFF'),
    borderColor: isActive ? colors.primary : colors.border,
  });

  // 🚀 2. Função inteligente para adicionar ou remover da lista de seleção
  const toggleCategory = (catName: string) => {
    if (selectedCategories.includes(catName)) {
      // Se já está na lista, remove
      onCategoriesChange(selectedCategories.filter(c => c !== catName));
    } else {
      // Se não está, adiciona
      onCategoriesChange([...selectedCategories, catName]);
    }
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
              onPress={() => setModalVisible(true)} 
              style={[styles.miniChip, getChipStyle(selectedCategories.length > 0)]}
            >
              <MaterialIcons name="label" size={16} color={selectedCategories.length > 0 ? '#FFF' : colors.textSub} />
              
              {/* 🚀 3. Badge indicador de quantidade (Opcional, mas fica lindo) */}
              {selectedCategories.length > 1 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{selectedCategories.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => onTypeChange(selectedType === 'income' ? 'all' : 'income')} 
              style={[styles.miniChip, getChipStyle(selectedType === 'income')]}
            >
              <MaterialIcons name="arrow-downward" size={16} color={selectedType === 'income' ? '#FFF' : colors.success} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => onTypeChange(selectedType === 'expense' ? 'all' : 'expense')} 
              style={[styles.miniChip, getChipStyle(selectedType === 'expense')]}
            >
              <MaterialIcons name="arrow-upward" size={16} color={selectedType === 'expense' ? '#FFF' : colors.danger} />
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

      <Modal visible={modalVisible} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Filtrar Categoria</Text>
                  
                  {selectedCategories.length > 0 && (
                    <TouchableOpacity onPress={() => onCategoriesChange([])}>
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
                      const isSelected = selectedCategories.includes(item.name); // 🚀 Verifica se está no array
                      return (
                        <TouchableOpacity 
                          style={styles.catItem}
                          onPress={() => toggleCategory(item.name)} // 🚀 Não fecha mais o modal ao clicar!
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

                {/* 🚀 4. Botão explícito para concluir a seleção múltipla */}
                <TouchableOpacity 
                  style={[styles.applyButton, { backgroundColor: colors.primary }]}
                  onPress={() => setModalVisible(false)}
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
  container: { marginVertical: 0, width: '100%' }, 
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, height: 48, borderRadius: 16, borderWidth: 1 },
  input: { flex: 1, fontSize: 14, marginLeft: 8, height: '100%' },
  divider: { width: 1, height: 20, marginHorizontal: 6 },
  typeActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniChip: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, position: 'relative' },
  clearAllBtn: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  
  // Badge flutuante
  badge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#FFF' },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxHeight: '75%', minHeight: 250, borderRadius: 28, padding: 24, paddingBottom: 24, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  catItem: { flex: 1/3, alignItems: 'center', marginBottom: 20 },
  catIcon: { width: 54, height: 54, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  catName: { fontSize: 11, textAlign: 'center', paddingHorizontal: 4 },

  applyButton: { height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  applyButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});