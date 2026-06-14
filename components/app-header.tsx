import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LevelModal } from '@/components/level-modal';
import { useApiResource } from '@/hooks/use-api-resource';
import { useGems } from '@/hooks/use-gems';
import { useAuth } from '@/providers/auth-provider';
import { lootopiaApi } from '@/services/lootopia-api';
import { computeLevel } from '@/utils/level';

const TIER_ICONS: Record<string, string> = {
  BRONZE: '🥉',
  SILVER: '🥈',
  GOLD: '🥇',
  PLATINUM: '💠',
  LEGEND: '⭐',
};

function CurrencyPill({ icon, value }: { icon: string; value: string }) {
  return (
    <LinearGradient colors={['#2b1b0a', '#0f0a05']} style={styles.currencyPill}>
      <Text style={styles.currencyIcon}>{icon}</Text>
      <Text style={styles.currencyValue}>{value}</Text>
    </LinearGradient>
  );
}

export function AppHeader() {
  const router = useRouter();
  const { session } = useAuth();
  const { gems } = useGems(session?.userId);
  const [showModal, setShowModal] = useState(false);

  const loadProfile = useCallback(
    () =>
      session?.userId
        ? lootopiaApi.getUser(session.userId).catch(() => null)
        : Promise.resolve(null),
    [session?.userId],
  );
  const { data: profile } = useApiResource(loadProfile);

  const totalPoints = profile?.totalPoints ?? 0;
  const { numericLevel, progress, tier } = computeLevel(totalPoints);
  const progressPct = Math.round(progress * 100);

  return (
    <View style={styles.topBar}>
      <View style={styles.playerBlock}>
        <Pressable
          onPress={() => setShowModal(true)}
          style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.75 }]}
        >
          <Text style={styles.avatarText}>{TIER_ICONS[tier] ?? '🥉'}</Text>
        </Pressable>

        <View>
          <Text style={styles.playerRole}>{tier}</Text>
          <Text style={styles.playerLevel}>NIVEAU {numericLevel}</Text>

          <View style={styles.progressOuter}>
            <View style={[styles.progressInner, { width: `${progressPct}%` as `${number}%` }]} />
            <Text style={styles.progressText}>{progressPct}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.currencyGroup}>
        <CurrencyPill icon="💎" value={String(gems)} />
      </View>

      <LevelModal
        visible={showModal}
        totalPoints={totalPoints}
        onClose={() => setShowModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 74,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#fbbf24',
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 26 },
  playerRole: { color: '#fef3c7', fontSize: 10, fontWeight: '900' },
  playerLevel: { color: '#fbbf24', fontSize: 14, fontWeight: '900' },
  progressOuter: {
    marginTop: 3,
    width: 120,
    height: 14,
    borderRadius: 999,
    backgroundColor: '#1c1208',
    borderWidth: 1,
    borderColor: '#a16207',
    overflow: 'hidden',
  },
  progressInner: { height: '100%', backgroundColor: '#facc15' },
  progressText: {
    position: 'absolute',
    right: 5,
    top: -1,
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  currencyGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  currencyPill: {
    height: 38,
    minWidth: 92,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#b45309',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    gap: 5,
  },
  currencyIcon: { fontSize: 18 },
  currencyValue: { color: '#fff7ed', fontSize: 13, fontWeight: '900' },
});
