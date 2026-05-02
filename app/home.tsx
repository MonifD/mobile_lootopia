import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  StyleSheet,
  View,
  Pressable,
  Text,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/providers/auth-provider';

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
  });
  const isSignedIn = !!session || process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true';

  // Animation references
  const slideUp = useRef(new Animated.Value(60)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const btnScale1 = useRef(new Animated.Value(0.95)).current;
  const btnScale2 = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(slideUp, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(100, [
        Animated.spring(btnScale1, { toValue: 1, useNativeDriver: true }),
        Animated.spring(btnScale2, { toValue: 1, useNativeDriver: true }),
      ]),
    ]).start();
  }, [slideUp, fadeIn, btnScale1, btnScale2]);

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/(tabs)');
    }
  }, [isSignedIn, router]);

  return (
    <ImageBackground
      source={require('@/assets/images/PersoAccueil.webp')}
      style={styles.root}
      imageStyle={styles.bgImage}
      resizeMode="cover">
  
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeIn,
              transform: [{ translateY: slideUp }],
            },
          ]}>
          
          {/* Main Title */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>LOOTOPIA</Text>
            <Text style={styles.subtitle}>
              Chasse au trésor • Énigmes • Récompenses réelles
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Login Button */}
            <Link href="/login" asChild>
              <Pressable style={({ pressed }) => pressed && styles.buttonPressed}>
                <Animated.View style={{ transform: [{ scale: btnScale1 }] }}>
                  <LinearGradient
                    colors={['#10b981', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBtn}>
                    <View style={styles.btnInnerShade} />
                    <View style={styles.btnLeft}>
                      <Text style={styles.btnEyebrow}>Joueur existant</Text>
                      <Text style={[styles.btnText, fontsLoaded && styles.btnTextGame]}>Se connecter</Text>
                    </View>
                    <View style={styles.arrowBubble}>
                      <Text style={styles.btnArrow}>→</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              </Pressable>
            </Link>

            {/* Register Button */}
            <Link href="/register" asChild>
              <Pressable style={({ pressed }) => pressed && styles.buttonPressed}>
                <Animated.View style={{ transform: [{ scale: btnScale2 }] }}>
                  <LinearGradient
                    colors={['#06b6d4', '#0f766e']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.secondaryBtn}>
                    <View style={styles.btnInnerShade} />
                    <View style={styles.btnLeft}>
                      <Text style={styles.btnEyebrow}>Nouveau joueur</Text>
                      <Text style={[styles.btnText, fontsLoaded && styles.btnTextGame]}>Créer un compte</Text>
                    </View>
                    <View style={styles.arrowBubble}>
                      <Text style={styles.btnArrow}>→</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              </Pressable>
            </Link>
          </View>

          {/* Legal text */}
          <Text style={styles.legal}>
            En continuant, tu acceptes nos{' '}
            <Text style={styles.legalLink}>Conditions d'utilisation</Text>
          </Text>
        </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bgImage: {
    opacity: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 46,
    gap: 18,
  },
  titleSection: {
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 52,
    fontWeight: '900',
    color: '#f0f9ff',
    letterSpacing: 2,
    textShadowColor: 'rgba(16, 185, 129, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(203, 213, 225, 0.92)',
    fontWeight: '500',
    letterSpacing: 0.3,
    lineHeight: 18,
    textAlign: 'center',
  },
  buttonsContainer: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    padding: 14,
    gap: 12,
    shadowColor: '#10b981',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  primaryBtn: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    shadowColor: '#10b981',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryBtn: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    shadowColor: '#06b6d4',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  btnInnerShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.16)',
  },
  btnLeft: {
    gap: 2,
  },
  btnEyebrow: {
    color: 'rgba(240, 253, 250, 0.8)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  btnText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnTextGame: {
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 0.7,
  },
  arrowBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(2, 6, 23, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnArrow: {
    color: 'white',
    fontSize: 17,
    fontWeight: '900',
  },
  buttonPressed: {
    opacity: 0.88,
  },
  legal: {
    fontSize: 11,
    color: 'rgba(203, 213, 225, 0.7)',
    textAlign: 'center',
    marginTop: 6,
  },
  legalLink: {
    color: '#34d399',
    textDecorationLine: 'underline',
  },
});
