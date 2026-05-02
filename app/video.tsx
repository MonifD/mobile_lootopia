import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '@/providers/auth-provider';

const BYPASS_AUTH = process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true';

export default function VideoScreen() {
  const router       = useRouter();
  const { isLoading, session }  = useAuth();
  const hasEndedRef = useRef(false);

  const goNext = useCallback(() => {
    if (isLoading) return;

    const isSignedIn = BYPASS_AUTH || !!session;
    router.replace(isSignedIn ? '/home' : '/welcome');
  }, [isLoading, router, session]);

  const player = useVideoPlayer(
    require('@/assets/images/videoVieux.mp4'),
    (p) => {
      p.loop   = false;
      p.muted  = false;
      p.volume = 1.0;
      p.play();
    },
  );

  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      hasEndedRef.current = true;
      goNext();
    });
    return () => sub.remove();
  }, [player, goNext]);

  useEffect(() => {
    if (hasEndedRef.current) {
      goNext();
    }
  }, [goNext, isLoading, session]);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
