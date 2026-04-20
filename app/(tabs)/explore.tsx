import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <ThemedText style={styles.kicker}>Progression joueur</ThemedText>
          <ThemedText type="title" style={styles.title}>Accomplissements</ThemedText>
          <ThemedText style={styles.subtitle}>Debloque des badges et monte en puissance a chaque mission.</ThemedText>
        </View>

        {loading ? <ThemedText style={styles.feedback}>Chargement...</ThemedText> : null}
        {error ? <ThemedText style={styles.error}>Erreur: {error}</ThemedText> : null}

        {data?.length ? (
          data.map((achievement: Achievement) => (
            <View key={achievement.id} style={[styles.card, { borderColor: getRarityColor(achievement.type) }]}>
              <View style={styles.header}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{achievement.name}</ThemedText>
                <ThemedText style={styles.points}>{achievement.pointsReward} pts</ThemedText>
              </View>
              <ThemedText style={styles.description}>{achievement.description}</ThemedText>
              {achievement.threshold > 1 ? (
                <ThemedText style={styles.threshold}>Seuil: {achievement.threshold}</ThemedText>
              ) : null}
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <ThemedText style={styles.feedback}>Aucun accomplissement deverrouille pour le moment.</ThemedText>
          </View>
        )}

        <Pressable style={styles.refreshButton} onPress={() => void refresh()}>
          <ThemedText style={styles.refreshText}>Rafraichir</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  content: {
    gap: 12,
    padding: 16,
    paddingBottom: 28,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(30,41,59,0.86)',
    padding: 16,
    gap: 6,
  },
  kicker: {
    color: '#34d399',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  title: {
    color: '#f8fafc',
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 19,
  },
  feedback: {
    color: '#ffffff',
    fontSize: 13,
  },
  error: {
    color: '#fda4af',
    fontSize: 13,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(30,41,59,0.82)',
    gap: 8,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#f8fafc',
    flex: 1,
    marginRight: 10,
  },
  points: {
    fontWeight: '700',
    fontSize: 14,
    color: '#fbbf24',
  },
  description: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 18,
  },
  threshold: {
    fontSize: 12,
    color: '#ffffff',
    fontStyle: 'italic',
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: 'rgba(30,41,59,0.65)',
    padding: 14,
  },
  refreshButton: {
    borderRadius: 12,
    backgroundColor: '#059669',
    paddingVertical: 12,
    alignItems: 'center',
  },
  refreshText: {
    color: '#fff',
    fontWeight: '700',
  },
});
