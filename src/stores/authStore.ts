import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../database'; 
import { Q } from '@nozbe/watermelondb'; 
import User from '../database/models/User'; 
import { seedCategories } from '../database/seeds'; 
import { useThemeStore } from './themeStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  hasWallets: boolean;
  hideValues: boolean;
  lastSyncTime: number;
  setSession: (user: any, token: string) => void;
  setLastSyncTime: (time: number) => void;
  setHasWallets: (value: boolean) => void;
  loadStorageData: () => Promise<void>;
  signInAsGuest: (name: string) => Promise<void>;
  signIn: (backendUser: any, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserSetting: (newSettings: Partial<any>) => Promise<void>;
  setUser: (user: User | null) => void;
  runSeed: () => Promise<void>;
  purgeDatabase: () => Promise<void>;
  toggleHideValues: () => void;
}

const TOKEN_KEY = '@Gestio:token';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  hasWallets: false,
  hideValues: false,
  lastSyncTime: Date.now(),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
  setHasWallets: (value) => set({ hasWallets: value }),
  setUser: (user) => set({ user }),
  toggleHideValues: () => set((state) => ({ hideValues: !state.hideValues })),
  
  setSession: (user, token) => {
    set({ user, token }); 
    // Se você tiver uma variável como 'isAuthenticated: true', adicione aqui também!
  },

  runSeed: async () => {
    try {
      const count = await database.get('categories').query().fetchCount();
      if (count === 0) {
        await seedCategories();
      }
    } catch (error) {
      console.error('Erro ao rodar seed de categorias:', error);
    }
  },

  loadStorageData: async () => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const usersCollection = database.get<User>('users');
      const users = await usersCollection.query().fetch();

      if (users.length > 0 && storedToken) {
        const currentUser = users[0];
        const walletsCount = await database.get('wallets').query().fetchCount();

        set({ 
          user: currentUser, 
          token: storedToken,
          isLoading: false, 
          hasWallets: walletsCount > 0 
        });
      } else {
        const currentUser = users.length > 0 ? users[0] : null;
        set({ user: currentUser, token: null, isLoading: false, hasWallets: false });
      }
    } catch (error) {
      console.error('Erro ao carregar storage:', error);
      set({ isLoading: false, hasWallets: false });
    }
  },

  signIn: async (backendUser: any, token: string) => {
    try {
      const guestUser = get().user;
      const isGuestMigration = guestUser && (guestUser.email.includes('@local') || !get().token);

      await AsyncStorage.setItem(TOKEN_KEY, token);

      let localUser: User | undefined;
      
      await database.write(async () => {
        const usersCollection = database.get<User>('users');
        const existingUsers = await usersCollection.query(Q.where('email', backendUser.email)).fetch();

        if (existingUsers.length > 0) {
          localUser = existingUsers[0];
          await localUser.update((u: any) => {
            u.name = backendUser.name || localUser?.name;
            u.avatar = backendUser.avatar || localUser?.avatar;
          });
        } else {
          localUser = await usersCollection.create((u: any) => {
            u._raw.id = backendUser.id; // Sincroniza ID com o Backend
            u.email = backendUser.email;
            u.name = backendUser.name || 'Usuário Gestio';
            u.avatar = backendUser.avatar || 'default';
            u.password = ''; 
            u.settings = backendUser.settings || { notifications: true, last_opened_wallet: null };
          });
        }

        // 🚀 LÓGICA DE MIGRAÇÃO DE DADOS DO CONVIDADO
        if (isGuestMigration && localUser && guestUser) {
          
          const tablesToMigrate = ['wallets', 'transactions', 'categories', 'debts', 'goals'];
          
          for (const tableName of tablesToMigrate) {
            const collection = database.get(tableName);
            const records = await collection.query().fetch();
            
            for (const record of records) {
              await record.update((r: any) => {
                // Atribui o novo ID do usuário aos registros antigos
                if ('user_id' in r) r.user_id = backendUser.id;
              });
            }
          }
          
          // Remove o registro do "Convidado" para manter apenas o "Oficial"
          if (guestUser.id !== localUser.id) {
            await guestUser.destroyPermanently();
          }
        }
      });

      const walletsCount = await database.get('wallets').query().fetchCount();

      set({ 
        user: localUser, 
        token: token, 
        hasWallets: walletsCount > 0 
      });
      
    } catch (error) {
      console.error('Erro no fluxo de login/migração:', error);
      throw error;
    }
  },

 signInAsGuest: async (name: string) => {
  try {
    const usersCollection = database.get<User>('users');
    const existingUsers = await usersCollection.query().fetch();
    if (existingUsers.length > 0) {
      const currentUser = existingUsers[0];
      const walletsCount = await database.get('wallets').query().fetchCount();
      set({ 
        user: currentUser, 
        token: null, 
        hasWallets: walletsCount > 0 
      });
      return;
    }
    let newUser: User | undefined;
    await AsyncStorage.removeItem(TOKEN_KEY);
    await database.write(async () => {
      newUser = await usersCollection.create((u: any) => {
        u.name = name;
        u.email = `guest_${Date.now()}@local`;
        u.avatar = 'default';
        u.password = '';
        u.settings = { notifications: true, last_opened_wallet: null };
      });
    });
    await get().runSeed();
    if (newUser) {
      set({ user: newUser, token: null, hasWallets: false });
    }
  } catch (error) {
    console.error('Erro ao criar usuário local:', error);
  }
},

  updateUserSetting: async (newSettings: Partial<any>) => {
    const currentUser = get().user;
    if (!currentUser) return;

    try {
      const { name, email, avatar, ...actualSettings } = newSettings;

      await database.write(async () => {
        await currentUser.update((u: any) => {
          if (name) u.name = name;
          if (email) u.email = email;
          if (avatar) u.avatar = avatar;
          const oldSettings = u.settings || {};
          if (Object.keys(actualSettings).length > 0) {
            u.settings = { ...oldSettings, ...actualSettings };
          }
        });
      });
      if (actualSettings.theme) {
        useThemeStore.getState().setTheme(actualSettings.theme);
      }
      const userClone = Object.assign(Object.create(Object.getPrototypeOf(currentUser)), currentUser);
      set({ user: userClone });
      
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw error;
    }
  },

  purgeDatabase: async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await database.write(async () => {
        await database.unsafeResetDatabase();
      });

      set({ user: null, token: null, hasWallets: false });
    } catch (error) {
      console.error('Erro ao purgar banco:', error);
    }
  },

  signOut: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await get().purgeDatabase(); 
    set({ user: null, token: null, hasWallets: false });
  },
}));