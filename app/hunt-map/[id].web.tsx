import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';

/**
 * Fallback web — react-native-maps n'est pas supporté sur navigateur.
 * La carte interactive est disponible uniquement sur l'app mobile.
 */
export default function HuntMapScreenWeb() {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.icon}>🗺️</ThemedText>
      <ThemedText type="title" style={styles.title}>
        Carte non disponible sur web
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        La carte interactive est disponible uniquement sur l'application mobile (iOS / Android).
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.6,
    fontSize: 14,
    lineHeight: 20,
  },
});
