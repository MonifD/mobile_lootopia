import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

const GEMS_INITIAL = 100;
const GEMS_PER_HUNT = 10;

function gemsKey(userId: number): string {
  return `lootopia.gems.${userId}`;
}

export async function initGems(userId: number): Promise<void> {
  const key = gemsKey(userId);
  const existing = await SecureStore.getItemAsync(key);
  if (existing === null) {
    await SecureStore.setItemAsync(key, String(GEMS_INITIAL));
  }
}

export async function addGems(userId: number, amount: number): Promise<number> {
  const key = gemsKey(userId);
  const current = Number((await SecureStore.getItemAsync(key)) ?? GEMS_INITIAL);
  const next = current + amount;
  await SecureStore.setItemAsync(key, String(next));
  return next;
}

export function useGems(userId: number | null | undefined) {
  const [gems, setGems] = useState<number>(GEMS_INITIAL);

  useEffect(() => {
    if (!userId) return;
    SecureStore.getItemAsync(gemsKey(userId))
      .then((v) => setGems(v !== null ? Number(v) : GEMS_INITIAL))
      .catch(() => {});
  }, [userId]);

  const onHuntCompleted = async () => {
    if (!userId) return;
    const next = await addGems(userId, GEMS_PER_HUNT);
    setGems(next);
  };

  return { gems, onHuntCompleted };
}
