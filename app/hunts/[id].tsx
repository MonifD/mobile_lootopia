import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApiResource } from '@/hooks/use-api-resource';
import { lootopiaApi } from '@/services/lootopia-api';

function dateLabel(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('fr-FR');
}

export default function HuntDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const huntId = Number(params.id ?? 0);

  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!huntId) {
      throw new Error('Identifiant de chasse invalide');
    }

    const [hunt, reviews, stats] = await Promise.all([
      lootopiaApi.getHunt(huntId),
      lootopiaApi.getHuntReviews(huntId),
      lootopiaApi.getHuntReviewStats(huntId),
    ]);

    return { hunt, reviews, stats };
  }, [huntId]);

  const { data, error, loading, refresh } = useApiResource(loadData);

  const sortedDistribution = useMemo(() => {
    if (!data?.stats?.distribution) {
      return [] as [string, number][];
    }

    return Object.entries(data.stats.distribution).sort(([a], [b]) => Number(b) - Number(a));
  }, [data?.stats?.distribution]);

  const submitReview = async () => {
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      Alert.alert('Validation', 'La note doit etre un entier entre 1 et 5.');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Validation', 'Le commentaire est requis.');
      return;
    }

    try {
      setIsSubmitting(true);
      await lootopiaApi.postHuntReview(huntId, {
        rating: numericRating,
        comment: comment.trim(),
      });
      setComment('');
      setRating('5');
      await refresh();
      Alert.alert('Succès', 'Ton avis a ete envoye.');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Erreur inconnue';
      Alert.alert('Erreur', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Detail chasse</ThemedText>

        {loading ? <ActivityIndicator /> : null}
        {error ? <ThemedText>Erreur: {error}</ThemedText> : null}

        {data?.hunt ? (
          <>
            <View style={styles.card}>
              <ThemedText type="subtitle">{data.hunt.title}</ThemedText>
              {data.hunt.description ? <ThemedText>{data.hunt.description}</ThemedText> : null}
              <ThemedText style={styles.meta}>Ville: {data.hunt.city ?? '-'}</ThemedText>
              <ThemedText style={styles.meta}>Cree le: {dateLabel(data.hunt.createdAt)}</ThemedText>
              <ThemedText style={styles.meta}>Etat: {data.hunt.isActive ? 'Active' : 'Inactive'}</ThemedText>
            </View>

            <View style={styles.card}>
              <ThemedText type="defaultSemiBold">Avis et notes</ThemedText>
              <ThemedText>Note moyenne: {data.stats.averageRating.toFixed(1)} / 5</ThemedText>
              <ThemedText>Total avis: {data.stats.totalReviews}</ThemedText>
              {sortedDistribution.map(([star, count]) => (
                <ThemedText key={star} style={styles.meta}>
                  {star} etoile(s): {count}
                </ThemedText>
              ))}
            </View>

            <View style={styles.card}>
              <ThemedText type="defaultSemiBold">Poster un avis</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Note (1 a 5)"
                placeholderTextColor="#94a3b8"
                value={rating}
                keyboardType="number-pad"
                onChangeText={setRating}
                editable={!isSubmitting}
              />
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Ton avis"
                placeholderTextColor="#94a3b8"
                value={comment}
                onChangeText={setComment}
                editable={!isSubmitting}
                multiline
              />
              <Pressable style={styles.submitBtn} onPress={() => void submitReview()} disabled={isSubmitting}>
                <ThemedText style={styles.submitBtnText}>{isSubmitting ? 'Envoi...' : 'Publier'}</ThemedText>
              </Pressable>
            </View>

            <View style={styles.card}>
              <ThemedText type="defaultSemiBold">Commentaires valides</ThemedText>
              {data.reviews.length ? (
                data.reviews.map((review) => (
                  <View key={review.id} style={styles.reviewLine}>
                    <ThemedText type="defaultSemiBold">
                      {review.user?.username ?? 'Joueur'} • {review.rating}/5
                    </ThemedText>
                    <ThemedText>{review.comment}</ThemedText>
                    <ThemedText style={styles.meta}>{dateLabel(review.createdAt)}</ThemedText>
                  </View>
                ))
              ) : (
                <ThemedText>Aucun avis pour le moment.</ThemedText>
              )}
            </View>

            <Pressable style={styles.refreshBtn} onPress={() => void refresh()}>
              <ThemedText style={styles.submitBtnText}>Rafraichir</ThemedText>
            </Pressable>
          </>
        ) : null}
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
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 8,
    padding: 12,
  },
  meta: {
    fontSize: 12,
    opacity: 0.7,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  submitBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#0f766e',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  reviewLine: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    gap: 4,
  },
  refreshBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#111827',
  },
});
