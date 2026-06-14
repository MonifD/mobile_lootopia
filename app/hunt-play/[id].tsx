import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { BottomNav } from '@/components/app-footer';
import { AppHeader } from '@/components/app-header';
import { useApiResource } from '@/hooks/use-api-resource';
import { useAuth } from '@/providers/auth-provider';
import { lootopiaApi } from '@/services/lootopia-api';
import type { Step } from '@/types/game';

const VALIDATION_RADIUS = 5;
const GPS_INTERVAL = 3000;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function stepIriToId(iri: string): number | null {
  const match = iri.match(/\/steps\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function isStepUnlocked(index: number, currentIndex: number, completed: Set<number>): boolean {
  return completed.has(index) || index === currentIndex;
}

function GameBackground({ children }: { children: React.ReactNode }) {
  return (
    <ImageBackground
      source={require('@/assets/images/illustration-saison-automne-dans-style-art-numerique_23-2151704540.jpg')}
      style={styles.container}
      resizeMode="cover"
      imageStyle={styles.bgImage}
    >
      <View style={styles.bgOverlay} />
      <View style={[styles.glowBlob, styles.glowEmerald]} />
      <View style={[styles.glowBlob, styles.glowGold]} />
      <View style={[styles.glowBlob, styles.glowCyan]} />
      {children}
    </ImageBackground>
  );
}

function GoldFrame({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <LinearGradient colors={['#fff3a3', '#f59e0b', '#7c2d12']} style={[styles.goldFrame, style]}>
      <View style={styles.goldFrameInner}>{children}</View>
    </LinearGradient>
  );
}

function GameButton({
  title,
  icon,
  onPress,
  loading,
  disabled,
  colors,
}: {
  title: string;
  icon: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  colors?: [string, string, string];
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [pressed && styles.pressed, disabled && styles.disabled]}
    >
      <LinearGradient
        colors={colors ?? ['#34d399', '#059669', '#064e3b']}
        style={styles.gameButton}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.gameButtonIcon}>{icon}</Text>
            <Text style={styles.gameButtonText}>{title}</Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

function PulseRadar({ distance, radius }: { distance: number | null; radius: number }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const isClose = distance !== null && distance <= radius;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: isClose ? 700 : 1800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );

    loop.start();
    return () => loop.stop();
  }, [pulseAnim, isClose]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1.6],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 0],
  });

  const color = isClose ? '#10b981' : '#f59e0b';

  return (
    <View style={styles.radarWrap}>
      <Animated.View
        style={[
          styles.radarPulse,
          {
            backgroundColor: color,
            transform: [{ scale }],
            opacity,
          },
        ]}
      />

      <View style={[styles.radarDot, { backgroundColor: color }]}>
        <Text style={styles.radarIcon}>{isClose ? '✅' : '📡'}</Text>
      </View>
    </View>
  );
}

