import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppHeader } from '@/components/app-header';
import { useApiResource } from '@/hooks/use-api-resource';
import { useAuth } from '@/providers/auth-provider';
import { lootopiaApi } from '@/services/lootopia-api';
import type { Hunt, HuntHistoryEntry } from '@/types/game';

type FilterMode = 'my-city' | 'all';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR');
}

function GameBackground({ children }: { children: React.ReactNode }) {
  return (
    <ImageBackground
      source={require('@/assets/images/ancient-tree-life-bridge-serene-river.jpg')}
      style={styles.container}
      imageStyle={styles.bgImage}
      resizeMode="cover"
    >
      <View style={styles.bgOverlay} />

      <View style={[styles.glowBlob, styles.glowEmerald]} />
      <View style={[styles.glowBlob, styles.glowCyan]} />
      <View style={[styles.glowBlob, styles.glowGold]} />

      {children}
    </ImageBackground>
  );
}

function GoldFrame({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <LinearGradient
      colors={['#fff3a3', '#f59e0b', '#7c2d12']}
      style={[styles.goldFrame, style]}
    >
      <View style={styles.goldFrameInner}>{children}</View>
    </LinearGradient>
  );
}

function HuntCard({ hunt, history, onPress }: { hunt: Hunt; history?: HuntHistoryEntry; onPress: () => void }) {
  const progressPct   = history ? Math.round(history.progress * 100) : 0;
  const isCompleted   = history?.status === 'completed';
  const isInProgress  = history?.status === 'in_progress';

  const progressLabel = isCompleted
    ? '✓ Terminée'
    : isInProgress
      ? `${history!.stepsCompleted}/${history!.totalSteps} étapes`
      : hunt.isActive
        ? 'Prête à jouer'
        : 'Inactive';

  const progressColor = isCompleted ? '#4ade80' : isInProgress ? '#fbbf24' : '#10b981';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <GoldFrame style={!hunt.isActive ? styles.inactiveFrame : undefined}>
        <View style={styles.huntTop}>
          <View style={styles.huntIconBox}>
            <Text style={styles.huntIcon}>
              {isCompleted ? '✅' : isInProgress ? '⏳' : hunt.isActive ? '🗺️' : '🔒'}
            </Text>
          </View>

          <View style={styles.huntTitleWrap}>
            <Text style={styles.huntTitle} numberOfLines={2}>
              {hunt.title}
            </Text>

            <Text style={styles.huntMeta} numberOfLines={1}>
              📍 {hunt.city ?? 'Ville mystère'} · Créée le {formatDate(hunt.createdAt)}
            </Text>
          </View>

          <View style={[styles.statusBadge, hunt.isActive ? styles.statusActive : styles.statusInactive]}>
            <Text style={styles.statusText}>{hunt.isActive ? 'ACTIVE' : 'LOCK'}</Text>
          </View>
        </View>

        {hunt.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {hunt.description}
          </Text>
        ) : null}

        <View style={styles.rewardRow}>
          <View style={styles.rewardPill}>
            <Text style={styles.rewardText}>⭐ Mission</Text>
          </View>

          <View style={styles.rewardPill}>
            <Text style={styles.rewardText}>🎯 Géolocalisée</Text>
          </View>

          <View style={styles.rewardPill}>
            <Text style={styles.rewardText}>
              {hunt.isActive ? '🔥 Disponible' : '⏳ Bientôt'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.progressOuter}>
            <View style={[styles.progressInner, { width: `${progressPct}%` as `${number}%`, backgroundColor: progressColor }]} />
            <Text style={styles.progressText}>{progressLabel}</Text>
          </View>

          <LinearGradient
            colors={hunt.isActive ? ['#059669', '#059669'] : ['#64748b', '#475569']}
            style={styles.playButton}
          >
            <Text style={styles.playButtonText}>{hunt.isActive ? 'OUVRIR' : 'VOIR'}</Text>
          </LinearGradient>
        </View>
      </GoldFrame>
    </Pressable>
  );
}

