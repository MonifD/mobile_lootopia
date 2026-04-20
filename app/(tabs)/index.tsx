import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApiResource } from '@/hooks/use-api-resource';
import { lootopiaApi } from '@/services/lootopia-api';
import type { Hunt } from '@/types/game';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
}

export default function HuntsScreen() {
  const router = useRouter();
  const loadHunts = useCallback(() => lootopiaApi.getHunts(), []);
  const { data, error, loading, refresh } = useApiResource(loadHunts);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.glow, styles.glowLeft]} />
        <View style={[styles.glow, styles.glowRight]} />

        <View style={styles.heroCard}>
          <ThemedText style={styles.kicker}>Terrain de jeu</ThemedText>
          <ThemedText type="title" style={styles.title} lightColor="#ffffff" darkColor="#ffffff">
            Chasses disponibles
          </ThemedText>
          <ThemedText style={styles.subtitle} lightColor="#ffffff" darkColor="#ffffff">
            Choisis une mission et commence ton aventure geolocalisee.
          </ThemedText>
        </View>

        {loading ? (
          <ThemedText style={styles.feedback} lightColor="#ffffff" darkColor="#ffffff">
            Chargement...
          </ThemedText>
        ) : null}
        {error ? <ThemedText style={styles.error}>Erreur: {error}</ThemedText> : null}

        {data?.length ? (
          data.map((hunt: Hunt) => (
            <Pressable
              key={hunt.id}
              onPress={() => router.push(`/hunts/${hunt.id}`)}
              style={[
                styles.card,
                {
                  borderColor: hunt.isActive ? 'rgba(52,211,153,0.65)' : 'rgba(148,163,184,0.35)',
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
                  <ThemedText style={styles.meta} lightColor="#ffffff" darkColor="#ffffff">
                    Lieu: {hunt.city}
                  </ThemedText>
                ) : null}
                <ThemedText style={styles.meta} lightColor="#ffffff" darkColor="#ffffff">
                  Cree: {formatDate(hunt.createdAt)}
                </ThemedText>
              </View>
              <ThemedText style={styles.openHint} lightColor="#6ee7b7" darkColor="#6ee7b7">
                Ouvrir le detail
              </ThemedText>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <ThemedText style={styles.feedback} lightColor="#ffffff" darkColor="#ffffff">
              Aucune chasse disponible pour le moment.
            </ThemedText>
          </View>
        )}

        <Pressable style={styles.refreshButton} onPress={() => void refresh()}>
          <ThemedText style={styles.refreshText} lightColor="#ffffff" darkColor="#ffffff">
            Rafraichir
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
  feedback: {
    color: '#ffffff',
    fontSize: 13,
  },
  error: {
    color: '#fda4af',
    fontSize: 13,
  },
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
