import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { computeLevel } from '@/utils/level';

const TIERS = [
  { label: 'BRONZE',   icon: '🥉', min: 0,     max: 499,   lvStart: 1,  lvEnd: 20,  color: '#cd7f32' },
  { label: 'SILVER',   icon: '🥈', min: 500,   max: 1999,  lvStart: 21, lvEnd: 40,  color: '#94a3b8' },
  { label: 'GOLD',     icon: '🥇', min: 2000,  max: 4999,  lvStart: 41, lvEnd: 60,  color: '#fbbf24' },
  { label: 'PLATINUM', icon: '💠', min: 5000,  max: 9999,  lvStart: 61, lvEnd: 80,  color: '#7dd3fc' },
  { label: 'LEGEND',   icon: '⭐', min: 10000, max: 15000, lvStart: 81, lvEnd: 100, color: '#f59e0b' },
] as const;

type Props = {
  visible: boolean;
  totalPoints: number;
  onClose: () => void;
};

export function LevelModal({ visible, totalPoints, onClose }: Props) {
  const { numericLevel: currentLevel, tier: currentTier } = computeLevel(totalPoints);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.box} onPress={() => {}}>
          <Text style={styles.title}>🏅 PROGRESSION DES NIVEAUX</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {TIERS.map((t, i) => {
              const isActive = t.label === currentTier;
              const isPast   = TIERS.findIndex(x => x.label === currentTier) > i;
              return (
                <View key={t.label} style={styles.timelineItem}>
                  {i < TIERS.length - 1 ? (
                    <View style={[styles.timelineLine, (isPast || isActive) && { backgroundColor: t.color }]} />
                  ) : null}

                  <View style={[styles.timelineDot, { borderColor: t.color, backgroundColor: isPast || isActive ? t.color : '#0f172a' }]}>
                    <Text style={styles.timelineDotIcon}>{t.icon}</Text>
                  </View>

                  <View style={[styles.timelineContent, isActive && { borderColor: t.color, borderWidth: 1 }]}>
                    <View style={styles.timelineHeader}>
                      <Text style={[styles.timelineTier, { color: t.color }]}>{t.label}</Text>
                      {isActive ? <Text style={[styles.timelineCurrentBadge, { backgroundColor: t.color }]}>EN COURS</Text> : null}
                      {isPast   ? <Text style={styles.timelineDoneBadge}>✓ COMPLÉTÉ</Text> : null}
                    </View>
                    <Text style={styles.timelinePoints}>
                      {t.label === 'LEGEND'
                        ? `≥ ${t.min.toLocaleString('fr-FR')} pts`
                        : `${t.min.toLocaleString('fr-FR')} – ${t.max.toLocaleString('fr-FR')} pts`}
                    </Text>
                    <Text style={styles.timelineLevels}>
                      Niveaux {t.lvStart} → {t.lvEnd}  ({t.lvEnd - t.lvStart + 1} paliers)
                    </Text>
                    {isActive ? (
                      <Text style={[styles.timelineCurrent, { color: t.color }]}>
                        Tu es au niveau {currentLevel}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>FERMER</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  box: {
    width: '100%',
    maxHeight: '82%',
    backgroundColor: '#0c1a12',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#facc15',
    padding: 20,
    gap: 14,
  },
  title: {
    color: '#facc15',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 34,
    width: 2,
    bottom: -14,
    backgroundColor: '#1e3a2a',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  timelineDotIcon: { fontSize: 14 },
  timelineContent: {
    flex: 1,
    backgroundColor: '#111c17',
    borderRadius: 14,
    padding: 10,
    gap: 3,
    borderColor: 'transparent',
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineTier: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  timelineCurrentBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  timelineDoneBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: '#4ade80',
  },
  timelinePoints: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  timelineLevels: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  timelineCurrent: {
    fontSize: 11,
    fontWeight: '900',
    marginTop: 2,
  },
  closeButton: {
    marginTop: 4,
    backgroundColor: '#1f2d1a',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4ade80',
  },
  closeText: {
    color: '#4ade80',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
});
