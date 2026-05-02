import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/providers/auth-provider';

export default function WelcomeScreen() {
  const router      = useRouter();
  const { session } = useAuth();
  const isSignedIn  = !!session || process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true';
  const welcomeVideoSource = require('@/assets/images/videoVieux.mp4');
  const hasRevealedRef = useRef(false);

  // ── expo-video player (HEAD) ─────────────────────────────────────────────
  const player = useVideoPlayer(welcomeVideoSource, (p) => {
    p.volume = 1.0;
    p.muted  = false;
    p.loop   = false;
    p.play();
  });

  // ── Animation refs HEAD ───────────────────────────────────────────────────
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const titleY      = useRef(new Animated.Value(24)).current;
  const ctaOpacity  = useRef(new Animated.Value(0)).current;
  const ctaY        = useRef(new Animated.Value(20)).current;
  const tickerX     = useRef(new Animated.Value(0)).current;
  const pulse       = useRef(new Animated.Value(0.85)).current;
  const floatY      = useRef(new Animated.Value(0)).current;
  const dotBlink    = useRef(new Animated.Value(0.4)).current;
  const btnGlow     = useRef(new Animated.Value(0)).current;

  const chestScale  = pulse.interpolate({ inputRange: [0.85, 1], outputRange: [0.97, 1.03] });
  const floatAnim   = floatY.interpolate({ inputRange: [-10, 0], outputRange: [-10, 0] });
  const glowOpacity = btnGlow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] });
  const freezeFaceMs = 350;

  // ── Animation refs LOOT-27 ────────────────────────────────────────────────
  const slideUp     = useRef(new Animated.Value(30)).current;
  const fadeIn      = useRef(new Animated.Value(0)).current;
  const bounceScale = useRef(new Animated.Value(0.8)).current;

  // ── revealCta (HEAD) ──────────────────────────────────────────────────────
  const revealCta = useCallback(() => {
    Animated.parallel([
      Animated.timing(ctaOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ctaY, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [ctaOpacity, ctaY]);

  // ── Fin de vidéo → freeze + revealCta (HEAD) ─────────────────────────────
  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      if (hasRevealedRef.current) return;
      hasRevealedRef.current = true;
      try {
        player.currentTime = freezeFaceMs / 1000;
        player.pause();
      } catch {
        // No-op
      }
      revealCta();
    });
    return () => sub.remove();
  }, [player, revealCta, freezeFaceMs]);

  // ── Animations d'entrée + redirect automatique (LOOT-27) ─────────────────
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
      if (isSignedIn) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [router, isSignedIn]);

  return (
    <View style={styles.root}>
      {/* Image fallback (LOOT-27) — visible pendant le chargement de la vidéo */}
      <Image
        source={require('@/assets/images/PersoAccueil.webp')}
        style={styles.bgMedia}
        resizeMode="cover"
      />

      {/* Vidéo en plein écran (HEAD) — s'affiche par-dessus l'image dès qu'elle est prête */}
      <View style={styles.bgMedia}>
        <VideoView
          player={player}
          style={{ flex: 1 }}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      </View>

      {/* Overlay dégradé */}
      <LinearGradient
        colors={['rgba(2,5,16,0.40)', 'rgba(4,10,28,0.65)', 'rgba(6,14,38,0.85)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Contenu splash (LOOT-27) */}
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
          ]}
        >
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  bgMedia: {
    ...StyleSheet.absoluteFillObject,
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
