import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApiResource } from '@/hooks/use-api-resource';
import { useAuth } from '@/providers/auth-provider';
import { lootopiaApi } from '@/services/lootopia-api';
import type { Hunt } from '@/types/game';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
}

type FilterMode = 'all' | 'my-city';

export default function HuntsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [filterMode, setFilterMode] = useState<FilterMode>('my-city');

  // Charge hunts + profil en parallèle
  const loadData = useCallback(async () => {
    const [hunts, profile] = await Promise.all([
      lootopiaApi.getHunts(),
      session?.userId
        ? lootopiaApi.getUser(session.userId).catch(() => null)
        : Promise.resolve(null),
    ]);
    return { hunts, userCity: profile?.city ?? null };
  }, [session?.userId]);

  const { data, error, loading, refresh } = useApiResource(loadData);

  const userCity = data?.userCity ?? null;
  const allHunts = data?.hunts ?? [];

  // Filtre côté client — comparaison insensible à la casse
  const visibleHunts = useMemo<Hunt[]>(() => {
    if (filterMode === 'all' || !userCity) return allHunts;
    return allHunts.filter(
      (h) => h.city?.toLowerCase().trim() === userCity.toLowerCase().trim()
    );
  }, [allHunts, filterMode, userCity]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.glow, styles.glowLeft]} />
        <View style={[styles.glow, styles.glowRight]} />

        {/* Hero */}
        <View style={styles.heroCard}>
          <ThemedText style={styles.kicker}>Terrain de jeu</ThemedText>
          <ThemedText type="title" style={styles.title} lightColor="#ffffff" darkColor="#ffffff">
            Chasses disponibles
          </ThemedText>
          <ThemedText style={styles.subtitle} lightColor="#ffffff" darkColor="#ffffff">
            Choisis une mission et commence ton aventure géolocalisée.
          </ThemedText>
        </View>

        {/* Toggle filtre ville */}
        <View style={styles.filterRow}>
          <Pressable
            style={[styles.filterChip, filterMode === 'all' && styles.filterChipActive]}
            onPress={() => setFilterMode('all')}
          >
            <ThemedText style={filterMode === 'all' ? styles.filterTextActive : styles.filterText}>
              🌍 Toutes les villes
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.filterChip,
              filterMode === 'my-city' && styles.filterChipActive,
              !userCity && !loading && styles.filterChipDisabled,
            ]}
            onPress={() => userCity && setFilterMode('my-city')}
            disabled={!userCity && !loading}
          >
            <ThemedText style={[
              filterMode === 'my-city' ? styles.filterTextActive : styles.filterText,
              !userCity && !loading && styles.filterTextDisabled,
            ]}>
              📍 {userCity ?? 'Ma ville (non définie)'}
            </ThemedText>
          </Pressable>
        </View>

        {/* Compteur */}
        {!loading ? (
          <ThemedText style={styles.counter}>
            {visibleHunts.length} chasse{visibleHunts.length !== 1 ? 's' : ''}
            {filterMode === 'my-city' && userCity ? ` à ${userCity}` : ''}
          </ThemedText>
        ) : null}

        {/* États chargement / erreur */}
        {loading ? (
          <ThemedText style={styles.feedback} lightColor="#ffffff" darkColor="#ffffff">
            Chargement...
          </ThemedText>
        ) : null}
        {error ? <ThemedText style={styles.error}>Erreur : {error}</ThemedText> : null}

        {/* Ville non définie */}
        {!loading && filterMode === 'my-city' && !userCity ? (
          <View style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>
              Tu n'as pas encore défini ta ville dans ton profil.{'\n'}
              Mets-la à jour ou affiche toutes les villes.
            </ThemedText>
          </View>
        ) : null}

        {/* Aucune chasse dans cette ville */}
        {!loading && filterMode === 'my-city' && userCity && visibleHunts.length === 0 && !error ? (
          <View style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>
              Aucune chasse disponible à {userCity} pour le moment.
            </ThemedText>
          </View>
        ) : null}

        {/* Liste */}
        {visibleHunts.map((hunt: Hunt) => (
          <Pressable
            key={hunt.id}
            onPress={() => router.push(`/hunts/${hunt.id}`)}
            style={[
              styles.card,
              {
                borderColor: hunt.isActive
                  ? 'rgba(52,211,153,0.65)'
                  : 'rgba(148,163,184,0.35)',
                opacity: hunt.isActive ? 1 : 0.75,
              },
            ]}
          >
            <View style={styles.cardTop}>
              <ThemedText
                type="defaultSemiBold"
                style={styles.cardTitle}
                lightColor="#ffffff"
                darkColor="#ffffff"
              >
                {hunt.title}
              </ThemedText>
              <ThemedText style={[styles.badge, hunt.isActive ? styles.badgeActive : styles.badgeInactive]}>
                {hunt.isActive ? 'Active' : 'Inactive'}
              </ThemedText>
            </View>

            {hunt.description ? (
              <ThemedText style={styles.description} lightColor="#ffffff" darkColor="#ffffff">
                {hunt.description}
              </ThemedText>
            ) : null}

            <View style={styles.footer}>
              {hunt.city ? (
                <View style={styles.cityTag}>
                  <ThemedText style={styles.cityTagText}>📍 {hunt.city}</ThemedText>
                </View>
              ) : null}
              <ThemedText style={styles.meta} lightColor="#ffffff" darkColor="#ffffff">
                Créée le {formatDate(hunt.createdAt)}
              </ThemedText>
            </View>

            <ThemedText style={styles.openHint} lightColor="#6ee7b7" darkColor="#6ee7b7">
              Ouvrir le détail →
            </ThemedText>
          </Pressable>
        ))}

        <Pressable style={styles.refreshButton} onPress={() => void refresh()}>
          <ThemedText style={styles.refreshText} lightColor="#ffffff" darkColor="#ffffff">
            Rafraîchir
          </ThemedText>
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
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.2,
  },
  glowLeft: {
    width: 220,
    height: 220,
    left: -60,
    top: -30,
    backgroundColor: '#10b981',
  },
  glowRight: {
    width: 180,
    height: 180,
    right: -70,
    top: 180,
    backgroundColor: '#06b6d4',
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

  // Filtre
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.45)',
    backgroundColor: 'rgba(30,41,59,0.78)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  filterChipDisabled: {
    opacity: 0.4,
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
  filterTextDisabled: {
    color: '#64748b',
  },
  counter: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 2,
  },

  // États
  feedback: {
    color: '#ffffff',
    fontSize: 13,
  },
  error: {
    color: '#fda4af',
    fontSize: 13,
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: 'rgba(30,41,59,0.65)',
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Carte chasse
  card: {
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(30,41,59,0.82)',
    gap: 8,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    color: '#f8fafc',
    flex: 1,
  },
  description: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  cityTag: {
    borderRadius: 8,
    backgroundColor: 'rgba(15,118,110,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cityTagText: {
    fontSize: 11,
    color: '#6ee7b7',
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    color: '#ffffff',
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
    color: '#fff',
    overflow: 'hidden',
  },
  badgeActive: {
    backgroundColor: '#059669',
  },
  badgeInactive: {
    backgroundColor: '#475569',
  },
  openHint: {
    fontSize: 12,
    color: '#6ee7b7',
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
