import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Video } from 'expo-av';
import { useRouter } from 'expo-router';

export default function VideoScreen() {
  const router = useRouter();
  const videoRef = React.useRef<Video>(null);

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish) {
      router.replace('/home');
    }
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={require('@/assets/images/videoVieux.mp4')}
        rate={1.0}
        volume={1.0}
        isMuted={false}
        useNativeControls={false}
        style={styles.video}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        shouldPlay
        progressUpdateIntervalMillis={500}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
