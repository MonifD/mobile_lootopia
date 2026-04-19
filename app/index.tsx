import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';

export default function HomeScreen() {
  const { session } = useAuth();
  const isSignedIn = !!session || process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true';

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Lootopia
        </ThemedText>
        <ThemedText style={styles.subtitle}>Bienvenue sur l'app mobile</ThemedText>

        <View style={styles.actions}>
          {isSignedIn ? (
            <Link href="/(tabs)" style={styles.primaryButton}>
              Ouvrir l'accueil
            </Link>
          ) : (
            <>
              <Link href="/login" style={styles.primaryButton}>
                Se connecter
              </Link>
              <Link href="/register" style={styles.secondaryButton}>
                Creer un compte
              </Link>
            </>
          )}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    gap: 16,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 8,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    textAlign: 'center',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    paddingVertical: 12,
    borderRadius: 10,
    fontWeight: '600',
  },
  secondaryButton: {
    textAlign: 'center',
    borderColor: '#2563eb',
    borderWidth: 1,
    color: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    fontWeight: '600',
  },
});
