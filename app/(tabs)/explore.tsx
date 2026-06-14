import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
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
import { useAuth } from '@/providers/auth-provider';
import { lootopiaApi } from '@/services/lootopia-api';
import type { Achievement, HuntHistoryEntry } from '@/types/game';

// ─── Achievements helpers ────────────────────────────────────────────────────

function getRarityColor(achievementType: string): string {
  switch (achievementType) {
    case 'top_leaderboard': return '#fbbf24';
    case 'login_streak':    return '#a78bfa';
    case 'hunts_completed': return '#fb923c';
    case 'steps_completed': return '#34d399';
    case 'social':          return '#60a5fa';
    default:                return '#d1d5db';
  }
}

function getAchievementIcon(type: string): string {
  switch (type) {
    case 'top_leaderboard': return '🏆';
    case 'login_streak':    return '🔥';
    case 'hunts_completed': return '🗺️';
    case 'steps_completed': return '💎';
    case 'social':          return '👥';
    default:                return '🎖️';
  }
}

// ─── Shared UI ───────────────────────────────────────────────────────────────

function GoldFrame({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <LinearGradient colors={['#fff3a3', '#f59e0b', '#7c2d12']} style={[styles.goldFrame, style]}>
      <View style={styles.goldFrameInner}>{children}</View>
    </LinearGradient>
  );
}

