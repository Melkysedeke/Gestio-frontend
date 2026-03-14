import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  withDelay,
  withRepeat,
  Easing,
  cancelAnimation 
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor';

const { width } = Dimensions.get('window');
const LOGO_SOURCE = require('../assets/images/adaptive-icon.png');

const SPINNER_SIZE = 136; 
const SPINNER_THICKNESS = 4; 

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const { colors, isDark } = useThemeColor();
  const mounted = useRef(true);

  const logoScale = useSharedValue(0.1); 
  const logoOpacity = useSharedValue(0);
  const spinnerRotation = useSharedValue(0); 
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const containerOpacity = useSharedValue(1);
  const blobScale = useSharedValue(1);

  const startLogoAnimation = () => {
    logoScale.value = withSpring(1, { damping: 12, stiffness: 120 });
    logoOpacity.value = withTiming(1, { duration: 300 });
  };

  const startExitAnimation = () => {
    containerOpacity.value = withTiming(0, { duration: 500 });
    logoScale.value = withTiming(1.5, { duration: 500 });

    setTimeout(() => {
      if (mounted.current) onFinish();
    }, 510); 
  };

  useEffect(() => {
    mounted.current = true;

    // Rotação linear infinita
    spinnerRotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }), 
      -1, 
      false 
    );
    
    textOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    textTranslateY.value = withDelay(400, withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) }));
    blobScale.value = withRepeat(withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }), -1, true);

    const logoTimeout = setTimeout(startLogoAnimation, 500);
    const exitTimeout = setTimeout(startExitAnimation, 3000);

    return () => {
      mounted.current = false;
      clearTimeout(logoTimeout);
      clearTimeout(exitTimeout);
      cancelAnimation(logoScale);
      cancelAnimation(logoOpacity);
      cancelAnimation(spinnerRotation);
      cancelAnimation(textOpacity);
      cancelAnimation(textTranslateY);
      cancelAnimation(containerOpacity);
      cancelAnimation(blobScale);
    };
  }, []);

  const logoPopStyle = useAnimatedStyle(() => ({ 
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value
  }));

  const spinnerRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }]
  }));

  const textStyle = useAnimatedStyle(() => ({ 
    opacity: textOpacity.value, 
    transform: [{ translateY: textTranslateY.value }] 
  }));

  const containerStyle = useAnimatedStyle(() => ({ 
    opacity: containerOpacity.value 
  }));

  const blobStyle = useAnimatedStyle(() => ({ 
    transform: [{ scale: blobScale.value }] 
  }));

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background }, containerStyle]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={colors.background} 
        translucent
      />
      
      <Animated.View style={[styles.blobBottom, { backgroundColor: colors.primary }, blobStyle]} />
      <Animated.View style={[styles.blobTop, { backgroundColor: colors.primary }, blobStyle]} />

      <View style={styles.contentContainer}>
        <Animated.View style={[styles.logoWrapper, logoPopStyle]}>
          <View style={[styles.logoGlow, { backgroundColor: colors.primary }]} />
          
          <Animated.View style={[styles.spinnerWrapper, spinnerRotateStyle]}>
            <View style={styles.spinnerHalfClipper}>
               <View style={[styles.solidRing, { borderColor: colors.primary }]} />
            </View>
          </Animated.View>
          
          <View style={[
              styles.logoContainer, 
              { 
                backgroundColor: colors.card, 
                shadowColor: colors.primary 
              }
            ]}>
            <Animated.Image 
                source={LOGO_SOURCE}
                style={styles.logoImage}
                resizeMode="contain"
            /> 
          </View>
        </Animated.View>

        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={[styles.title, { color: colors.text }]}>Gestio</Text>
          <Text style={[styles.subtitle, { color: colors.textSub }]}>Gestão de Finanças Pessoais</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { 
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 9999 
  },
  blobBottom: { 
    position: 'absolute', 
    bottom: -width * 0.2, 
    right: -width * 0.2, 
    width: width * 0.8, 
    height: width * 0.8, 
    borderRadius: width * 0.4, 
    opacity: 0.05 
  },
  blobTop: { 
    position: 'absolute', 
    top: -width * 0.2, 
    left: -width * 0.2, 
    width: width * 0.6, 
    height: width * 0.6, 
    borderRadius: width * 0.3, 
    opacity: 0.05 
  },
  contentContainer: { alignItems: 'center', gap: 40 },
  logoWrapper: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: 140, 
    height: 140 
  },
  logoGlow: { 
    position: 'absolute', 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    opacity: 0.15 
  },
  spinnerWrapper: {
    position: 'absolute',
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerHalfClipper: {
    width: SPINNER_SIZE,
    height: SPINNER_SIZE / 2,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
  },
  solidRing: {
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
    borderRadius: SPINNER_SIZE / 2,
    borderWidth: SPINNER_THICKNESS,
    position: 'absolute',
    top: 0,
  },
  logoContainer: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 20, 
    elevation: 10,
    zIndex: 2 
  },
  logoImage: { width: 80, height: 80 },
  textContainer: { alignItems: 'center' },
  title: { 
    fontSize: 42, 
    fontWeight: '800', 
    letterSpacing: -1, 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 16, 
    fontWeight: '500', 
    letterSpacing: 0.5 
  },
});