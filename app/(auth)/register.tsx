import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/providers/auth-provider';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const handleRegister = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await signUp(email, username, password);
      router.replace('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.glowOrb, styles.glowOrbLeft]} />
      <View style={[styles.glowOrb, styles.glowOrbRight]} />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <ThemedText style={styles.badge}>Lootopia Explorer</ThemedText>
            <ThemedText type="title" style={styles.title}>
              Inscription
            </ThemedText>
            <ThemedText style={styles.subtitle}>Creer ton profil et debloque tes premieres missions.</ThemedText>

            {error ? (
              <View style={styles.errorBox}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Nom d'utilisateur</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Nom d'utilisateur"
                placeholderTextColor="#7a8699"
                value={username}
                onChangeText={setUsername}
                editable={!isLoading}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#7a8699"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Mot de passe</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#7a8699"
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
                secureTextEntry
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                isLoading && styles.submitButtonDisabled,
                pressed && !isLoading && styles.submitButtonPressed,
                pressed && !isLoading && styles.buttonLift,
              ]}
              onPress={handleRegister}
              disabled={isLoading}>
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <ThemedText style={styles.submitButtonText}>Inscription...</ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.submitButtonText}>S'inscrire</ThemedText>
              )}
            </Pressable>

            <View style={styles.footerRow}>
              <ThemedText style={styles.footerText}>Deja inscrit ?</ThemedText>
              <Link href="/login" asChild>
                <Pressable style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed, pressed && styles.buttonLift]}>
                  <ThemedText style={styles.linkText}>Se connecter</ThemedText>
                </Pressable>
              </Link>
            </View>

            <View style={styles.guestCard}>
              <ThemedText style={styles.guestTitle}>Tu peux regarder avant de jouer</ThemedText>
              <ThemedText style={styles.guestText}>L'accueil public te montre l'univers Lootopia, les visuels et les promesses du jeu sans te connecter.</ThemedText>
              <Link href="/welcome" asChild>
                <Pressable style={({ pressed }) => [styles.guestButton, pressed && styles.buttonLift]}>
                  <ThemedText style={styles.guestButtonText}>Voir l'accueil</ThemedText>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b1220',
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 999,
    opacity: 0.35,
  },
  glowOrbLeft: {
    left: -96,
    top: -12,
    backgroundColor: '#10b981',
  },
  glowOrbRight: {
    right: -84,
    bottom: -36,
    backgroundColor: '#06b6d4',
    opacity: 0.25,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 28,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(30,41,59,0.88)',
    padding: 24,
    shadowColor: '#0f172a',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  badge: {
    marginBottom: 8,
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  title: {
    color: '#f8fafc',
    marginBottom: 6,
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: '#ffffff',
    marginBottom: 18,
    fontSize: 12,
    lineHeight: 17,
  },
  errorBox: {
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    color: '#be123c',
    fontSize: 13,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 6,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.45)',
    backgroundColor: 'rgba(30,41,59,0.78)',
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#f8fafc',
    fontSize: 16,
  },
  submitButton: {
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: '#059669',
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonPressed: {
    backgroundColor: '#10b981',
  },
  buttonLift: {
    transform: [{ scale: 0.98 }],
  },
  submitButtonDisabled: {
    opacity: 0.75,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  footerText: {
    color: '#ffffff',
    fontSize: 12,
  },
  linkButton: {
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  linkButtonPressed: {
    opacity: 0.7,
  },
  linkText: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '700',
  },
  guestCard: {
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.24)',
    backgroundColor: 'rgba(15,23,42,0.72)',
    padding: 16,
    gap: 8,
  },
  guestTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  guestText: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 17,
  },
  guestButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.45)',
    backgroundColor: 'rgba(59,130,246,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  guestButtonText: {
    color: '#bfdbfe',
    fontSize: 13,
    fontWeight: '700',
  },
});
