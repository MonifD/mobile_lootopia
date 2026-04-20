import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';

export default function WelcomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const isSignedIn = !!session || process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <ThemedText style={styles.badgeEmoji}>🎮</ThemedText>
            <ThemedText style={styles.badgeText}>Accueil public Lootopia</ThemedText>
          </View>

          <ThemedText type="title" style={styles.title}>
            L'aventure commence ici
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Explore l'univers du jeu, regarde comment ca fonctionne, puis connecte-toi quand tu veux commencer une vraie chasse.
          </ThemedText>

          <View style={styles.previewRow}>
            <View style={styles.previewCard}>
              <ThemedText style={styles.previewEmoji}>🗺️</ThemedText>
              <ThemedText style={styles.previewTitle}>Carte</ThemedText>
            </View>
            <View style={styles.previewCard}>
              <ThemedText style={styles.previewEmoji}>🧩</ThemedText>
              <ThemedText style={styles.previewTitle}>Indices</ThemedText>
            </View>
            <View style={styles.previewCard}>
              <ThemedText style={styles.previewEmoji}>🏆</ThemedText>
              <ThemedText style={styles.previewTitle}>Points</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.actionCard}>
          <ThemedText style={styles.actionTitle}>Choisis ton entree</ThemedText>

          {isSignedIn ? (
            <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonLift]} onPress={() => router.replace('/(tabs)')}>
              <ThemedText style={styles.primaryButtonText}>🚀 Aller au jeu</ThemedText>
            </Pressable>
          ) : (
            <>
              <Link href="/login" asChild>
                <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonLift]}>
                  <ThemedText style={styles.primaryButtonText}>🔐 Se connecter</ThemedText>
                </Pressable>
              </Link>

              <Link href="/register" asChild>
                <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonLift]}>
                  <ThemedText style={styles.secondaryButtonText}>✨ Créer un compte</ThemedText>
                </Pressable>
              </Link>
            </>
          )}
        </View>

        <View style={styles.noteCard}>
          <ThemedText style={styles.noteTitle}>🔒 Sécurité</ThemedText>
          <ThemedText style={styles.noteText}>
            Profil et parties connectées restent verrouillés tant que tu n'as pas créé un compte ou ouvert une session.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111f',
  },
  content: {
    padding: 16,
    paddingTop: 28,
    paddingBottom: 32,
    gap: 14,
  },
  heroCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(15,23,42,0.9)',
    padding: 20,
    gap: 14,
  },
  badgeRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.24)',
    backgroundColor: 'rgba(16,185,129,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeEmoji: {
    fontSize: 12,
  },
  badgeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f8fafc',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 19,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 10,
  },
  previewCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(30,41,59,0.8)',
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  previewEmoji: {
    fontSize: 28,
  },
  previewTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  actionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.22)',
    backgroundColor: 'rgba(15,23,42,0.78)',
    padding: 18,
    gap: 12,
  },
  actionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: '#059669',
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(30,41,59,0.82)',
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '800',
  },
  noteCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.18)',
    backgroundColor: 'rgba(20,83,45,0.34)',
    padding: 16,
    gap: 6,
  },
  noteTitle: {
    color: '#d1fae5',
    fontSize: 14,
    fontWeight: '800',
  },
  noteText: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 17,
  },
  buttonLift: {
    transform: [{ scale: 0.98 }],
  },
});