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
        <View style={styles.heroCard}>
          <ThemedText style={styles.kicker}>Competition</ThemedText>
          <ThemedText type="title" style={styles.title}>Classement</ThemedText>
          <ThemedText style={styles.subtitle}>Compare tes points et grimpe dans le top des chasseurs.</ThemedText>
        </View>

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

        {entriesState.loading ? <ActivityIndicator color="#34d399" /> : null}
        {entriesState.error ? <ThemedText style={styles.error}>Erreur: {entriesState.error}</ThemedText> : null}

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
  error: {
    color: '#fda4af',
    fontSize: 13,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.45)',
    backgroundColor: 'rgba(30,41,59,0.78)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  filterText: {
    fontSize: 12,
    color: '#cbd5e1',
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(30,41,59,0.82)',
    padding: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff',
  },
  podium: {
    gap: 8,
  },
  podiumCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(30,41,59,0.82)',
    padding: 10,
    gap: 4,
  },
  gold: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(146,64,14,0.35)',
  },
  points: {
    fontWeight: '700',
    color: '#b45309',
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(30,41,59,0.82)',
    padding: 10,
    gap: 10,
  },
  rank: {
    width: 36,
    textAlign: 'center',
    fontWeight: '700',
    color: '#f8fafc',
  },
  entryMain: {
    flex: 1,
    gap: 2,
  },
  entryMeta: {
    fontSize: 12,
    color: '#ffffff',
  },
  entryPoints: {
    fontWeight: '700',
    fontSize: 16,
    color: '#f8fafc',
  },
  refreshButton: {
    borderRadius: 8,
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    alignItems: 'center',
  },
  refreshText: {
    color: '#fff',
    fontWeight: '600',
  },
});
