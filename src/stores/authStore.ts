import { create } from 'zustand';
import { database } from '../database'; 
import { Q } from '@nozbe/watermelondb'; // 🚀 Importação do Q adicionada
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
  // 🚀 Nova função signIn adicionada à interface
  signIn: (supabaseUser: any, token: string) => Promise<void>;
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

  // 🚀 A NOVA FUNÇÃO DE LOGIN OFICIAL (SUPABASE -> WATERMELONDB)
  // signIn: async (supabaseUser: any, token: string) => {
  //   try {
  //     let localUser: User | undefined;
      
  //     await database.write(async () => {
  //       const usersCollection = database.get<User>('users');
        
  //       // 1. Verifica se o usuário já existe no banco local pelo email
  //       const existingUsers = await usersCollection.query(Q.where('email', supabaseUser.email)).fetch();

  //       if (existingUsers.length > 0) {
  //         // Se já existe (ex: ele deslogou e logou de novo), atualiza os dados
  //         localUser = existingUsers[0];
  //         await localUser.update((u: any) => {
  //           u.name = supabaseUser.user_metadata?.name || localUser?.name;
  //           u.avatar = supabaseUser.user_metadata?.avatar || localUser?.avatar;
  //         });
  //       } else {
  //         // 2. Se for o primeiro login/registro neste celular, cria no banco local
  //         localUser = await usersCollection.create((u: any) => {
  //           u.email = supabaseUser.email;
  //           u.name = supabaseUser.user_metadata?.name || 'Usuário Gestio';
  //           u.avatar = supabaseUser.user_metadata?.avatar || 'default';
  //           u.password = ''; // Não salvamos senhas locais agora que temos o Supabase!
  //           u.settings = { notifications: true, last_opened_wallet: null };
  //         });
  //       }
  //     });

  //     // 3. Roda os seeds básicos (Categorias, etc)
  //     await get().runSeed();
  //     const walletsCount = await database.get('wallets').query().fetchCount();

  //     // 4. Salva no estado global e libera o app
  //     if (localUser) {
  //       set({ user: localUser, hasWallets: walletsCount > 0 });
  //     }
  //   } catch (error) {
  //     console.error('Erro ao salvar usuário da nuvem no banco local:', error);
  //     throw error;
  //   }
  // },

  signIn: async (backendUser: any, token: string) => {
    try {
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
            u.email = backendUser.email;
            u.name = backendUser.name || 'Usuário Gestio';
            u.avatar = backendUser.avatar || 'default';
            u.password = ''; 
            u.settings = backendUser.settings || { notifications: true, last_opened_wallet: null };
          });
        }
      });

      await get().runSeed();
      const walletsCount = await database.get('wallets').query().fetchCount();

      if (localUser) {
        set({ user: localUser, hasWallets: walletsCount > 0 });
      }
    } catch (error) {
      console.error('Erro ao salvar usuário do backend no banco local:', error);
      throw error;
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
        const users = await database.get<User>('users').query().fetch();
        const wallets = await database.get('wallets').query().fetch();
        
        const allRecords = [...users, ...wallets];
        for (const record of allRecords) {
          await record.destroyPermanently();
        }
      });

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