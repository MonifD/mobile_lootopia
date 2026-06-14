/**
 * Calcule un niveau numérique (1-100) et une progression (0-1)
 * à partir des points totaux d'un joueur.
 *
 * Correspondance tier ↔ niveaux :
 *   BRONZE   0 – 499 pts      → niveaux  1 – 20
 *   SILVER   500 – 1 999 pts  → niveaux 21 – 40
 *   GOLD     2 000 – 4 999 pts→ niveaux 41 – 60
 *   PLATINUM 5 000 – 9 999 pts→ niveaux 61 – 80
 *   LEGEND   10 000+ pts      → niveaux 81 – 100  (plafond : 15 000 pts)
 */

const TIERS = [
  { label: 'BRONZE',   min: 0,     max: 499,   levelStart: 1,  levelEnd: 20  },
  { label: 'SILVER',   min: 500,   max: 1999,  levelStart: 21, levelEnd: 40  },
  { label: 'GOLD',     min: 2000,  max: 4999,  levelStart: 41, levelEnd: 60  },
  { label: 'PLATINUM', min: 5000,  max: 9999,  levelStart: 61, levelEnd: 80  },
  { label: 'LEGEND',   min: 10000, max: 15000, levelStart: 81, levelEnd: 100 },
] as const;

export type TierLabel = (typeof TIERS)[number]['label'];

export type LevelInfo = {
  /** Niveau numérique de 1 à 100 */
  numericLevel: number;
  /** Progression dans le niveau courant, de 0 à 1 (pour la barre) */
  progress: number;
  /** Nom du palier : BRONZE / SILVER / GOLD / PLATINUM / LEGEND */
  tier: TierLabel;
  /** Points nécessaires pour atteindre le palier suivant (null si LEGEND) */
  nextTierThreshold: number | null;
};

export function computeLevel(totalPoints: number): LevelInfo {
  const clamped = Math.max(0, Math.min(totalPoints, 15000));

  const tier = [...TIERS].find((t) => clamped <= t.max) ?? TIERS[4];

  const levelCount   = tier.levelEnd - tier.levelStart + 1;   // 20
  const pointsPerLevel = (tier.max - tier.min) / levelCount;

  const pointsInTier = clamped - tier.min;
  const levelOffset  = Math.min(
    Math.floor(pointsInTier / pointsPerLevel),
    levelCount - 1,
  );

  const numericLevel = tier.levelStart + levelOffset;

  // Progression à l'intérieur du niveau courant
  const progress =
    numericLevel >= 100
      ? 1
      : (pointsInTier - levelOffset * pointsPerLevel) / pointsPerLevel;

  const tierIndex = TIERS.findIndex((t) => t.label === tier.label);
  const nextTierThreshold =
    tierIndex < TIERS.length - 1 ? TIERS[tierIndex + 1].min : null;

  return {
    numericLevel,
    progress: Math.min(Math.max(progress, 0), 1),
    tier: tier.label,
    nextTierThreshold,
  };
}
