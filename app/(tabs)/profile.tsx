import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { useApiResource } from '@/hooks/use-api-resource';
import { useAuth } from '@/providers/auth-provider';
import { API_BASE_URL, lootopiaApi } from '@/services/lootopia-api';

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
      return '#84cc16';
  }
}

function buildAvatarUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${base}${path}`;
}

function formatActivityDate(value: string | null | undefined): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);

  return `${day}/${month}/${year}`;
}

function GoldFrame({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <LinearGradient
      colors={['#fff3a3', '#f59e0b', '#7c2d12']}
      style={[styles.goldFrame, style]}
    >
      <View style={styles.goldFrameInner}>{children}</View>
    </LinearGradient>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
}) {
  return (
    <LinearGradient colors={['#fff3a3', '#f59e0b', '#7c2d12']} style={styles.statBorder}>
      <LinearGradient colors={[color, '#102018']} style={styles.statCard}>
        <View style={styles.cardGloss} />
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
      </LinearGradient>
    </LinearGradient>
  );
}

function ActionButton({
  icon,
  title,
  subtitle,
  color,
  onPress,
  loading,
}: {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={loading} style={({ pressed }) => pressed && styles.pressed}>
      <LinearGradient colors={['#fff3a3', '#f59e0b', '#7c2d12']} style={styles.actionBorder}>
        <LinearGradient colors={[color, '#132018']} style={styles.actionButton}>
          <Text style={styles.actionIcon}>{icon}</Text>

          <View style={styles.actionTextWrap}>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionSubtitle}>{subtitle}</Text>
          </View>

          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionArrow}>›</Text>
          )}
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editCity, setEditCity] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

  const loadRank = useCallback(() => {
    if (!session?.userId) return Promise.resolve(null);
    return lootopiaApi.getUserRank(session.userId).catch(() => null);
  }, [session?.userId]);

  const { data: rank, refresh: refreshRank } = useApiResource(loadRank);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      void refreshRank();
    }, [refresh, refreshRank])
  );

  const rankPercentileLabel = useMemo(() => {
    if (!rank) return null;
    const p = rank.percentile;
    if (p >= 95) return 'Top 5% 🏆';
    if (p >= 75) return 'Top 25% 🥇';
    if (p >= 50) return 'Top 50% 🥈';
    return `Top ${Math.round(100 - p)}%`;
  }, [rank]);

  const startEdit = () => {
    setEditUsername(profile?.username ?? '');
    setEditCity(profile?.city ?? '');
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const saveProfile = async () => {
    if (!session?.userId) return;

    const trimmedUsername = editUsername.trim();
    const trimmedCity = editCity.trim();

    if (!trimmedUsername) {
      Alert.alert('Validation', 'Le nom d’utilisateur ne peut pas être vide.');
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

  const pickAndUploadAvatar = async () => {
    if (!session?.userId) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorise l’accès à ta galerie dans les réglages.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
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

  const confirmDeleteAvatar = () => {
    Alert.alert(
      'Supprimer l’avatar',
      'Es-tu sûr de vouloir supprimer ta photo de profil ?',
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
    <ImageBackground
      source={require('@/assets/images/rendu-3d-du-scenario-routier_23-2151293955.jpg')}
      style={styles.root}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.iconButton}>
            <Text style={styles.iconButtonText}>‹</Text>
          </Pressable>

          <View style={styles.titleWrap}>
            <Text style={styles.pageTitle}>PROFIL</Text>
            <Text style={styles.pageSubtitle}>COMPTE JOUEUR</Text>
          </View>

          <Pressable style={styles.iconButton}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator color="#facc15" /> : null}
        {error ? <Text style={styles.error}>Erreur : {error}</Text> : null}

        {profile ? (
          <>
            <GoldFrame style={styles.profilePanel}>
              <View style={styles.profileRow}>
                <Pressable
                  onPress={pickAndUploadAvatar}
                  disabled={isUploadingAvatar}
                  style={styles.avatarOuter}
                >
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>
                        {(profile.username ?? '?')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cameraBadge}>
                    {isUploadingAvatar ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.cameraIcon}>📷</Text>
                    )}
                  </View>
                </Pressable>

                <View style={styles.profileInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.username}>{profile.username}</Text>

                    <Pressable onPress={startEdit} style={styles.smallEditButton}>
                      <Text style={styles.smallEditText}>✎</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.email}>{profile.email}</Text>

                  {profile.city ? (
                    <Text style={styles.city}>📍 {profile.city}</Text>
                  ) : (
                    <Text style={styles.cityMuted}>📍 Ville non renseignée</Text>
                  )}

                  {profile.lastActivityAt ? (
                    <Text style={styles.activityDate}>
                      Dernière activité : {formatActivityDate(profile.lastActivityAt)}
                    </Text>
                  ) : null}

                  <Text style={styles.xpLabel}>EXPÉRIENCE</Text>

                  <View style={styles.xpBarOuter}>
                    <View style={styles.xpBarInner} />
                    <Text style={styles.xpPercent}>65%</Text>
                  </View>

                  <Text style={styles.xpText}>15 650 / 24 000 XP</Text>
                </View>

                <View
                  style={[
                    styles.levelShield,
                    { borderColor: getLevelColor(profile.level) },
                  ]}
                >
                  <Text style={styles.levelSmall}>NIVEAU</Text>
                  <Text style={styles.levelNumber}>
                    {String(profile.level).toUpperCase() === 'LEGEND' ? '★' : profile.level}
                  </Text>
                </View>
              </View>

              {avatarUrl ? (
                <Pressable onPress={confirmDeleteAvatar} disabled={isUploadingAvatar}>
                  <Text style={styles.deleteAvatarText}>Supprimer la photo</Text>
                </Pressable>
              ) : null}
            </GoldFrame>

            {isEditing ? (
              <GoldFrame>
                <Text style={styles.editTitle}>MODIFIER LE PROFIL</Text>

                <Text style={styles.inputLabel}>Nom d’utilisateur</Text>
                <TextInput
                  style={styles.input}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  placeholder="Ton pseudo"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  editable={!isSaving}
                />

                <Text style={styles.inputLabel}>Ville</Text>
                <TextInput
                  style={styles.input}
                  value={editCity}
                  onChangeText={setEditCity}
                  placeholder="Ta ville"
                  placeholderTextColor="#9ca3af"
                  editable={!isSaving}
                />

                <View style={styles.editActions}>
                  <Pressable style={styles.cancelButton} onPress={cancelEdit} disabled={isSaving}>
                    <Text style={styles.cancelText}>Annuler</Text>
                  </Pressable>

                  <Pressable style={styles.saveButton} onPress={() => void saveProfile()} disabled={isSaving}>
                    {isSaving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveText}>Enregistrer</Text>
                    )}
                  </Pressable>
                </View>
              </GoldFrame>
            ) : null}

            <View style={styles.statsGrid}>
              <StatCard
                icon="🏆"
                label="POINTS"
                value={profile.totalPoints}
                subtitle="Récoltés"
                color="#6b0f0f"
              />

              <StatCard
                icon="🗺️"
                label="CHASSES"
                value={profile.completedHunts}
                subtitle="Terminées"
                color="#5a3708"
              />

              <StatCard
                icon="💎"
                label="ÉTAPES"
                value={profile.completedSteps ?? 0}
                subtitle="Validées"
                color="#064e3b"
              />

              <StatCard
                icon="🔥"
                label="SÉRIE"
                value={`${profile.loginStreak}`}
                subtitle="jours"
                color="#0f3a5f"
              />
            </View>

            {rank ? (
              <GoldFrame>
                <View style={styles.rankRow}>
                  <View>
                    <Text style={styles.rankTitle}>CLASSEMENT GLOBAL</Text>
                    <Text style={styles.rankNumber}>#{rank.rank}</Text>
                    <Text style={styles.rankTotal}>sur {rank.total} joueurs</Text>
                  </View>

                  {rankPercentileLabel ? (
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankBadgeText}>{rankPercentileLabel}</Text>
                    </View>
                  ) : null}
                </View>
              </GoldFrame>
            ) : null}

            <ActionButton
              icon="👤"
              title="MODIFIER LE PROFIL"
              subtitle="Change ton nom ou ta ville"
              color="#065f46"
              onPress={startEdit}
            />

            <ActionButton
              icon="🚪"
              title="SE DÉCONNECTER"
              subtitle="Quitter ton compte"
              color="#0f3a5f"
              onPress={() => void handleLogout()}
            />
          </>
        ) : null}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#06100a',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  content: {
    padding: 16,
    paddingTop: 48,
    paddingBottom: 36,
    gap: 14,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#1f160c',
    borderWidth: 3,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    color: '#fef3c7',
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 42,
  },
  settingsIcon: {
    fontSize: 26,
  },
  titleWrap: {
    alignItems: 'center',
  },
  pageTitle: {
    color: '#facc15',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: '#78350f',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 2,
  },
  pageSubtitle: {
    marginTop: -4,
    color: '#bbf7d0',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },

  error: {
    color: '#fecaca',
    fontWeight: '800',
    textAlign: 'center',
  },

  goldFrame: {
    borderRadius: 24,
    padding: 4,
    shadowColor: '#facc15',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  goldFrameInner: {
    borderRadius: 20,
    backgroundColor: 'rgba(8,38,30,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 14,
  },

  profilePanel: {
    marginTop: 4,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  avatarOuter: {
    width: 104,
    height: 104,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: '#facc15',
    shadowColor: '#facc15',
    shadowOpacity: 0.7,
    shadowRadius: 18,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#123b36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#facc15',
    fontSize: 42,
    fontWeight: '900',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#0f766e',
    borderWidth: 3,
    borderColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 16,
  },
  deleteAvatarText: {
    marginTop: 10,
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },

  profileInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    color: '#fff7ed',
    fontSize: 22,
    fontWeight: '900',
    flexShrink: 1,
  },
  smallEditButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#164e43',
    borderWidth: 2,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallEditText: {
    color: '#fef3c7',
    fontSize: 16,
    fontWeight: '900',
  },
  email: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '700',
  },
  city: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '800',
  },
  cityMuted: {
    color: '#a3a3a3',
    fontSize: 13,
    fontWeight: '700',
  },
  xpLabel: {
    marginTop: 6,
    color: '#facc15',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  xpBarOuter: {
    height: 18,
    borderRadius: 999,
    backgroundColor: '#09090b',
    borderWidth: 2,
    borderColor: '#6b3a0c',
    overflow: 'hidden',
  },
  xpBarInner: {
    width: '65%',
    height: '100%',
    backgroundColor: '#84cc16',
  },
  xpPercent: {
    position: 'absolute',
    right: 8,
    top: -1,
    color: '#fef3c7',
    fontSize: 12,
    fontWeight: '900',
  },
  xpText: {
    color: '#fef3c7',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },

  levelShield: {
    width: 62,
    height: 78,
    borderRadius: 16,
    backgroundColor: '#241607',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelSmall: {
    color: '#fef3c7',
    fontSize: 9,
    fontWeight: '900',
  },
  levelNumber: {
    color: '#facc15',
    fontSize: 24,
    fontWeight: '900',
  },

  editTitle: {
    color: '#facc15',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  inputLabel: {
    color: '#fef3c7',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 5,
    marginTop: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#92400e',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  cancelText: {
    color: '#fff',
    fontWeight: '900',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#16a34a',
  },
  saveText: {
    color: '#fff',
    fontWeight: '900',
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBorder: {
    flex: 1,
    borderRadius: 18,
    padding: 3,
  },
  statCard: {
    minHeight: 122,
    borderRadius: 15,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardGloss: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    height: 22,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  statIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  statLabel: {
    color: '#facc15',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
  },
  statValue: {
    color: '#fff7ed',
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
  },
  statSubtitle: {
    color: '#fde68a',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },

  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankTitle: {
    color: '#facc15',
    fontSize: 15,
    fontWeight: '900',
  },
  rankNumber: {
    color: '#facc15',
    fontSize: 38,
    fontWeight: '900',
  },
  rankTotal: {
    color: '#fef3c7',
    fontSize: 13,
    fontWeight: '800',
  },
  rankBadge: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f59e0b',
    backgroundColor: '#14532d',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  rankBadgeText: {
    color: '#fef3c7',
    fontSize: 13,
    fontWeight: '900',
  },

  activityDate: {
    marginTop: 6,
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },

  actionBorder: {
    borderRadius: 18,
    padding: 3,
  },
  actionButton: {
    minHeight: 74,
    borderRadius: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionIcon: {
    fontSize: 30,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    color: '#fff7ed',
    fontSize: 17,
    fontWeight: '900',
  },
  actionSubtitle: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  actionArrow: {
    color: '#fef3c7',
    fontSize: 42,
    fontWeight: '900',
  },
  pressed: {
    transform: [{ scale: 0.97 }, { translateY: 2 }],
  },
});
