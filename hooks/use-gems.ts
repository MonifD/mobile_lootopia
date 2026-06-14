import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';

const GEMS_INITIAL = 100;
const GEMS_PER_HUNT = 10;
const GEMS_EVENT = 'lootopia:gemsUpdated';

function gemsKey(userId: number): string {
  return `lootopia.gems.${userId}`;
}

async function readGems(userId: number): Promise<number> {
  try {
    const raw = await SecureStore.getItemAsync(gemsKey(userId));
    return raw !== null ? parseInt(raw, 10) : GEMS_INITIAL;
  } catch {
    return GEMS_INITIAL;
  }
}

async function writeGems(userId: number, value: number): Promise<void> {
  try {
    await SecureStore.setItemAsync(gemsKey(userId), String(value));
  } catch {}
}

/** Initialise à 100 si la clé n'existe pas encore (premier login). */
export async function initGems(userId: number): Promise<void> {
  try {
    const existing = await SecureStore.getItemAsync(gemsKey(userId));
    if (existing === null) {
      await SecureStore.setItemAsync(gemsKey(userId), String(GEMS_INITIAL));
    }
  } catch {}
}

/** Ajoute `amount` gemmes, persiste, et notifie tous les hooks useGems actifs. */
export async function addGems(userId: number, amount: number): Promise<number> {
  const current = await readGems(userId);
  const next = current + amount;
  await writeGems(userId, next);
  DeviceEventEmitter.emit(GEMS_EVENT, { userId, gems: next });
  return next;
}

/** Hook React — se met à jour automatiquement quand addGems est appelé. */
export function useGems(userId: number | null | undefined) {
  const [gems, setGems] = useState(GEMS_INITIAL);

  useEffect(() => {
    if (!userId) return;

    // Lecture initiale
    readGems(userId).then(setGems);

    // Écoute les mises à jour émises par addGems
    const sub = DeviceEventEmitter.addListener(
      GEMS_EVENT,
      ({ userId: uid, gems: g }: { userId: number; gems: number }) => {
        if (uid === userId) setGems(g);
      }
    );

    return () => sub.remove();
  }, [userId]);

  const onHuntCompleted = useCallback(async () => {
    if (!userId) return;
    await addGems(userId, GEMS_PER_HUNT);
  }, [userId]);

  return { gems, onHuntCompleted };
}
