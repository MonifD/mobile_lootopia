import { useState } from 'react';
import { Button, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';
export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const handleRegister = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await signUp(email, username, password, city || undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
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
        <ThemedText style={styles.subtitle}>Creer un compte</ThemedText>
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
          placeholder="Nom d'utilisateur"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          editable={!isLoading}
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
        <TextInput
          style={styles.input}
          placeholder="Ville (optionnel)"
          placeholderTextColor="#999"
          value={city}
          onChangeText={setCity}
          editable={!isLoading}
        />
        <Button title={isLoading ? 'Inscription...' : "S'inscrire"} onPress={handleRegister} disabled={isLoading} />
        <View style={styles.divider} />
        <ThemedText style={styles.centerText}>Deja inscrit ?</ThemedText>
        <Link href="/login" asChild>
          <Button title="Se connecter" />
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
