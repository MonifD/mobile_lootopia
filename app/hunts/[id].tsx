import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApiResource } from '@/hooks/use-api-resource';
import { useAuth } from '@/providers/auth-provider';
import { lootopiaApi } from '@/services/lootopia-api';
import type { HuntReview } from '@/types/game';

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
  const router = useRouter();
  const { session } = useAuth();

  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingReview, setPendingReview] = useState<HuntReview | null>(null);
  const hasReviewed = useRef(false);

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

    if (!session?.userId) {
      Alert.alert('Erreur', 'Tu dois etre connecte pour laisser un avis.');
      return;
    }

    try {
      setIsSubmitting(true);
      await lootopiaApi.postHuntReview(huntId, {
        userId: session.userId,
        rating: numericRating,
        comment: comment.trim(),
      });
      // Affiche le review localement en attente de modération
      setPendingReview({
        id: -1,
        rating: numericRating,
        comment: comment.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        user: { id: session.userId, username: session.username },
      });
      hasReviewed.current = true;
      setComment('');
      setRating('5');
      await refresh();
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
        <View style={styles.heroCard}>
          <ThemedText style={styles.kicker}>Mission</ThemedText>
          <ThemedText type="title" style={styles.title}>Detail chasse</ThemedText>
          <ThemedText style={styles.subtitle}>Consulte les infos terrain et partage ton avis de joueur.</ThemedText>
        </View>

        {loading ? <ActivityIndicator color="#34d399" /> : null}
        {error ? <ThemedText style={styles.error}>Erreur: {error}</ThemedText> : null}

        {data?.hunt ? (
          <>
            <View style={styles.card}>
              <ThemedText type="subtitle" style={styles.whiteText}>{data.hunt.title}</ThemedText>
              {data.hunt.description ? <ThemedText style={styles.whiteText}>{data.hunt.description}</ThemedText> : null}
              <ThemedText style={styles.meta}>Ville: {data.hunt.city ?? '-'}</ThemedText>
              <ThemedText style={styles.meta}>Cree le: {dateLabel(data.hunt.createdAt)}</ThemedText>
              <ThemedText style={styles.meta}>Etat: {data.hunt.isActive ? 'Active' : 'Inactive'}</ThemedText>
            </View>

            {/* Bouton carte interactive */}
            <Pressable
              style={({ pressed }) => [styles.mapButton, pressed && styles.mapButtonPressed]}
              onPress={() => router.push(`/hunt-map/${huntId}`)}
            >
              <ThemedText style={styles.mapButtonText}>🗺️  Voir la carte interactive</ThemedText>
            </Pressable>

            <View style={styles.card}>
              <ThemedText type="defaultSemiBold" style={styles.whiteText}>Avis et notes</ThemedText>
              <ThemedText style={styles.whiteText}>Note moyenne: {data.stats.averageRating.toFixed(1)} / 5</ThemedText>
              <ThemedText style={styles.whiteText}>Total avis: {data.stats.totalReviews}</ThemedText>
              {sortedDistribution.map(([star, count]) => (
                <ThemedText key={star} style={styles.meta}>
                  {star} etoile(s): {count}
                </ThemedText>
              ))}
            </View>

            {!hasReviewed.current ? (
              <View style={styles.card}>
                <ThemedText type="defaultSemiBold" style={styles.whiteText}>Poster un avis</ThemedText>
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
            ) : null}

            <View style={styles.card}>
              <ThemedText type="defaultSemiBold" style={styles.whiteText}>Commentaires</ThemedText>

              {/* Review en attente de validation (soumis dans cette session) */}
              {pendingReview ? (
                <View style={styles.pendingReviewLine}>
                  <View style={styles.pendingBadgeRow}>
                    <View style={styles.pendingBadge}>
                      <ThemedText style={styles.pendingBadgeText}>⏳ En attente de validation</ThemedText>
                    </View>
                  </View>
                  <ThemedText type="defaultSemiBold" style={styles.whiteText}>
                    {pendingReview.user?.username ?? 'Toi'} • {pendingReview.rating}/5
                  </ThemedText>
                  <ThemedText style={styles.whiteText}>{pendingReview.comment}</ThemedText>
                </View>
              ) : null}

              {/* Reviews approuvés */}
              {data.reviews.length ? (
                data.reviews.map((review) => (
                  <View key={review.id} style={styles.reviewLine}>
                    <ThemedText type="defaultSemiBold" style={styles.whiteText}>
                      {review.user?.username ?? 'Joueur'} • {review.rating}/5
                    </ThemedText>
                    <ThemedText style={styles.whiteText}>{review.comment}</ThemedText>
                    <ThemedText style={styles.meta}>{dateLabel(review.createdAt)}</ThemedText>
                  </View>
                ))
              ) : !pendingReview ? (
                <ThemedText style={styles.whiteText}>Aucun avis approuve pour le moment.</ThemedText>
              ) : null}
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
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(30,41,59,0.82)',
    gap: 8,
    padding: 12,
  },
  meta: {
    fontSize: 12,
    color: '#ffffff',
  },
  whiteText: {
    color: '#ffffff',
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.45)',
    backgroundColor: 'rgba(30,41,59,0.78)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
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
    borderTopColor: 'rgba(148,163,184,0.25)',
    paddingTop: 8,
    gap: 4,
  },
  refreshBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  mapButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#0f766e',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  mapButtonPressed: {
    backgroundColor: '#0d9488',
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  pendingReviewLine: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.25)',
    paddingTop: 8,
    gap: 6,
  },
  pendingBadgeRow: {
    flexDirection: 'row',
  },
  pendingBadge: {
    backgroundColor: 'rgba(245,158,11,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.5)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingBadgeText: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '600',
  },
});
