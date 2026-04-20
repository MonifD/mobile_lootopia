import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

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
  const router = useRouter();
  const { session, signOut } = useAuth();

  const loadProfile = useCallback(() => {
    const request = !session?.userId
      ? lootopiaApi.getCurrentUser()
      : lootopiaApi.getUser(session.userId);

    return request.catch((error) => {
      const message = error instanceof Error ? error.message : '';
      if (/not found|EntityValueResolver/i.test(message)) {
        void signOut();
        router.replace('/login');
      }

      throw error;
    });
  }, [router, session?.userId, signOut]);

  const { data: profile, error, loading, refresh } = useApiResource(loadProfile);

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <ThemedText style={styles.kicker}>Compte joueur</ThemedText>
          <ThemedText type="title" style={styles.title}>Profil</ThemedText>
          <ThemedText style={styles.subtitle}>Retrouve tes stats, ton niveau et ta progression globale.</ThemedText>
        </View>

        {loading ? <ThemedText style={styles.feedback}>Chargement...</ThemedText> : null}
        {error ? <ThemedText style={styles.error}>Erreur: {error}</ThemedText> : null}

        {profile ? (
          <>
            <View style={styles.card}>
              <View style={styles.header}>
                <View>
                  <ThemedText type="defaultSemiBold" style={styles.name}>{profile.username}</ThemedText>
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
                <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>Ville</ThemedText>
                <ThemedText style={styles.sectionValue}>{profile.city}</ThemedText>
              </View>
            )}

            {profile.lastActivityAt && (
              <View style={styles.card}>
                <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>Derniere activite</ThemedText>
                <ThemedText style={styles.sectionValue}>{new Date(profile.lastActivityAt).toLocaleDateString('fr-FR')}</ThemedText>
              </View>
            )}

            <Pressable style={styles.refreshButton} onPress={() => void refresh()}>
              <ThemedText style={styles.buttonText}>Rafraichir</ThemedText>
            </Pressable>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <ThemedText style={styles.buttonText}>Se deconnecter</ThemedText>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  content: {
    gap: 12,
    padding: 16,
    paddingBottom: 28,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(30,41,59,0.86)',
    padding: 16,
    gap: 6,
  },
  kicker: {
    color: '#34d399',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  title: {
    color: '#f8fafc',
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 19,
  },
  feedback: {
    color: '#ffffff',
    fontSize: 13,
  },
  error: {
    color: '#fda4af',
    fontSize: 13,
  },
  card: {
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(30,41,59,0.82)',
    gap: 8,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: '#f8fafc',
  },
  email: {
    fontSize: 13,
    color: '#ffffff',
  },
  levelBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  levelText: {
    fontWeight: '700',
    color: '#fff',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(30,41,59,0.82)',
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff',
  },
  sectionLabel: {
    color: '#ffffff',
  },
  sectionValue: {
    color: '#f8fafc',
  },
  refreshButton: {
    borderRadius: 12,
    backgroundColor: '#059669',
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButton: {
    borderRadius: 12,
    backgroundColor: '#be123c',
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

