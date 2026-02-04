import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  last_opened_wallet?: number | null;
  theme?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  signIn: (user: User, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserSetting: (settings: Partial<User>) => Promise<void>;
  loadStorageData: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  signIn: async (user, token) => {
    console.log("=== AUTH STORE RECEBEU ===", user);
    try {
      api.defaults.headers.authorization = `Bearer ${token}`;
      await AsyncStorage.multiSet([
        ['@gestio:user', JSON.stringify(user)],
        ['@gestio:token', token],
      ]);
      set({ user, token });
    } catch (error) {
      console.error('Erro ao salvar login:', error);
    }
  },

  signOut: async () => {
    try {
      await AsyncStorage.multiRemove(['@gestio:user', '@gestio:token']);
      api.defaults.headers.authorization = '';
      set({ user: null, token: null });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  },

  updateUserSetting: async (newSettings) => {
    set((state) => {
      const updatedUser = state.user ? { ...state.user, ...newSettings } : null;
      
      if (updatedUser) {
        AsyncStorage.setItem('@gestio:user', JSON.stringify(updatedUser)).catch(err => 
          console.error('Erro ao persistir settings atualizadas:', err)
        );
        if (newSettings.last_opened_wallet) {
          api.patch('/users/settings', { 
            last_opened_wallet: newSettings.last_opened_wallet 
          }).catch(err => console.log("Apenas aviso: Não sincronizou com o servidor agora, mas salvou local."));
        }
      }
      return { user: updatedUser };
    });
  },

  loadStorageData: async () => {
    try {
      const [storedUser, storedToken] = await AsyncStorage.multiGet([
        '@gestio:user',
        '@gestio:token',
      ]);

      if (storedToken[1] && storedUser[1]) {
        const user = JSON.parse(storedUser[1]);
        console.log("=== REIDRATANDO DADOS DO STORAGE ===", user);
        api.defaults.headers.authorization = `Bearer ${storedToken[1]}`;
        set({ 
          token: storedToken[1], 
          user, 
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Erro ao carregar storage:', error);
      set({ isLoading: false });
    }
  },
}));