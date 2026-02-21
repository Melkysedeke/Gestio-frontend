import { create } from 'zustand';
import { database } from '../database'; 
import User from '../database/models/User'; 
import { seedCategories } from '../database/seeds'; 
import { useThemeStore } from './themeStore'; 

interface AuthState {
  user: User | null;
  isLoading: boolean;
  hasWallets: boolean;
  hideValues: boolean;
  setHasWallets: (value: boolean) => void;
  loadStorageData: () => Promise<void>;
  signInAsGuest: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserSetting: (newSettings: Partial<any>) => Promise<void>;
  setUser: (user: User | null) => void;
  runSeed: () => Promise<void>;
  purgeDatabase: () => Promise<void>;
  toggleHideValues: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  hasWallets: false,
  hideValues: false,
  setHasWallets: (value) => set({ hasWallets: value }),
  setUser: (user) => set({ user }),
  toggleHideValues: () => set((state) => ({ hideValues: !state.hideValues })),
  
  runSeed: async () => {
    try {
      await seedCategories();
    } catch (error) {
      console.error('Erro ao rodar seed de categorias:', error);
    }
  },

  loadStorageData: async () => {
    try {
      const usersCollection = database.get<User>('users');
      const users = await usersCollection.query().fetch();

      if (users.length > 0) {
        const currentUser = users[0];
        const walletsCount = await database.get('wallets').query().fetchCount();
        await get().runSeed();

        set({ 
          user: currentUser, 
          isLoading: false, 
          hasWallets: walletsCount > 0 
        });
      } else {
        set({ user: null, isLoading: false, hasWallets: false });
      }
    } catch (error) {
      console.error('Erro ao carregar storage:', error);
      set({ isLoading: false, hasWallets: false });
    }
  },

  signInAsGuest: async (name: string) => {
    try {
      let newUser: User | undefined;
      await database.write(async () => {
        const usersCollection = database.get<User>('users');
        newUser = await usersCollection.create((u: any) => {
          u.name = name;
          u.email = `guest_${Date.now()}@local`;
          u.avatar = 'default';
          u.password = '';
          u.settings = { notifications: true, last_opened_wallet: null };
        });
      });

      await get().runSeed();
      if (newUser) set({ user: newUser, hasWallets: false });
    } catch (error) {
      console.error('Erro ao criar usuário local:', error);
    }
  },

  updateUserSetting: async (newSettings: Partial<any>) => {
    const currentUser = get().user;
    if (!currentUser) return;

    try {
      await database.write(async () => {
        await currentUser.update((u: any) => {
          if (newSettings.name) u.name = newSettings.name;
          if (newSettings.email) u.email = newSettings.email;
          if (newSettings.avatar) u.avatar = newSettings.avatar;

          const oldSettings = u.settings || {};
          u.settings = { ...oldSettings, ...newSettings };
        });
      });

      if (newSettings.theme) {
        useThemeStore.getState().setTheme(newSettings.theme);
      }

      // 🔥 O TRUQUE DE MESTRE:
      // Criamos um clone exato do usuário com uma NOVA referência de memória,
      // mas que herda todas as funções originais do WatermelonDB.
      // O Zustand vê a nova referência e atualiza o MainHeader e o Settings na mesma hora!
      const userClone = Object.assign(
        Object.create(Object.getPrototypeOf(currentUser)),
        currentUser
      );
      
      set({ user: userClone });

    } catch (error) {
      console.error('Erro ao atualizar configurações do usuário:', error);
      throw error;
    }
  },

  purgeDatabase: async () => {
    try {
      await database.write(async () => {
        // Buscamos os registros para deletar
        const users = await database.get<User>('users').query().fetch();
        const wallets = await database.get('wallets').query().fetch();
        
        // Destruição permanente no SQLite
        const allRecords = [...users, ...wallets];
        for (const record of allRecords) {
          await record.destroyPermanently();
        }
      });

      // Limpa o estado da memória
      set({ user: null, hasWallets: false });
    } catch (error) {
      console.error('Erro ao purgar banco:', error);
      throw error;
    }
  },

  signOut: async () => {
    set({ user: null, hasWallets: false });
  },
}));