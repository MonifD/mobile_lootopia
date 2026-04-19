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
import { Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/providers/auth-provider';

export default function RegisterScreen() {
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
            <ThemedText style={styles.badge}>Lootopia Partner</ThemedText>
            <ThemedText type="title" style={styles.title}>
              Inscription
            </ThemedText>
            <ThemedText style={styles.subtitle}>Creer un compte pour acceder au backoffice.</ThemedText>

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
                <Pressable style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}>
                  <ThemedText style={styles.linkText}>Se connecter</ThemedText>
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
    backgroundColor: '#020617',
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
    backgroundColor: 'rgba(255,255,255,0.96)',
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
    color: '#0f172a',
    marginBottom: 6,
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: '#475569',
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 20,
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
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#0f172a',
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
    color: '#64748b',
    fontSize: 13,
  },
  linkButton: {
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  linkButtonPressed: {
    opacity: 0.7,
  },
  linkText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '700',
  },
});
