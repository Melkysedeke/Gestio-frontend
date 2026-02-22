import 'react-native-url-polyfill/auto'; // ⚠️ Obrigatório no React Native para o Supabase funcionar
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Pegue essas duas chaves lá no painel do Supabase em:
// Project Settings -> API -> Project URL / Project API Keys (anon, public)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Guarda o login para não deslogar ao fechar o app
    autoRefreshToken: true, // Renova o token de segurança automaticamente
    persistSession: true,
    detectSessionInUrl: false, // Só é usado em web, então deixamos false no mobile
  },
});