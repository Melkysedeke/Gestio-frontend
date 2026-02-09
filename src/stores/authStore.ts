import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useThemeStore } from './themeStore'; // <--- IMPORTANTE: Importar o store de tema

interface UserSettings {
  theme?: 'light' | 'dark';
  notifications?: boolean;
  last_opened_wallet?: number;
  [key: string]: any;
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  // A nova coluna JSONB do banco vem aqui
  settings?: UserSettings;
  // Mantemos isso para facilitar o acesso no front (atalho)
  last_opened_wallet?: number | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  hasWallets: boolean;
  setHasWallets: (value: boolean) => void;
  // Atualizei a assinatura do signIn para ser mais genérica se precisar
  signIn: (user: User, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Aceita qualquer pedaço do objeto User ou Settings
  updateUserSetting: (settings: Partial<User> & Partial<UserSettings>) => Promise<void>;
  loadStorageData: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  hasWallets: false,

  setHasWallets: (value: boolean) => set({ hasWallets: value }),

  signIn: async (user, token) => {
    try {
      api.defaults.headers.authorization = `Bearer ${token}`;
      
      // --- LÓGICA NOVA: Normalização ---
      // Se o backend mandar settings.last_opened_wallet, copiamos para a raiz do user
      // para manter compatibilidade com seu código existente que usa user.last_opened_wallet
      if (user.settings?.last_opened_wallet) {
        user.last_opened_wallet = user.settings.last_opened_wallet;
      }

      // Sincroniza o Tema imediatamente ao logar
      if (user.settings?.theme) {
        useThemeStore.getState().setTheme(user.settings.theme);
      }
      // ---------------------------------

      await AsyncStorage.multiSet([
        ['@gestio:user', JSON.stringify(user)],
        ['@gestio:token', token],
      ]);
      
      set({ user, token, hasWallets: false }); 
    } catch (error) {
      console.error('Erro crítico ao salvar login:', error);
    }
  },

  signOut: async () => {
    try {
      await AsyncStorage.multiRemove(['@gestio:user', '@gestio:token']);
      api.defaults.headers.authorization = ''; 
      
      // Opcional: Voltar para tema light ao sair
      useThemeStore.getState().setTheme('light');
      
      set({ user: null, token: null, hasWallets: false });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  },

  updateUserSetting: async (newSettings) => {
    // 1. Atualização Otimista (Local)
    set((state) => {
      if (!state.user) return {};

      // Mescla as configurações novas tanto na raiz quanto dentro de settings
      const updatedUser = { 
        ...state.user, 
        ...newSettings, // Atualiza raiz (ex: last_opened_wallet)
        settings: {
            ...state.user.settings,
            ...newSettings // Atualiza o JSON interno (ex: theme)
        }
      };
      
      // Persiste localmente
      AsyncStorage.setItem('@gestio:user', JSON.stringify(updatedUser)).catch(console.error);
      
      return { user: updatedUser };
    });

    // 2. Sincronização com Backend (Universal)
    try {
        // Agora mandamos o objeto newSettings inteiro. 
        // O backend aceita { "theme": "dark" } ou { "last_opened_wallet": 1 } genericamente.
        await api.patch('/users/settings', newSettings);
    } catch (err: any) {
        console.log("Sync offline/erro:", err.message);
    }
  },

  loadStorageData: async () => {
    try {
      const [storedUser, storedToken] = await AsyncStorage.multiGet(['@gestio:user', '@gestio:token']);

      if (storedToken[1] && storedUser[1]) {
        const user = JSON.parse(storedUser[1]);
        const token = storedToken[1];

        api.defaults.headers.authorization = `Bearer ${token}`;
        
        // --- LÓGICA NOVA: Recuperar Tema ---
        // Se o usuário reabrir o app, aplicamos o tema salvo
        if (user.settings?.theme) {
            useThemeStore.getState().setTheme(user.settings.theme);
        }
        // -----------------------------------
        
        console.log("=== DADOS RECUPERADOS ===", user.name);
        set({ token, user, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Erro ao carregar storage:', error);
      set({ isLoading: false });
    }
  },
}));