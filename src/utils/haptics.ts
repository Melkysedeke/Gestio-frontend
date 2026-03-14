import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../stores/authStore';

/**
 * Dispara um feedback tátil de impacto (Light, Medium, Heavy)
 * Respeita a configuração global do usuário no AuthStore.
 */
export const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  const isEnabled = useAuthStore.getState().hapticsEnabled;

  if (isEnabled) {
    Haptics.impactAsync(style);
  }
};

/**
 * Dispara um feedback de notificação (Success, Warning, Error)
 */
export const triggerNotificationHaptic = (type: Haptics.NotificationFeedbackType) => {
  const isEnabled = useAuthStore.getState().hapticsEnabled;

  if (isEnabled) {
    Haptics.notificationAsync(type);
  }
};

/**
 * Atalho para feedback de seleção (vibração bem curta e sutil)
 */
export const triggerSelectionHaptic = () => {
  const isEnabled = useAuthStore.getState().hapticsEnabled;

  if (isEnabled) {
    Haptics.selectionAsync();
  }
};