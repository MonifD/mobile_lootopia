import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { useApiResource } from '@/hooks/use-api-resource';
import { usePlayerLocation } from '@/hooks/use-player-location';
import { useAuth } from '@/providers/auth-provider';
import { lootopiaApi } from '@/services/lootopia-api';
import type { Step } from '@/types/game';

// ─── Constantes ────────────────────────────────────────────────────────────────

/** Rayon de proximité en mètres pour révéler un indice */
const PROXIMITY_RADIUS = 50;

/** Région initiale par défaut (Paris) si aucune étape ni position disponible */
const DEFAULT_REGION = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

// ─── Utilitaires ────────────────────────────────────────────────────────────────

/**
 * Calcule la distance en mètres entre deux coordonnées GPS
 * via la formule de Haversine.
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Extrait l'ID numérique d'un IRI de type "/api/steps/42"
 */
function extractIdFromIri(iri: string): number | null {
  const match = iri.match(/\/(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

// ─── Sous-composants ────────────────────────────────────────────────────────────

/** Marqueur personnalisé pour la position du joueur */
function PlayerMarker() {
  return (
    <View style={markerStyles.playerOuter}>
      <View style={markerStyles.playerInner} />
    </View>
  );
}

const markerStyles = StyleSheet.create({
  playerOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 2,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
});

/** Épingle numérotée pour une étape */
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
    <View
      style={[
        pinStyles.pin,
        isNear && !isDone && pinStyles.pinNear,
        isDone && pinStyles.pinDone,
        isSelected && pinStyles.pinSelected,
      ]}
    >
      <ThemedText style={pinStyles.pinText}>{isDone ? '✓' : index + 1}</ThemedText>
    </View>
  );
}

const pinStyles = StyleSheet.create({
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#64748b',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pinNear: {
    backgroundColor: '#0f766e',
  },
  pinDone: {
    backgroundColor: '#16a34a',
    borderColor: '#86efac',
  },
  pinSelected: {
    backgroundColor: '#f59e0b',
    transform: [{ scale: 1.2 }],
  },
  pinText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});

// ─── Écran principal ────────────────────────────────────────────────────────────

