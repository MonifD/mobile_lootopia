import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApiResource } from '@/hooks/use-api-resource';
import { useAuth } from '@/providers/auth-provider';
import { lootopiaApi } from '@/services/lootopia-api';
import type { LeaderboardEntry } from '@/types/game';

const LEADERBOARD_MODES = [
  { key: 'global',        label: 'Global' },
  { key: 'weekly',        label: 'Hebdo' },
  { key: 'monthly',       label: 'Mensuel' },
  { key: 'by-hunts',      label: 'Par chasses' },
  { key: 'by-streak',     label: 'Par série' },
  { key: 'weekly-stars',  label: 'Stars' },
  { key: 'local',         label: '📍 Ma ville' },
] as const;

type LeaderboardMode = (typeof LEADERBOARD_MODES)[number]['key'];

const standardLoaders: Partial<Record<LeaderboardMode, () => Promise<LeaderboardEntry[]>>> = {
  global:       () => lootopiaApi.getLeaderboardGlobal(),
  weekly:       () => lootopiaApi.getLeaderboardWeekly(),
  monthly:      () => lootopiaApi.getLeaderboardMonthly(),
  'by-hunts':   () => lootopiaApi.getLeaderboardByHunts(),
  'by-streak':  () => lootopiaApi.getLeaderboardByStreak(),
  'weekly-stars': () => lootopiaApi.getLeaderboardWeeklyStars(),
};

export default function LeaderboardScreen() {
  const { session } = useAuth();

  const [mode, setMode] = useState<LeaderboardMode>('global');

  // ── Classement local ─────────────────────────────────────────────────────
  const [cityInput, setCityInput] = useState(session ? '' : '');
  const [activeCity, setActiveCity] = useState<string | null>(null);

  const loadEntries = useCallback(() => {
    if (mode === 'local') {
      const city = activeCity ?? '';
      if (!city.trim()) return Promise.resolve([] as LeaderboardEntry[]);
      return lootopiaApi.getLeaderboardLocal(city.trim());
    }
    return standardLoaders[mode]!();
  }, [mode, activeCity]);

  const loadMyRank = useCallback(() => lootopiaApi.getMyRank(), []);
  const loadStats  = useCallback(() => lootopiaApi.getLeaderboardStats(), []);

  const entriesState = useApiResource(loadEntries);
  const myRankState  = useApiResource(loadMyRank);
  const statsState   = useApiResource(loadStats);

  const topThree = useMemo(() => (entriesState.data ?? []).slice(0, 3), [entriesState.data]);

  const switchMode = (key: LeaderboardMode) => {
    setMode(key);
    if (key === 'local' && !activeCity) {
      // pré-remplit avec la ville du profil si dispo
      const profileCity = (session as unknown as { city?: string } | null)?.city ?? '';
      setCityInput(profileCity);
    }
  };

  const searchLocal = () => {
    const city = cityInput.trim();
    if (!city) return;
    setActiveCity(city);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Hero */}
        <View style={styles.heroCard}>
          <ThemedText style={styles.kicker}>Compétition</ThemedText>
          <ThemedText type="title" style={styles.title}>Classement</ThemedText>
          <ThemedText style={styles.subtitle}>
            Compare tes points et grimpe dans le top des chasseurs.
          </ThemedText>
        </View>

        {/* Filtres */}
        <View style={styles.filters}>
          {LEADERBOARD_MODES.map((item) => {
            const selected = item.key === mode;
            return (
              <Pressable
                key={item.key}
                style={[styles.filterChip, selected && styles.filterChipActive]}
                onPress={() => switchMode(item.key)}
              >
                <ThemedText style={selected ? styles.filterTextActive : styles.filterText}>
                  {item.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* Saisie ville pour le mode local */}
        {mode === 'local' ? (
          <View style={styles.cityRow}>
            <TextInput
              style={styles.cityInput}
              value={cityInput}
              onChangeText={setCityInput}
              placeholder="Nom de la ville…"
              placeholderTextColor="#64748b"
              returnKeyType="search"
              onSubmitEditing={searchLocal}
              autoCapitalize="words"
            />
            <Pressable style={styles.citySearchBtn} onPress={searchLocal}>
              <ThemedText style={styles.citySearchText}>Chercher</ThemedText>
            </Pressable>
          </View>
        ) : null}

        {/* Stats globales */}
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
            <ThemedText style={styles.statLabel}>Moy. pts</ThemedText>
          </View>
        </View>

        {/* État : chargement / erreur / invite ville */}
        {entriesState.loading ? <ActivityIndicator color="#34d399" /> : null}
        {entriesState.error ? (
          <ThemedText style={styles.error}>Erreur : {entriesState.error}</ThemedText>
        ) : null}
        {mode === 'local' && !activeCity ? (
          <View style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>
              Entre le nom d'une ville pour voir le classement local.
            </ThemedText>
          </View>
        ) : null}

        {/* Podium top 3 */}
        {topThree.length > 0 ? (
          <View style={styles.podium}>
            {topThree.map((entry, index) => (
              <View
                key={entry.id}
                style={[styles.podiumCard, index === 0 && styles.gold]}
              >
                <ThemedText type="defaultSemiBold" style={styles.whiteText}>
                  #{index + 1} {entry.username}
                </ThemedText>
                <ThemedText style={styles.points}>{entry.totalPoints} pts</ThemedText>
              </View>
            ))}
          </View>
        ) : null}

        {/* Classement complet */}
        {(entriesState.data ?? []).map((entry, index) => (
          <View key={`${entry.id}-${index}`} style={styles.entryCard}>
            <ThemedText style={styles.rank}>#{entry.rank ?? index + 1}</ThemedText>
            <View style={styles.entryMain}>
              <ThemedText type="defaultSemiBold" style={styles.whiteText}>
                {entry.username}
              </ThemedText>
              <ThemedText style={styles.entryMeta}>
                {entry.level} • {entry.completedHunts} chasses • série {entry.loginStreak}
                {entry.city ? ` • ${entry.city}` : ''}
              </ThemedText>
            </View>
            <ThemedText style={styles.entryPoints}>{entry.totalPoints}</ThemedText>
          </View>
        ))}

        <Pressable style={styles.refreshButton} onPress={() => void entriesState.refresh()}>
          <ThemedText style={styles.refreshText}>Rafraîchir</ThemedText>
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
  whiteText: {
    color: '#ffffff',
  },

  // Filtres
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

  // Saisie ville
  cityRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  cityInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: 'rgba(15,23,42,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#f8fafc',
    fontSize: 14,
  },
  citySearchBtn: {
    borderRadius: 10,
    backgroundColor: '#0f766e',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  citySearchText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Stats
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

  // Invite vide
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: 'rgba(30,41,59,0.65)',
    padding: 14,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },

  // Podium
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

  // Lignes
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
