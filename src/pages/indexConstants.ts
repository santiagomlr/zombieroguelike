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
export const BOSS_COLOR = "#c81d3c";

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
  textPrimary: "#e6f1ff",
  textSecondary: "rgba(230, 241, 255, 0.65)",
  accent: "#00d9ff",
  accentGlow: "rgba(0, 217, 255, 0.45)",
  rageAccent: "#ff375e",
  rageGlow: "rgba(255, 55, 94, 0.45)",
  panelBg: "rgba(26, 26, 26, 0.94)",
  panelBorder: "rgba(90, 90, 90, 0.6)",
  overlay: "rgba(10, 10, 10, 0.72)",
  healthLow: "#7a1124",
  healthHigh: "#ff375e",
  shield: "#2fb3a3",
  ammo: "#00d9ff",
  xp: "#ff7b2f",
  minimap: "#3bc9db",
  backgroundGradient: ["#1a1a1a", "#2e2e2e", "#1a1a1a"],
} as const;

export type PortalType = "boss" | "exit";

export const PORTAL_COLORS: Record<PortalType, string> = {
  boss: "#ff375e",
  exit: "#00d9ff",
};

export const PORTAL_GLOW_COLORS: Record<PortalType, string> = {
  boss: "#ff5f7c",
  exit: "#4de3ff",
};

export const DIFFICULTY_TIERS = [
  { label: "Tranquilo", threshold: 0, color: "#3bc9db" },
  { label: "Fácil", threshold: 120, color: "#2fb3a3" },
  { label: "Desafiante", threshold: 300, color: "#66d981" },
  { label: "Implacable", threshold: 540, color: "#ffb347" },
  { label: "Apocalíptico", threshold: 780, color: "#ff7b2f" },
  { label: "Imposible", threshold: 1080, color: "#ff375e" },
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
