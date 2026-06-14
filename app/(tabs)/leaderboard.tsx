import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useApiResource } from '@/hooks/use-api-resource';
import { lootopiaApi } from '@/services/lootopia-api';
import type { LeaderboardEntry } from '@/types/game';

const LEADERBOARD_MODES = [
  { key: 'global', label: '🌍 Global' },
  { key: 'weekly', label: '📅 Hebdo' },
  { key: 'monthly', label: '🗓️ Mensuel' },
] as const;

type LeaderboardMode = (typeof LEADERBOARD_MODES)[number]['key'];

const standardLoaders: Partial<Record<LeaderboardMode, () => Promise<LeaderboardEntry[]>>> = {
  global: () => lootopiaApi.getLeaderboardGlobal(),
  weekly: () => lootopiaApi.getLeaderboardWeekly(),
  monthly: () => lootopiaApi.getLeaderboardMonthly(),
};

function GoldFrame({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <LinearGradient colors={['#fff3a3', '#f59e0b', '#7c2d12']} style={[styles.goldFrame, style]}>
      <View style={styles.goldFrameInner}>{children}</View>
    </LinearGradient>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <LinearGradient colors={['#fff3a3', '#f59e0b', '#7c2d12']} style={styles.statBorder}>
      <LinearGradient colors={[color, '#102018']} style={styles.statCard}>
        <View style={styles.cardGloss} />
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </LinearGradient>
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<LeaderboardMode>('global');

  const loadEntries = useCallback(() => {
    return standardLoaders[mode]!();
  }, [mode]);

  const loadMyRank = useCallback(() => lootopiaApi.getMyRank(), []);
  const loadLeaderboardStats = useCallback(() => lootopiaApi.getLeaderboardStats(), []);

  const entriesState = useApiResource<LeaderboardEntry[]>(loadEntries);
  const myRankState = useApiResource(loadMyRank);
  const statsState = useApiResource(loadLeaderboardStats);

  const entries = entriesState.data ?? [];
  const topThree = useMemo(() => entries.slice(0, 3), [entries]);

  return (
    <ImageBackground
      source={require('@/assets/images/foret.jpg')}
      style={styles.root}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.iconButton}>
            <Text style={styles.iconButtonText}>‹</Text>
          </Pressable>

          <View style={styles.titleWrap}>
            <Text style={styles.pageTitle}>CLASSEMENT</Text>
            <Text style={styles.pageSubtitle}>DES CHASSEURS</Text>
          </View>

        </View>

        {entriesState.loading ? <ActivityIndicator color="#facc15" /> : null}

        {entriesState.error ? (
          <Text style={styles.error}>Erreur : {entriesState.error}</Text>
        ) : null}

        <GoldFrame>
          <Text style={styles.heroLogo}>💰 LOOTOPIA</Text>
          <Text style={styles.heroTitle}>COMPÉTITION</Text>
          <Text style={styles.heroText}>
            Compare tes points, grimpe dans le top et deviens une légende Lootopia.
          </Text>
        </GoldFrame>

        <View style={styles.filters}>
          {LEADERBOARD_MODES.map((item) => {
            const selected = item.key === mode;

            return (
              <Pressable
                key={item.key}
                onPress={() => setMode(item.key)}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <LinearGradient
                  colors={
                    selected
                      ? ['#fff3a3', '#f59e0b', '#7c2d12']
                      : ['#d6a75d', '#b7791f', '#78350f']
                  }
                  style={styles.filterBorder}
                >
                  <View style={[styles.filterChip, selected && styles.filterChipActive]}>
                    <Text style={selected ? styles.filterTextActive : styles.filterText}>
                      {item.label}
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>

        {topThree.length > 0 ? (
          <GoldFrame>
            <Text style={styles.sectionTitle}>PODIUM</Text>

            <View style={styles.podium}>
              {topThree.map((entry, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';

                return (
                  <LinearGradient
                    key={entry.id}
                    colors={
                      index === 0
                        ? ['#92400e', '#3f2307']
                        : index === 1
                          ? ['#374151', '#111827']
                          : ['#7c2d12', '#241607']
                    }
                    style={[styles.podiumCard, index === 0 && styles.podiumFirst]}
                  >
                    <View style={styles.cardGloss} />
                    <Text style={styles.medal}>{medal}</Text>

                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {entry.username?.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <Text style={styles.podiumName} numberOfLines={1}>
                      {entry.username}
                    </Text>

                    <Text style={styles.podiumPoints}>{entry.totalPoints} pts</Text>
                  </LinearGradient>
                );
              })}
            </View>
          </GoldFrame>
        ) : null}

        <View style={styles.statsGrid}>
          <StatCard
            icon="👥"
            label="JOUEURS"
            value={statsState.data?.totalPlayers ?? '-'}
            color="#6b0f0f"
          />

          <StatCard
            icon="🏴‍☠️"
            label="MON RANG"
            value={`#${myRankState.data?.rank ?? '-'}`}
            color="#5a3708"
          />

          <StatCard
            icon="📊"
            label="MOY. PTS"
            value={statsState.data?.averagePoints ?? '-'}
            color="#064e3b"
          />
        </View>


        {mode === 'global' && entries.length > 0 ? (
          <View style={styles.entriesSection}>
            <Text style={styles.sectionTitle}>CLASSEMENT GLOBAL</Text>

            {entries.map((entry, index) => (
              <LinearGradient
                key={`${entry.id}-${index}`}
                colors={['#fff3a3', '#f59e0b', '#7c2d12']}
                style={styles.entryBorder}
              >
                <LinearGradient colors={['#08261e', '#102018']} style={styles.entryCard}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rank}>#{entry.rank ?? index + 1}</Text>
                  </View>

                  <View style={styles.entryAvatar}>
                    <Text style={styles.entryAvatarText}>
                      {entry.username?.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.entryMain}>
                    <Text style={styles.entryName}>{entry.username}</Text>

                    <Text style={styles.entryMeta} numberOfLines={2}>
                      {entry.city ? `📍 ${entry.city}  •  ` : ''}
                      🗺️ {entry.completedHunts} chasses  •  🔥 {entry.loginStreak}
                    </Text>
                  </View>

                  <View style={styles.pointsBadge}>
                    <Text style={styles.entryPoints}>🏆</Text>
                    <Text style={styles.entryPointsValue}>{entry.totalPoints}</Text>
                  </View>
                </LinearGradient>
              </LinearGradient>
            ))}
          </View>
        ) : null}

        {entries.length > 3 ? (
          <View style={styles.scrollPanel}>
            <Text style={styles.scrollTitle}>DÉFI DU JOUR</Text>
            <Text style={styles.scrollText}>
              💰 Continue ta chasse pour dépasser le prochain joueur.
            </Text>
          </View>
        ) : null}

      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#06100a',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  content: {
    padding: 16,
    paddingTop: 48,
    paddingBottom: 36,
    gap: 14,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#1f160c',
    borderWidth: 3,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    color: '#fef3c7',
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 42,
  },
  settingsIcon: {
    color: '#fef3c7',
    fontSize: 30,
    fontWeight: '900',
  },
  titleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  pageTitle: {
    color: '#facc15',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowColor: '#78350f',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 2,
  },
  pageSubtitle: {
    marginTop: -2,
    color: '#bbf7d0',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },

  error: {
    color: '#fecaca',
    fontWeight: '800',
    textAlign: 'center',
  },

  goldFrame: {
    borderRadius: 24,
    padding: 4,
    shadowColor: '#facc15',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  goldFrameInner: {
    borderRadius: 20,
    backgroundColor: 'rgba(8,38,30,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 14,
  },

  heroLogo: {
    color: '#facc15',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  heroTitle: {
    marginTop: 8,
    color: '#fff7ed',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },
  heroText: {
    marginTop: 8,
    color: '#fde68a',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 19,
  },

  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterBorder: {
    borderRadius: 14,
    padding: 3,
  },
  filterChip: {
    borderRadius: 11,
    backgroundColor: '#d6a75d',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: '#14532d',
  },
  filterText: {
    color: '#3f2307',
    fontSize: 12,
    fontWeight: '900',
  },
  filterTextActive: {
    color: '#fef3c7',
    fontSize: 12,
    fontWeight: '900',
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBorder: {
    flex: 1,
    borderRadius: 18,
    padding: 3,
  },
  statCard: {
    minHeight: 116,
    borderRadius: 15,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardGloss: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    height: 22,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  statIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff7ed',
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
  },
  statLabel: {
    color: '#facc15',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyText: {
    color: '#fde68a',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 19,
  },

  sectionTitle: {
    color: '#facc15',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  podiumCard: {
    flex: 1,
    minHeight: 148,
    borderRadius: 18,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  podiumFirst: {
    minHeight: 178,
  },
  medal: {
    fontSize: 28,
    marginBottom: 4,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#facc15',
    backgroundColor: '#123b36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#facc15',
    fontSize: 22,
    fontWeight: '900',
  },
  podiumName: {
    marginTop: 8,
    color: '#fff7ed',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  podiumPoints: {
    marginTop: 4,
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },

  entriesSection: {
    gap: 10,
  },

  entryBorder: {
    borderRadius: 18,
    padding: 3,
  },
  entryCard: {
    minHeight: 76,
    borderRadius: 15,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#241607',
    borderWidth: 2,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: {
    color: '#fef3c7',
    fontSize: 12,
    fontWeight: '900',
  },
  entryAvatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#facc15',
    backgroundColor: '#123b36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryAvatarText: {
    color: '#facc15',
    fontSize: 18,
    fontWeight: '900',
  },
  entryMain: {
    flex: 1,
    gap: 3,
  },
  entryName: {
    color: '#fff7ed',
    fontSize: 16,
    fontWeight: '900',
  },
  entryMeta: {
    color: '#fde68a',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  pointsBadge: {
    minWidth: 62,
    borderRadius: 12,
    backgroundColor: '#241607',
    borderWidth: 2,
    borderColor: '#d97706',
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  entryPoints: {
    fontSize: 15,
  },
  entryPointsValue: {
    color: '#fef3c7',
    fontSize: 12,
    fontWeight: '900',
  },

  scrollPanel: {
    borderRadius: 18,
    backgroundColor: '#d6a75d',
    borderWidth: 3,
    borderColor: '#8b5a2b',
    padding: 16,
    alignItems: 'center',
  },
  scrollTitle: {
    color: '#3f2307',
    fontSize: 16,
    fontWeight: '900',
  },
  scrollText: {
    marginTop: 6,
    color: '#2f1703',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },

  refreshBorder: {
    borderRadius: 18,
    padding: 3,
  },
  refreshButton: {
    minHeight: 64,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    color: '#fff7ed',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  pressed: {
    transform: [{ scale: 0.97 }, { translateY: 2 }],
  },
});