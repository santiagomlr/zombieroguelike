import {
  EnemyArchetypeId,
  ENEMY_ARCHETYPES,
  LegacyEnemyType,
  EnemySelection,
  applyScaling,
  adjustBomberDamage,
  clamp01,
} from "./enemies";

export type BaseEnemySlot = Extract<LegacyEnemyType, "weak" | "medium" | "strong">;

export interface WaveProfile {
  baseWeights: Partial<Record<BaseEnemySlot, number>>;
  specialChance: number;
  eliteChance: number;
  specialWeights: Array<{ id: EnemyArchetypeId; weight: number }>;
}

const STATIC_PROFILES: Record<number, WaveProfile> = {
  1: profile({ weak: 1 }, 0.05),
  2: profile({ weak: 0.9, medium: 0.1 }, 0.05),
  3: profile({ weak: 0.75, medium: 0.25 }, 0.08),
  4: profile({ weak: 0.65, medium: 0.35 }, 0.1),
  5: profile({ weak: 0.4, medium: 0.56, strong: 0.04 }, 0.12),
  6: profile({ weak: 0.5, medium: 0.4, strong: 0.1 }, 0.15),
  7: profile({ weak: 0.55, medium: 0.32, strong: 0.13 }, 0.18),
};

function profile(baseWeights: Partial<Record<BaseEnemySlot, number>>, specialChance: number, eliteChance = 0): WaveProfile {
  return {
    baseWeights,
    specialChance,
    eliteChance,
    specialWeights: defaultSpecialPool(),
  };
}

function defaultSpecialPool() {
  return [
    { id: "bomber" as const, weight: 1 },
    { id: "runner" as const, weight: 0.9 },
    { id: "tank" as const, weight: 0.8 },
    { id: "caster" as const, weight: 0.7 },
  ];
}

function getBaseProfileForWave(wave: number): WaveProfile {
  if (STATIC_PROFILES[wave]) {
    return NORMALIZED_STATIC_PROFILES[wave];
  }

  const strongChance = Math.min(0.3, 0.15 + (wave - 8) * 0.02);
  const mediumChance = 0.45;
  const weakChance = clamp01(1 - strongChance - mediumChance);

  const specialChance = getSpecialChance(wave);
  const eliteChance = clamp01(0.05 + (wave - 8) * 0.01);

  return normalizeProfile({
    baseWeights: { weak: weakChance, medium: mediumChance, strong: strongChance },
    specialChance,
    eliteChance,
    specialWeights: defaultSpecialPool(),
  });
}

function getSpecialChance(wave: number) {
  if (wave <= 3) return 0.05;
  if (wave <= 7) return 0.15;
  if (wave <= 12) return 0.25;
  if (wave <= 18) return 0.35;
  return 0.45;
}

function normalizeProfile(profile: WaveProfile): WaveProfile {
  const total = Object.values(profile.baseWeights).reduce((acc, value = 0) => acc + value, 0);
  if (total <= 0) {
    return { ...profile, baseWeights: { weak: 1 } };
  }

  const baseWeights = Object.fromEntries(
    Object.entries(profile.baseWeights).map(([key, value]) => [key, (value ?? 0) / total])
  ) as WaveProfile["baseWeights"];

  return { ...profile, baseWeights };
}

const NORMALIZED_STATIC_PROFILES = Object.fromEntries(
  Object.entries(STATIC_PROFILES).map(([wave, profile]) => [wave, normalizeProfile(profile)])
) as Record<number, WaveProfile>;

function baseLegacyToArchetype(slot: BaseEnemySlot): EnemyArchetypeId {
  switch (slot) {
    case "medium":
      return "intermediate";
    case "strong":
      return "elite";
    default:
      return "common";
  }
}

type WeightedEntry<T> = { id: T; weight: number };

function weightedSelect<T>(entries: WeightedEntry<T>[]): T {
  if (entries.length === 0) {
    throw new Error('Cannot select from an empty weight set');
  }

  const totalWeight = entries.reduce((acc, entry) => acc + entry.weight, 0);
  let roll = Math.random() * (totalWeight || 1);
  for (const entry of entries) {
    if (roll < entry.weight) {
      return entry.id;
    }
    roll -= entry.weight;
  }

  return entries[entries.length - 1].id;
}

export function selectEnemyForWave(wave: number): EnemySelection {
  const profile = getBaseProfileForWave(wave);
  const specialRoll = Math.random();
  if (profile.specialWeights.length > 0 && specialRoll < profile.specialChance) {
    const specialId = weightedSelect(profile.specialWeights);
    return { archetype: ENEMY_ARCHETYPES[specialId], isElite: false };
  }

  const baseId = weightedSelect(
    Object.entries(profile.baseWeights).map(([legacyType, weight]) => ({
      id: baseLegacyToArchetype(legacyType as BaseEnemySlot),
      weight: weight ?? 0,
    }))
  );

  const archetype = ENEMY_ARCHETYPES[baseId];
  const isElite = Math.random() < profile.eliteChance && archetype.legacyType !== "weak";

  return { archetype, isElite };
}

export function createEnemyInstance(wave: number) {
  const selection = selectEnemyForWave(wave);
  const stats = applyScaling(selection.archetype, wave, { isElite: selection.isElite });

  const specialType = selection.archetype.specialType ?? null;
  const damage =
    specialType === "explosive"
      ? adjustBomberDamage(selection.archetype, wave)
      : stats.damage;

  return {
    selection,
    stats: { ...stats, damage },
    specialType,
  };
}
