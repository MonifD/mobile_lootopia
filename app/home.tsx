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
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { useRouter } from 'expo-router';

function CubeButton({ onPress }: { onPress: () => void }) {
  const floatY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -10,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const rotateLoop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    floatLoop.start();
    rotateLoop.start();

    return () => {
      floatLoop.stop();
      rotateLoop.stop();
    };
  }, [floatY, rotate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cubePressable, pressed && styles.cubePressed]}>
      <Animated.View style={[styles.cubeWrap, { transform: [{ translateY: floatY }] }]}>
        <Animated.View style={[styles.cubeOrbit, { transform: [{ rotate: spin }] }]}>
          <View style={[styles.cubeFace, styles.cubeFaceTop]} />
          <View style={[styles.cubeFace, styles.cubeFaceRight]} />
          <View style={[styles.cubeFace, styles.cubeFaceFront]}>
            <Text style={styles.cubeKicker}>Explorer</Text>
            <Text style={styles.cubeTitle}>Liste des chasses</Text>
            <Text style={styles.cubeSubtitle}>Ouvre tes missions et rejoins le terrain de jeu</Text>
            <View style={styles.cubeCta}>
              <Text style={styles.cubeCtaText}>Entrer</Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function SidePill({ label, hint, onPress }: { label: string; hint: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.sidePill, pressed && styles.sidePillPressed]}>
      <LinearGradient
        colors={['rgba(15,23,42,0.92)', 'rgba(30,41,59,0.94)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.sidePillInner}
      >
        <Text style={styles.sidePillLabel}>{label}</Text>
        <Text style={styles.sidePillHint}>{hint}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Orbitron_700Bold });
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 700,
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
          <View style={styles.header}>
            <Text style={[styles.badge, fontsLoaded && styles.orbitron]}>LOOTOPIA</Text>
            <Text style={[styles.title, fontsLoaded && styles.orbitron]}>Bienvenue sur ton camp de base</Text>
            <Text style={styles.subtitle}>
              Choisis ton point d'entrée. La liste des chasses reste au centre, les autres accès tournent autour.
            </Text>
          </View>

          <View style={styles.heroArea}>
            <View style={styles.sideLeft}>
              <SidePill
                label="Classement"
                hint="Voir les meilleurs joueurs"
                onPress={() => router.push('/(tabs)/leaderboard')}
              />
              <SidePill
                label="Profil"
                hint="Ajuster ta ville et ton identité"
                onPress={() => router.push('/(tabs)/profile')}
              />
            </View>

            <CubeButton onPress={() => router.push('/(tabs)')} />

            <View style={styles.sideRight}>
              <SidePill
                label="Accomplissements"
                hint="Suivre ta progression"
                onPress={() => router.push('/(tabs)/explore')}
              />
              <SidePill
                label="Reprendre"
                hint="Retour direct vers les chasses"
                onPress={() => router.push('/(tabs)')}
              />
            </View>
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
    backgroundColor: 'rgba(6,11,20,0.55)',
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    opacity: 0.22,
  },
  glowLeft: {
    left: -70,
    top: 120,
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
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
    justifyContent: 'space-between',
  },
  header: {
    gap: 10,
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
  orbitron: {
    fontFamily: 'Orbitron_700Bold',
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    textShadowColor: 'rgba(16,185,129,0.32)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    color: 'rgba(226,232,240,0.92)',
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 330,
  },
  heroArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sideLeft: {
    flex: 1,
    gap: 12,
    paddingRight: 4,
  },
  sideRight: {
    flex: 1,
    gap: 12,
    paddingLeft: 4,
  },
  cubePressable: {
    flex: 1.35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cubePressed: {
    transform: [{ scale: 0.98 }],
  },
  cubeWrap: {
    width: '100%',
    aspectRatio: 0.86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cubeOrbit: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cubeFace: {
    position: 'absolute',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#10b981',
    shadowOpacity: 0.34,
    shadowRadius: 18,
    elevation: 6,
  },
  cubeFaceTop: {
    width: '82%',
    height: '82%',
    backgroundColor: 'rgba(15,23,42,0.85)',
    transform: [{ translateX: -14 }, { translateY: -16 }, { rotate: '-8deg' }],
    opacity: 0.8,
  },
  cubeFaceRight: {
    width: '82%',
    height: '82%',
    backgroundColor: 'rgba(6,182,212,0.18)',
    transform: [{ translateX: 14 }, { translateY: 10 }, { rotate: '8deg' }],
    opacity: 0.9,
  },
  cubeFaceFront: {
    width: '84%',
    height: '84%',
    padding: 18,
    justifyContent: 'flex-end',
    gap: 8,
    backgroundColor: 'rgba(2,6,23,0.92)',
    borderColor: 'rgba(16,185,129,0.45)',
    overflow: 'hidden',
  },
  cubeKicker: {
    color: '#6ee7b7',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  cubeTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  cubeSubtitle: {
    color: 'rgba(226,232,240,0.78)',
    fontSize: 12,
    lineHeight: 16,
  },
  cubeCta: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#10b981',
  },
  cubeCtaText: {
    color: '#052e16',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sidePill: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  sidePillPressed: {
    transform: [{ scale: 0.98 }],
  },
  sidePillInner: {
    minHeight: 104,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
  },
  sidePillLabel: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  sidePillHint: {
    color: 'rgba(203,213,225,0.82)',
    fontSize: 11,
    lineHeight: 15,
  },
});
