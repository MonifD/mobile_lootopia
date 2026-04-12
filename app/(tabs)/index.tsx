import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Button, Pressable, ScrollView, StyleSheet, View } from 'react-native';

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
        <ThemedText type="title">Chasses</ThemedText>

        {loading ? <ThemedText>Chargement...</ThemedText> : null}
        {error ? <ThemedText>Erreur: {error}</ThemedText> : null}

        {data?.length ? (
          data.map((hunt: Hunt) => (
            <Pressable
              key={hunt.id}
              onPress={() => router.push(`/hunts/${hunt.id}`)}
              style={[
                styles.card,
                {
                  borderColor: hunt.isActive ? '#34d399' : '#9ca3af',
                  opacity: hunt.isActive ? 1 : 0.6,
                },
              ]}
            >
              <ThemedText type="defaultSemiBold">{hunt.title}</ThemedText>
              {hunt.description ? <ThemedText style={styles.description}>{hunt.description}</ThemedText> : null}
              <View style={styles.footer}>
                {hunt.city ? <ThemedText style={styles.meta}>Lieu: {hunt.city}</ThemedText> : null}
                <ThemedText style={styles.meta}>Cree: {formatDate(hunt.createdAt)}</ThemedText>
              </View>
              <ThemedText style={styles.badge}>{hunt.isActive ? 'Active' : 'Inactive'}</ThemedText>
              <ThemedText style={styles.openHint}>Ouvrir le detail</ThemedText>
            </Pressable>
          ))
        ) : (
          <ThemedText>Aucune chasse disponible pour le moment.</ThemedText>
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
  description: {
    fontSize: 13,
    opacity: 0.8,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  meta: {
    fontSize: 12,
    opacity: 0.6,
  },
  badge: {
    fontSize: 11,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: '#34d399',
    color: '#fff',
    overflow: 'hidden',
  },
  openHint: {
    fontSize: 12,
    opacity: 0.65,
  },
});
