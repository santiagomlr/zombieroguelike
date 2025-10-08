import { clamp } from "@/lib/utils";

export type EnemyArchetypeId =
  | "common"
  | "intermediate"
  | "elite"
  | "bomber"
  | "caster"
  | "tank"
  | "runner"
  | "splitter";

export type LegacyEnemyType =
  | "weak"
  | "medium"
  | "strong"
  | "explosive"
  | "fast"
  | "tank"
  | "summoner"
  | "split";

export interface EnemyArchetype {
  id: EnemyArchetypeId;
  legacyType: LegacyEnemyType;
  displayName: string;
  color: string;
  base: {
    hp: number;
    damage: number;
    radius: number;
    speed: number;
  };
  specialType?: "explosive" | "fast" | "tank" | "summoner" | "split";
  tags?: string[];
}

export const ENEMY_ARCHETYPES: Record<EnemyArchetypeId, EnemyArchetype> = {
  common: {
    id: "common",
    legacyType: "weak",
    displayName: "Infectado común",
    color: "#22c55e",
    base: { hp: 3, damage: 5, radius: 12, speed: 1.3 },
    tags: ["ground", "melee"],
  },
  intermediate: {
    id: "intermediate",
    legacyType: "medium",
    displayName: "Acechador intermedio",
    color: "#a855f7",
    base: { hp: 5, damage: 10, radius: 15, speed: 1.1 },
    tags: ["ground", "melee"],
  },
  elite: {
    id: "elite",
    legacyType: "strong",
    displayName: "Rompefilas élite",
    color: "#fbbf24",
    base: { hp: 8, damage: 20, radius: 18, speed: 0.9 },
    tags: ["ground", "melee"],
  },
  bomber: {
    id: "bomber",
    legacyType: "explosive",
    displayName: "Portador volátil",
    color: "#ef4444",
    base: { hp: 2, damage: 30, radius: 12, speed: 1.8 },
    specialType: "explosive",
    tags: ["suicide", "aoe"],
  },
  caster: {
    id: "caster",
    legacyType: "summoner",
    displayName: "Hechicero del enjambre",
    color: "#a855f7",
    base: { hp: 8, damage: 5, radius: 14, speed: 0.9 },
    specialType: "summoner",
    tags: ["ranged", "support"],
  },
  tank: {
    id: "tank",
    legacyType: "tank",
    displayName: "Quebrantador blindado",
    color: "#78716c",
    base: { hp: 15, damage: 20, radius: 20, speed: 0.6 },
    specialType: "tank",
    tags: ["tank"],
  },
  runner: {
    id: "runner",
    legacyType: "fast",
    displayName: "Azote veloz",
    color: "#fbbf24",
    base: { hp: 1, damage: 3, radius: 10, speed: 2.5 },
    specialType: "fast",
    tags: ["runner"],
  },
  splitter: {
    id: "splitter",
    legacyType: "split",
    displayName: "Divisor mutado",
    color: "#60a5fa",
    base: { hp: 6, damage: 6, radius: 14, speed: 1.2 },
    specialType: "split",
    tags: ["mutation"],
  },
};

export interface WaveScaling {
  hpMultiplier: number;
  damageMultiplier: number;
  speedMultiplier: number;
}

export interface EnemyStatOverrides {
  isElite?: boolean;
  extraHpMultiplier?: number;
  extraDamageMultiplier?: number;
  extraSpeedMultiplier?: number;
}

export interface ScaledEnemyStats {
  hp: number;
  damage: number;
  speed: number;
  radius: number;
  color: string;
}

export const ELITE_COLOR_OVERRIDES: Partial<Record<LegacyEnemyType, string>> = {
  weak: "#16a34a",
  medium: "#9333ea",
  strong: "#f59e0b",
};

export function getScalingForWave(wave: number): WaveScaling {
  let hpMultiplier = 1;
  if (wave <= 5) {
    hpMultiplier = 1 + (wave - 1) * 0.2;
  } else if (wave <= 15) {
    hpMultiplier = 1 + (wave - 1) * 0.35;
  } else {
    hpMultiplier = 1 + (wave - 1) * 0.5;
  }

  let speedMultiplier = 1;
  if (wave <= 10) {
    speedMultiplier = 1 + (wave - 1) * 0.03;
  } else if (wave <= 20) {
    speedMultiplier = 1 + (wave - 1) * 0.05;
  } else {
    speedMultiplier = clamp(1 + (wave - 1) * 0.07, 1, 3);
  }

  let damageMultiplier = 1;
  if (wave <= 5) {
    damageMultiplier = 1;
  } else if (wave <= 10) {
    damageMultiplier = 1.3;
  } else if (wave <= 13) {
    damageMultiplier = 1.6;
  } else if (wave <= 17) {
    damageMultiplier = 2.0;
  } else if (wave <= 21) {
    damageMultiplier = 2.5;
  } else {
    damageMultiplier = 3.0;
  }

  return { hpMultiplier, damageMultiplier, speedMultiplier };
}

export function applyScaling(
  archetype: EnemyArchetype,
  wave: number,
  overrides: EnemyStatOverrides = {}
): ScaledEnemyStats {
  const scaling = getScalingForWave(wave);
  const hpMultiplier = scaling.hpMultiplier * (overrides.extraHpMultiplier ?? 1);
  const speedMultiplier = scaling.speedMultiplier * (overrides.extraSpeedMultiplier ?? 1);
  const damageMultiplier = scaling.damageMultiplier * (overrides.extraDamageMultiplier ?? 1);

  let hp = Math.floor(archetype.base.hp * hpMultiplier);
  let damage = Math.floor(archetype.base.damage * damageMultiplier);
  const speed = archetype.base.speed * speedMultiplier;
  let radius = archetype.base.radius;
  let color = archetype.color;

  if (overrides.isElite) {
    hp = Math.floor(hp * 1.5);
    radius += 3;
    if (ELITE_COLOR_OVERRIDES[archetype.legacyType]) {
      color = ELITE_COLOR_OVERRIDES[archetype.legacyType]!;
    }
  }

  if (archetype.specialType === "explosive") {
    // Bombers ya incorporan su daño base escalado en la definición.
    damage = archetype.base.damage;
  }

  return {
    hp,
    damage,
    speed,
    radius,
    color,
  };
}

export interface EnemySelection {
  archetype: EnemyArchetype;
  isElite: boolean;
}

export function adjustBomberDamage(archetype: EnemyArchetype, wave: number): number {
  if (archetype.specialType !== "explosive") {
    return archetype.base.damage;
  }

  if (wave <= 5) {
    return 20 + wave * 3;
  }
  if (wave <= 10) {
    return 35 + (wave - 5) * 5;
  }
  if (wave <= 15) {
    return 65 + (wave - 10) * 7;
  }
  if (wave <= 20) {
    return 100 + (wave - 15) * 16;
  }
  return 180 + (wave - 20) * 20;
}

export function clamp01(value: number) {
  return clamp(value, 0, 1);
}