function SectionHeader({ icon, title, subtitle, color }: { icon: string; title: string; subtitle?: string; color: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderIcon}>{icon}</Text>
      <View>
        <Text style={[styles.sectionHeaderTitle, { color }]}>{title}</Text>
        {subtitle ? <Text style={styles.sectionHeaderSub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

// ─── Hunt History Card ───────────────────────────────────────────────────────

function HuntHistoryCard({ entry }: { entry: HuntHistoryEntry }) {
  const isCompleted = entry.status === 'completed';
  const accentColor = isCompleted ? '#4ade80' : '#fbbf24';
  const progressPct = Math.round(entry.progress * 100);

  function formatDuration(seconds: number | null): string | null {
    if (!seconds) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
  }

  function formatDate(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <LinearGradient
      colors={isCompleted ? ['#4ade80', '#16a34a', '#7c2d12'] : ['#fbbf24', '#d97706', '#7c2d12']}
      style={styles.huntCardBorder}
    >
      <LinearGradient colors={['#08261e', '#102018']} style={styles.huntCard}>
        <View style={styles.huntCardGloss} />

        {/* Header */}
        <View style={styles.huntCardHeader}>
          <Text style={styles.huntCardIcon}>{isCompleted ? '✅' : '⏳'}</Text>
          <View style={styles.huntCardTitleWrap}>
            <Text style={styles.huntCardTitle} numberOfLines={1}>{entry.hunt.title}</Text>
            {entry.hunt.city ? (
              <Text style={styles.huntCardCity}>📍 {entry.hunt.city.name}</Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { borderColor: accentColor }]}>
            <Text style={[styles.statusBadgeText, { color: accentColor }]}>
              {isCompleted ? 'TERMINÉ' : 'EN COURS'}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarWrap}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` as `${number}%`, backgroundColor: accentColor }]} />
          </View>
          <Text style={[styles.progressPct, { color: accentColor }]}>{progressPct}%</Text>
        </View>

        {/* Stats row */}
        <View style={styles.huntCardStats}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🗺️</Text>
            <Text style={styles.statValue}>{entry.stepsCompleted}/{entry.totalSteps}</Text>
            <Text style={styles.statLabel}>étapes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>{entry.totalPoints}</Text>
            <Text style={styles.statLabel}>pts</Text>
          </View>
          {isCompleted && entry.durationSeconds ? (
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statValue}>{formatDuration(entry.durationSeconds)}</Text>
              <Text style={styles.statLabel}>durée</Text>
            </View>
          ) : (
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📅</Text>
              <Text style={styles.statValue}>{formatDate(entry.startedAt)}</Text>
              <Text style={styles.statLabel}>début</Text>
            </View>
          )}
          {isCompleted && entry.completedAt ? (
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🏁</Text>
              <Text style={styles.statValue}>{formatDate(entry.completedAt)}</Text>
              <Text style={styles.statLabel}>fini le</Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </LinearGradient>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AchievementsScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();

  const loadAchievements = useCallback(() => {
    const request = !session?.userId
      ? lootopiaApi.getAchievementsForCurrentUser()
      : lootopiaApi.getAchievementsForUser(session.userId);

    return request.catch((error) => {
      const message = error instanceof Error ? error.message : '';
      if (/not found|EntityValueResolver/i.test(message)) {
        void signOut();
        router.replace('/login');
      }
      throw error;
    });
  }, [router, session?.userId, signOut]);

  const loadHuntHistory = useCallback(
    () => session?.userId
      ? lootopiaApi.getHuntHistory(session.userId)
      : Promise.resolve([] as Awaited<ReturnType<typeof lootopiaApi.getHuntHistory>>),
    [session?.userId],
  );

  const { data: achievements, error: achError, loading: achLoading } = useApiResource(loadAchievements);
  const { data: huntHistory, error: huntError, loading: huntLoading } = useApiResource(loadHuntHistory);

  const inProgress = huntHistory?.filter((e) => e.status === 'in_progress') ?? [];
  const completed  = huntHistory?.filter((e) => e.status === 'completed')   ?? [];


  return (
    <ImageBackground
      source={require('@/assets/images/foret.jpg')}
      style={styles.root}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.iconButton}>
            <Text style={styles.iconButtonText}>‹</Text>
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.pageTitle}>SUCCÈS</Text>
            <Text style={styles.pageSubtitle}>ACCOMPLISSEMENTS</Text>
          </View>
        </View>

        {(achLoading || huntLoading) ? <ActivityIndicator color="#facc15" /> : null}
        {achError  ? <Text style={styles.error}>Erreur badges : {achError}</Text>  : null}
        {huntError ? <Text style={styles.error}>Erreur chasses : {huntError}</Text> : null}

        {/* ── CHASSES EN COURS ─────────────────────────────────────────────── */}
        <SectionHeader icon="⏳" title="CHASSES EN COURS" subtitle={`${inProgress.length} chasse${inProgress.length !== 1 ? 's' : ''}`} color="#fbbf24" />

        {!huntLoading && inProgress.length === 0 ? (
          <GoldFrame>
            <Text style={styles.emptyIcon}>🔒</Text>
            <Text style={styles.emptyTitle}>Bientôt disponible</Text>
            <Text style={styles.emptyText}>Les chasses en cours seront visibles après la mise à jour d'authentification.</Text>
          </GoldFrame>
        ) : null}

        {inProgress.map((entry) => (
          <HuntHistoryCard key={`ip-${entry.hunt.id}`} entry={entry} />
        ))}

        {/* Séparateur */}
        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorGem}>◆</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* ── CHASSES TERMINÉES ────────────────────────────────────────────── */}
        <SectionHeader icon="✅" title="CHASSES TERMINÉES" subtitle={`${completed.length} chasse${completed.length !== 1 ? 's' : ''} complétée${completed.length !== 1 ? 's' : ''}`} color="#4ade80" />

        {!huntLoading && completed.length === 0 ? (
          <GoldFrame>
            <Text style={styles.emptyIcon}>🏁</Text>
            <Text style={styles.emptyTitle}>Aucune chasse terminée</Text>
            <Text style={styles.emptyText}>Termine ta première chasse pour débloquer cette section.</Text>
          </GoldFrame>
        ) : null}

        {completed.map((entry) => (
          <HuntHistoryCard key={`cp-${entry.hunt.id}`} entry={entry} />
        ))}

        {/* Séparateur */}
        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorGem}>◆</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* ── BADGES ───────────────────────────────────────────────────────── */}
        <SectionHeader icon="🎖️" title="BADGES" subtitle="Accomplissements débloqués" color="#facc15" />

        <GoldFrame>
          <Text style={styles.heroLogo}>🎖️ LOOTOPIA</Text>
          <Text style={styles.heroTitle}>PROGRESSION JOUEUR</Text>
          <Text style={styles.heroText}>
            Débloque des badges, gagne des points et monte en puissance à chaque mission.
          </Text>
        </GoldFrame>

        {achievements?.length ? (
          achievements.map((achievement: Achievement) => {
            const rarityColor = getRarityColor(achievement.type);
            return (
              <LinearGradient
                key={achievement.id}
                colors={['#fff3a3', rarityColor, '#7c2d12']}
                style={styles.achievementBorder}
              >
                <LinearGradient colors={['#08261e', '#102018']} style={styles.achievementCard}>
                  <View style={styles.cardGloss} />
                  <View style={[styles.badgeIconWrap, { borderColor: rarityColor }]}>
                    <Text style={styles.badgeIcon}>{getAchievementIcon(achievement.type)}</Text>
                  </View>
                  <View style={styles.achievementMain}>
                    <View style={styles.achievementHeader}>
                      <Text style={styles.achievementTitle}>{achievement.name}</Text>
                      <View style={styles.pointsBadge}>
                        <Text style={styles.points}>{achievement.pointsReward} pts</Text>
                      </View>
                    </View>
                    <Text style={styles.description}>{achievement.description}</Text>
                    {achievement.threshold > 1 ? (
                      <Text style={styles.threshold}>Seuil : {achievement.threshold}</Text>
                    ) : null}
                  </View>
                </LinearGradient>
              </LinearGradient>
            );
          })
        ) : (
          !achLoading ? (
            <GoldFrame>
              <Text style={styles.emptyIcon}>🔒</Text>
              <Text style={styles.emptyTitle}>Aucun badge débloqué</Text>
              <Text style={styles.emptyText}>
                Continue tes chasses au trésor pour révéler tes premiers accomplissements.
              </Text>
            </GoldFrame>
          ) : null
        )}

      </ScrollView>
    </ImageBackground>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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

  // Top bar
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
  refreshTopIcon: {
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
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: '#78350f',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 2,
  },
  pageSubtitle: {
    marginTop: -4,
    color: '#bbf7d0',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },
  error: {
    color: '#fecaca',
    fontWeight: '800',
    textAlign: 'center',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  sectionHeaderIcon: {
    fontSize: 26,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionHeaderSub: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },

  // Separator
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  separatorLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#3f2307',
  },
  separatorGem: {
    color: '#d97706',
    fontSize: 14,
  },

  // Hunt history card
  huntCardBorder: {
    borderRadius: 20,
    padding: 3,
  },
  huntCard: {
    borderRadius: 17,
    padding: 14,
    gap: 10,
    overflow: 'hidden',
  },
  huntCardGloss: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    height: 20,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  huntCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  huntCardIcon: {
    fontSize: 24,
  },
  huntCardTitleWrap: {
    flex: 1,
  },
  huntCardTitle: {
    color: '#fff7ed',
    fontSize: 15,
    fontWeight: '900',
  },
  huntCardCity: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  progressBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '900',
    minWidth: 36,
    textAlign: 'right',
  },
  huntCardStats: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statIcon: {
    fontSize: 14,
  },
  statValue: {
    color: '#fef3c7',
    fontSize: 13,
    fontWeight: '900',
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '700',
  },

  // Gold frame
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
    fontSize: 24,
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

  // Achievement card
  achievementBorder: {
    borderRadius: 20,
    padding: 3,
  },
  achievementCard: {
    minHeight: 104,
    borderRadius: 17,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    overflow: 'hidden',
  },
  cardGloss: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    height: 22,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  badgeIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#241607',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  badgeIcon: {
    fontSize: 28,
  },
  achievementMain: {
    flex: 1,
    gap: 6,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  achievementTitle: {
    flex: 1,
    color: '#fff7ed',
    fontSize: 16,
    fontWeight: '900',
  },
  pointsBadge: {
    borderRadius: 12,
    backgroundColor: '#241607',
    borderWidth: 2,
    borderColor: '#d97706',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  points: {
    color: '#fef3c7',
    fontSize: 12,
    fontWeight: '900',
  },
  description: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  threshold: {
    color: '#bbf7d0',
    fontSize: 11,
    fontWeight: '900',
  },

  // Empty states
  emptyIcon: {
    fontSize: 34,
    textAlign: 'center',
  },
  emptyTitle: {
    marginTop: 8,
    color: '#facc15',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 6,
    color: '#fde68a',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 19,
  },

  // Refresh button
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
