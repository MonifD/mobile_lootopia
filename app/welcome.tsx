import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  Text,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  const slideUp = useRef(new Animated.Value(30)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const bounceScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideUp, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(bounceScale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/home');
    }, 3500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <ImageBackground
      source={require('@/assets/images/PersoAccueil.webp')}
      style={styles.root}
      imageStyle={styles.bgImage}
      resizeMode="cover">
      
      <LinearGradient
        colors={['rgba(2,5,16,0.40)', 'rgba(4,10,28,0.65)', 'rgba(6,14,38,0.85)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeIn,
              transform: [
                { translateY: slideUp },
                { scale: bounceScale },
              ],
            },
          ]}>
          
          <View style={styles.heroText}>
            <Text style={styles.title}>LOOTOPIA</Text>
            <View style={styles.divider} />
            <Text style={styles.subtitle}>
              Chasse au trésor • Indices • Récompenses réelles
            </Text>
          </View>

          <View style={styles.dots}>
            <Animated.View style={[styles.dot, { opacity: 0.9 }]} />
            <Animated.View style={[styles.dot, { opacity: 0.6, marginLeft: 8 }]} />
            <Animated.View style={[styles.dot, { opacity: 0.3, marginLeft: 8 }]} />
          </View>

          <Text style={styles.loadingText}>Ouvre ton aventure...</Text>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bgImage: {
    opacity: 0.9,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  content: {
    alignItems: 'center',
    gap: 32,
  },
  heroText: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 56,
    fontWeight: '900',
    color: '#f0f9ff',
    letterSpacing: 4,
    textShadowColor: 'rgba(52, 211, 153, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  divider: {
    width: 120,
    height: 3,
    backgroundColor: '#34d399',
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(186, 230, 253, 0.75)',
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 260,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34d399',
    shadowColor: '#34d399',
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  loadingText: {
    fontSize: 12,
    color: 'rgba(148, 163, 184, 0.7)',
    fontWeight: '600',
    letterSpacing: 1,
  },
});
