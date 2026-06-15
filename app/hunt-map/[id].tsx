import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/app-footer';
import { ThemedText } from '@/components/themed-text';
import { useApiResource } from '@/hooks/use-api-resource';
import { addGems } from '@/hooks/use-gems';
import { usePlayerLocation } from '@/hooks/use-player-location';
import { useAuth } from '@/providers/auth-provider';
import { lootopiaApi } from '@/services/lootopia-api';
import type { Step } from '@/types/game';

const PROXIMITY_RADIUS = 5;
const STEP_POINTS_REWARD = 10;
const MAP_FOLLOW_INTERVAL_MS = 1500;
const FOOTER_CLEARANCE = 86;

const PROXIMITY_SIGNAL_LEVELS = [
  { maxDistance: 120, label: 'Signal faible', style: Haptics.ImpactFeedbackStyle.Light },
  { maxDistance: 60, label: 'Signal moyen', style: Haptics.ImpactFeedbackStyle.Medium },
  { maxDistance: 30, label: 'Signal fort', style: Haptics.ImpactFeedbackStyle.Heavy },
  { maxDistance: 15, label: 'Signal tres fort', style: Haptics.ImpactFeedbackStyle.Rigid },
  { maxDistance: 5, label: 'Signal maximal', style: Haptics.ImpactFeedbackStyle.Heavy },
] as const;

