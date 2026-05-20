import { Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type GameColor = 'red' | 'green' | 'blue' | 'pink' | 'gold' | 'black' | 'beige';

function TopBar() {
  return (
    <View style={styles.topBar}>
      <View style={styles.playerBlock}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🧭</Text>
        </View>

        <View>
          <Text style={styles.playerRole}>EXPLORATEUR</Text>
          <Text style={styles.playerLevel}>NIVEAU 27</Text>

          <View style={styles.progressOuter}>
            <View style={styles.progressInner} />
            <Text style={styles.progressText}>65%</Text>
          </View>
        </View>
      </View>

      <View style={styles.currencyGroup}>
        <CurrencyPill icon="💎" value="320" />
      </View>
    </View>
  );
}

function CurrencyPill({ icon, value }: { icon: string; value: string }) {
  return (
    <LinearGradient
      colors={['#2b1b0a', '#0f0a05']}
      style={styles.currencyPill}
    >
      <Text style={styles.currencyIcon}>{icon}</Text>
      <Text style={styles.currencyValue}>{value}</Text>
      <View style={styles.plusButton}>
        <Text style={styles.plusText}>+</Text>
      </View>
    </LinearGradient>
  );
}

function LogoPanel({ fontsLoaded }: { fontsLoaded: boolean }) {
  return (
    <View style={styles.logoWrap}>
      <Image
        source={require('@/assets/images/logo_loot-preview.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />

      <View style={styles.scrollBanner}>
        <Text style={styles.scrollText}>
          Explore. Trouve. Collectionne.
        </Text>
        <Text style={styles.scrollText}>
          Deviens une légende.
        </Text>
      </View>
    </View>
  );
}

function TreasureChest() {
  const glow = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -8,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glow, floatY]);

  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.85],
  });

  return (
    <Animated.View style={[styles.chestArea, { transform: [{ translateY: floatY }] }]}>
    </Animated.View>
  );
}

function GameSquareButton({
  label,
  hint,
  icon,
  iconSource,
  iconSize = 80,
  color,
  onPress,
}: {
  label: string;
  hint: string;
  icon?: string;
  iconSource?: any;
  iconSize?: number;
  color: GameColor;
  onPress: () => void;
}) {
  const palettes: Record<GameColor, [string, string, string]> = {
    red: ['#ff4b4b', '#d20b0b', '#7f0000'],
    green: ['#a7f421', '#43b000', '#145c00'],
    blue: ['#38bdf8', '#0b6ee8', '#003c9e'],
    pink: ['#ff4df3', '#c218c9', '#750075'],
    gold: ['#facc15', '#f59e0b', '#92400e'],
    black: ['#6b7280', '#4b5563', '#374151'],
    beige: ['#f5e6c8', '#e7d3ad', '#cdb589'],
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.squareOuter,
        pressed && styles.squarePressed,
      ]}
    >
      <LinearGradient
        colors={['#fff3a3', '#f59e0b', '#7c2d12']}
        style={styles.squareGoldBorder}
      >
        <LinearGradient
          colors={palettes[color]}
          style={styles.squareInner}
        >
          <View style={styles.squareTopGlow} />
          <View style={styles.squareBottomGlow} />
          <View style={styles.squareSlashOne} />
          <View style={styles.squareSlashTwo} />

          {iconSource ? (
            <Image
              source={iconSource}
              style={[styles.squareIconImage, { width: iconSize, height: iconSize }]}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.squareIcon}>{icon}</Text>
          )}

          <Text
            style={styles.squareLabel}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {label}
          </Text>

          <Text
            style={styles.squareHint}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {hint}
          </Text>
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
}

function ExploreButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.exploreOuter,
        pressed && styles.explorePressed,
      ]}
    >
      <LinearGradient
        colors={['#fff3a3', '#f59e0b', '#7c2d12']}
        style={styles.exploreBorder}
      >
        <LinearGradient
          colors={['#fbbf24', '#d97706', '#78350f']}
          style={styles.exploreInner}
        >
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.exploreTitle}>EXPLORER</Text>
          <Text style={styles.exploreSubtitle}>LISTE DES CHASSES</Text>
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
}

function BottomNav() {
  const router = useRouter();

  return (
    <View style={styles.bottomNav}>
      <BottomNavItem icon="🏠" label="ACCUEIL" active onPress={() => router.replace('/home')} />
      <BottomNavItem icon="🗺️" label="CHASSES" onPress={() => router.replace('/(tabs)')} />
      <BottomNavItem icon="⭐" label="SUCCÈS" onPress={() => router.replace('/(tabs)/explore')} />
      <BottomNavItem icon="🏆" label="CLASSEMENT" onPress={() => router.replace('/(tabs)/leaderboard')} />
      <BottomNavItem icon="👤" label="PROFIL" onPress={() => router.replace('/(tabs)/profile')} />
    </View>
  );
}

function BottomNavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.bottomItem, pressed && styles.bottomItemPressed, active && styles.bottomItemActive]}>
      <Text style={styles.bottomIcon}>{icon}</Text>
      <Text style={[styles.bottomLabel, active && styles.bottomLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Orbitron_700Bold });

  return (
    <ImageBackground
      source={require('@/assets/images/rendu-3d-du-scenario-routier_23-2151293955.jpg')}
      style={styles.root}
      resizeMode="cover"
    >
      <View style={styles.darkOverlay} />
      <View style={[styles.glow, styles.glowLeft]} />
      <View style={[styles.glow, styles.glowRight]} />

      <SafeAreaView style={styles.safeArea}>
        <TopBar />

        <View style={styles.main}>
          <LogoPanel fontsLoaded={fontsLoaded} />

          <View style={styles.middleZone}>
            <View style={styles.leftButtons}>
              <GameSquareButton
                label="CLASSEMENT"
                hint=""
                iconSource={require('@/assets/images/trophee.png')}
                iconSize={80}
                color="black"
                onPress={() => router.push('/(tabs)/leaderboard')}
              />
              <GameSquareButton
                label="PROFIL"
                hint=""
                iconSource={require('@/assets/images/profil.png')}
                color="green"
                onPress={() => router.push('/(tabs)/profile')}
              />
            </View>

            <TreasureChest />

            <View style={styles.rightButtons}>
              <GameSquareButton
                label="SUCCÈS"
                hint=""
                iconSource={require('@/assets/images/etoile.png')}
                color="pink"
                onPress={() => router.push('/(tabs)/explore')}
              />

              <GameSquareButton
                label="CHASSES"
                hint=""
                iconSource={require('@/assets/images/chasse.png')}
                color="blue"
                onPress={() => router.push('/(tabs)')}
              />
            </View>
          </View>
        </View>

        <BottomNav />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#06100a',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 999,
    opacity: 0.3,
  },
  glowLeft: {
    left: -90,
    top: 180,
    backgroundColor: '#22c55e',
  },
  glowRight: {
    right: -90,
    top: 280,
    backgroundColor: '#f59e0b',
  },
  safeArea: {
    flex: 1,
  },
  orbitron: {
    fontFamily: 'Orbitron_700Bold',
  },

  topBar: {
    height: 74,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#fbbf24',
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
  },
  playerRole: {
    color: '#fef3c7',
    fontSize: 10,
    fontWeight: '900',
  },
  playerLevel: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '900',
  },
  progressOuter: {
    marginTop: 3,
    width: 120,
    height: 14,
    borderRadius: 999,
    backgroundColor: '#1c1208',
    borderWidth: 1,
    borderColor: '#a16207',
    overflow: 'hidden',
  },
  progressInner: {
    width: '65%',
    height: '100%',
    backgroundColor: '#facc15',
  },
  progressText: {
    position: 'absolute',
    right: 5,
    top: -1,
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  currencyGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currencyPill: {
    height: 38,
    minWidth: 92,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#b45309',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    gap: 5,
  },
  currencyIcon: {
    fontSize: 18,
  },
  currencyValue: {
    color: '#fff7ed',
    fontSize: 13,
    fontWeight: '900',
  },
  plusButton: {
    marginLeft: 'auto',
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#84cc16',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  plusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },


  main: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 4,
  },
  logoImage: {
    width: '90%',
    height: 150,
    marginBottom: 12,
    resizeMode: 'contain',
  },
  scrollBanner: {
    marginTop: 28,
    backgroundColor: '#f5deb3',
    borderRadius: 10,
    paddingHorizontal: 26,
    paddingVertical: 9,
    borderWidth: 2,
    borderColor: '#92400e',
    alignItems: 'center',
  },
  scrollText: {
    color: '#3f2307',
    fontSize: 14,
    fontWeight: '900',
  },

  middleZone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 70,
  },
  leftButtons: {
    width: '28%',
    gap: 14,
  },
  rightButtons: {
    width: '27%',
    gap: 14,
  },

  squareOuter: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  squarePressed: {
    transform: [{ scale: 0.93 }, { translateY: 3 }],
  },
  squareGoldBorder: {
    flex: 1,
    borderRadius: 24,
    padding: 4,
  },
  squareInner: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  squareTopGlow: {
    position: 'absolute',
    top: 8,
    left: 10,
    right: 10,
    height: 24,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  squareBottomGlow: {
    position: 'absolute',
    bottom: 9,
    left: 16,
    right: 16,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  squareSlashOne: {
    position: 'absolute',
    left: 18,
    top: 6,
    width: 12,
    height: 78,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    transform: [{ rotate: '28deg' }],
  },
  squareSlashTwo: {
    position: 'absolute',
    left: 42,
    top: 12,
    width: 7,
    height: 66,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ rotate: '28deg' }],
  },
  squareIcon: {
    fontSize: 30,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  squareIconImage: {
    marginBottom: 0,
  },
  squareLabel: {
    marginTop: -8,
    color: '#fff',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  squareHint: {
    marginTop: 1,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  chestArea: {
    width: '38%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  exploreOuter: {
    width: '38%',
    height: 82,
    borderRadius: 24,
    shadowColor: '#facc15',
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 12,
  },
  explorePressed: {
    transform: [{ scale: 0.95 }, { translateY: 3 }],
  },
  exploreBorder: {
    flex: 1,
    borderRadius: 24,
    padding: 4,
  },
  exploreInner: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  mapIcon: {
    position: 'absolute',
    top: -25,
    fontSize: 42,
  },
  exploreTitle: {
    color: '#fff7ed',
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 2,
  },
  exploreSubtitle: {
    color: '#fef3c7',
    fontSize: 12,
    fontWeight: '900',
  },

  bottomNav: {
    height: 72,
    marginHorizontal: 10,
    marginBottom: 6,
    borderRadius: 18,
    backgroundColor: '#140f0a',
    borderWidth: 2,
    borderColor: '#5f3b16',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bottomItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#3f2a13',
  },
  bottomItemPressed: {
    opacity: 0.85,
  },
  bottomItemActive: {
    backgroundColor: '#2d1b08',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  bottomIcon: {
    fontSize: 22,
  },
  bottomLabel: {
    marginTop: 3,
    color: '#c9b58b',
    fontSize: 9,
    fontWeight: '900',
  },
  bottomLabelActive: {
    color: '#facc15',
  },
});