function StepProgressBar({
  current,
  total,
  completedSet,
}: {
  current: number;
  total: number;
  completedSet: Set<number>;
}) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: total }, (_, i) => {
        const isDone = completedSet.has(i);
        const isCurrent = i === current;

        return (
          <View
            key={i}
            style={[
              styles.progressDot,
              isDone && styles.progressDotDone,
              isCurrent && !isDone && styles.progressDotCurrent,
            ]}
          >
            <Text style={styles.progressDotText}>{isDone ? '✓' : i + 1}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function HuntPlayScreen() {
  const params = useLocalSearchParams<{ id?: string; finished?: string }>();
  const huntId = Number(params.id ?? 0);
  const router = useRouter();
  const { session } = useAuth();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(new Set());
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [huntFinished, setHuntFinished] = useState(params.finished === '1');

  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const loadData = useCallback(async () => {
    if (!huntId) throw new Error('Identifiant de chasse invalide');
    if (!session?.userId) throw new Error('Tu dois être connecté');

    const [steps, hunt, participations] = await Promise.all([
      lootopiaApi.getHuntSteps(huntId),
      lootopiaApi.getHunt(huntId),
      lootopiaApi.getMyParticipations(session.userId),
    ]);

    return { steps, hunt, participations };
  }, [huntId, session?.userId]);

  const { data, error, loading, refresh } = useApiResource(loadData);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const steps = data?.steps ?? [];
  const hunt = data?.hunt ?? null;

  const completedStepIds = useMemo<Set<number>>(() => {
    if (!data?.participations || !steps.length) return new Set();

    const stepIdsInHunt = new Set(steps.map((step) => step.id));
    const done = new Set<number>();

    for (const participation of data.participations) {
      const stepId = stepIriToId(participation.step);

      if (stepId && stepIdsInHunt.has(stepId)) {
        done.add(stepId);
      }
    }
    console.log('completedStepIds:', [...done]);

    return done;
  }, [data?.participations, steps]);

  useEffect(() => {
    if (!steps.length) return;

    const indices = new Set<number>();

    steps.forEach((step, index) => {
      if (completedStepIds.has(step.id)) {
        indices.add(index);
      }
    });

    setCompletedIndices(indices);

    const firstUncompleted = steps.findIndex((step) => !completedStepIds.has(step.id));

    if (firstUncompleted === -1) {
      setHuntFinished(true);
    } else {
      setHuntFinished(false);
      setCurrentStepIndex(firstUncompleted);
    }
  }, [completedStepIds, steps]);

  useEffect(() => {
    let mounted = true;

    const startLocationWatch = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setGpsError('Permission de localisation refusée');
        return;
      }

      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: GPS_INTERVAL,
          distanceInterval: 5,
        },
        (location) => {
          if (!mounted) return;

          setUserLat(location.coords.latitude);
          setUserLon(location.coords.longitude);
          setGpsError(null);
        }
      );
    };

    void startLocationWatch();

    return () => {
      mounted = false;
      watchRef.current?.remove();
    };
  }, []);

  const currentStep: Step | null = steps[currentStepIndex] ?? null;

  const distance = useMemo(() => {
    if (!currentStep || userLat === null || userLon === null) return null;

    return haversineDistance(
      userLat,
      userLon,
      currentStep.latitude,
      currentStep.longitude
    );
  }, [currentStep, userLat, userLon]);

  const canActivateAr = distance !== null && distance <= VALIDATION_RADIUS;
  const isCurrentCompleted = completedIndices.has(currentStepIndex);

  const visibleStepEntries = useMemo(
    () =>
      steps
        .map((step, index) => ({ step, index }))
        .filter(({ index }) => isStepUnlocked(index, currentStepIndex, completedIndices)),
    [steps, currentStepIndex, completedIndices]
  );

  const hiddenStepsCount = Math.max(0, steps.length - visibleStepEntries.length);

  const goToStep = (index: number) => {
    if (!isStepUnlocked(index, currentStepIndex, completedIndices)) return;
    setCurrentStepIndex(index);
  };

  return (
    <GameBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader />

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#facc15" />
            <Text style={styles.loadingText}>Chargement de la mission...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>Erreur : {error}</Text> : null}

        {gpsError ? (
          <GoldFrame>
            <Text style={styles.gpsErrorTitle}>📡 LOCALISATION</Text>
            <Text style={styles.gpsErrorText}>{gpsError}</Text>
          </GoldFrame>
        ) : null}

        {steps.length > 0 ? (
          <StepProgressBar current={currentStepIndex} total={steps.length} completedSet={completedIndices} />
        ) : null}

        {huntFinished ? (
          <GoldFrame>
            <View style={styles.finishedWrap}>
              <Text style={styles.finishedIcon}>🏆</Text>
              <Text style={styles.finishedTitle}>MISSION ACCOMPLIE</Text>
              <Text style={styles.finishedText}>
                Tu as complété les {steps.length} étapes de cette chasse !
              </Text>

              <GameButton icon="⭐" title="LAISSER UN AVIS" onPress={() => router.push(`/hunts/${huntId}`)} />

              <GameButton
                icon="🏠"
                title="RETOUR ACCUEIL"
                onPress={() => router.replace('/home')}
                colors={['#f59e0b', '#d97706', '#92400e']}
              />
            </View>
          </GoldFrame>
        ) : null}

        {currentStep && !huntFinished ? (
          <>
            <GoldFrame>
              <View style={styles.radarSection}>
                <PulseRadar distance={distance} radius={VALIDATION_RADIUS} />

                <View style={styles.distanceInfo}>
                  <Text style={styles.distanceLabel}>DISTANCE</Text>

                  <Text style={[styles.distanceValue, canActivateAr && styles.distanceValueClose]}>
                    {distance !== null ? formatDistance(distance) : '-- m'}
                  </Text>

                  <Text style={styles.distanceHint}>
                    {canActivateAr
                      ? '🟢 Tu es à portée de l’étape'
                      : `Approche-toi à moins de ${VALIDATION_RADIUS} m`}
                  </Text>
                </View>
              </View>
            </GoldFrame>

            <GoldFrame>
              <View style={styles.clueSection}>
                <View style={styles.clueHeader}>
                  <View style={styles.clueIconBox}>
                    <Text style={styles.clueIconText}>{isCurrentCompleted ? '✅' : '🔎'}</Text>
                  </View>

                  <View style={styles.clueHeaderText}>
                    <Text style={styles.clueKicker}>ÉTAPE {currentStep.orderNumber}</Text>
                    <Text style={styles.clueStatus}>{isCurrentCompleted ? 'VALIDÉE' : 'EN COURS'}</Text>
                  </View>
                </View>

                <View style={styles.clueBox}>
                  <Text style={styles.clueLabel}>💡 INDICE ACTUEL</Text>
                  <Text style={styles.clueText}>
                    {currentStep.clue || 'Aucun indice disponible pour cette étape.'}
                  </Text>
                </View>
              </View>
            </GoldFrame>

            <GameButton
              icon="🗺️"
              title="VOIR SUR LA CARTE"
              onPress={() => router.push(`/hunt-map/${huntId}`)}
              colors={['#3b82f6', '#1d4ed8', '#1e3a5f']}
            />
          {/* <GameButton
            icon="🥽"
            title="ACTIVER LA RA"
            onPress={() => router.push(`/ar-step/${currentStep.id}?huntId=${huntId}`)}
            disabled={!canActivateAr}
            colors={canActivateAr ? ['#06b6d4', '#0891b2', '#164e63'] : ['#475569', '#334155', '#1e293b']}
          /> */}
          </>
        ) : null}

        {steps.length > 1 && !huntFinished ? (
          <GoldFrame>
            <Text style={styles.sectionTitle}>📋 ÉTAPES DÉCOUVERTES</Text>

            {visibleStepEntries.map(({ step, index }) => {
              const isDone = completedIndices.has(index);
              const isCurrent = index === currentStepIndex;

              return (
                <Pressable
                  key={step.id}
                  onPress={() => goToStep(index)}
                  style={({ pressed }) => [
                    styles.stepListItem,
                    isCurrent && styles.stepListItemActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.stepListDot,
                      isDone && styles.stepListDotDone,
                      isCurrent && !isDone && styles.stepListDotCurrent,
                    ]}
                  >
                    <Text style={styles.stepListDotText}>{isDone ? '✓' : step.orderNumber}</Text>
                  </View>

                  <View style={styles.stepListInfo}>
                    <Text style={[styles.stepListTitle, isDone && styles.stepListTitleDone]} numberOfLines={1}>
                      Étape {step.orderNumber}
                    </Text>
                    <Text style={styles.stepListClue} numberOfLines={1}>
                      {step.clue || 'Pas d’indice'}
                    </Text>
                  </View>

                  <Text style={styles.stepListStatus}>{isDone ? '✅' : isCurrent ? '📍' : '⬜'}</Text>
                </Pressable>
              );
            })}

            {hiddenStepsCount > 0 ? (
              <Text style={styles.lockedStepsHint}>
                🔒 {hiddenStepsCount} étape{hiddenStepsCount > 1 ? 's' : ''} encore verrouillée
                {hiddenStepsCount > 1 ? 's' : ''}.
              </Text>
            ) : null}
          </GoldFrame>
        ) : null}
        <BottomNav />
      </ScrollView>
    </GameBackground>
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
  glowBlob: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowEmerald: {
    width: 360,
    height: 360,
    left: -160,
    top: 120,
    backgroundColor: '#10b981',
    opacity: 0.18,
  },
  glowGold: {
    width: 260,
    height: 260,
    right: -80,
    bottom: -80,
    backgroundColor: '#f59e0b',
    opacity: 0.16,
  },
  glowCyan: {
    width: 200,
    height: 200,
    right: -60,
    top: 200,
    backgroundColor: '#06b6d4',
    opacity: 0.12,
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
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  kicker: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  pageTitle: {
    color: '#facc15',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(16,185,129,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  subtitle: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
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
    color: '#fecaca',
    fontWeight: '900',
    textAlign: 'center',
  },
  gpsErrorTitle: {
    color: '#facc15',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  gpsErrorText: {
    color: '#fef3c7',
    fontSize: 13,
    fontWeight: '700',
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
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.7)',
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotDone: {
    backgroundColor: '#059669',
    borderColor: '#10b981',
  },
  progressDotCurrent: {
    backgroundColor: 'rgba(245,158,11,0.3)',
    borderColor: '#facc15',
  },
  progressDotText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  radarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  radarWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarPulse: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 999,
  },
  radarDot: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  radarIcon: {
    fontSize: 24,
  },
  distanceInfo: {
    flex: 1,
    gap: 4,
  },
  distanceLabel: {
    color: '#5eead4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  distanceValue: {
    color: '#facc15',
    fontSize: 36,
    fontWeight: '900',
  },
  distanceValueClose: {
    color: '#10b981',
  },
  distanceHint: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  clueSection: {
    gap: 12,
  },
  clueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clueIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(31,22,12,0.84)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clueIconText: {
    fontSize: 26,
  },
  clueHeaderText: {
    flex: 1,
  },
  clueKicker: {
    color: '#facc15',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  clueStatus: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  clueBox: {
    borderRadius: 16,
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.25)',
    padding: 14,
    gap: 6,
  },
  clueLabel: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '900',
  },
  clueText: {
    color: '#f1f5f9',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  finishedWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  finishedIcon: {
    fontSize: 56,
  },
  finishedTitle: {
    color: '#facc15',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  finishedText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },
  sectionTitle: {
    color: '#facc15',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  stepListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    marginBottom: 4,
  },
  stepListItemActive: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.3)',
  },
  stepListDot: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.7)',
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepListDotDone: {
    backgroundColor: '#059669',
    borderColor: '#10b981',
  },
  stepListDotCurrent: {
    backgroundColor: 'rgba(245,158,11,0.3)',
    borderColor: '#facc15',
  },
  stepListDotText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  stepListInfo: {
    flex: 1,
    gap: 2,
  },
  stepListTitle: {
    color: '#fff7ed',
    fontSize: 14,
    fontWeight: '900',
  },
  stepListTitleDone: {
    color: '#86efac',
  },
  stepListClue: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  stepListStatus: {
    fontSize: 18,
  },
  lockedStepsHint: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 6,
  },
  gameButton: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#5eead4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  gameButtonIcon: {
    fontSize: 22,
  },
  gameButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.97 }, { translateY: 2 }],
    opacity: 0.9,
  },
});