const DEFAULT_REGION = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function extractIdFromIri(iri: string): number | null {
  const match = iri.match(/\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function getSignalLevel(distanceInMeters: number | null): number {
  if (distanceInMeters === null) return 0;

  let level = 0;
  for (const threshold of PROXIMITY_SIGNAL_LEVELS) {
    if (distanceInMeters <= threshold.maxDistance) {
      level += 1;
    }
  }

  return level;
}

function PlayerMarker() {
  return (
   <View style={markerStyles.footstepsWrap}>
           <Image
        source={require('@/assets/images/trace_pied.png')}
        style={markerStyles.footstepsImage}
      />
    </View>
  );
}

function StepPin({
  index,
  isNear,
  isSelected,
  isDone,
}: {
  index: number;
  isNear: boolean;
  isSelected: boolean;
  isDone: boolean;
}) {
  return (
    <View style={[pinStyles.treasureWrap, isSelected && pinStyles.treasureSelected]}>
      {isNear && !isDone ? <View style={pinStyles.treasureGlow} /> : null}

      <Image
        source={require('@/assets/images/tresor.png')}
        style={[pinStyles.treasureImage, isDone && pinStyles.treasureDone]}
      />

      <ThemedText style={pinStyles.treasureNumber}>
        {isDone ? '✓' : index + 1}
      </ThemedText>
    </View>
  );
}

export default function HuntMapScreen() {
  const { id, debugAr } = useLocalSearchParams<{ id: string; debugAr?: string }>();
  const huntId = Number(id ?? 0);
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const lastFollowAnimationMsRef = useRef(0);
  const lastSignalLevelRef = useRef(0);
  const { session } = useAuth();
  const forceArTestMode = __DEV__ && debugAr === '1';
  const insets = useSafeAreaInsets();

  const overlayBaseTop = Math.max(insets.top, Platform.OS === 'ios' ? 8 : 6) + 8;
  const legendTop = overlayBaseTop + 56;
  const signalBannerTop = legendTop + 112;
  // const recenterButtonTop = overlayBaseTop + 40;
  const recenterButtonBottom = FOOTER_CLEARANCE + 16;

  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [localDoneStepIds, setLocalDoneStepIds] = useState<Set<number>>(new Set());
  const [validatingStepId, setValidatingStepId] = useState<number | null>(null);
  const [autoFollowEnabled, setAutoFollowEnabled] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);

  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  const { location, error: locationError, permissionDenied, isLoading: locationLoading } =
    usePlayerLocation();

  const loadSteps = useCallback(() => lootopiaApi.getHuntSteps(huntId), [huntId]);
  const { data: steps, loading: stepsLoading, error: stepsError } = useApiResource(loadSteps);

  const loadParticipations = useCallback(() => {
    if (!session?.userId) return Promise.resolve([]);
    return lootopiaApi.getMyParticipations(session.userId).catch(() => []);
  }, [session?.userId]);

  const { data: participations, refresh: refreshParticipations } =
    useApiResource(loadParticipations);

const doneStepIds = useMemo<Set<number>>(() => {
  const set = new Set<number>();

  if (!steps?.length) {
    return set;
  }

  const stepIdsInCurrentHunt = new Set(steps.map((step) => step.id));

  for (const stepId of localDoneStepIds) {
    if (stepIdsInCurrentHunt.has(stepId)) {
      set.add(stepId);
    }
  }

  if (!participations?.length) {
    return set;
  }

  for (const participation of participations) {
    if (typeof participation.step !== 'string') continue;

    const stepId = extractIdFromIri(participation.step);

    if (stepId !== null && stepIdsInCurrentHunt.has(stepId)) {
      set.add(stepId);
    }
  }

  return set;
}, [participations, localDoneStepIds, steps]);


  const nearStepIds = useMemo<Set<number>>(() => {
    const set = new Set<number>();

    if (!location || !steps) return set;

    if (forceArTestMode) {
      for (const step of steps) {
        set.add(step.id);
      }

      return set;
    }

    for (const step of steps) {
      const distance = haversineDistance(
        location.coords.latitude,
        location.coords.longitude,
        step.latitude,
        step.longitude
      );

      if (distance <= PROXIMITY_RADIUS) {
        set.add(step.id);
      }
    }

    return set;
  }, [location, steps, forceArTestMode]);

  const currentStep = useMemo(() => {
    if (!steps?.length) return null;
    return steps.find((step) => !doneStepIds.has(step.id)) ?? null;
  }, [steps, doneStepIds]);

  const distanceToCurrentStep = useMemo(() => {
    if (!location || !currentStep) return null;

    return haversineDistance(
      location.coords.latitude,
      location.coords.longitude,
      currentStep.latitude,
      currentStep.longitude
    );
  }, [location, currentStep]);

  const currentSignalLevel = useMemo(
    () => getSignalLevel(distanceToCurrentStep),
    [distanceToCurrentStep]
  );

  const currentSignalLabel =
    currentSignalLevel > 0 ? PROXIMITY_SIGNAL_LEVELS[currentSignalLevel - 1].label : null;

  const routeLine = useMemo(() => {
    if (!location || !currentStep) return [];

    return [
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      {
        latitude: currentStep.latitude,
        longitude: currentStep.longitude,
      },
    ];
  }, [location, currentStep]);

  const visibleSteps = useMemo(() => {
    if (!steps?.length) return [] as Step[];
    return steps.filter((step) => doneStepIds.has(step.id) || step.id === currentStep?.id);
  }, [steps, doneStepIds, currentStep?.id]);

  const hiddenStepsCount = Math.max(0, (steps?.length ?? 0) - visibleSteps.length);

  const initialRegion = useMemo(() => {
    if (steps?.length) {
      return {
        latitude: steps[0].latitude,
        longitude: steps[0].longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      };
    }

    if (location) {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      };
    }

    return DEFAULT_REGION;
  }, [steps, location]);

  const selectedStepIndex = useMemo(() => {
    if (!selectedStep || !steps) return 0;
    const index = steps.findIndex((step) => step.id === selectedStep.id);
    return index === -1 ? 0 : index;
  }, [selectedStep, steps]);

  const isLoading = stepsLoading || locationLoading;

  useEffect(() => {
    if (!isMapReady || !steps?.length) return;

    mapRef.current?.animateToRegion(
      {
        latitude: steps[0].latitude,
        longitude: steps[0].longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      800
    );
  }, [steps, isMapReady]);

  useEffect(() => {
    if (!isMapReady || !location || !autoFollowEnabled) return;

    const now = Date.now();
    if (now - lastFollowAnimationMsRef.current < MAP_FOLLOW_INTERVAL_MS) return;

    lastFollowAnimationMsRef.current = now;

    mapRef.current?.animateToRegion(
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      700
    );
  }, [location, autoFollowEnabled, isMapReady]);

  useEffect(() => {
    if (doneStepIds.has(currentStep?.id ?? -1)) return;

    const previousLevel = lastSignalLevelRef.current;
    const nextLevel = currentSignalLevel;

    if (nextLevel <= previousLevel) {
      lastSignalLevelRef.current = nextLevel;
      return;
    }

    const feedbackStyle = PROXIMITY_SIGNAL_LEVELS[nextLevel - 1]?.style;
    if (feedbackStyle) {
      void Haptics.impactAsync(feedbackStyle);
    }

    lastSignalLevelRef.current = nextLevel;
  }, [currentSignalLevel, currentStep?.id, doneStepIds]);

  useEffect(() => {
    if (!selectedStep) return;
    if (visibleSteps.some((step) => step.id === selectedStep.id)) return;
    setSelectedStep(null);
  }, [selectedStep, visibleSteps]);

  // ajout 2 
  useEffect(() => {
  const timer = setTimeout(() => setTracksViewChanges(false), 2000);
  return () => clearTimeout(timer);
}, []);

  const openArMarker = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
    } catch {
      Alert.alert('Erreur RA', 'Impossible d’ouvrir le marqueur AR.');
    }
  };

  const validateStep = async () => {
    if (!selectedStep) return;

    if (!session?.userId) {
      Alert.alert('Connexion requise', 'Tu dois être connecté pour valider une étape.');
      return;
    }

    if (!forceArTestMode && !nearStepIds.has(selectedStep.id)) {
      Alert.alert('Trop loin', `Approche-toi à moins de ${PROXIMITY_RADIUS} m de l’étape.`);
      return;
    }

    if (doneStepIds.has(selectedStep.id)) {
      return;
    }

    try {
      setValidatingStepId(selectedStep.id);

      await lootopiaApi.completeStep(session.userId, selectedStep.id, STEP_POINTS_REWARD);

      setLocalDoneStepIds((previous) => {
        const next = new Set(previous);
        next.add(selectedStep.id);
        return next;
      });

      // Vérification fiable : compter les étapes complétées vs total
      const [allParticipations] = await Promise.all([
        lootopiaApi.getMyParticipations(session.userId),
        refreshParticipations(),
      ]);

      const stepIdsInHunt = new Set((steps ?? []).map((s) => s.id));
      const completedCount = allParticipations.filter((p) => {
        const match = p.step.match(/\/(\d+)$/);
        return match && stepIdsInHunt.has(Number(match[1]));
      }).length;

      const isHuntComplete = completedCount >= (steps ?? []).length;

      if (isHuntComplete) {
        await addGems(session.userId, 10);
        router.replace(`/hunt-play/${huntId}?finished=1`);
      } else {
        Alert.alert('Étape validée', 'Bravo, cette étape est terminée !');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      Alert.alert('Erreur', message);
    } finally {
      setValidatingStepId(null);
    }
  };

  return (
    <View style={styles.container}>

  <View style={[styles.playerHudRow, { top: overlayBaseTop }]}>
    <View style={styles.signalHud}>
      <ThemedText style={styles.signalHudTitle}>
        {currentSignalLevel > 0
          ? `📡 ${currentSignalLabel}`
          : '📡 Aucun signal'}
      </ThemedText>

      {distanceToCurrentStep !== null ? (
        <ThemedText style={styles.signalHudDistance}>
          {Math.round(distanceToCurrentStep)} m
        </ThemedText>
      ) : null}

      <View style={styles.signalDotsRow}>
        {Array.from({ length: PROXIMITY_SIGNAL_LEVELS.length }).map((_, index) => {
          const active = index < currentSignalLevel;

          return (
            <View
              key={`signal-${index + 1}`}
              style={[
                styles.signalDot,
                active && styles.signalDotActive,
              ]}
            />
          );
        })}
      </View>
    </View>
  </View>


      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        style={[styles.iconButton, styles.backAbsolute, { top: overlayBaseTop }]}
      >
        <ThemedText style={styles.backText}>‹</ThemedText>
      </Pressable>

      {forceArTestMode ? (
        <View style={[styles.debugBanner, { top: overlayBaseTop }]}> 
          <ThemedText style={styles.debugBannerText}>Mode test RA activé</ThemedText>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0f766e" />
          <ThemedText style={styles.loadingText}>Chargement de la carte…</ThemedText>
        </View>
      ) : stepsError ? (
        <View style={styles.centered}>
          <ThemedText style={styles.errorText}>❌ {stepsError}</ThemedText>

          <Pressable style={styles.backBtn} onPress={() => router.replace('/(tabs)')}>
            <ThemedText style={styles.backBtnText}>← Retour</ThemedText>
          </Pressable>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          onMapReady={() => setIsMapReady(true)}
          showsUserLocation={false}
          showsMyLocationButton={false}
          onPanDrag={() => {
            if (autoFollowEnabled) setAutoFollowEnabled(false);
          }}
        >
          {location ? (
            <>
              {routeLine.length === 2 ? (
                <Polyline
                  coordinates={routeLine}
                  strokeColor="#0f766e"
                  strokeWidth={4}
                  lineCap="round"
                />
              ) : null}

              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                title="Ma position"
                zIndex={10}
              >
                <PlayerMarker />
              </Marker>
            </>
          ) : null}
          {/* {visibleSteps.map((step) => (
  <Marker
    key={step.id}
    coordinate={{ latitude: step.latitude, longitude: step.longitude }}
    anchor={{ x: 0.5, y: 0.5 }}
    tappable
    tracksViewChanges={false}
    onPress={(event) => {
      event.stopPropagation();
      setSelectedStep(step);
    }}
    zIndex={selectedStep?.id === step.id ? 99 : 5}
  >
    <Pressable onPress={() => setSelectedStep(step)} hitSlop={20}>
      <StepPin
        index={Math.max(0, step.orderNumber - 1)}
        isNear={nearStepIds.has(step.id)}
        isSelected={selectedStep?.id === step.id}
        isDone={doneStepIds.has(step.id)}
      />
    </Pressable>
  </Marker>
))} */}
{visibleSteps.map((step) => (
  <Marker
    key={step.id}
    coordinate={{ latitude: step.latitude, longitude: step.longitude }}
    anchor={{ x: 0.5, y: 0.5 }}
    tappable
    tracksViewChanges={true}
    onPress={(event) => {
      event.stopPropagation();
      setSelectedStep(step);
    }}
    zIndex={selectedStep?.id === step.id ? 99 : 5}
  >
    <Pressable onPress={() => setSelectedStep(step)} hitSlop={20}>
      <StepPin
        index={Math.max(0, step.orderNumber - 1)}
        isNear={nearStepIds.has(step.id)}
        isSelected={selectedStep?.id === step.id}
        isDone={doneStepIds.has(step.id)}
      />
    </Pressable>
  </Marker>
))}
        </MapView>
      )}

      {!isLoading && !stepsError ? (
        <View style={[styles.legend, { top: legendTop }]}> 
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
            <ThemedText style={styles.legendText}>Ma position ({PROXIMITY_RADIUS}m)</ThemedText>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0f766e' }]} />
            <ThemedText style={styles.legendText}>Étape à portée</ThemedText>
          </View>

        {selectedStep && doneStepIds.has(selectedStep.id) ? (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#16a34a' }]} />
            <ThemedText style={styles.legendText}>Étape validée ✓</ThemedText>
          </View>
        ) : null}

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <ThemedText style={styles.legendText}>Sélectionnée</ThemedText>
          </View>

          {hiddenStepsCount > 0 ? (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#475569' }]} />
              <ThemedText style={styles.legendText}>
                {hiddenStepsCount} étape{hiddenStepsCount > 1 ? 's' : ''} verrouillée
                {hiddenStepsCount > 1 ? 's' : ''}
              </ThemedText>
            </View>
          ) : null}
        </View>
      ) : null}


      {!autoFollowEnabled && !isLoading ? (
        <Pressable
          style={[styles.recenterButton, { bottom: recenterButtonBottom }]}
          onPress={() => {
            setAutoFollowEnabled(true);

            if (!location || !mapRef.current) return;

            mapRef.current.animateToRegion(
              {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              500
            );
          }}
        >
          {/* <ThemedText style={styles.recenterButtonText}>Recentrer le suivi</ThemedText> */}
          <ThemedText style={styles.recenterIcon}>⌖</ThemedText>
        </Pressable>
      ) : null}

      {(permissionDenied || locationError) ? (
        <View style={[styles.gpsBanner, { top: overlayBaseTop }]}> 
          <ThemedText style={styles.gpsBannerText}>
            {permissionDenied
              ? '📍 Permission GPS refusée — active-la dans les réglages'
              : `📍 GPS indisponible : ${locationError}`}
          </ThemedText>
        </View>
      ) : null}

          {selectedStep ? (
        <View style={styles.stepPanel}>
          <View style={styles.stepPanelHeader}>
            <View style={styles.stepPanelTitleRow}>
              <View
                style={[
                  styles.stepIndexBadge,
                  nearStepIds.has(selectedStep.id) && styles.stepIndexBadgeNear,
                  doneStepIds.has(selectedStep.id) && styles.stepIndexBadgeDone,
                ]}
              >
                <ThemedText style={styles.stepIndexText}>
                  {doneStepIds.has(selectedStep.id) ? '✓' : selectedStepIndex + 1}
                </ThemedText>
              </View>

              <View>
                <ThemedText style={styles.stepPanelTitle}>
                  Étape {selectedStepIndex + 1}
                </ThemedText>

                {doneStepIds.has(selectedStep.id) ? (
                  <ThemedText style={styles.doneBadge}>✅ Déjà validée</ThemedText>
                ) : null}
              </View>
            </View>

            <Pressable style={styles.closeBtn} onPress={() => setSelectedStep(null)} hitSlop={12}>
              <ThemedText style={styles.closeBtnText}>✕</ThemedText>
            </Pressable>
          </View>

          {forceArTestMode || nearStepIds.has(selectedStep.id) ? (
            <View style={[styles.clueBox, doneStepIds.has(selectedStep.id) && styles.clueBoxDone]}>
              <ThemedText style={styles.clueLabel}>🔍 Indice révélé</ThemedText>
              <ThemedText style={styles.clueText}>{selectedStep.clue}</ThemedText>

              {selectedStep.arMarkerUrl ? (
                <Pressable
                  style={styles.arBadge}
                  onPress={() => openArMarker(selectedStep.arMarkerUrl!)}
                >
                  <ThemedText style={styles.arBadgeText}>🎯 Ouvrir le marqueur AR →</ThemedText>
                </Pressable>
              ) : null}

              {!doneStepIds.has(selectedStep.id) ? (
                <Pressable
                  style={styles.arScreenBtn}
                  onPress={() => router.push(`/ar-step/${selectedStep.id}?huntId=${huntId}`)}
                >
                  <ThemedText style={styles.arScreenBtnText}>🥽 Activer la RA</ThemedText>
                </Pressable>
              ) : null}

            </View>
          ) : doneStepIds.has(selectedStep.id) ? (
            <View style={styles.doneBox}>
              <ThemedText style={styles.doneBoxText}>✅ Tu as déjà validé cette étape.</ThemedText>

              {selectedStep.clue ? (
                <ThemedText style={styles.clueText}>{selectedStep.clue}</ThemedText>
              ) : null}

              {selectedStep.arMarkerUrl ? (
                <Pressable
                  style={styles.arBadge}
                  onPress={() => openArMarker(selectedStep.arMarkerUrl!)}
                >
                  <ThemedText style={styles.arBadgeText}>🎯 Ouvrir le marqueur AR →</ThemedText>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.tooFarBox}>
              <ThemedText style={styles.tooFarText}>
                🚶 Approche-toi à moins de{' '}
                <ThemedText style={styles.tooFarDistance}>{PROXIMITY_RADIUS} m</ThemedText>{' '}
                de cette étape pour révéler l’indice.
              </ThemedText>

              {location ? (
                <ThemedText style={styles.distanceHint}>
                  Distance actuelle :{' '}
                  {Math.round(
                    haversineDistance(
                      location.coords.latitude,
                      location.coords.longitude,
                      selectedStep.latitude,
                      selectedStep.longitude
                    )
                  )}{' '}
                  m
                </ThemedText>
              ) : null}
            </View>
          )}
        </View>
      ) : null}

      <BottomNav />
    </View>
  );
}

const markerStyles = StyleSheet.create({
 footstepsWrap: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  footstepsImage: {
    width: 39,
    height:39,
    resizeMode: 'contain',
  },
});

const pinStyles = StyleSheet.create({
  treasureWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },

  treasureSelected: {
    transform: [{ scale: 1.16 }],
  },

  treasureGlow: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(34, 197, 94, 0.22)',
  },

  treasureImage: {
    width: 52,
    height: 52,
    resizeMode: 'contain',
  },

  treasureDone: {
    opacity: 0.65,
  },

treasureNumber: {
  position: 'absolute',
  top: -8,

  minWidth: 24,
  height: 24,
  paddingHorizontal: 6,

  borderRadius: 12,
  backgroundColor: '#16a34a',
  borderWidth: 2,
  borderColor: '#bbf7d0',

  color: '#ffffff',
  fontSize: 13,
  fontWeight: '900',
  textAlign: 'center',
  lineHeight: 20,

  overflow: 'hidden',

  textShadowColor: '#000',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
},
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },

  loadingText: {
    fontSize: 14,
    opacity: 0.7,
  },

  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },

  backBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0f766e',
  },

  backBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  signalHud: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',

  flex: 1,
  marginLeft: 70,
  marginRight: 12,

  backgroundColor: 'rgba(15, 23, 42, 0.72)',
  borderRadius: 14,

  paddingVertical: 10,
  paddingHorizontal: 14,

  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.12)',
},

signalHudLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
},

signalHudTitle: {
  color: '#f8fafc',
  fontSize: 12,
  fontWeight: '800',
},

signalHudDistance: {
  color: '#cbd5e1',
  fontSize: 12,
  fontWeight: '700',
},

  map: {
    flex: 1,
  },

  playerHudRow: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 45,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    pointerEvents: 'none',
  },

  playerHudRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  playerHudBadge: {
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(20, 15, 10, 0.92)',
    borderWidth: 2,
    borderColor: '#b45309',
    alignItems: 'center',
    justifyContent: 'center',
  },

  playerHudCurrencyBadge: {
    minWidth: 74,
  },

  playerHudBadgeText: {
    color: '#fef3c7',
    fontSize: 12,
    fontWeight: '900',
  },

  legend: {
    position: 'absolute',
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 12,
    padding: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

signalBanner: {
  position: 'absolute',
  left: 12,
  right: 12,
  backgroundColor: 'rgba(15, 23, 42, 0.45)',
  borderRadius: 12,
  paddingVertical: 8,
  paddingHorizontal: 12,
  gap: 4,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.18)',
},

  signalTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },

  signalDistance: {
    color: '#cbd5e1',
    fontSize: 12,
  },

  signalDotsRow: {
    marginTop: 2,
    flexDirection: 'row',
    gap: 6,
  },

  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },

  signalDotActive: {
    backgroundColor: '#22d3ee',
  },