export default function HuntMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const huntId = Number(id ?? 0);
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { session } = useAuth();

  const [selectedStep, setSelectedStep] = useState<Step | null>(null);

  // GPS joueur
  const { location, error: locationError, permissionDenied, isLoading: locationLoading } =
    usePlayerLocation();

  // Étapes de la chasse
  const loadSteps = useCallback(() => lootopiaApi.getHuntSteps(huntId), [huntId]);
  const { data: steps, loading: stepsLoading, error: stepsError } = useApiResource(loadSteps);

  // Participations de l'utilisateur connecté (étapes déjà validées)
  const loadParticipations = useCallback(() => {
    if (!session?.userId) return Promise.resolve([]);
    return lootopiaApi.getMyParticipations(session.userId).catch(() => []);
  }, [session?.userId]);
  const { data: participations } = useApiResource(loadParticipations);

  // Ensemble des IDs d'étapes déjà validées
  const doneStepIds = useMemo<Set<number>>(() => {
    const set = new Set<number>();
    if (!participations) return set;
    for (const p of participations) {
      const stepId = extractIdFromIri(p.step);
      if (stepId !== null) set.add(stepId);
    }
    return set;
  }, [participations]);

  // Calcule quelles étapes sont à portée du joueur
  const nearStepIds = useMemo<Set<number>>(() => {
    const set = new Set<number>();
    if (!location || !steps) return set;
    for (const step of steps) {
      const dist = haversineDistance(
        location.coords.latitude,
        location.coords.longitude,
        step.latitude,
        step.longitude
      );
      if (dist <= PROXIMITY_RADIUS) set.add(step.id);
    }
    return set;
  }, [location, steps]);

  // Centre la carte sur la première étape au chargement
  useEffect(() => {
    if (!steps?.length || !mapRef.current) return;
    const first = steps[0];
    mapRef.current.animateToRegion(
      {
        latitude: first.latitude,
        longitude: first.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      800
    );
  }, [steps]);

  // Région initiale : première étape ou position joueur ou Paris
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

  const isLoading = stepsLoading || locationLoading;

  const openArMarker = (url: string) => {
    Linking.openURL(url).catch(() => {
      // URL invalide ou app non disponible — silencieux
    });
  };

  return (
    <View style={styles.container}>
      {/* ── Carte ─────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0f766e" />
          <ThemedText style={styles.loadingText}>Chargement de la carte…</ThemedText>
        </View>
      ) : stepsError ? (
        <View style={styles.centered}>
          <ThemedText style={styles.errorText}>❌ {stepsError}</ThemedText>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ThemedText style={styles.backBtnText}>← Retour</ThemedText>
          </Pressable>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {/* ── Position du joueur + cercle 50m ─────────────────────────── */}
          {location && (
            <>
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

              <Circle
                center={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                radius={PROXIMITY_RADIUS}
                strokeColor="rgba(37, 99, 235, 0.5)"
                fillColor="rgba(37, 99, 235, 0.08)"
                strokeWidth={2}
              />
            </>
          )}

          {/* ── Marqueurs des étapes ──────────────────────────────────────── */}
          {steps?.map((step, index) => (
            <Marker
              key={step.id}
              coordinate={{ latitude: step.latitude, longitude: step.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() =>
                setSelectedStep((prev) => (prev?.id === step.id ? null : step))
              }
              zIndex={selectedStep?.id === step.id ? 9 : 5}
            >
              <StepPin
                index={index}
                isNear={nearStepIds.has(step.id)}
                isSelected={selectedStep?.id === step.id}
                isDone={doneStepIds.has(step.id)}
              />
            </Marker>
          ))}
        </MapView>
      )}

      {/* ── Légende flottante ──────────────────────────────────────────────── */}
      {!isLoading && !stepsError && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
            <ThemedText style={styles.legendText}>Ma position ({PROXIMITY_RADIUS}m)</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0f766e' }]} />
            <ThemedText style={styles.legendText}>Étape à portée</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#16a34a' }]} />
            <ThemedText style={styles.legendText}>Étape validée ✓</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <ThemedText style={styles.legendText}>Sélectionnée</ThemedText>
          </View>
        </View>
      )}

      {/* ── Bannière de permission GPS refusée ────────────────────────────── */}
      {(permissionDenied || locationError) && (
        <View style={styles.gpsBanner}>
          <ThemedText style={styles.gpsBannerText}>
            {permissionDenied
              ? '📍 Permission GPS refusée — activez-la dans les réglages'
              : `📍 GPS indisponible : ${locationError}`}
          </ThemedText>
        </View>
      )}

      {/* ── Panel d'information de l'étape sélectionnée ───────────────────── */}
      {selectedStep !== null && (
        <View style={styles.stepPanel}>
          {/* En-tête du panel */}
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
                  {doneStepIds.has(selectedStep.id)
                    ? '✓'
                    : (steps?.findIndex((s) => s.id === selectedStep.id) ?? 0) + 1}
                </ThemedText>
              </View>
              <View>
                <ThemedText style={styles.stepPanelTitle}>
                  Étape {(steps?.findIndex((s) => s.id === selectedStep.id) ?? 0) + 1}
                </ThemedText>
                {doneStepIds.has(selectedStep.id) ? (
                  <ThemedText style={styles.doneBadge}>✅ Déjà validée</ThemedText>
                ) : null}
              </View>
            </View>
            <Pressable
              style={styles.closeBtn}
              onPress={() => setSelectedStep(null)}
              hitSlop={12}
            >
              <ThemedText style={styles.closeBtnText}>✕</ThemedText>
            </Pressable>
          </View>

          {/* Contenu : indice révélé ou message d'approche */}
          {nearStepIds.has(selectedStep.id) ? (
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
            </View>
          ) : doneStepIds.has(selectedStep.id) ? (
            // Étape déjà validée mais on n'est plus à portée
            <View style={styles.doneBox}>
              <ThemedText style={styles.doneBoxText}>
                ✅ Tu as déjà validé cette étape.
              </ThemedText>
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
                🚶 Approchez-vous à moins de{' '}
                <ThemedText style={styles.tooFarDistance}>{PROXIMITY_RADIUS} m</ThemedText>{' '}
                de cette étape pour révéler l'indice.
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
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  // États de chargement / erreur
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

  // Carte
  map: {
    flex: 1,
  },

  // Légende
  legend: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 12,
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

  // Bannière GPS
  gpsBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 12,
    left: 12,
    right: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  gpsBannerText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Panel étape
  stepPanel: {
    position: 'absolute',
    bottom: 0,
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

  // Indice révélé
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

  // Marqueur AR (tappable)
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

  // Étape déjà validée (hors portée)
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

  // Trop loin
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
