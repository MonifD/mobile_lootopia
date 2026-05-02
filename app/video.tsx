import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '@/providers/auth-provider';

const BYPASS_AUTH = process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true';

export default function VideoScreen() {
  const router       = useRouter();
  const { session }  = useAuth();

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
      const isSignedIn = BYPASS_AUTH || !!session;
      if (isSignedIn) {
        router.replace('/(tabs)');
      } else {
        router.replace('/home');
      }
    });
    return () => sub.remove();
  }, [player, router, session]);

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
