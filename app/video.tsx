import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const BYPASS_AUTH = process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true';

export default function VideoScreen() {
  const router       = useRouter();
  const { isLoading, session }  = useAuth();
  const shouldNavigateRef = useRef(false);

  const goNext = useCallback(() => {
    if (isLoading) return;

    const isSignedIn = BYPASS_AUTH || !!session;
    router.replace(isSignedIn ? '/home' : '/welcome');
  }, [isLoading, router, session]);

  const player = useVideoPlayer(
    require('@/assets/images/trailer_2.mp4'),
    (p) => {
      p.loop   = false;
      p.muted  = false;
      p.volume = 1.0;
      p.play();
    },
  );

  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      shouldNavigateRef.current = true;
      goNext();
    });
    return () => sub.remove();
  }, [player, goNext]);

  useEffect(() => {
    if (shouldNavigateRef.current) {
      goNext();
    }
  }, [goNext, isLoading, session]);

  const skipVideo = useCallback(() => {
    shouldNavigateRef.current = true;
    player.pause();
    goNext();
  }, [goNext, player]);

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
      <Pressable
        style={styles.skipButton}
        onPress={skipVideo}
        accessibilityRole="button"
        accessibilityLabel="Passer la vidéo"
      >
        <Text style={styles.skipText}>Passer la vidéo</Text>
      </Pressable>
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
  skipButton: {
    position: 'absolute',
    top: 34,
    right: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#059669',
    borderWidth: 1,
    borderColor: '#047857',
  },
  skipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
