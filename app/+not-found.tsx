import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Linking, StatusBar } from 'react-native'; 
// 🚀 1. Importações da SafeArea
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import SubHeader from '@/components/SubHeader';

export default function NotFoundScreen() {
  const { colors, isDark } = useThemeColor();
  const router = useRouter();
  // 🚀 2. Hook de insets
  const insets = useSafeAreaInsets();

  // Cores dinâmicas para o fundo da tela
  const backgroundColor = isDark ? '#111921' : '#f6f7f8';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* 🚀 3. SafeAreaView protegendo o topo */}
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        
        {/* Header */}
        <SubHeader title="Eita!" />

        {/* Main Content */}
        <View style={[styles.main, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          
          {/* Illustration Area */}
          <View style={styles.illustrationContainer}>
            <View style={[styles.circleBg, { backgroundColor: `${colors.primary}20` }]}>
              <MaterialIcons name="find-in-page" size={120} color={colors.primary} style={{ opacity: 0.2 }} />
              <View style={styles.centerIconOverlay}>
                <MaterialIcons name="search-off" size={70} color={colors.primary} />
              </View>
            </View>
            
            {/* Decorative Elements */}
            <View style={[styles.badgeHigh, { backgroundColor: `${colors.primary}30` }]}>
              <MaterialIcons name="priority-high" size={20} color={colors.primary} />
            </View>
            <View style={[styles.badgeClose, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
              <MaterialIcons name="close" size={14} color={isDark ? '#94A3B8' : '#64748B'} />
            </View>
          </View>

          {/* Error Message */}
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Esta tela não existe.</Text>
            <Text style={[styles.description, { color: colors.textSub }]}>
              Desculpe, a página que você está procurando não foi encontrada ou foi movida para outro endereço.
            </Text>
          </View>

          {/* Call to Action */}
          <TouchableOpacity 
            onPress={() => router.replace('/(tabs)')}
            style={[
              styles.button, 
              { 
                backgroundColor: colors.primary, 
                shadowColor: colors.primary 
              }
            ]}
            activeOpacity={0.8}
          >
            <MaterialIcons name="home" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Voltar para o início</Text>
          </TouchableOpacity>

          {/* Botão de Relatar Problema */}
          <TouchableOpacity 
            style={styles.reportButton}
            onPress={() => Linking.openURL('mailto:suporte@gestio.com?subject=Ajuda Gestio')}
          >
            <Text style={[styles.reportText, { color: colors.primary }]}>Relatar um problema</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  illustrationContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  circleBg: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeHigh: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeClose: {
    position: 'absolute',
    bottom: 20,
    left: -10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#FFFFFF', 
    fontSize: 16,
    fontWeight: '700',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  reportButton: {
    marginTop: 24,
    padding: 8, 
  },
  reportText: {
    fontSize: 14,
    fontWeight: '600',
  },
});