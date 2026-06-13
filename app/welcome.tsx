import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

function ActionButton({
  href,
  title,
  subtitle,
  colors,
}: {
  href: '/login' | '/register';
  title: string;
  subtitle: string;
  colors: [string, string];
}) {
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buttonInner}>
          <Text style={styles.buttonTitle}>{title}</Text>
          <Text style={styles.buttonSubtitle}>{subtitle}</Text>
        </LinearGradient>
      </Pressable>
    </Link>
  );
}

export default function WelcomeScreen() {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeIn, slideUp]);

  return (
    <ImageBackground
      source={require('@/assets/images/PersoAccueil.webp')}
      style={styles.root}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={[styles.glow, styles.glowLeft]} />
      <View style={[styles.glow, styles.glowRight]} />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeIn,
              transform: [{ translateY: slideUp }],
            },
          ]}
        >
          <View style={styles.hero}>
            <Text style={styles.badge}>LOOTOPIA</Text>
            <Text style={styles.title}>Prêt à partir en chasse</Text>
            <Text style={styles.subtitle}>
              Connecte-toi si tu as déjà un compte, ou crée-en un pour commencer ton aventure.
            </Text>
          </View>

          <View style={styles.buttonsWrap}>
            <ActionButton
              href="/login"
              title="Connexion"
              subtitle="J'ai déjà un compte"
              colors={['#10b981', '#047857']}
            />
            <ActionButton
              href="/register"
              title="Inscription"
              subtitle="Créer un nouveau compte"
              colors={['#06b6d4', '#0f766e']}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060b14',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,11,20,0.58)',
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    opacity: 0.2,
  },
  glowLeft: {
    left: -70,
    top: 130,
    backgroundColor: '#10b981',
  },
  glowRight: {
    right: -80,
    top: 220,
    backgroundColor: '#06b6d4',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  hero: {
    gap: 12,
    marginTop: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    color: '#86efac',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(134,239,172,0.35)',
    backgroundColor: 'rgba(15,23,42,0.65)',
  },
  title: {
    color: '#f8fafc',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    textShadowColor: 'rgba(16,185,129,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    color: 'rgba(226,232,240,0.9)',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 330,
  },
  buttonsWrap: {
    gap: 14,
    paddingBottom: 10,
  },
  button: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonInner: {
    minHeight: 102,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#10b981',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  buttonTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  buttonSubtitle: {
    marginTop: 4,
    color: 'rgba(240,253,250,0.82)',
    fontSize: 12,
    lineHeight: 16,
  },
});
