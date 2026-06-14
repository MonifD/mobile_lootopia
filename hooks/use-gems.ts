import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const GEMS_INITIAL = 100;
const GEMS_PER_HUNT = 10;

function gemsKey(userId: number): string {
  return `lootopia.gems.${userId}`;
}

async function readGems(userId: number): Promise<number> {
  try {
    if (Platform.OS === 'web') {
      const raw = window.localStorage.getItem(gemsKey(userId));
      return raw !== null ? parseInt(raw, 10) : GEMS_INITIAL;
    }
    const raw = await SecureStore.getItemAsync(gemsKey(userId));
    return raw !== null ? parseInt(raw, 10) : GEMS_INITIAL;
  } catch {
    return GEMS_INITIAL;
  }
}

async function writeGems(userId: number, value: number): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      window.localStorage.setItem(gemsKey(userId), String(value));
      return;
    }
    await SecureStore.setItemAsync(gemsKey(userId), String(value));
  } catch {}
}

/** Initialise à 100 si la clé n'existe pas encore (premier login). */
export async function initGems(userId: number): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (window.localStorage.getItem(gemsKey(userId)) === null) {
        window.localStorage.setItem(gemsKey(userId), String(GEMS_INITIAL));
      }
      return;
    }
    const existing = await SecureStore.getItemAsync(gemsKey(userId));
    if (existing === null) {
      await SecureStore.setItemAsync(gemsKey(userId), String(GEMS_INITIAL));
    }
  } catch {}
}

/** Ajoute `amount` gemmes et retourne le nouveau total. */
export async function addGems(userId: number, amount: number): Promise<number> {
  const current = await readGems(userId);
  const next = current + amount;
  await writeGems(userId, next);
  return next;
}

/** Hook React pour lire et mettre à jour les gemmes d'un utilisateur. */
export function useGems(userId: number | null | undefined) {
  const [gems, setGems] = useState(GEMS_INITIAL);

  useEffect(() => {
    if (!userId) return;
    readGems(userId).then(setGems);
  }, [userId]);

  /** Appelé quand l'utilisateur termine une chasse : +10 gemmes. */
  const onHuntCompleted = useCallback(async () => {
    if (!userId) return;
    const next = await addGems(userId, GEMS_PER_HUNT);
    setGems(next);
  }, [userId]);

  return { gems, onHuntCompleted };
}
