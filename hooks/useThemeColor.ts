import { useColorScheme } from 'react-native';
import { useThemeStore } from '../src/stores/themeStore'; 
import { COLORS } from '../constants/colors';

export function useThemeColor() {
  const userPref = useThemeStore((state) => state.theme);
  
  const systemScheme = useColorScheme(); // retorna 'light', 'dark' ou null

  const activeMode = userPref === 'system' 
    ? (systemScheme === 'dark' ? 'dark' : 'light') 
    : userPref;

  return { 
    colors: COLORS[activeMode], 
    isDark: activeMode === 'dark',
    theme: activeMode, // O tema que está sendo EXIBIDO
    userSetting: userPref // A configuração que o usuário SALVOU
  };
}