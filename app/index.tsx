// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function Index() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { colors } = useThemeColor();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});