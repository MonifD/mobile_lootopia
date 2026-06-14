import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { computeLevel } from '@/utils/level';
import type { TierLabel } from '@/utils/level';

function getTierColor(tier: TierLabel): string {
  switch (tier) {
    case 'LEGEND':   return '#fbbf24';
    case 'PLATINUM': return '#06b6d4';
    case 'GOLD':     return '#f59e0b';
    case 'SILVER':   return '#d1d5db';
    case 'BRONZE':   return '#b45309';
  }
}

function getTierIcon(tier: TierLabel): string {
  switch (tier) {
    case 'LEGEND':   return '⭐';
    case 'PLATINUM': return '💠';
    case 'GOLD':     return '🥇';
    case 'SILVER':   return '🥈';
    case 'BRONZE':   return '🥉';
  }
}

type Props = {
  totalPoints: number;
  /** 'sm' = header compact, 'md' = default (profile) */
  size?: 'sm' | 'md';
  onPress?: () => void;
};

export function LevelBadge({ totalPoints, size = 'md' }: Props) {
  const { numericLevel, tier } = computeLevel(totalPoints);
  const color    = getTierColor(tier);
  const icon     = getTierIcon(tier);

  const isSmall  = size === 'sm';
  const w        = isSmall ? 54 : 68;
  const h        = isSmall ? 84 : 108;

  return (
    <View
      style={[
        styles.shield,
        {
          width: w,
          height: h,
          borderColor: color,
          borderRadius: isSmall ? 13 : 16,
        },
      ]}
    >
      <Text style={[styles.icon, isSmall && styles.iconSm]}>{icon}</Text>

      <View style={[styles.divider, { backgroundColor: color }]} />

      <Text style={[styles.number, isSmall && styles.numberSm]}>
        {numericLevel >= 100 ? '★' : numericLevel}
      </Text>

      <Text style={[styles.label, isSmall && styles.labelSm]}>NIVEAU</Text>

      <Text style={[styles.tierName, isSmall && styles.tierNameSm, { color }]}>
        {tier}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shield: {
    backgroundColor: '#1a0f04',
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 2,
  },

  icon: {
    fontSize: 26,
    lineHeight: 30,
  },
  iconSm: {
    fontSize: 20,
    lineHeight: 24,
  },

  divider: {
    width: '55%',
    height: 1.5,
    borderRadius: 999,
    marginVertical: 2,
    opacity: 0.6,
  },

  number: {
    color: '#facc15',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 30,
  },
  numberSm: {
    fontSize: 22,
    lineHeight: 24,
  },

  label: {
    color: '#a8916a',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: -2,
  },
  labelSm: {
    fontSize: 7,
  },

  tierName: {
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  tierNameSm: {
    fontSize: 6.5,
  },
});
