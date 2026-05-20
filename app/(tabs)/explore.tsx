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
import type { Achievement } from '@/types/game';

function getRarityColor(achievementType: string): string {
  switch (achievementType) {
    case 'top_leaderboard':
      return '#fbbf24';
    case 'login_streak':
      return '#a78bfa';
    case 'hunts_completed':
      return '#fb923c';
    case 'steps_completed':
      return '#34d399';
    case 'social':
      return '#60a5fa';
    default:
      return '#d1d5db';
  }
}

function getAchievementIcon(type: string): string {
  switch (type) {
    case 'top_leaderboard':
      return '🏆';
    case 'login_streak':
      return '🔥';
    case 'hunts_completed':
      return '🗺️';
    case 'steps_completed':
      return '💎';
    case 'social':
      return '👥';
    default:
      return '🎖️';
  }
}

function GoldFrame({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <LinearGradient
      colors={['#fff3a3', '#f59e0b', '#7c2d12']}
      style={[styles.goldFrame, style]}
    >
      <View style={styles.goldFrameInner}>{children}</View>
    </LinearGradient>
  );
}

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

  const { data, error, loading, refresh } = useApiResource(loadAchievements);

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
            <Text style={styles.pageTitle}>BADGES</Text>
            <Text style={styles.pageSubtitle}>ACCOMPLISSEMENTS</Text>
          </View>

          <Pressable onPress={() => void refresh()} style={styles.iconButton}>
            <Text style={styles.refreshTopIcon}>↻</Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator color="#facc15" /> : null}

        {error ? <Text style={styles.error}>Erreur : {error}</Text> : null}

        <GoldFrame>
          <Text style={styles.heroLogo}>🎖️ LOOTOPIA</Text>
          <Text style={styles.heroTitle}>PROGRESSION JOUEUR</Text>
          <Text style={styles.heroText}>
            Débloque des badges, gagne des points et monte en puissance à chaque mission.
          </Text>
        </GoldFrame>

        {data?.length ? (
          data.map((achievement: Achievement) => {
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
          <GoldFrame>
            <Text style={styles.emptyIcon}>🔒</Text>
            <Text style={styles.emptyTitle}>Aucun badge débloqué</Text>
            <Text style={styles.emptyText}>
              Continue tes chasses au trésor pour révéler tes premiers accomplissements.
            </Text>
          </GoldFrame>
        )}

        <Pressable onPress={() => void refresh()} style={({ pressed }) => pressed && styles.pressed}>
          <LinearGradient colors={['#fff3a3', '#f59e0b', '#7c2d12']} style={styles.refreshBorder}>
            <LinearGradient colors={['#065f46', '#132018']} style={styles.refreshButton}>
              <Text style={styles.refreshText}>🧭 RAFRAÎCHIR</Text>
            </LinearGradient>
          </LinearGradient>
        </Pressable>
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
  refreshTopIcon: {
    color: '#fef3c7',
    fontSize: 30,
    fontWeight: '900',
  },
  titleWrap: {
    alignItems: 'center',
    flex: 1,
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