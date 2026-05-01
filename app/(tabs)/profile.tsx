import * as ImagePicker from 'expo-image-picker';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApiResource } from '@/hooks/use-api-resource';
import { useAuth } from '@/providers/auth-provider';
import { lootopiaApi, API_BASE_URL } from '@/services/lootopia-api';

function getLevelColor(level: string): string {
  switch (level.toUpperCase()) {
    case 'LEGEND':   return '#fbbf24';
    case 'PLATINUM': return '#06b6d4';
    case 'GOLD':     return '#f59e0b';
    case 'SILVER':   return '#d1d5db';
    case 'BRONZE':   return '#b45309';
    default:         return '#6b7280';
  }
}

function buildAvatarUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // path = "/uploads/avatars/xxx.jpg" → on préfixe la base sans /api
  const base = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${base}${path}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();

  // ── Mode édition ──────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editCity, setEditCity] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // ── Chargement du profil ──────────────────────────────────────────────────
  const loadProfile = useCallback(() => {
    const req = !session?.userId
      ? lootopiaApi.getCurrentUser()
      : lootopiaApi.getUser(session.userId);

    return req.catch((error) => {
      const message = error instanceof Error ? error.message : '';
      if (/not found|EntityValueResolver/i.test(message)) {
        void signOut();
        router.replace('/login');
      }
      throw error;
    });
  }, [router, session?.userId, signOut]);

  const { data: profile, error, loading, refresh } = useApiResource(loadProfile);

  // ── Rang du joueur ────────────────────────────────────────────────────────
  const loadRank = useCallback(() => {
    if (!session?.userId) return Promise.resolve(null);
    return lootopiaApi.getUserRank(session.userId).catch(() => null);
  }, [session?.userId]);

  const { data: rank } = useApiResource(loadRank);

  const rankPercentileLabel = useMemo(() => {
    if (!rank) return null;
    const p = rank.percentile;
    if (p >= 95) return 'Top 5% 🏆';
    if (p >= 75) return 'Top 25% 🥇';
    if (p >= 50) return 'Top 50% 🥈';
    return `Top ${Math.round(100 - p)}%`;
  }, [rank]);

  // ── Ouvrir le formulaire d'édition ────────────────────────────────────────
  const startEdit = () => {
    setEditUsername(profile?.username ?? '');
    setEditCity(profile?.city ?? '');
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  // ── Sauvegarder les modifications ─────────────────────────────────────────
  const saveProfile = async () => {
    if (!session?.userId) return;

    const trimmedUsername = editUsername.trim();
    const trimmedCity = editCity.trim();

    if (!trimmedUsername) {
      Alert.alert('Validation', 'Le nom d\'utilisateur ne peut pas etre vide.');
      return;
    }

    const patch: { username?: string; city?: string } = {};
    if (trimmedUsername !== profile?.username) patch.username = trimmedUsername;
    if (trimmedCity !== (profile?.city ?? '')) patch.city = trimmedCity || undefined;

    if (Object.keys(patch).length === 0) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await lootopiaApi.updateProfile(session.userId, patch);
      await refresh();
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      Alert.alert('Erreur', message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Upload avatar ─────────────────────────────────────────────────────────
  const pickAndUploadAvatar = async () => {
    if (!session?.userId) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorise l\'accès à ta galerie dans les réglages.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],   // MediaTypeOptions supprimé en v17
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    const fileName = asset.fileName ?? `avatar_${Date.now()}.jpg`;

    try {
      setIsUploadingAvatar(true);
      await lootopiaApi.uploadAvatar(session.userId, asset.uri, mimeType, fileName);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      Alert.alert('Erreur upload', message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ── Supprimer avatar ──────────────────────────────────────────────────────
  const confirmDeleteAvatar = () => {
    Alert.alert(
      'Supprimer l\'avatar',
      'Es-tu sur de vouloir supprimer ta photo de profil ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: deleteAvatar },
      ]
    );
  };

  const deleteAvatar = async () => {
    if (!session?.userId) return;
    try {
      setIsUploadingAvatar(true);
      await lootopiaApi.deleteAvatar(session.userId);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      Alert.alert('Erreur', message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const avatarUrl = buildAvatarUrl(profile?.avatarUrl ?? null);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Hero */}
        <View style={styles.heroCard}>
          <ThemedText style={styles.kicker}>Compte joueur</ThemedText>
          <ThemedText type="title" style={styles.title}>Profil</ThemedText>
          <ThemedText style={styles.subtitle}>Gere ton identite, tes stats et ta progression.</ThemedText>
        </View>

        {loading ? <ActivityIndicator color="#34d399" /> : null}
        {error ? <ThemedText style={styles.error}>Erreur: {error}</ThemedText> : null}

        {profile ? (
          <>
            {/* ── Avatar ── */}
            <View style={styles.avatarSection}>
              <Pressable onPress={pickAndUploadAvatar} style={styles.avatarWrapper} disabled={isUploadingAvatar}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <ThemedText style={styles.avatarInitial}>
                      {(profile.username ?? '?')[0].toUpperCase()}
                    </ThemedText>
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  {isUploadingAvatar
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <ThemedText style={styles.avatarEditIcon}>📷</ThemedText>
                  }
                </View>
              </Pressable>

              {avatarUrl ? (
                <Pressable onPress={confirmDeleteAvatar} style={styles.deleteAvatarBtn} disabled={isUploadingAvatar}>
                  <ThemedText style={styles.deleteAvatarText}>Supprimer la photo</ThemedText>
                </Pressable>
              ) : (
                <ThemedText style={styles.avatarHint}>Appuie sur la photo pour en choisir une</ThemedText>
              )}
            </View>

            {/* ── Identité — Vue ou Édition ── */}
            {isEditing ? (
              <View style={styles.card}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Modifier le profil</ThemedText>

                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>Nom d'utilisateur</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={editUsername}
                    onChangeText={setEditUsername}
                    placeholder="Ton pseudo"
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                    editable={!isSaving}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>Ville</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={editCity}
                    onChangeText={setEditCity}
                    placeholder="Ta ville (optionnel)"
                    placeholderTextColor="#64748b"
                    editable={!isSaving}
                  />
                </View>

                <View style={styles.editActions}>
                  <Pressable style={styles.cancelBtn} onPress={cancelEdit} disabled={isSaving}>
                    <ThemedText style={styles.cancelBtnText}>Annuler</ThemedText>
                  </Pressable>
                  <Pressable style={styles.saveBtn} onPress={() => void saveProfile()} disabled={isSaving}>
                    {isSaving
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <ThemedText style={styles.saveBtnText}>Enregistrer</ThemedText>
                    }
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.card}>
                <View style={styles.identityRow}>
                  <View style={styles.identityInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.name}>{profile.username}</ThemedText>
                    <ThemedText style={styles.email}>{profile.email}</ThemedText>
                    {profile.city ? (
                      <ThemedText style={styles.city}>📍 {profile.city}</ThemedText>
                    ) : null}
                  </View>
                  <View style={styles.identityRight}>
                    <View style={[styles.levelBadge, { backgroundColor: getLevelColor(profile.level) }]}>
                      <ThemedText style={styles.levelText}>{profile.level}</ThemedText>
                    </View>
                    <Pressable style={styles.editBtn} onPress={startEdit}>
                      <ThemedText style={styles.editBtnText}>✏️ Modifier</ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* ── Stats ── */}
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
                <ThemedText style={styles.statValue}>{profile.completedSteps ?? 0}</ThemedText>
                <ThemedText style={styles.statLabel}>Étapes</ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText style={styles.statValue}>{profile.loginStreak}</ThemedText>
                <ThemedText style={styles.statLabel}>Série</ThemedText>
              </View>
            </View>

            {/* ── Rang dans le classement ── */}
            {rank ? (
              <View style={styles.rankCard}>
                <ThemedText style={styles.rankKicker}>Classement global</ThemedText>
                <View style={styles.rankRow}>
                  <View style={styles.rankMain}>
                    <ThemedText style={styles.rankNumber}>#{rank.rank}</ThemedText>
                    <ThemedText style={styles.rankTotal}>sur {rank.total} joueurs</ThemedText>
                  </View>
                  {rankPercentileLabel ? (
                    <View style={styles.rankBadge}>
                      <ThemedText style={styles.rankBadgeText}>{rankPercentileLabel}</ThemedText>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* ── Dernière activité ── */}
            {profile.lastActivityAt ? (
              <View style={styles.card}>
                <ThemedText style={styles.fieldLabel}>Dernière activité</ThemedText>
                <ThemedText style={styles.sectionValue}>
                  {new Date(profile.lastActivityAt).toLocaleDateString('fr-FR')}
                </ThemedText>
              </View>
            ) : null}

            {/* ── Actions ── */}
            <Pressable style={styles.refreshButton} onPress={() => void refresh()}>
              <ThemedText style={styles.buttonText}>Rafraichir</ThemedText>
            </Pressable>
            <Pressable style={styles.logoutButton} onPress={() => void handleLogout()}>
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
    paddingBottom: 36,
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
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    color: '#fda4af',
    fontSize: 13,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    gap: 10,
  },
  avatarWrapper: {
    position: 'relative',
    width: 96,
    height: 96,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#34d399',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1e3a5f',
    borderWidth: 3,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: '700',
    color: '#94a3b8',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0b1220',
  },
  avatarEditIcon: {
    fontSize: 14,
  },
  avatarHint: {
    fontSize: 12,
    color: '#64748b',
  },
  deleteAvatarBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  deleteAvatarText: {
    fontSize: 12,
    color: '#f87171',
    fontWeight: '600',
  },

  // Carte identité
  card: {
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(30,41,59,0.82)',
    gap: 10,
    padding: 14,
  },
  identityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  identityInfo: {
    flex: 1,
    gap: 3,
  },
  identityRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  name: {
    color: '#f8fafc',
    fontSize: 16,
  },
  email: {
    fontSize: 12,
    color: '#64748b',
  },
  city: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  levelBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  levelText: {
    fontWeight: '700',
    color: '#fff',
    fontSize: 11,
  },
  editBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editBtnText: {
    fontSize: 12,
    color: '#34d399',
    fontWeight: '600',
  },

  // Formulaire d'édition
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 14,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    backgroundColor: 'rgba(15,23,42,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#0f766e',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionValue: {
    color: '#f8fafc',
    fontSize: 14,
  },

  // Rang
  rankCard: {
    borderColor: 'rgba(52,211,153,0.3)',
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(15,118,110,0.15)',
    padding: 14,
    gap: 8,
  },
  rankKicker: {
    fontSize: 10,
    color: '#34d399',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankMain: {
    gap: 2,
  },
  rankNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
  },
  rankTotal: {
    fontSize: 12,
    color: '#94a3b8',
  },
  rankBadge: {
    borderRadius: 999,
    backgroundColor: '#0f766e',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rankBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Boutons
  refreshButton: {
    borderRadius: 12,
    backgroundColor: '#059669',
    paddingVertical: 13,
    alignItems: 'center',
  },
  logoutButton: {
    borderRadius: 12,
    backgroundColor: '#be123c',
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
