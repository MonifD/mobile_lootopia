import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useApiResource } from '@/hooks/use-api-resource';
import { useAuth } from '@/providers/auth-provider';
import { lootopiaApi } from '@/services/lootopia-api';
import type { HuntReview, Step } from '@/types/game';
import HuntMapScreen from '../hunt-map/[id]';

function dateLabel(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('fr-FR');
}

function stepIriToId(iri: string): number | null {
  const match = iri.match(/\/steps\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function GoldFrame({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <LinearGradient colors={['#fff3a3', '#f59e0b', '#7c2d12']} style={[styles.goldFrame, style]}>
      <View style={styles.goldFrameInner}>{children}</View>
    </LinearGradient>
  );
}

function GameButton({
  icon,
  title,
  onPress,
  colors,
  disabled,
}: {
  icon: string;
  title: string;
  onPress: () => void;
  colors?: [string, string, string];
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [pressed && styles.pressed, disabled && styles.disabled]}>
      <LinearGradient colors={colors ?? ['#34d399', '#059669', '#064e3b']} style={styles.actionButton}>
        <Text style={styles.actionIcon}>{icon}</Text>
        <Text style={styles.actionText}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
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

    const [hunt, reviews, stats, steps, participations] = await Promise.all([
      lootopiaApi.getHunt(huntId),
      lootopiaApi.getHuntReviews(huntId),
      lootopiaApi.getHuntReviewStats(huntId),
      lootopiaApi.getHuntSteps(huntId),
      session?.userId ? lootopiaApi.getMyParticipations(session.userId).catch(() => []) : Promise.resolve([]),
    ]);

    return { hunt, reviews, stats, steps, participations };
  }, [huntId, session?.userId]);

  const { data, error, loading, refresh } = useApiResource(loadData);

  const sortedDistribution = useMemo(() => {
    if (!data?.stats?.distribution) {
      return [] as [string, number][];
    }

    return Object.entries(data.stats.distribution).sort(([a], [b]) => Number(b) - Number(a));
  }, [data?.stats?.distribution]);

  const steps = data?.steps ?? [];

  const completedStepIds = useMemo<Set<number>>(() => {
    if (!data?.participations?.length) return new Set();

    const ids = new Set<number>();
    for (const participation of data.participations) {
      const stepId = stepIriToId(participation.step);
      if (stepId !== null) ids.add(stepId);
    }
    return ids;
  }, [data?.participations]);

  const completedCount = useMemo(() => {
    if (!steps.length) return 0;
    return steps.filter((step) => completedStepIds.has(step.id)).length;
  }, [steps, completedStepIds]);

  const progressPercent = steps.length ? Math.min(100, Math.round((completedCount / steps.length) * 100)) : 0;

  const currentStep = useMemo<Step | null>(() => {
    if (!steps.length) return null;
    return steps.find((step) => !completedStepIds.has(step.id)) ?? null;
  }, [steps, completedStepIds]);

  const [isPlaying, setIsPlaying] = useState(false);

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

  if (isPlaying) {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ paddingTop: 48, paddingHorizontal: 12 }}>
          <Pressable onPress={() => setIsPlaying(false)} style={{ padding: 8, alignSelf: 'flex-start' }}>
            <Text style={{ color: '#fef3c7', fontSize: 20 }}>← Retour</Text>
          </Pressable>
        </View>
        <HuntMapScreen />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('@/assets/images/illustration-saison-automne-dans-style-art-numerique_23-2151704540.jpg')}
      style={styles.container}
      resizeMode="cover"
      imageStyle={styles.bgImage}
    >
      <View style={styles.bgOverlay} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.iconButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={styles.headerTextWrap}>
            <Text style={styles.kicker}>MISSION</Text>
            <Text style={styles.title}>DÉTAIL CHASSE</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#facc15" />
            <Text style={styles.loadingText}>Chargement de la chasse...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>Erreur : {error}</Text> : null}

        {data?.hunt ? (
          <>
            <GoldFrame>
              <Text style={styles.huntTitle}>{data.hunt.title}</Text>
              {data.hunt.description ? <Text style={styles.huntDescription}>{data.hunt.description}</Text> : null}
              <Text style={styles.meta}>📍 {data.hunt.city ?? 'Ville inconnue'}</Text>
              <Text style={styles.meta}>🗓️ Créée le {dateLabel(data.hunt.createdAt)}</Text>
              <Text style={styles.meta}>🎮 {data.hunt.isActive ? 'Active' : 'Inactive'}</Text>
            </GoldFrame>

            <GoldFrame>
              <Text style={styles.ruleTitle}>🔐 RÈGLE DE PROGRESSION</Text>
              <Text style={styles.ruleText}>
                Cette chasse fonctionne étape par étape : les prochaines étapes restent cachées tant que l'étape actuelle n'est pas validée.
              </Text>
            </GoldFrame>

            <GoldFrame>
              <Text style={styles.sectionTitle}>📊 PROGRESSION</Text>
              <View style={styles.progressBarOuter}>
                <View style={[styles.progressBarInner, { width: `${progressPercent}%` }]} />
                <Text style={styles.progressText}>{progressPercent}%</Text>
              </View>
              <Text style={styles.progressMeta}>{completedCount} / {steps.length} étapes validées</Text>
              <Text style={styles.progressMeta}>
                {currentStep ? `Étape actuelle : ${currentStep.orderNumber}` : 'Mission terminée'}
              </Text>
            </GoldFrame>

{completedCount > 0 && completedCount < steps.length ? (
  <GameButton
    icon="🎯"
    title="REPRENDRE"
    onPress={() => router.push(`/hunt-play/${huntId}`)}
  />
) : null}

<GameButton
  icon="🗺️"
  title="VOIR LA CARTE"
  onPress={() => router.push(`/hunt-map/${huntId}`)}
  colors={['#3b82f6', '#1d4ed8', '#1e3a5f']}
/>

            <GoldFrame>
              <Text style={styles.sectionTitle}>⭐ AVIS ET NOTES</Text>
              <Text style={styles.meta}>Note moyenne : {data.stats.averageRating.toFixed(1)} / 5</Text>
              <Text style={styles.meta}>Total avis : {data.stats.totalReviews}</Text>
              {sortedDistribution.map(([star, count]) => (
                <Text key={star} style={styles.meta}>{star} étoile(s) : {count}</Text>
              ))}
            </GoldFrame>

            {!hasReviewed.current ? (
              <GoldFrame>
                <Text style={styles.sectionTitle}>✍️ LAISSER UN AVIS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Note (1 à 5)"
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
                <GameButton icon="📨" title={isSubmitting ? 'ENVOI...' : 'PUBLIER'} onPress={() => void submitReview()} disabled={isSubmitting} />
              </GoldFrame>
            ) : null}

            <GoldFrame>
              <Text style={styles.sectionTitle}>💬 COMMENTAIRES</Text>

              {pendingReview ? (
                <View style={styles.reviewLine}>
                  <Text style={styles.pendingBadgeText}>⏳ En attente de validation</Text>
                  <Text style={styles.reviewUser}>{pendingReview.user?.username ?? 'Toi'} • {pendingReview.rating}/5</Text>
                  <Text style={styles.reviewText}>{pendingReview.comment}</Text>
                </View>
              ) : null}

              {data.reviews.length ? (
                data.reviews.map((review) => (
                  <View key={review.id} style={styles.reviewLine}>
                    <Text style={styles.reviewUser}>{review.user?.username ?? 'Joueur'} • {review.rating}/5</Text>
                    <Text style={styles.reviewText}>{review.comment}</Text>
                    <Text style={styles.reviewDate}>{dateLabel(review.createdAt)}</Text>
                  </View>
                ))
              ) : !pendingReview ? (
                <Text style={styles.meta}>Aucun avis approuvé pour le moment.</Text>
              ) : null}
            </GoldFrame>

          </>
        ) : null}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  bgImage: {
    opacity: 1,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  content: {
    gap: 14,
    padding: 16,
    paddingTop: 48,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#1f160c',
    borderWidth: 3,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#fef3c7',
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 42,
  },
  headerTextWrap: {
    flex: 1,
    alignItems: 'center',
  },
  goldFrame: {
    borderRadius: 24,
    padding: 4,
    shadowColor: '#facc15',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  goldFrameInner: {
    borderRadius: 20,
    backgroundColor: 'rgba(2,44,34,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.22)',
    padding: 14,
  },
  kicker: {
    color: '#34d399',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  title: {
    color: '#facc15',
    fontSize: 26,
    fontWeight: '900',
  },
  loadingCard: {
    borderRadius: 18,
    padding: 20,
    backgroundColor: 'rgba(2,44,34,0.72)',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#fef3c7',
    fontWeight: '800',
  },
  error: {
    color: '#fda4af',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '900',
  },
  huntTitle: {
    color: '#fff7ed',
    fontSize: 22,
    fontWeight: '900',
  },
  huntDescription: {
    color: '#f1f5f9',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: '#e2e8f0',
    marginTop: 2,
    fontWeight: '700',
  },
  ruleTitle: {
    color: '#facc15',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  ruleText: {
    color: '#f1f5f9',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#facc15',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },
  progressBarOuter: {
    height: 18,
    borderRadius: 999,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#0f766e',
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  progressText: {
    position: 'absolute',
    right: 8,
    top: -1,
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  progressMeta: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  actionButton: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#5eead4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.45)',
    backgroundColor: 'rgba(30,41,59,0.78)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontWeight: '700',
    marginBottom: 8,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  reviewLine: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.25)',
    paddingTop: 8,
    gap: 4,
    marginTop: 4,
  },
  reviewUser: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  reviewText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  reviewDate: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  pendingBadgeText: {
    backgroundColor: 'rgba(245,158,11,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.5)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '800',
    alignSelf: 'flex-start',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.97 }, { translateY: 2 }],
    opacity: 0.9,
  },
});
