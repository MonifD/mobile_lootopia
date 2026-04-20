import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';

export default function IntroScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const isSignedIn = !!session || process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true';

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(isSignedIn ? '/(tabs)' : '/welcome');
    }, isSignedIn ? 350 : 2200);

    return () => clearTimeout(timer);
  }, [isSignedIn, router]);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.glow, styles.glowLeft]} />
      <View style={[styles.glow, styles.glowRight]} />

      <View style={styles.heroCard}>
        <View style={styles.topRow}>
          <View style={styles.liveDot} />
          <ThemedText style={styles.liveText}>Story mode loading</ThemedText>
        </View>

        <ThemedText type="title" style={styles.title}>
          Lootopia
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Chasses au tresor, indices, points et aventure mobile. Un univers de jeu geolocalise qui s'ouvre en quelques secondes.
        </ThemedText>

        <View style={styles.reel}>
          <View style={[styles.reelCard, styles.reelCardPrimary]}>
            <Image
              source={{ uri: 'https://img.icons8.com/fluency/512/treasure-map.png' }}
              style={styles.reelImage}
              contentFit="contain"
            />
            <ThemedText style={styles.reelLabel}>Carte vivante</ThemedText>
          </View>
          <View style={[styles.reelCard, styles.reelCardSecondary]}>
            <ThemedText style={styles.reelEmoji}>🧭</ThemedText>
            <ThemedText style={styles.reelLabel}>Exploration</ThemedText>
          </View>
          <View style={[styles.reelCard, styles.reelCardTertiary]}>
            <ThemedText style={styles.reelEmoji}>🏆</ThemedText>
            <ThemedText style={styles.reelLabel}>Progression</ThemedText>
          </View>
        </View>

        <View style={styles.loadingBar}>
          <View style={styles.loadingFill} />
        </View>

        <Pressable style={({ pressed }) => [styles.skipButton, pressed && styles.buttonLift]} onPress={() => router.replace(isSignedIn ? '/(tabs)' : '/welcome')}>
          <ThemedText style={styles.skipText}>Passer l'intro</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111f',
    justifyContent: 'center',
    padding: 16,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.24,
  },
  glowLeft: {
    width: 260,
    height: 260,
    backgroundColor: '#10b981',
    top: -80,
    left: -70,
  },
  glowRight: {
    width: 220,
    height: 220,
    backgroundColor: '#06b6d4',
    bottom: -60,
    right: -70,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(15,23,42,0.9)',
    padding: 22,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.25)',
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#34d399',
  },
  liveText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f8fafc',
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 19,
  },
  reel: {
    flexDirection: 'row',
    gap: 10,
  },
  reelCard: {
    flex: 1,
    minHeight: 120,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
  },
  reelCardPrimary: {
    backgroundColor: 'rgba(8,47,73,0.92)',
    borderColor: 'rgba(34,211,238,0.24)',
  },
  reelCardSecondary: {
    backgroundColor: 'rgba(20,83,45,0.75)',
    borderColor: 'rgba(52,211,153,0.24)',
  },
  reelCardTertiary: {
    backgroundColor: 'rgba(88,28,135,0.72)',
    borderColor: 'rgba(196,181,253,0.24)',
  },
  reelImage: {
    width: 64,
    height: 64,
  },
  reelEmoji: {
    fontSize: 34,
  },
  reelLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.2)',
    overflow: 'hidden',
  },
  loadingFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#34d399',
  },
  skipButton: {
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(30,41,59,0.82)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  skipText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  buttonLift: {
    transform: [{ scale: 0.98 }],
  },
});