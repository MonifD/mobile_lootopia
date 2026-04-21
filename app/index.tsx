import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function IntroScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/splash');
  }, [router]);

  return null;
}