import type { Language } from "./gameData";

export const LANGUAGE_ORDER: Language[] = ["es", "en"];

export type PauseMenuTab = "home" | "settings" | "stats";

export const PAUSE_MENU_TABS: PauseMenuTab[] = ["home", "settings", "stats"];

export const CHEST_DROP_RATE = 0.025;
export const ENTITY_SCALE = 0.75;
export const CAMERA_DEADZONE_RADIUS = 80;
export const CAMERA_ZOOM = 1.8;

export const PLAYER_BASE_RADIUS = 16;
export const WEAK_ENEMY_BASE_RADIUS = 16;
export const MEDIUM_ENEMY_BASE_RADIUS = 20;
export const STRONG_ENEMY_BASE_RADIUS = 24;
export const FAST_ENEMY_BASE_RADIUS = 16;
export const EXPLOSIVE_ENEMY_BASE_RADIUS = 18;
export const SUMMONER_ENEMY_BASE_RADIUS = 20;
export const TANK_ENEMY_BASE_RADIUS = 28;

export const WEAK_ENEMY_COLOR = "#5dbb63";
export const WEAK_ELITE_COLOR = "#16a34a";
export const MEDIUM_ENEMY_COLOR = "#8e44ad";
export const MEDIUM_ELITE_COLOR = "#9333ea";
export const STRONG_ENEMY_COLOR = "#f97316";
export const STRONG_ELITE_COLOR = "#ea580c";
export const FAST_ENEMY_COLOR = "#fb923c";
export const BOSS_COLOR = "#ffc300";

export const ENEMY_SIZE_MULTIPLIER = 1.3;
export const ENEMY_SPEED_MULTIPLIER = 0.7;
export const HOTSPOT_SIZE_MULTIPLIER = 1.3;

export const scaleEntitySize = (value: number) =>
  Math.max(1, Math.round(value * ENTITY_SCALE));

export const scaleEnemyRadius = (value: number) =>
  Math.max(1, Math.round(scaleEntitySize(value) * ENEMY_SIZE_MULTIPLIER));

export const scaleHotspotRadius = (value: number) =>
  Math.max(1, Math.round(scaleEntitySize(value) * HOTSPOT_SIZE_MULTIPLIER));

export const applyEnemySpeedModifier = (value: number) =>
  value * ENEMY_SPEED_MULTIPLIER;

export const BULLET_RADIUS = 4;

export const MAX_ENEMY_RADIUS = Math.max(
  scaleEnemyRadius(WEAK_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(MEDIUM_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(STRONG_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(FAST_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(EXPLOSIVE_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(SUMMONER_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(TANK_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(40),
);

export const MAX_CHAIN_RADIUS = 150;
export const MAX_BOUNCE_RADIUS = 200;

export const SPATIAL_HASH_CELL_SIZE = Math.max(
  1,
  Math.round((MAX_ENEMY_RADIUS + BULLET_RADIUS) * 2),
);

export const BULLET_QUERY_RADIUS = Math.max(
  MAX_ENEMY_RADIUS + BULLET_RADIUS,
  MAX_BOUNCE_RADIUS,
);

export const UI_COLORS = {
  textPrimary: "#d9d9d9",
  textSecondary: "rgba(217, 217, 217, 0.7)",
  accent: "#00d140",
  accentGlow: "rgba(0, 209, 64, 0.45)",
  rageAccent: "#ff7a2a",
  rageGlow: "rgba(255, 122, 42, 0.45)",
  panelBg: "rgba(10, 10, 10, 0.92)",
  panelBorder: "rgba(217, 217, 217, 0.2)",
  overlay: "rgba(0, 0, 0, 0.7)",
  healthLow: "#b00020",
  healthHigh: "#ff3b3b",
  shield: "#2e86c1",
  ammo: "#ffc300",
  xp: "#8e44ad",
  minimap: "#5dbb63",
  backgroundGradient: ["#111", "#0a0a0a", "#050505"],
} as const;

export type PortalType = "boss" | "exit";

export const PORTAL_COLORS: Record<PortalType, string> = {
  boss: "#6366f1",
  exit: "#22c55e",
};

export const PORTAL_GLOW_COLORS: Record<PortalType, string> = {
  boss: "#a855f7",
  exit: "#4ade80",
};

export const DIFFICULTY_TIERS = [
  { label: "Tranquilo", threshold: 0, color: "#22c55e" },
  { label: "Fácil", threshold: 120, color: "#84cc16" },
  { label: "Desafiante", threshold: 300, color: "#fbbf24" },
  { label: "Implacable", threshold: 540, color: "#f97316" },
  { label: "Apocalíptico", threshold: 780, color: "#ef4444" },
  { label: "Imposible", threshold: 1080, color: "#a855f7" },
] as const;

export type DifficultyTier = (typeof DIFFICULTY_TIERS)[number];

export const getDifficultyIntensity = (elapsedTime: number) =>
  Math.pow(1 + elapsedTime / 90, 1.12) - 1;

export const getDifficultyLevel = (elapsedTime: number) =>
  Math.max(1, Math.floor(getDifficultyIntensity(elapsedTime)) + 1);

export const getDifficultyTierIndex = (elapsedTime: number) => {
  let tierIndex = 0;
  for (let i = 0; i < DIFFICULTY_TIERS.length; i++) {
    if (elapsedTime >= DIFFICULTY_TIERS[i].threshold) {
      tierIndex = i;
    } else {
      break;
    }
  }
  return tierIndex;
};

export const getTierProgress = (
  elapsedTime: number,
  tier: DifficultyTier,
  nextTier: DifficultyTier | undefined,
) => {
  if (!nextTier) {
    return 1;
  }
  const span = Math.max(1, nextTier.threshold - tier.threshold);
  return Math.min(1, Math.max(0, (elapsedTime - tier.threshold) / span));
};

export const hexToRgba = (hex: string, alpha: number) => {
  if (!hex.startsWith("#")) {
    return hex;
  }

  const normalized = hex.slice(1);

  if (normalized.length !== 6 && normalized.length !== 3) {
    return hex;
  }

  const expand = (value: string) => (value.length === 1 ? value + value : value);
  const r = parseInt(
    expand(normalized.slice(0, normalized.length === 3 ? 1 : 2)),
    16,
  );
  const g = parseInt(
    expand(
      normalized.slice(
        normalized.length === 3 ? 1 : 2,
        normalized.length === 3 ? 2 : 4,
      ),
    ),
    16,
  );
  const b = parseInt(expand(normalized.slice(normalized.length === 3 ? 2 : 4)), 16);

  if ([r, g, b].some((component) => Number.isNaN(component))) {
    return hex;
  }

  const clampedAlpha = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
};

export type Bounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type GamePortal = {
  x: number;
  y: number;
  rad: number;
  type: PortalType;
  active: boolean;
  activated?: boolean;
  spawnTime: number;
};
