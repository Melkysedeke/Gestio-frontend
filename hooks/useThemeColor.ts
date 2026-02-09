import { useThemeStore } from '../src/stores/themeStore'; 
import { COLORS } from '../constants/colors';

export function useThemeColor() {
  const theme = useThemeStore((state) => state.theme);
  
  const colors = COLORS[theme];
  
  return { 
    colors, 
    theme, 
    isDark: theme === 'dark' 
  };
}