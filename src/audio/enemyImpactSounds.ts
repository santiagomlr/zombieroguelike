import type { SfxKey } from "./audioManager";

export type EnemyCategory = "zombie" | "insect" | "zombie_animal";

const CATEGORY_IMPACT_SOUNDS: Record<EnemyCategory, readonly SfxKey[]> = {
  zombie: [
    "impact_zombie_hit_1",
    "impact_zombie_hit_2",
    "impact_zombie_hit_3",
    "impact_zombie_growl_1",
    "impact_zombie_growl_2",
    "impact_zombie_short_grunt",
    "impact_zombie_snarl",
  ],
  zombie_animal: [
    "impact_zombie_dog_hit",
    "impact_zombie_dog_growl_1",
  ],
  insect: [
    "impact_insect_smash_1",
    "impact_insect_smash_2",
    "impact_insect_move_1",
    "impact_insect_move_2",
  ],
};

export type EnemyWithCategory<T extends object = Record<string, any>> = T & {
  category: EnemyCategory;
};

export function pickImpactSoundForCategories(
  categories: readonly EnemyCategory[],
  rng: () => number = Math.random,
): SfxKey | null {
  for (const category of categories) {
    const sounds = CATEGORY_IMPACT_SOUNDS[category];
    if (!sounds?.length) {
      continue;
    }
    if (sounds.length === 1) {
      return sounds[0];
    }
    const index = Math.floor(rng() * sounds.length);
    return sounds[index];
  }
  return null;
}

export function inferEnemyCategory({
  specialType,
  isSummoned,
  defaultCategory = "zombie",
}: {
  specialType?: string | null;
  isSummoned?: boolean;
  defaultCategory?: EnemyCategory;
}): EnemyCategory {
  if (isSummoned) {
    return "zombie_animal";
  }
  if (specialType === "fast") {
    return "insect";
  }
  return defaultCategory;
}

export function getImpactSoundsForCategory(
  category: EnemyCategory,
): readonly SfxKey[] {
  return CATEGORY_IMPACT_SOUNDS[category] ?? [];
}
