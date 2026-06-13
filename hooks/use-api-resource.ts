import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export function useApiResource<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const value = await loader();
      setData(value);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [loader]);

  // Recharge automatiquement les données à chaque fois que l'écran prend le focus
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return {
    data,
    error,
    loading,
    refresh: load,
  };
}

