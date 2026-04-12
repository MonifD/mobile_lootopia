import { useCallback } from 'react';
import { Button, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApiResource } from '@/hooks/use-api-resource';
import { useAuth } from '@/providers/auth-provider';
import { lootopiaApi } from '@/services/lootopia-api';

function getLevelColor(level: string): string {
  switch (level.toUpperCase()) {
    case 'LEGEND':
      return '#fbbf24';
    case 'PLATINUM':
      return '#06b6d4';
    case 'GOLD':
      return '#f59e0b';
    case 'SILVER':
      return '#d1d5db';
    case 'BRONZE':
      return '#b45309';
    default:
      return '#6b7280';
  }
}

export default function ProfileScreen() {
  const { session, signOut } = useAuth();

  const loadProfile = useCallback(() => {
    if (!session?.userId) return Promise.resolve(null as any);
    return lootopiaApi.getUser(session.userId);
  }, [session?.userId]);

  const { data: profile, error, loading, refresh } = useApiResource(loadProfile);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Profil</ThemedText>

        {loading ? <ThemedText>Chargement...</ThemedText> : null}
        {error ? <ThemedText>Erreur: {error}</ThemedText> : null}

        {profile ? (
          <>
            <View style={styles.card}>
              <View style={styles.header}>
                <View>
                  <ThemedText type="defaultSemiBold">{profile.username}</ThemedText>
                  <ThemedText style={styles.email}>{profile.email}</ThemedText>
                </View>
                <View style={[styles.levelBadge, { backgroundColor: getLevelColor(profile.level) }]}>
                  <ThemedText style={styles.levelText}>{profile.level}</ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <ThemedText style={styles.statValue}>{profile.totalPoints}</ThemedText>
                <ThemedText style={styles.statLabel}>Points</ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText style={styles.statValue}>{profile.completedHunts}</ThemedText>
                <ThemedText style={styles.statLabel}>Chasses</ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText style={styles.statValue}>{profile.loginStreak}</ThemedText>
                <ThemedText style={styles.statLabel}>Serie</ThemedText>
              </View>
            </View>

            {profile.city && (
              <View style={styles.card}>
                <ThemedText type="defaultSemiBold">Ville</ThemedText>
                <ThemedText>{profile.city}</ThemedText>
              </View>
            )}

            {profile.lastActivityAt && (
              <View style={styles.card}>
                <ThemedText type="defaultSemiBold">Derniere activite</ThemedText>
                <ThemedText>{new Date(profile.lastActivityAt).toLocaleDateString('fr-FR')}</ThemedText>
              </View>
            )}

            <Button title="Rafraichir" onPress={() => void refresh()} />
            <Button title="Se deconnecter" onPress={handleLogout} color="#ef4444" />
          </>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 12,
    padding: 16,
  },
  card: {
    borderColor: '#4f46e5',
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  email: {
    fontSize: 13,
    opacity: 0.7,
  },
  levelBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  levelText: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
});

