import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

export type PlayerLocationState = {
  location: Location.LocationObject | null;
  error: string | null;
  permissionDenied: boolean;
  isLoading: boolean;
};

/**
 * Hook qui demande la permission GPS, récupère la position initiale
 * et surveille les mises à jour en temps réel (toutes les 5m de déplacement).
 *
 * Utilise expo-location — à installer si ce n'est pas déjà fait :
 *   npx expo install expo-location
 */
export function usePlayerLocation(): PlayerLocationState {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        // Demande de permission GPS (foreground uniquement)
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          if (mounted) {
            setPermissionDenied(true);
            setIsLoading(false);
          }
          return;
        }

        // Position initiale (haute précision)
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (mounted) {
          setLocation(initial);
          setIsLoading(false);
        }

        // Surveillance en continu — se déclenche tous les 5m minimum
        watchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,      // m entre deux mises à jour
            timeInterval: 3000,       // ms minimum entre deux mises à jour
          },
          (loc) => {
            if (mounted) setLocation(loc);
          }
        );
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Erreur de localisation');
          setIsLoading(false);
        }
      }
    }

    void start();

    return () => {
      mounted = false;
      watchRef.current?.remove();
    };
  }, []);

  return { location, error, permissionDenied, isLoading };
}
