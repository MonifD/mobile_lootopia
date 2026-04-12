import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApiResource } from '@/hooks/use-api-resource';
import { lootopiaApi } from '@/services/lootopia-api';
import type { LeaderboardEntry } from '@/types/game';

const LEADERBOARD_MODES = [
  { key: 'global', label: 'Global' },
  { key: 'weekly', label: 'Hebdo' },
  { key: 'monthly', label: 'Mensuel' },
  { key: 'by-hunts', label: 'Par chasses' },
  { key: 'by-streak', label: 'Par serie' },
  { key: 'weekly-stars', label: 'Stars semaine' },
] as const;

type LeaderboardMode = (typeof LEADERBOARD_MODES)[number]['key'];

const loaders: Record<LeaderboardMode, () => Promise<LeaderboardEntry[]>> = {
  global: () => lootopiaApi.getLeaderboardGlobal(),
  weekly: () => lootopiaApi.getLeaderboardWeekly(),
  monthly: () => lootopiaApi.getLeaderboardMonthly(),
  'by-hunts': () => lootopiaApi.getLeaderboardByHunts(),
  'by-streak': () => lootopiaApi.getLeaderboardByStreak(),
  'weekly-stars': () => lootopiaApi.getLeaderboardWeeklyStars(),
};

export default function LeaderboardScreen() {
  const [mode, setMode] = useState<LeaderboardMode>('global');

  const loadEntries = useCallback(() => loaders[mode](), [mode]);
  const loadMyRank = useCallback(() => lootopiaApi.getMyRank(), []);
  const loadStats = useCallback(() => lootopiaApi.getLeaderboardStats(), []);

  const entriesState = useApiResource(loadEntries);
  const myRankState = useApiResource(loadMyRank);
  const statsState = useApiResource(loadStats);

  const topThree = useMemo(() => (entriesState.data ?? []).slice(0, 3), [entriesState.data]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Classement</ThemedText>

        <View style={styles.filters}>
          {LEADERBOARD_MODES.map((item) => {
            const selected = item.key === mode;
            return (
              <Pressable
                key={item.key}
                style={[styles.filterChip, selected ? styles.filterChipActive : undefined]}
                onPress={() => setMode(item.key)}
              >
                <ThemedText style={selected ? styles.filterTextActive : styles.filterText}>{item.label}</ThemedText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <ThemedText style={styles.statValue}>{statsState.data?.totalPlayers ?? '-'}</ThemedText>
            <ThemedText style={styles.statLabel}>Joueurs</ThemedText>
          </View>
          <View style={styles.statsCard}>
            <ThemedText style={styles.statValue}>{myRankState.data?.rank ?? '-'}</ThemedText>
            <ThemedText style={styles.statLabel}>Mon rang</ThemedText>
          </View>
          <View style={styles.statsCard}>
            <ThemedText style={styles.statValue}>{statsState.data?.averagePoints ?? '-'}</ThemedText>
            <ThemedText style={styles.statLabel}>Moy. points</ThemedText>
          </View>
        </View>

        {entriesState.loading ? <ActivityIndicator /> : null}
        {entriesState.error ? <ThemedText>Erreur: {entriesState.error}</ThemedText> : null}

        <View style={styles.podium}>
          {topThree.map((entry, index) => (
            <View key={entry.id} style={[styles.podiumCard, index === 0 ? styles.gold : undefined]}>
              <ThemedText type="defaultSemiBold">#{index + 1} {entry.username}</ThemedText>
              <ThemedText style={styles.points}>{entry.totalPoints} pts</ThemedText>
            </View>
          ))}
        </View>

        {(entriesState.data ?? []).map((entry, index) => (
          <View key={`${entry.id}-${index}`} style={styles.entryCard}>
            <ThemedText style={styles.rank}>#{entry.rank ?? index + 1}</ThemedText>
            <View style={styles.entryMain}>
              <ThemedText type="defaultSemiBold">{entry.username}</ThemedText>
              <ThemedText style={styles.entryMeta}>
                {entry.level} • {entry.completedHunts} chasses • serie {entry.loginStreak}
              </ThemedText>
            </View>
            <ThemedText style={styles.entryPoints}>{entry.totalPoints}</ThemedText>
          </View>
        ))}

        <Pressable style={styles.refreshButton} onPress={() => void entriesState.refresh()}>
          <ThemedText style={styles.refreshText}>Rafraichir</ThemedText>
        </Pressable>
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
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  filterText: {
    fontSize: 12,
    opacity: 0.8,
  },
  filterTextActive: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statsCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  podium: {
    gap: 8,
  },
  podiumCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 10,
    gap: 4,
  },
  gold: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  points: {
    fontWeight: '700',
    color: '#b45309',
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    gap: 10,
  },
  rank: {
    width: 36,
    textAlign: 'center',
    fontWeight: '700',
  },
  entryMain: {
    flex: 1,
    gap: 2,
  },
  entryMeta: {
    fontSize: 12,
    opacity: 0.65,
  },
  entryPoints: {
    fontWeight: '700',
    fontSize: 16,
  },
  refreshButton: {
    borderRadius: 8,
    backgroundColor: '#111827',
    paddingVertical: 10,
    alignItems: 'center',
  },
  refreshText: {
    color: '#fff',
    fontWeight: '600',
  },
});