export default function HuntsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [filterMode, setFilterMode] = useState<FilterMode>('my-city');

  const loadData = useCallback(async () => {
    const [hunts, profile, history] = await Promise.all([
      lootopiaApi.getHunts(),
      session?.userId
        ? lootopiaApi.getUser(session.userId).catch(() => null)
        : Promise.resolve(null),
      lootopiaApi.getHuntHistory('all').catch(() => [] as Awaited<ReturnType<typeof lootopiaApi.getHuntHistory>>),
    ]);

    // Map huntId → history entry pour accès O(1)
    const historyByHuntId = new Map(history.map((e) => [e.hunt.id, e]));

    return { hunts, userCity: profile?.city ?? null, historyByHuntId };
  }, [session?.userId]);

  const { data, error, loading, refresh } = useApiResource(loadData);

  const userCity        = data?.userCity ?? null;
  const allHunts        = data?.hunts ?? [];
  const historyByHuntId = data?.historyByHuntId ?? new Map();

  const visibleHunts = useMemo<Hunt[]>(() => {
    const notCompleted = allHunts.filter(
      (hunt) => historyByHuntId.get(hunt.id)?.status !== 'completed'
    );

    if (filterMode === 'all' || !userCity) return notCompleted;

    return notCompleted.filter(
      (hunt) => hunt.city?.toLowerCase().trim() === userCity.toLowerCase().trim()
    );
  }, [allHunts, filterMode, userCity, historyByHuntId]);

  const openHuntDetails = (hunt: Hunt) => {
    if (!Number.isFinite(hunt.id) || hunt.id <= 0) {
      Alert.alert('Chasse indisponible', 'Cette chasse a un identifiant invalide.');
      return;
    }

    router.push(`/hunts/${hunt.id}`);
  };

  return (
    <GameBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader />

        <GoldFrame>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>ZONE ACTUELLE</Text>
              <Text style={styles.summaryCity}>📍 {userCity ?? 'Ville non définie'}</Text>
            </View>

            <View style={styles.summaryCounter}>
              <Text style={styles.summaryNumber}>{visibleHunts.length}</Text>
              <Text style={styles.summarySmall}>chasses</Text>
            </View>
          </View>

          <View style={styles.filterRow}>
            <Pressable
              style={[styles.filterChip, filterMode === 'my-city' && styles.filterChipActive]}
              onPress={() => userCity && setFilterMode('my-city')}
              disabled={!userCity}
            >
              <Text style={[styles.filterText, filterMode === 'my-city' && styles.filterTextActive]}>
                📍 Ma ville
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterChip, filterMode === 'all' && styles.filterChipActive]}
              onPress={() => setFilterMode('all')}
            >
              <Text style={[styles.filterText, filterMode === 'all' && styles.filterTextActive]}>
                🌍 Toutes
              </Text>
            </Pressable>
          </View>
        </GoldFrame>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#facc15" />
            <Text style={styles.loadingText}>Chargement des chasses...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>Erreur : {error}</Text> : null}

        {!loading && !error && filterMode === 'my-city' && !userCity ? (
          <GoldFrame>
            <Text style={styles.emptyTitle}>VILLE NON DÉFINIE</Text>
            <Text style={styles.emptyText}>
              Ajoute ta ville dans ton profil ou affiche toutes les villes.
            </Text>
          </GoldFrame>
        ) : null}

        {!loading && !error && visibleHunts.length === 0 && userCity ? (
          <GoldFrame>
            <Text style={styles.emptyTitle}>AUCUNE CHASSE</Text>
            <Text style={styles.emptyText}>
              Aucune mission disponible à {userCity} pour le moment.
            </Text>
          </GoldFrame>
        ) : null}

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>
            {filterMode === 'my-city' && userCity
              ? `MISSIONS À ${userCity.toUpperCase()}`
              : 'TOUTES LES MISSIONS'}
          </Text>
          <Text style={styles.sectionCounter}>{visibleHunts.length}</Text>
        </View>

        {visibleHunts.map((hunt) => (
          <HuntCard
            key={hunt.id}
            hunt={hunt}
            history={historyByHuntId.get(hunt.id)}
            onPress={() => openHuntDetails(hunt)}
          />
        ))}

      </ScrollView>
    </GameBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },

  bgImage: {
    opacity: 1,
  },

  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  glowBlob: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowEmerald: {
    width: 360,
    height: 360,
    left: -160,
    top: 110,
    backgroundColor: '#10b981',
    opacity: 0.18,
  },
  glowCyan: {
    width: 300,
    height: 300,
    right: -140,
    top: 260,
    backgroundColor: '#06b6d4',
    opacity: 0.14,
  },
  glowGold: {
    width: 260,
    height: 260,
    left: 80,
    bottom: -100,
    backgroundColor: '#f59e0b',
    opacity: 0.14,
  },

  content: {
    gap: 14,
    padding: 16,
    paddingTop: 48,
    paddingBottom: 36,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#1f160c',
    borderWidth: 3,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#fef3c7',
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 42,
  },
  refreshIconButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#1f160c',
    borderWidth: 3,
    borderColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    color: '#5eead4',
    fontSize: 28,
    fontWeight: '900',
  },
  headerTextWrap: {
    flex: 1,
    alignItems: 'center',
  },
  kicker: {
    color: '#5eead4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    color: '#facc15',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(16,185,129,0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },

  goldFrame: {
    borderRadius: 24,
    padding: 4,
    shadowColor: '#facc15',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  goldFrameInner: {
    borderRadius: 20,
    backgroundColor: 'rgba(2,44,34,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.22)',
    padding: 14,
  },

  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#5eead4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  summaryCity: {
    color: '#fff7ed',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 4,
  },
  summaryCounter: {
    width: 78,
    height: 78,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#facc15',
    backgroundColor: 'rgba(31,22,12,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryNumber: {
    color: '#facc15',
    fontSize: 28,
    fontWeight: '900',
  },
  summarySmall: {
    color: '#fef3c7',
    fontSize: 10,
    fontWeight: '900',
  },

  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  filterChip: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.58)',
    borderWidth: 2,
    borderColor: 'rgba(148,163,184,0.28)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(15,118,110,0.92)',
    borderColor: '#5eead4',
  },
  filterText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '900',
  },
  filterTextActive: {
    color: '#fff7ed',
  },

  sectionTitle: {
    color: '#5eead4',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  listHeader: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionCounter: {
    color: '#facc15',
    fontSize: 22,
    fontWeight: '900',
  },

  loadingCard: {
    borderRadius: 18,
    padding: 20,
    backgroundColor: 'rgba(2,44,34,0.72)',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#fef3c7',
    fontWeight: '800',
  },
  error: {
    color: '#fecaca',
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#facc15',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: '#fef3c7',
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },

  inactiveFrame: {
    opacity: 0.72,
  },
  huntTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  huntIconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(31,22,12,0.84)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  huntIcon: {
    fontSize: 28,
  },
  huntTitleWrap: {
    flex: 1,
  },
  huntTitle: {
    color: '#fff7ed',
    fontSize: 17,
    fontWeight: '900',
  },
  huntMeta: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusActive: {
    backgroundColor: '#059669',
  },
  statusInactive: {
    backgroundColor: '#475569',
  },
  statusText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  description: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },

  rewardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 12,
  },
  rewardPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(94,234,212,0.28)',
    backgroundColor: 'rgba(15,118,110,0.22)',
  },
  rewardText: {
    color: '#ccfbf1',
    fontSize: 10,
    fontWeight: '800',
  },

  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  progressOuter: {
    flex: 1,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#09090b',
    borderWidth: 2,
    borderColor: '#0f766e',
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  progressText: {
    position: 'absolute',
    alignSelf: 'center',
    top: -1,
    color: '#fff7ed',
    fontSize: 11,
    fontWeight: '900',
  },
  playButton: {
    minWidth: 82,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },

  refreshButton: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#5eead4',
  },
  refreshText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  pressed: {
    transform: [{ scale: 0.97 }, { translateY: 2 }],
    opacity: 0.9,
  },
});