recenterButton: {
  position: 'absolute',
  right: 16,
  width: 52,
  height: 52,
  borderRadius: 26,
  backgroundColor: '#19ee99f1',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.25,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 8,
  borderWidth: 1,
  borderColor: 'rgba(15,23,42,0.12)',
},

recenterIcon: {
  color: '#0f766e',
  fontSize: 30,
  fontWeight: '900',
  lineHeight: 32,
},

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  legendText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },

  iconButton: {
    width: 54,
    height: 54,
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

  gpsBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  debugBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
  },
  backAbsolute: {
    position: 'absolute',
    left: 12,
    zIndex: 40,
  },
  debugBannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  gpsBannerText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  stepPanel: {
    position: 'absolute',
    bottom: FOOTER_CLEARANCE,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
    zIndex: 35,
    gap: 12,
  },

  stepPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  stepPanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  stepIndexBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepIndexBadgeNear: {
    backgroundColor: '#0f766e',
  },

  stepIndexBadgeDone: {
    backgroundColor: '#16a34a',
  },

  stepIndexText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  stepPanelTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },

  doneBadge: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 1,
  },

  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeBtnText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
  },

  clueBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },

  clueBoxDone: {
    backgroundColor: '#dcfce7',
    borderColor: '#4ade80',
  },

  clueLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  clueText: {
    fontSize: 15,
    color: '#14532d',
    lineHeight: 22,
  },

  arBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#4ade80',
  },

  arBadgeText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '700',
  },

  arScreenBtn: {
    marginTop: 2,
    backgroundColor: '#155e75',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },

  arScreenBtnText: {
    color: '#ecfeff',
    fontWeight: '700',
  },

  validateBtn: {
    marginTop: 8,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },

  validateBtnText: {
    color: '#fff',
    fontWeight: '700',
  },

  doneBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#4ade80',
  },

  doneBoxText: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '600',
  },

  tooFarBox: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fdba74',
  },

  tooFarText: {
    fontSize: 14,
    color: '#7c2d12',
    lineHeight: 20,
  },

  tooFarDistance: {
    fontWeight: '700',
    color: '#ea580c',
  },

  distanceHint: {
    fontSize: 12,
    color: '#9a3412',
    fontStyle: 'italic',
  },
});