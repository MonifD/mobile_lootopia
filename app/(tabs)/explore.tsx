import { useCallback } from 'react';
import { Button, ScrollView, StyleSheet, View } from 'react-native';

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
  const { session } = useAuth();
  const loadAchievements = useCallback(() => {
    if (!session?.userId) return Promise.resolve([]);
    return lootopiaApi.getAchievementsForUser(session.userId);
  }, [session?.userId]);

  const { data, error, loading, refresh } = useApiResource(loadAchievements);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Accomplissements</ThemedText>

        {loading ? <ThemedText>Chargement...</ThemedText> : null}
        {error ? <ThemedText>Erreur: {error}</ThemedText> : null}

        {data?.length ? (
          data.map((achievement: Achievement) => (
            <View key={achievement.id} style={[styles.card, { borderColor: getRarityColor(achievement.type) }]}>
              <View style={styles.header}>
                <ThemedText type="defaultSemiBold">{achievement.name}</ThemedText>
                <ThemedText style={styles.points}>{achievement.pointsReward} pts</ThemedText>
              </View>
              <ThemedText style={styles.description}>{achievement.description}</ThemedText>
              {achievement.threshold > 1 ? (
                <ThemedText style={styles.threshold}>Seuil: {achievement.threshold}</ThemedText>
              ) : null}
            </View>
          ))
        ) : (
          <ThemedText>Aucun accomplissement deverrouille pour le moment.</ThemedText>
        )}

        <Button title="Rafraichir" onPress={() => void refresh()} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 12,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  points: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fbbf24',
  },
  description: {
    fontSize: 13,
    opacity: 0.8,
    lineHeight: 18,
  },
  threshold: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
});
