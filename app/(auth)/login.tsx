import { useState } from 'react';
import { Button, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';
export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const handleLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await signIn(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Lootopia
        </ThemedText>
        <ThemedText style={styles.subtitle}>Connexion</ThemedText>
        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
          secureTextEntry
        />
        <Button title={isLoading ? 'Connexion...' : 'Se connecter'} onPress={handleLogin} disabled={isLoading} />
        <View style={styles.divider} />
        <ThemedText style={styles.centerText}>Pas de compte ?</ThemedText>
        <Link href="/register" asChild>
          <Button title="Creer un compte" />
        </Link>
      </ScrollView>
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
    opacity: 0.7,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
  centerText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
