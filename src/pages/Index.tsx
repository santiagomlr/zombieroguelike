import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type {
  MinimapEntity,
  MinimapFrame,
  OverlayParticle,
} from "../workers/overlayRenderer";
import { audioManager, type SfxKey } from "../audio/audioManager";
import {
  type EnemyCategory,
  type EnemyWithCategory,
  inferEnemyCategory,
  pickImpactSoundForCategories,
} from "../audio/enemyImpactSounds";

import {
  HORIZON_VISOR_ITEM,
  ITEMS,
  TOMES,
  WEAPONS,
  getItemText,
  getTomeDescription,
  getTomeName,
  getUpgradeDescriptionText,
  getWeaponName,
  rarityColors,
  translations,
  type Item,
  type Language,
  type Rarity,
  type Tome,
  type Upgrade,
  type Weapon,
} from "./gameData";
import { SpatialHash } from "../game/collision/spatialHash";
import {
  applyEnemySpeedModifier,
  BOSS_COLOR,
  BULLET_QUERY_RADIUS,
  BULLET_RADIUS,
  CAMERA_DEADZONE_RADIUS,
  CAMERA_ZOOM,
  CHEST_DROP_RATE,
  clampDifficultyValue,
  createDifficultyVariables,
  DIFFICULTY_COOLING_RULES,
  DIFFICULTY_EVENT_DELTAS,
  DIFFICULTY_INITIAL_VALUE,
  DIFFICULTY_RANGE,
  DIFFICULTY_TIERS,
  EXPLOSIVE_ENEMY_BASE_RADIUS,
  FAST_ENEMY_BASE_RADIUS,
  FAST_ENEMY_COLOR,
  evaluateDifficultyValue,
  getDifficultyIntensity,
  getDifficultyLevel,
  getDifficultyTierIndex,
  getTierProgress,
  hexToRgba,
  LANGUAGE_ORDER,
  MAX_BOUNCE_RADIUS,
  MAX_CHAIN_RADIUS,
  MAX_ENEMY_RADIUS,
  MEDIUM_ELITE_COLOR,
  MEDIUM_ENEMY_BASE_RADIUS,
  MEDIUM_ENEMY_COLOR,
  PAUSE_MENU_TABS,
  PLAYER_BASE_RADIUS,
  PORTAL_COLORS,
  PORTAL_GLOW_COLORS,
  scaleEnemyRadius,
  scaleEntitySize,
  scaleHotspotRadius,
  SPATIAL_HASH_CELL_SIZE,
  STRONG_ELITE_COLOR,
  STRONG_ENEMY_BASE_RADIUS,
  STRONG_ENEMY_COLOR,
  SUMMONER_ENEMY_BASE_RADIUS,
  TANK_ENEMY_BASE_RADIUS,
  UI_COLORS,
  WEAK_ELITE_COLOR,
  WEAK_ENEMY_BASE_RADIUS,
  WEAK_ENEMY_COLOR,
} from "./indexConstants";
import type {
  Bounds,
  DifficultyEventId,
  DifficultyTier,
  GamePortal,
  PauseMenuTab,
  BossPortalStatus,
} from "./indexConstants";

type BossEncounterState = {
  portalSpawned: boolean;
  bossActive: boolean;
  bossDefeated: boolean;
  uniqueBossId: string | null;
};

const explosionGradientCache = new Map<number, CanvasGradient>();
const dropPathCache = new Map<number, Path2D>();
const hotspotPathCache = new Map<number, Path2D>();

const HUD_FONT_FAMILY =
  '"Orbitron", "Press Start 2P", "VT323", "IBM Plex Mono", monospace';
const withTerminalFont = (font: string) => font.replace(/system-ui/g, HUD_FONT_FAMILY);

const MINIMAP_SIZE = 180;
const MINIMAP_PADDING = 24;
const MINIMAP_BOTTOM_OFFSET = 50;
const MINIMAP_FRAME_RADIUS = MINIMAP_SIZE / 2 + 10;

const PORTAL_ACTIVATION_HOLD_SECONDS = 1;
const PORTAL_BOSS_SPAWN_DELAY = 2;
const PORTAL_STUCK_FAILSAFE_SECONDS = 60;
const POST_BOSS_SURVIVAL_LIMIT = 600;
const POST_BOSS_REWARD_INTERVAL = 120;
const POST_BOSS_REWARD_XP = 50;
const POST_BOSS_SPAWN_DENSITY_PER_MIN = 0.1;
const POST_BOSS_ELITE_CHANCE_PER_MIN = 0.02;

const EXPLODER_INNER_RADIUS = 30;
const EXPLODER_OUTER_RADIUS = 70;
const EXPLODER_OUTER_MULTIPLIER = 0.4;
const EXPLODER_PLAYER_DAMAGE_MULTIPLIER = 0.8;
const EXPLODER_RAGDOLL_FORCE = 350;

const getDiamondPath = (radius: number) => {
  let path = dropPathCache.get(radius);
  if (!path) {
    path = new Path2D();
    path.moveTo(0, -radius);
    path.lineTo(radius, 0);
    path.lineTo(0, radius);
    path.lineTo(-radius, 0);
    path.closePath();
    dropPathCache.set(radius, path);
  }
  return path;
};

const getHotspotPath = (radius: number) => {
  let path = hotspotPathCache.get(radius);
  if (!path) {
    path = new Path2D();
    path.arc(0, 0, radius, 0, Math.PI * 2);
    hotspotPathCache.set(radius, path);
  }
  return path;
};

const getExplosionGradient = (ctx: CanvasRenderingContext2D, radius: number) => {
  let gradient = explosionGradientCache.get(radius);
  if (!gradient) {
    gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, "rgba(80, 30, 10, 0.8)");
    gradient.addColorStop(0.5, "rgba(60, 20, 5, 0.5)");
    gradient.addColorStop(1, "rgba(40, 10, 0, 0)");
    explosionGradientCache.set(radius, gradient);
  }
  return gradient;
};

const expandBounds = (bounds: Bounds, padding: number): Bounds => ({
  left: bounds.left - padding,
  top: bounds.top - padding,
  right: bounds.right + padding,
  bottom: bounds.bottom + padding,
});

const isEntityVisible = <T extends { x: number; y: number }>(
  entity: T,
  bounds: Bounds,
  radius: number,
) =>
  !(entity.x + radius < bounds.left ||
    entity.x - radius > bounds.right ||
    entity.y + radius < bounds.top ||
    entity.y - radius > bounds.bottom);

const cullEntities = <T extends { x: number; y: number }>(
  entities: readonly T[],
  bounds: Bounds,
  radiusAccessor: (entity: T) => number,
) => {
  const visible: T[] = [];
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const radius = radiusAccessor(entity);
    if (isEntityVisible(entity, bounds, radius)) {
      visible.push(entity);
    }
  }
  return visible;
};

const CRT_SETTINGS = {
  scanlineSpacing: 2,
  scanlineOpacity: 0.12,
  vignetteOpacity: 0.2,
  chromaShift: 1.8,
};

const drawPixelPanel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  {
    background = UI_COLORS.panelBg,
    border = UI_COLORS.panelBorder,
    highlight = "rgba(255, 255, 255, 0.04)",
  }: { background?: string; border?: string; highlight?: string } = {},
) => {
  ctx.save();
  ctx.fillStyle = background;
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = highlight;
  for (let row = 0; row < height; row += 2) {
    ctx.fillRect(Math.floor(x), Math.floor(y + row), Math.floor(width), 1);
  }
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, Math.floor(width) - 1, Math.floor(height) - 1);
  ctx.restore();
};

const drawSegmentedBar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  segment = 6,
) => {
  ctx.save();
  ctx.fillStyle = color;
  for (let offset = 0; offset < width; offset += segment) {
    const segmentWidth = Math.min(segment - 2, width - offset);
    if (segmentWidth <= 0) continue;
    ctx.fillRect(Math.floor(x + offset), Math.floor(y), segmentWidth, height);
  }
  ctx.restore();
};

const drawWarningIcon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
) => {
  const half = size / 2;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x + half, y);
  ctx.lineTo(x + size, y + size);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = UI_COLORS.textPrimary;
  ctx.font = withTerminalFont(`bold ${Math.round(size * 0.6)}px system-ui`);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("!", x + half, y + size * 0.7);
  ctx.restore();
};

const MUSIC_CONTROL_KEYS = ["toggle", "play", "skip"] as const;
type MusicControlKey = (typeof MUSIC_CONTROL_KEYS)[number];

type AuditLog = {
  zombies: Record<string, { kills: number; damage: number }>;
  totalDamageDealt: number;
  drops: {
    xp: { count: number; totalValue: number };
    heal: { count: number; totalValue: number };
    powerups: Record<string, number>;
    items: Record<string, number>;
  };
};

const createEmptyAuditLog = (): AuditLog => ({
  zombies: {},
  totalDamageDealt: 0,
  drops: {
    xp: { count: 0, totalValue: 0 },
    heal: { count: 0, totalValue: 0 },
    powerups: {},
    items: {},
  },
});

const ENEMY_LOG_LABELS: Record<string, { en: string; es: string }> = {
  boss: { en: "Bosses", es: "Jefes" },
  explosive: { en: "Explosive Zombies", es: "Zombis explosivos" },
  fast: { en: "Fast Zombies", es: "Zombis veloces" },
  tank: { en: "Tank Zombies", es: "Zombis tanque" },
  summoner: { en: "Summoner Zombies", es: "Zombis invocadores" },
  strong: { en: "Strong Zombies", es: "Zombis fuertes" },
  medium: { en: "Medium Zombies", es: "Zombis medianos" },
  weak: { en: "Weak Zombies", es: "Zombis débiles" },
  elite: { en: "Elite Zombies", es: "Zombis élite" },
  unknown: { en: "Unknown", es: "Desconocido" },
};

const POWERUP_LABELS: Record<string, { en: string; es: string }> = {
  magnet: { en: "Magnet", es: "Imán" },
  shield: { en: "Shield", es: "Escudo" },
  rage: { en: "Rage", es: "Furia" },
  speed: { en: "Speed", es: "Velocidad" },
};

const AUDIT_CONSOLE_TEXT = {
  en: {
    title: "Audit Console",
    placeholder: "Type a command (auditlogz, auditlogi, auditlogd) and press Enter",
    close: "Close",
    outputEmpty: "No command executed yet. Try auditlogz, auditlogi or auditlogd.",
    unknown: (cmd: string) => `Unknown command: ${cmd}`,
    zombieHeader: "Zombie elimination summary",
    zombieNone: "No zombies eliminated yet.",
    zombieEntry: (label: string, kills: number, damage: number) =>
      `• ${label}: Kills ${kills.toLocaleString("en-US")} | Damage ${damage.toLocaleString("en-US")}`,
    zombieTotal: (damage: number) =>
      `Estimated total damage dealt: ${damage.toLocaleString("en-US")}`,
    itemsHeader: "Inventory summary",
    itemsNone: "No items collected yet.",
    itemsEntry: (name: string, description: string, count: number) =>
      `• ${name} (x${count.toLocaleString("en-US")}) — ${description}`,
    dropsHeader: "Drop summary",
    dropsNone: "No drops collected yet.",
    dropsXp: (count: number, total: number) =>
      `• XP Crystals: ${count.toLocaleString("en-US")} collected | XP gained ${Math.round(total).toLocaleString("en-US")}`,
    dropsHeal: (count: number, total: number) =>
      `• Medkits: ${count.toLocaleString("en-US")} collected | HP restored ${Math.round(total).toLocaleString("en-US")}`,
    dropsPowerupHeader: "• Power-ups:",
    dropsPowerupEntry: (label: string, count: number) =>
      `  - ${label}: ${count.toLocaleString("en-US")} picked up`,
    dropsItemsHeader: "• Items:",
    dropsItemEntry: (name: string, description: string, count: number) =>
      `  - ${name} (x${count.toLocaleString("en-US")}) — ${description}`,
  },
  es: {
    title: "Consola de auditoría",
    placeholder: "Escribe un comando (auditlogz, auditlogi, auditlogd) y presiona Enter",
    close: "Cerrar",
    outputEmpty: "Aún no ejecutaste comandos. Prueba auditlogz, auditlogi o auditlogd.",
    unknown: (cmd: string) => `Comando desconocido: ${cmd}`,
    zombieHeader: "Resumen de eliminaciones",
    zombieNone: "Aún no eliminaste zombis.",
    zombieEntry: (label: string, kills: number, damage: number) =>
      `• ${label}: Bajas ${kills.toLocaleString("es-ES")} | Daño ${damage.toLocaleString("es-ES")}`,
    zombieTotal: (damage: number) =>
      `Daño total estimado: ${damage.toLocaleString("es-ES")}`,
    itemsHeader: "Inventario",
    itemsNone: "Todavía no tienes ítems.",
    itemsEntry: (name: string, description: string, count: number) =>
      `• ${name} (x${count.toLocaleString("es-ES")}) — ${description}`,
    dropsHeader: "Resumen de drops",
    dropsNone: "Aún no recogiste drops.",
    dropsXp: (count: number, total: number) =>
      `• Cristales de XP: ${count.toLocaleString("es-ES")} recogidos | XP obtenida ${Math.round(total).toLocaleString("es-ES")}`,
    dropsHeal: (count: number, total: number) =>
      `• Botiquines: ${count.toLocaleString("es-ES")} recogidos | HP recuperada ${Math.round(total).toLocaleString("es-ES")}`,
    dropsPowerupHeader: "• Power-ups:",
    dropsPowerupEntry: (label: string, count: number) =>
      `  - ${label}: ${count.toLocaleString("es-ES")} recogidos`,
    dropsItemsHeader: "• Ítems:",
    dropsItemEntry: (name: string, description: string, count: number) =>
      `  - ${name} (x${count.toLocaleString("es-ES")}) — ${description}`,
  },
} as const;

const ALL_ITEMS: Item[] = [...ITEMS, HORIZON_VISOR_ITEM];

const getPauseMenuLayout = (W: number, H: number) => {
  const scale = Math.min(1, Math.max(0.7, Math.min(W / 1280, H / 720)));

  const menuW = Math.min(600, Math.max(400, W * 0.75)) * scale;
  const menuH = Math.min(620, Math.max(480, H * 0.8)) * scale;
  const menuX = W / 2 - menuW / 2;
  const menuY = H / 2 - menuH / 2;
  const padding = 32 * scale;

  return {
    menuX,
    menuY,
    menuW,
    menuH,
    padding,
    scale,
  };
};

const getPauseMenuContentMetrics = (layout: ReturnType<typeof getPauseMenuLayout>) => {
  return {
    scale: layout.scale,
  };
};

type PauseMenuButtonLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type PauseMenuHomeLayout = {
  buttons: {
    continue: PauseMenuButtonLayout;
    audio: PauseMenuButtonLayout;
    language: PauseMenuButtonLayout;
    restart: PauseMenuButtonLayout;
  };
  audioPanel: {
    rect: { x: number; y: number; w: number; h: number };
    slider: {
      rect: { x: number; y: number; w: number; h: number };
      hitArea: { x: number; y: number; w: number; h: number };
    };
    toggles: {
      music: PauseMenuButtonLayout;
      sfx: PauseMenuButtonLayout;
    };
  };
};

const getPauseMenuHomeLayout = (
  layout: ReturnType<typeof getPauseMenuLayout>,
  audioPanelOpen: boolean,
): PauseMenuHomeLayout => {
  const { menuX, menuY, menuW, menuH, padding, scale } = layout;

  const buttonH = 56 * scale;
  const buttonGap = 14 * scale;
  const buttonCount = 4;
  const buttonStackHeight = buttonH * buttonCount + buttonGap * (buttonCount - 1);

  const panelX = menuX + padding;
  const panelW = menuW - padding * 2;

  const baseButtonsY = menuY + menuH - padding - buttonStackHeight - 16 * scale;
  const buttonsY = baseButtonsY;

  const minButtonMargin = audioPanelOpen ? 8 * scale : 16 * scale;
  const panelBottomLimit = buttonsY - minButtonMargin;
  const defaultPanelHeight = 200 * scale;
  const panelTopLimit = menuY + padding;
  const desiredPanelTop = panelTopLimit + (audioPanelOpen ? 6 * scale : 12 * scale);

  const maxPanelHeight = Math.max(panelBottomLimit - panelTopLimit, 0);
  let panelHeight = defaultPanelHeight;
  if (audioPanelOpen) {
    panelHeight = Math.min(defaultPanelHeight, maxPanelHeight);
  }

  const maxPanelTop = panelBottomLimit - panelHeight;
  let panelY = clamp(desiredPanelTop, panelTopLimit, maxPanelTop);

  if (!audioPanelOpen) {
    panelHeight = defaultPanelHeight;
    panelY = Math.max(panelY, desiredPanelTop);
  }

  const continueBtn: PauseMenuButtonLayout = {
    x: menuX + padding,
    y: buttonsY,
    w: panelW,
    h: buttonH,
  };

  const audioBtn: PauseMenuButtonLayout = {
    x: menuX + padding,
    y: buttonsY + buttonH + buttonGap,
    w: panelW,
    h: buttonH,
  };

  const languageBtn: PauseMenuButtonLayout = {
    x: menuX + padding,
    y: audioBtn.y + buttonH + buttonGap,
    w: panelW,
    h: buttonH,
  };

  const restartBtn: PauseMenuButtonLayout = {
    x: menuX + padding,
    y: languageBtn.y + buttonH + buttonGap,
    w: panelW,
    h: buttonH,
  };

  const panelInnerPadding = Math.max(16 * scale, 20 * scale * Math.min(1, panelHeight / defaultPanelHeight));
  const sliderX = panelX + 28 * scale;
  const sliderW = panelW - 56 * scale;
  const sliderH = Math.max(8 * scale, 10 * scale);
  const sliderMinY = panelY + panelInnerPadding + Math.min(32 * scale, panelHeight * 0.25);

  const baseToggleHeight = 56 * scale;
  const minToggleHeight = 44 * scale;
  const toggleGap = Math.max(14 * scale, Math.min(18 * scale, panelW * 0.04));
  const toggleWidth = Math.max((panelW - toggleGap - panelInnerPadding * 2) / 2, 0);

  let toggleHeight = Math.min(baseToggleHeight, panelHeight - panelInnerPadding * 2 - sliderH - 28 * scale);

  let toggleY = panelY + panelHeight - toggleHeight - panelInnerPadding;
  let sliderMaxY = toggleY - sliderH - 24 * scale;
  if (sliderMaxY <= sliderMinY) {
    const availableForSlider = panelHeight - panelInnerPadding * 2 - toggleHeight - 24 * scale;
    const adjustedToggleHeight = Math.max(
      minToggleHeight,
      Math.min(baseToggleHeight, panelHeight - panelInnerPadding - (sliderMinY + sliderH + 24 * scale)),
    );
    toggleHeight = Math.max(minToggleHeight, Math.min(toggleHeight, adjustedToggleHeight));
    toggleY = panelY + panelHeight - toggleHeight - panelInnerPadding;
    sliderMaxY = toggleY - sliderH - 20 * scale;
  }

  const sliderBaseY = sliderMinY + Math.min(18 * scale, Math.max(12 * scale, panelHeight * 0.15));
  const sliderY = clamp(sliderBaseY, sliderMinY, sliderMaxY);
  if (toggleY < sliderY + sliderH + 24 * scale) {
    toggleY = sliderY + sliderH + 24 * scale;
  }

  const availableToggleHeight = Math.max(panelY + panelHeight - panelInnerPadding - toggleY, 0);
  if (availableToggleHeight < minToggleHeight) {
    toggleHeight = availableToggleHeight;
  } else {
    toggleHeight = Math.min(baseToggleHeight, availableToggleHeight);
  }

  const musicToggle: PauseMenuButtonLayout = {
    x: panelX + 20 * scale,
    y: toggleY,
    w: toggleWidth,
    h: toggleHeight,
  };

  const sfxToggle: PauseMenuButtonLayout = {
    x: musicToggle.x + toggleWidth + toggleGap,
    y: toggleY,
    w: toggleWidth,
    h: toggleHeight,
  };

  return {
    buttons: {
      continue: continueBtn,
      audio: audioBtn,
      language: languageBtn,
      restart: restartBtn,
    },
    audioPanel: {
      rect: { x: panelX, y: panelY, w: panelW, h: panelHeight },
      slider: {
        rect: { x: sliderX, y: sliderY, w: sliderW, h: sliderH },
        hitArea: {
          x: sliderX,
          y: sliderY - 14 * scale,
          w: sliderW,
          h: sliderH + 28 * scale,
        },
      },
      toggles: {
        music: musicToggle,
        sfx: sfxToggle,
      },
    },
  };
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getCameraViewExtents = (width: number, height: number, zoom: number) => {
  const safeZoom = Math.max(zoom, 0.0001);
  const viewWidth = width / safeZoom;
  const viewHeight = height / safeZoom;

  return {
    halfViewW: viewWidth / 2,
    halfViewH: viewHeight / 2,
  };
};

const getCameraBounds = (
  camera: { x: number; y: number; zoom?: number | null },
  width: number,
  height: number,
  padding = 0,
) => {
  const zoom = camera.zoom ?? CAMERA_ZOOM;
  const { halfViewW, halfViewH } = getCameraViewExtents(width, height, zoom);

  return {
    minX: camera.x - halfViewW + padding,
    maxX: camera.x + halfViewW - padding,
    minY: camera.y - halfViewH + padding,
    maxY: camera.y + halfViewH - padding,
  };
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const getMusicMenuButtonRect = (W: number, H: number) => {
  const width = 160;
  const height = 44;
  const marginX = 20;
  const marginY = 72;

  return {
    x: W - width - marginX,
    y: H - height - marginY,
    w: width,
    h: height,
  };
};

const getMusicControlPanelRect = (W: number, H: number, trackCount: number) => {
  const width = 260;
  const baseHeight = 120;
  const rowHeight = 32;
  const marginX = 20;
  const marginY = 82;
  const calculatedHeight = baseHeight + Math.max(0, trackCount) * rowHeight;
  const maxHeight = H - marginY - 20;
  const height = Math.min(calculatedHeight, Math.max(baseHeight + rowHeight, maxHeight));

  return {
    x: W - width - marginX,
    y: H - height - marginY,
    w: width,
    h: height,
  };
};

const MUSIC_MENU_CONTROL_SIZE = 42;
const MUSIC_MENU_CONTROL_GAP = 12;
const MUSIC_MENU_PANEL_PADDING_X = 16;
const MUSIC_MENU_TRACK_ROW_HEIGHT = 28;

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayWorkerRef = useRef<Worker | null>(null);
  const overlaySupportedRef = useRef(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("language");
      if (stored === "es" || stored === "en") {
        return stored as Language;
      }
    }
    return "es";
  });
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const gameStateRef = useRef<any>(null);
  const resetGameRef = useRef<(() => void) | null>(null);
  const prerenderedLogosRef = useRef<{ [key: string]: HTMLCanvasElement }>({});
  const spatialHashRef = useRef(new SpatialHash<EnemyWithCategory, any>(SPATIAL_HASH_CELL_SIZE));
  const bulletNeighborBufferRef = useRef<EnemyWithCategory[]>([]);
  const fallbackEnemyListRef = useRef<EnemyWithCategory[]>([]);
  const chainedEnemiesRef = useRef<EnemyWithCategory[]>([]);
  const [consoleVisible, setConsoleVisibleState] = useState(false);
  const consoleVisibleRef = useRef(false);
  const [consoleInput, setConsoleInput] = useState("");
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const consoleInputRef = useRef<HTMLInputElement>(null);

  const setConsoleVisible = (value: boolean) => {
    consoleVisibleRef.current = value;
    setConsoleVisibleState(value);
  };

  const t = translations[language];

  const getLocalizedItemInfo = (id: string, lang: Language) => {
    const item = ALL_ITEMS.find((candidate) => candidate.id === id);
    if (item) {
      const localized = getItemText(item, lang);
      const description = localized.description || (lang === "es" ? "Sin descripción disponible." : "No description available.");
      return { name: localized.name, description };
    }
    return {
      name: id,
      description: lang === "es" ? "Sin descripción disponible." : "No description available.",
    };
  };

  const getConsoleStrings = (lang: Language) => AUDIT_CONSOLE_TEXT[lang] ?? AUDIT_CONSOLE_TEXT.en;

  const buildZombieLog = (lang: Language) => {
    const strings = getConsoleStrings(lang);
    const lines: string[] = [strings.zombieHeader];
    const audit = gameStateRef.current?.auditLog as AuditLog | undefined;
    if (!audit) {
      lines.push(strings.zombieNone);
      return lines;
    }

    const entries = Object.entries(audit.zombies).filter(([, data]) => data.kills > 0);
    if (entries.length === 0) {
      lines.push(strings.zombieNone);
      return lines;
    }

    entries.sort((a, b) => b[1].kills - a[1].kills);
    for (const [key, data] of entries) {
      const labelEntry = ENEMY_LOG_LABELS[key] ?? ENEMY_LOG_LABELS.unknown;
      const label = labelEntry?.[lang] ?? labelEntry.en ?? key;
      lines.push(strings.zombieEntry(label, data.kills, data.damage));
    }
    lines.push(strings.zombieTotal(audit.totalDamageDealt));
    return lines;
  };

  const buildItemLog = (lang: Language) => {
    const strings = getConsoleStrings(lang);
    const lines: string[] = [strings.itemsHeader];
    const stacks = gameStateRef.current?.player?.itemStacks ?? {};
    const entries = Object.entries(stacks).filter(([, count]) => (Number(count) ?? 0) > 0);
    if (entries.length === 0) {
      lines.push(strings.itemsNone);
      return lines;
    }

    const localizedEntries = entries.map(([id, count]) => {
      const info = getLocalizedItemInfo(id, lang);
      return { id, count: Number(count) || 0, ...info };
    });

    localizedEntries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of localizedEntries) {
      lines.push(strings.itemsEntry(entry.name, entry.description, entry.count));
    }

    return lines;
  };

  const buildDropLog = (lang: Language) => {
    const strings = getConsoleStrings(lang);
    const lines: string[] = [strings.dropsHeader];
    const audit = gameStateRef.current?.auditLog as AuditLog | undefined;
    if (!audit) {
      lines.push(strings.dropsNone);
      return lines;
    }

    let hasData = false;
    const { xp, heal, powerups, items } = audit.drops;

    if (xp.count > 0) {
      lines.push(strings.dropsXp(xp.count, xp.totalValue));
      hasData = true;
    }

    if (heal.count > 0) {
      lines.push(strings.dropsHeal(heal.count, heal.totalValue));
      hasData = true;
    }

    const powerupEntries = Object.entries(powerups).filter(([, count]) => (Number(count) ?? 0) > 0);
    if (powerupEntries.length > 0) {
      hasData = true;
      lines.push(strings.dropsPowerupHeader);
      powerupEntries.sort((a, b) => a[0].localeCompare(b[0]));
      for (const [key, count] of powerupEntries) {
        const labelEntry = POWERUP_LABELS[key];
        const label = labelEntry?.[lang] ?? labelEntry?.en ?? key;
        lines.push(strings.dropsPowerupEntry(label, Number(count) || 0));
      }
    }

    const itemEntries = Object.entries(items).filter(([, count]) => (Number(count) ?? 0) > 0);
    if (itemEntries.length > 0) {
      hasData = true;
      lines.push(strings.dropsItemsHeader);
      const localizedItems = itemEntries.map(([id, count]) => {
        const info = getLocalizedItemInfo(id, lang);
        return { id, count: Number(count) || 0, ...info };
      });
      localizedItems.sort((a, b) => a.name.localeCompare(b.name));
      for (const entry of localizedItems) {
        lines.push(strings.dropsItemEntry(entry.name, entry.description, entry.count));
      }
    }

    if (!hasData) {
      lines.push(strings.dropsNone);
    }

    return lines;
  };

  const handleConsoleCommand = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    const lang = (gameStateRef.current?.language ?? language) as Language;
    const strings = getConsoleStrings(lang);
    const normalized = trimmed.toLowerCase();
    const lines: string[] = [`> ${trimmed}`];

    if (normalized === "auditlogz") {
      lines.push(...buildZombieLog(lang));
    } else if (normalized === "auditlogi") {
      lines.push(...buildItemLog(lang));
    } else if (normalized === "auditlogd") {
      lines.push(...buildDropLog(lang));
    } else {
      lines.push(strings.unknown(trimmed));
    }

    setConsoleOutput(lines);
  };

  const handleConsoleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleConsoleCommand(consoleInput);
    setConsoleInput("");
  };

  const activeConsoleStrings = getConsoleStrings(
    (gameStateRef.current?.language ?? language) as Language,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    if (overlayCanvas) {
      overlayCanvas.width = W;
      overlayCanvas.height = H;
      overlayCanvas.style.width = `${W}px`;
      overlayCanvas.style.height = `${H}px`;
    }

    const supportsOffscreen =
      typeof window !== "undefined" && typeof Worker !== "undefined" && "OffscreenCanvas" in window;

    if (overlayCanvas && supportsOffscreen && !overlayWorkerRef.current) {
      try {
        const offscreen = overlayCanvas.transferControlToOffscreen();
        const worker = new Worker(new URL("../workers/overlayRenderer.ts", import.meta.url), {
          type: "module",
        });
        worker.postMessage(
          { type: "init", canvas: offscreen, width: W, height: H },
          [offscreen as unknown as Transferable],
        );
        overlayWorkerRef.current = worker;
        overlaySupportedRef.current = true;
      } catch (error) {
        overlaySupportedRef.current = false;
      }
    } else {
      overlaySupportedRef.current = false;
    }

    const worldW = Math.max(W, 2200);
    const worldH = Math.max(H, 1600);

    const createInitialDifficultyState = () => {
      const variables = createDifficultyVariables();
      variables.player_level = 1;
      return {
        intensity: 0,
        value: DIFFICULTY_INITIAL_VALUE,
        level: 1,
        tierIndex: 0,
        tierLabel:
          DIFFICULTY_TIERS[0].labels?.[language] ?? DIFFICULTY_TIERS[0].label,
        tierProgress: 0,
        notification: 0,
        stateId: DIFFICULTY_TIERS[0].id,
        eventValue: 0,
        freezeTimer: 0,
        damageDeltaTimer: 0,
        damageDeltaApplied: 0,
        variables,
      };
    };

    const gameState = {
      state: "running" as "running" | "paused" | "gameover",
      player: {
        x: worldW / 2,
        y: worldH / 2,
        vx: 0,
        vy: 0,
        spd: 2.45,
        rad: scaleEntitySize(PLAYER_BASE_RADIUS),
        hp: 100,
        maxhp: 100,
        stamina: 20,
        maxStamina: 20,
        isSprinting: false,
        shotsFired: 0,
        shield: 0,
        ifr: 0,
        ifrDuration: 0.5, // Cooldown de invulnerabilidad después de golpe (0.5s)
        magnet: 120,
        rageTimer: 0,
        tempMagnetTimer: 0,
        tempShieldTimer: 0,
        nightVisionActive: false,
        weapons: [WEAPONS[0]],
        tomes: [] as Tome[],
        items: [] as Item[],
        itemStacks: {} as Record<string, number>,
        stats: {
          damageMultiplier: 1,
          speedMultiplier: 1,
          rangeMultiplier: 1,
          fireRateMultiplier: 1,
          bounces: 0,
          multishot: 0,
          auraRadius: 0,
          vampire: 0,
          xpMultiplier: 1,
          precision: 0,
          regenRate: 0,
          regenInterval: 0,
          magnetMultiplier: 1,
          cameraZoomMultiplier: 1,
          bounceOnEnemies: false,
          damageReduction: 0,
          powerupDuration: 1,
          xpBonus: 0,
          firstHitImmuneChargesUsed: 0,
          chaosDamage: false,
          solarGauntletKills: 0,
          bloodstoneKills: 0,
          reactiveShieldActive: false,
          sprintEfficiencyMultiplier: 1,
          sprintRecoveryMultiplier: 1,
          adrenalineStacks: 0,
          adrenalineSpeedBonus: 0,
          adrenalineDamageBonus: 0,
          adrenalineThreshold: 0,
          droneAttackLevel: 0,
          droneSupportLevel: 0,
          droneShieldLevel: 0,
        },
      },
      bullets: [] as any[],
      enemies: [] as EnemyWithCategory[],
      normalEnemyCount: 0,
      drops: [] as any[],
      chestBlacklist: new Set<string>(),
      activeChestChoice: null as
        | {
            item: Item;
            chestPosition: { x: number; y: number };
          }
        | null,
      chestUIAnimation: 0,
      nearbyChest: null as any | null,
      pendingChestDrop: null as any | null,
      chestBanishesRemaining: 3,
      chestSkipsRemaining: 3,
      pausedForChest: false,
      particles: [] as any[],
      chestParticleSnapshot: null as any[] | null,
      maxParticlesBeforeChest: null as number | null,
      suppressParticlesForChest: false,
      hotspots: [] as any[],
      worldWidth: worldW,
      worldHeight: worldH,
      camera: {
        x: worldW / 2,
        y: worldH / 2,
        deadzone: CAMERA_DEADZONE_RADIUS,
        zoom: CAMERA_ZOOM,
      },
      maxParticles: 200,
      bosses: [] as any[],
      score: 0,
      level: 1,
      xp: 0,
      xpDisplay: 0,
      xpDisplayTarget: 0,
      nextXP: 25,
      nextXpDisplay: 25,
      nextXpDisplayTarget: 25,
      time: 0,
      elapsedTime: 0,
      globalEventTimer: 600,
      bossEncounter: {
        portalSpawned: false,
        bossActive: false,
        bossDefeated: false,
        uniqueBossId: null,
      } as BossEncounterState,
      bossPortal: null as GamePortal | null,
      exitPortal: null as GamePortal | null,
      bossFailSafe: {
        spawnTime: 0,
        respawned: false,
        lastHpCheck: 0,
        lastHpValue: 0,
      },
      postBossSurvival: {
        active: false,
        elapsed: 0,
        nextReward: POST_BOSS_REWARD_INTERVAL,
        rewardsGranted: 0,
        lootBiasBonus: { rare: 0, epic: 0, legendary: 0 },
      },
      nearbyBossPortal: null as GamePortal | null,
      nearbyExitPortal: null as GamePortal | null,
      difficulty: createInitialDifficultyState(),
      maxConcurrentEnemies: 12,
      lastSpawn: 0,
      lastBossSpawn: 0,
      spawnCooldown: 0, // Cooldown de 3 segundos después de matar todos los enemigos
      canSpawn: true, // Flag para controlar si se puede spawnar
      weaponCooldowns: {} as Record<string, number>,
      autoAimMemory: {} as Record<string, { target: any | null; lostTimer: number; lastScore: number }>,
      keys: {} as Record<string, boolean>,
      showUpgradeUI: false,
      upgradeOptions: [] as Upgrade[],
      regenTimer: 0,
      droneAttackCooldown: 0,
      droneSupportCooldown: 0,
      droneShieldCooldown: 0,
      auraTimer: 0,
      hotspotTimer: 0,
      dangerZoneTimer: 0,
      inDangerZone: false,
      levelUpAnimation: 0,
      upgradeAnimation: 0,
      upgradeUIAnimation: 0,
      xpBarRainbow: false,
      minimapOpacity: 0,
      minimapDetailLevel: 0,
      minimapHeading: 0,
      restartTimer: 0,
      restartHoldTime: 2, // 2 segundos para reiniciar sosteniendo R
      gameOverTimer: 0,
      countdownTimer: 0, // Countdown 3-2-1 al reanudar desde pausa
      // Sistema de Eventos Ambientales (sincronizado con dificultad)
      environmentalEvent: null as "storm" | "fog" | "rain" | null,
      eventNotification: 0,
      eventDuration: 0,
      eventTimer: 0,
      eventPhase: "none" as "none" | "notification" | "fadein" | "active" | "fadeout",
      eventIntensity: 0, // 0 a 1 para fade in/out
      eventActivatedThisTier: false, // Control: solo 1 evento por subida de dificultad
      lightningTimer: 0,
      fogOpacity: 0,
      fogZones: [] as Array<{ x: number; y: number; width: number; height: number }>,
      fogWarningZones: [] as Array<{ x: number; y: number; width: number; height: number; warningTime: number }>, // Warning para niebla
      stormZone: null as { x: number; y: number; radius: number; vx: number; vy: number } | null,
      meleeCooldown: 0, // Cooldown de golpe melee
      explosionMarks: [] as Array<{ x: number; y: number; radius: number; life: number }>, // Marcas de explosión en el suelo
      gameOverMusic: null as HTMLAudioElement | null,
      musicTracks: [
        { name: "Electronic Dreams", path: "/audio/Electronic_Dreams.mp3" },
        { name: "That Song", path: "/audio/Fobee_-_That_Song.mp3" },
        { name: "Upbeat Sports Bass", path: "/audio/MGM_-_Upbeat_Sports_Bass.mp3" },
        { name: "Luxury House Loop", path: "/audio/Track_Full.mp3" },
        { name: "Cool Funky Jazz Loop", path: "/audio/Cool_Funky_Jazz_Loop.mp3" },
      ],
      currentMusicIndex: 0,
      music: null as HTMLAudioElement | null,
      itemNotification: "",
      itemNotificationTimer: 0,
      musicMuted: false,
      musicVolume: 0.3, // Volumen de la música (0 a 1)
      targetMusicVolume: 0.3, // Volumen objetivo para animación suave
      musicStarted: false, // Flag para saber si el usuario ya inició la música
      musicIsPlaying: false,
      musicButtonClickAnim: {
        toggle: 0,
        play: 0,
        skip: 0,
      } as Record<MusicControlKey, number>,
      musicControlsVisible: false,
      musicQueue: [] as number[],
      sfxMuted: false,
      playerImg: null as HTMLImageElement | null,
      bossImg: null as HTMLImageElement | null,
      mediumZombieImg: null as HTMLImageElement | null,
      greenZombieImg: null as HTMLImageElement | null,
      bomberImg: null as HTMLImageElement | null,
      ghoulImg: null as HTMLImageElement | null,
      hellDogImg: null as HTMLImageElement | null,
      purpleZombieImg: null as HTMLImageElement | null,
      larvaImg: null as HTMLImageElement | null,
      shieldImg: null as HTMLImageElement | null,
      horizonVisorImg: null as HTMLImageElement | null,
      chestImg: null as HTMLImageElement | null,
      mapBackground: null as HTMLImageElement | null,
      tutorialActive: localStorage.getItem("gameHasTutorial") !== "completed",
      tutorialStartTime: performance.now(),
      gameOverAnimationTimer: 0,
      pauseMenuTab: "home" as PauseMenuTab,
      pauseMenuScroll: {
        home: 0,
        settings: 0,
        stats: 0,
      } as Record<PauseMenuTab, number>,
      pauseMenuMaxScroll: {
        home: 0,
        settings: 0,
        stats: 0,
      } as Record<PauseMenuTab, number>,
      pauseMenuAudioOpen: false,
      pauseMenuUiScalePercent: (() => {
        const stored = localStorage.getItem("pauseMenuUiScalePercent");
        const allowed = [70, 80, 90, 100, 110, 120];
        if (stored) {
          const parsed = Number.parseInt(stored, 10);
          if (Number.isFinite(parsed) && allowed.includes(parsed)) {
            return parsed;
          }
        }
        return 90;
      })(),
      pauseMenuUiScaleDropdownOpen: false,
      pauseMenuHitAreas: {
        home: {
          layout: "horizontal" as "horizontal" | "stacked",
          resume: { x: 0, y: 0, w: 0, h: 0 },
          language: { x: 0, y: 0, w: 0, h: 0 },
          restart: { x: 0, y: 0, w: 0, h: 0 },
        },
        settings: {
          slider: { x: 0, y: 0, w: 0, h: 0 },
          toggles: {
            music: { x: 0, y: 0, w: 0, h: 0 },
            sfx: { x: 0, y: 0, w: 0, h: 0 },
          },
          languages: [] as Array<{ x: number; y: number; w: number; h: number; lang: Language }>,
          uiScale: {
            trigger: { x: 0, y: 0, w: 0, h: 0 },
            options: [] as Array<{ x: number; y: number; w: number; h: number; value: number }>,
          },
        },
      },
      pauseMenuAudioHitAreas: {
        button: { x: 0, y: 0, w: 0, h: 0 },
        slider: { x: 0, y: 0, w: 0, h: 0 },
        musicToggle: { x: 0, y: 0, w: 0, h: 0 },
        sfxToggle: { x: 0, y: 0, w: 0, h: 0 },
      },
      language,
      auditLog: createEmptyAuditLog(),
    };

    const getDifficultyValue = () => gameState.difficulty.value;

    const addDifficultyValue = (delta: number) => {
      if (!Number.isFinite(delta)) {
        return gameState.difficulty.value;
      }
      gameState.difficulty.eventValue += delta;
      return clampDifficultyValue(
        evaluateDifficultyValue(gameState.difficulty.variables) +
          gameState.difficulty.eventValue,
      );
    };

    const setDifficultyValue = (value: number) => {
      if (!Number.isFinite(value)) {
        return gameState.difficulty.value;
      }
      const clamped = clampDifficultyValue(value);
      const base = evaluateDifficultyValue(gameState.difficulty.variables);
      gameState.difficulty.eventValue = clamped - base;
      return clamped;
    };

    const freezeDifficulty = (seconds: number) => {
      if (!Number.isFinite(seconds) || seconds <= 0) {
        return;
      }
      gameState.difficulty.freezeTimer = Math.max(
        gameState.difficulty.freezeTimer,
        seconds,
      );
    };

    const applyDifficultyEvent = (eventId: DifficultyEventId) => {
      const config = DIFFICULTY_EVENT_DELTAS[eventId];
      if (!config || typeof config.value_delta !== "number") {
        return gameState.difficulty.value;
      }

      let delta = config.value_delta;
      if (eventId === "on_player_damage_taken" && config.max_per_second) {
        if (gameState.difficulty.damageDeltaTimer <= 0) {
          gameState.difficulty.damageDeltaTimer = 1;
          gameState.difficulty.damageDeltaApplied = 0;
        }
        const remaining =
          config.max_per_second - gameState.difficulty.damageDeltaApplied;
        if (remaining <= 0) {
          return gameState.difficulty.value;
        }
        delta = Math.min(delta, remaining);
        gameState.difficulty.damageDeltaApplied += delta;
      }

      gameState.difficulty.eventValue += delta;
      return clampDifficultyValue(
        evaluateDifficultyValue(gameState.difficulty.variables) +
          gameState.difficulty.eventValue,
      );
    };

    const difficultyApi = {
      getValue: getDifficultyValue,
      addValue: addDifficultyValue,
      setValue: setDifficultyValue,
      applyEvent: applyDifficultyEvent,
      freeze: freezeDifficulty,
    };

    gameState.difficulty.api = difficultyApi;

    const getEnemyLogKey = (enemy: any) => {
      if (enemy?.isBoss) return "boss";
      if (enemy?.isElite) return "elite";
      if (enemy?.specialType) return String(enemy.specialType);
      if (enemy?.enemyType) return String(enemy.enemyType);
      return "unknown";
    };

    const recordEnemyKill = (enemy: any) => {
      const audit = gameState.auditLog;
      if (!audit) return;
      const key = getEnemyLogKey(enemy);
      const estimatedDamage = Math.max(0, Math.floor(Number(enemy?.maxhp ?? enemy?.hp ?? 0)));
      if (!audit.zombies[key]) {
        audit.zombies[key] = { kills: 0, damage: 0 };
      }
      audit.zombies[key].kills += 1;
      audit.zombies[key].damage += estimatedDamage;
      audit.totalDamageDealt += estimatedDamage;
    };

    const recordItemDrop = (item: Item) => {
      const audit = gameState.auditLog;
      if (!audit) return;
      audit.drops.items[item.id] = (audit.drops.items[item.id] ?? 0) + 1;
    };

    const recordPowerupPickup = (type: string | undefined) => {
      if (!type) return;
      const audit = gameState.auditLog;
      if (!audit) return;
      audit.drops.powerups[type] = (audit.drops.powerups[type] ?? 0) + 1;
    };

    const recordXpPickup = (value: number) => {
      const audit = gameState.auditLog;
      if (!audit) return;
      audit.drops.xp.count += 1;
      audit.drops.xp.totalValue += value;
    };

    const recordHealPickup = (value: number) => {
      const audit = gameState.auditLog;
      if (!audit || value <= 0) return;
      audit.drops.heal.count += 1;
      audit.drops.heal.totalValue += value;
    };

    const getItemStacks = (id: string) => gameState.player.itemStacks[id] ?? 0;
    const getCameraZoomMultiplier = () => gameState.player.stats.cameraZoomMultiplier ?? 1;
    const getTargetCameraZoom = () => CAMERA_ZOOM * getCameraZoomMultiplier();

    gameStateRef.current = gameState;

    const ENEMY_LOGO_BASE_SIZE = 60;

    const ensureTintedLogo = (color: string) => {
      const existing = prerenderedLogosRef.current[color];
      if (existing) {
        return existing;
      }

      if (!gameState.mediumZombieImg || !gameState.mediumZombieImg.complete) {
        return null;
      }

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = ENEMY_LOGO_BASE_SIZE;
      tempCanvas.height = ENEMY_LOGO_BASE_SIZE;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) {
        return null;
      }

      tempCtx.clearRect(0, 0, ENEMY_LOGO_BASE_SIZE, ENEMY_LOGO_BASE_SIZE);
      tempCtx.drawImage(gameState.mediumZombieImg, 0, 0, ENEMY_LOGO_BASE_SIZE, ENEMY_LOGO_BASE_SIZE);

      // Apply a color tint while preserving the underlying shading by overlaying
      // the desired color with partial alpha. Using source-atop with a reduced
      // alpha keeps the sprite details visible instead of replacing them with
      // a flat silhouette of the tint color (which made some enemies appear as
      // solid yellow blocks).
      tempCtx.globalCompositeOperation = "source-atop";
      tempCtx.globalAlpha = 0.85;
      tempCtx.fillStyle = color;
      tempCtx.fillRect(0, 0, ENEMY_LOGO_BASE_SIZE, ENEMY_LOGO_BASE_SIZE);

      tempCtx.globalAlpha = 1;
      tempCtx.globalCompositeOperation = "source-over";

      prerenderedLogosRef.current[color] = tempCanvas;
      return tempCanvas;
    };

    const playerImg = new Image();
    playerImg.src = "/images/player/main_character.png";
    playerImg.onload = () => {
      gameState.playerImg = playerImg;
      console.log("Player sprite loaded successfully");
    };
    playerImg.onerror = (error) => {
      gameState.playerImg = null;
      console.error("Failed to load player sprite", error);
    };

    const bossImg = new Image();
    bossImg.src = "/images/boss.png";
    bossImg.onload = () => {
      gameState.bossImg = bossImg;
      console.log("Boss sprite loaded successfully");
    };
    bossImg.onerror = (error) => {
      gameState.bossImg = null;
      console.error("Failed to load boss sprite", error);
    };

    // Load base medium zombie image (used for tinting fallbacks)
    const mediumZombieImg = new Image();
    mediumZombieImg.src = "/images/medium_zombie.png";
    mediumZombieImg.onload = () => {
      gameState.mediumZombieImg = mediumZombieImg;
      console.log("Medium zombie loaded successfully");

      // Pre-render colored enemy logos for performance (covers fallback colors)
      const spawnEnemyColors = [
        MEDIUM_ENEMY_COLOR,
        MEDIUM_ELITE_COLOR,
        STRONG_ENEMY_COLOR,
        STRONG_ELITE_COLOR,
        WEAK_ENEMY_COLOR,
        WEAK_ELITE_COLOR,
        FAST_ENEMY_COLOR,
        "#6e6e6e",
        "#ff7a2a",
        "#ff3b3b",
        "#4a4a4a",
      ];

      spawnEnemyColors.forEach((color) => {
        ensureTintedLogo(color);
      });
    };
    mediumZombieImg.onerror = () => {
      console.error("Failed to load medium zombie image");
    };

    // Load all enemy images
    const greenZombieImg = new Image();
    greenZombieImg.src = "/images/green_zombie.png";
    greenZombieImg.onload = () => {
      gameState.greenZombieImg = greenZombieImg;
      console.log("Green zombie loaded successfully");
    };
    greenZombieImg.onerror = () => {
      console.error("Failed to load green zombie image");
    };

    const bomberImg = new Image();
    bomberImg.src = "/images/bomber.png";
    bomberImg.onload = () => {
      gameState.bomberImg = bomberImg;
      console.log("Bomber loaded successfully");
    };
    bomberImg.onerror = () => {
      console.error("Failed to load bomber image");
    };

    const ghoulImg = new Image();
    ghoulImg.src = "/images/ghoul.png";
    ghoulImg.onload = () => {
      gameState.ghoulImg = ghoulImg;
      console.log("Ghoul loaded successfully");
    };
    ghoulImg.onerror = () => {
      console.error("Failed to load ghoul image");
    };

    const hellDogImg = new Image();
    hellDogImg.src = "/images/hell_dog.png";
    hellDogImg.onload = () => {
      gameState.hellDogImg = hellDogImg;
      console.log("Hell dog loaded successfully");
    };
    hellDogImg.onerror = () => {
      console.error("Failed to load hell dog image");
    };

    const purpleZombieImg = new Image();
    purpleZombieImg.src = "/images/purple_zombie.png";
    purpleZombieImg.onload = () => {
      gameState.purpleZombieImg = purpleZombieImg;
      console.log("Purple zombie loaded successfully");
    };
    purpleZombieImg.onerror = () => {
      console.error("Failed to load purple zombie image");
    };

    const larvaImg = new Image();
    larvaImg.src = "/images/larva.png";
    larvaImg.onload = () => {
      gameState.larvaImg = larvaImg;
      console.log("Larva loaded successfully");
    };
    larvaImg.onerror = () => {
      console.error("Failed to load larva image");
    };

    const shieldImg = new Image();
    shieldImg.src = "/images/shield.png";
    shieldImg.onload = () => {
      gameState.shieldImg = shieldImg;
      console.log("Shield loaded successfully");
    };
    shieldImg.onerror = () => {
      console.error("Failed to load shield image");
    };

    const horizonVisorImg = new Image();
    horizonVisorImg.src = "/images/horizon-visor.svg";
    horizonVisorImg.onload = () => {
      gameState.horizonVisorImg = horizonVisorImg;
      console.log("Horizon visor image loaded successfully");
    };
    horizonVisorImg.onerror = () => {
      console.error("Failed to load horizon visor image");
    };

    const chestImg = new Image();
    chestImg.src = "/images/chest.svg";
    chestImg.onload = () => {
      gameState.chestImg = chestImg;
      console.log("Chest image loaded successfully");
    };
    chestImg.onerror = () => {
      console.error("Failed to load chest image");
    };

    // Load map background
    const mapBackground = new Image();
    mapBackground.src = "/images/map1.png";
    mapBackground.onload = () => {
      gameState.mapBackground = mapBackground;
      console.log("Map background loaded successfully");
    };
    mapBackground.onerror = () => {
      console.error("Failed to load map background");
    };

    // Initialize audio manager and preload SFX buffers
    audioManager.initialize();
    audioManager.preloadAllSfx().catch(() => {
      console.warn("Failed to preload SFX buffers");
    });

    // Initialize music system
    const musicListenersCleanup: Array<() => void> = [];

    function initMusic() {
      const musicElement = audioManager.getMusicElement("background");
      if (!musicElement) {
        return;
      }

      gameState.music = musicElement;

      audioManager.setMusicVolume("background", gameState.musicVolume);
      audioManager.setMusicMuted("background", gameState.musicMuted);
      audioManager.setMusicVolume("gameOver", gameState.musicVolume);
      audioManager.setMusicMuted("gameOver", gameState.musicMuted);

      if (musicListenersCleanup.length === 0) {
        musicListenersCleanup.push(
          audioManager.addMusicEventListener("background", "ended", () => {
            if (!gameState.musicStarted) {
              return;
            }
            playNextTrack({ avoidIndex: gameState.currentMusicIndex, resetPosition: true });
          }),
          audioManager.addMusicEventListener("background", "play", () => {
            gameState.musicIsPlaying = true;
          }),
          audioManager.addMusicEventListener("background", "pause", () => {
            const element = audioManager.getMusicElement("background");
            if (element?.ended) {
              return;
            }
            gameState.musicIsPlaying = false;
          }),
        );
      }
    }

    const shuffleIndices = (count: number) => {
      const indices = Array.from({ length: count }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      return indices;
    };

    const ensureMusicQueue = (excludeIndex: number | null) => {
      const trackCount = gameState.musicTracks.length;
      if (trackCount === 0) {
        gameState.musicQueue = [];
        return;
      }
      if (gameState.musicQueue.length === 0) {
        const queue = shuffleIndices(trackCount);
        if (excludeIndex !== null && trackCount > 1 && queue[0] === excludeIndex) {
          const swapIndex = queue.findIndex((idx) => idx !== excludeIndex);
          if (swapIndex > 0) {
            [queue[0], queue[swapIndex]] = [queue[swapIndex], queue[0]];
          }
        }
        gameState.musicQueue = queue;
      }
    };

    const pickNextTrackIndex = (
      options: { forceIndex?: number; avoidIndex?: number | null } = {},
    ) => {
      const trackCount = gameState.musicTracks.length;
      if (trackCount === 0) {
        return null;
      }

      if (options.forceIndex !== undefined) {
        if (options.forceIndex < 0 || options.forceIndex >= trackCount) {
          return null;
        }
        gameState.musicQueue = gameState.musicQueue.filter((idx) => idx !== options.forceIndex);
        return options.forceIndex;
      }

      const avoidIndex = options.avoidIndex ?? (trackCount > 1 ? gameState.currentMusicIndex : null);
      ensureMusicQueue(avoidIndex ?? null);

      if (gameState.musicQueue.length === 0) {
        return avoidIndex ?? 0;
      }

      let nextIndex = gameState.musicQueue.shift()!;
      if (avoidIndex !== null && trackCount > 1 && nextIndex === avoidIndex) {
        const alternative = gameState.musicQueue.find((idx) => idx !== avoidIndex);
        if (alternative !== undefined) {
          gameState.musicQueue = gameState.musicQueue.filter((idx) => idx !== alternative);
          gameState.musicQueue.push(nextIndex);
          nextIndex = alternative;
        }
      }

      return nextIndex;
    };

    const playNextTrack = (
      options: { forceIndex?: number; avoidIndex?: number | null; resetPosition?: boolean } = {},
    ) => {
      if (options.forceIndex !== undefined) {
        gameState.musicQueue = [];
      }

      const nextIndex = pickNextTrackIndex({
        forceIndex: options.forceIndex,
        avoidIndex: options.avoidIndex,
      });

      if (nextIndex === null) {
        return;
      }

      gameState.currentMusicIndex = nextIndex;
      ensureMusicQueue(nextIndex);
      gameState.musicStarted = true;
      playTrackAtCurrentIndex(options.resetPosition ?? true);
    };

    function playTrackAtCurrentIndex(resetPosition: boolean = true) {
      if (!gameState.musicStarted) return;

      const track = gameState.musicTracks[gameState.currentMusicIndex];

      if (!track) {
        return;
      }

      audioManager.stopMusic("background");
      gameState.musicIsPlaying = false;

      audioManager.setMusicVolume("background", gameState.musicVolume);
      audioManager.setMusicMuted("background", gameState.musicMuted);

      audioManager
        .playMusic("background", track.path, { resetPosition, loop: false })
        .then(() => {
          gameState.musicIsPlaying = true;
        })
        .catch((e) => {
          console.warn("Audio play failed:", e);
          gameState.musicIsPlaying = false;
        });

      const element = audioManager.getMusicElement("background");
      gameState.music = element ?? null;
    }

    // Inicializar música pero sin auto-play
    initMusic();

    audioManager.setSfxMuted(gameState.sfxMuted);

    // Sound effect functions
    const playHitSound = () => {
      audioManager.playSfx("hit");
    };
    const playLevelUpSound = () => {
      audioManager.playSfx("level_up");
    };
    const playDeathSound = () => {
      audioManager.playSfx("death");
    };
    const playPowerupSound = () => {
      audioManager.playSfx("pickup");
    };

    type WeaponSoundConfig = {
      fireSounds?: SfxKey[];
      loopSound?: SfxKey;
      loopStopDelay?: number;
      impactSound?: SfxKey | null;
    };

    const weaponSoundConfigs: Record<string, WeaponSoundConfig> = {
      pistol: { fireSounds: ["weapon_pistol"], impactSound: null },
      shotgun: { fireSounds: ["weapon_shotgun"] },
      smg: { fireSounds: ["weapon_smg"] },
      rocket: { fireSounds: ["weapon_rpg"], impactSound: "death" },
      laser: {
        fireSounds: ["weapon_laser_1", "weapon_laser_2", "weapon_laser_3", "weapon_laser_4"],
      },
      railgun: { fireSounds: ["weapon_railgun"] },
      minigun: { loopSound: "weapon_minigun", loopStopDelay: 0.12 },
      electric: { fireSounds: ["weapon_laser_2", "weapon_laser_3", "weapon_laser_4"] },
      flamethrower: { loopSound: "weapon_flamethrower", loopStopDelay: 0.08 },
      frostbow: { fireSounds: ["weapon_bow"] },
      homing: { fireSounds: ["weapon_homing_missile"], impactSound: "death" },
    };

    const playImpactSoundForWeapon = (weaponId?: string, enemyCategories: EnemyCategory[] = []) => {
      const config = weaponId ? weaponSoundConfigs[weaponId] : undefined;

      if (config?.impactSound === null) {
        return;
      }

      if (config?.impactSound) {
        audioManager.playSfx(config.impactSound);
        return;
      }

      const categoryImpact = pickImpactSoundForCategories(enemyCategories);
      if (categoryImpact) {
        audioManager.playSfx(categoryImpact);
      }
    };

    const trackEnemyCategoryHit = (
      enemy: EnemyWithCategory | null | undefined,
      enemyCategories: EnemyCategory[],
    ) => {
      if (!enemy) {
        return;
      }
      const category = (enemy.category as EnemyCategory | undefined) ?? "zombie";
      if (!enemyCategories.includes(category)) {
        enemyCategories.push(category);
      }
    };

    const weaponLastShotTime: Record<string, number> = {};

    const weaponAudioController = {
      onWeaponFired(weaponId: string) {
        const config = weaponSoundConfigs[weaponId];
        if (!config) {
          return;
        }

        if (config.fireSounds?.length) {
          const sounds = config.fireSounds;
          const key = sounds.length === 1 ? sounds[0] : sounds[Math.floor(Math.random() * sounds.length)];
          audioManager.playSfx(key);
        }

        if (config.loopSound) {
          weaponLastShotTime[weaponId] = gameState.time;
          audioManager.playSfx(config.loopSound);
        }
      },
      updateLoopingSounds() {
        const now = gameState.time;
        for (const [weaponId, config] of Object.entries(weaponSoundConfigs)) {
          if (!config.loopSound) continue;
          const lastShot = weaponLastShotTime[weaponId];
          if (lastShot === undefined) continue;

          const threshold = config.loopStopDelay ?? 0.2;
          if (now - lastShot > threshold) {
            delete weaponLastShotTime[weaponId];
            audioManager.stopSfx(config.loopSound);
          }
        }
      },
      stopAllLooping() {
        for (const config of Object.values(weaponSoundConfigs)) {
          if (config.loopSound) {
            audioManager.stopSfx(config.loopSound);
          }
        }
      },
      resetTimers() {
        for (const key of Object.keys(weaponLastShotTime)) {
          delete weaponLastShotTime[key];
        }
      },
    };

    // Game state management
    function endGame() {
      if (gameState.state === "gameover") return; // Ya está en game over

      gameState.state = "gameover";
      gameState.player.hp = 0;
      gameState.gameOverTimer = 0; // No auto-restart, mostrar pantalla de game over

      weaponAudioController.stopAllLooping();
      weaponAudioController.resetTimers();
      playDeathSound();

      // Detener música normal y reproducir música de game over
      audioManager.pauseMusic("background");
      gameState.musicIsPlaying = false;

      if (!gameState.gameOverMusic) {
        gameState.gameOverMusic = audioManager.getMusicElement("gameOver");
      }

      audioManager.setMusicVolume("gameOver", gameState.musicVolume);
      audioManager.setMusicMuted("gameOver", gameState.musicMuted);
      audioManager
        .playMusic("gameOver", "/audio/Summer_Saxophone.mp3", { resetPosition: true, loop: true })
        .catch(() => {});

      console.log("Game Over");
    }

    function resetGame() {
      weaponAudioController.stopAllLooping();
      weaponAudioController.resetTimers();
      setConsoleVisible(false);
      setConsoleOutput([]);

      // Limpiar arrays
      gameState.bullets.length = 0;
      gameState.enemies.length = 0;
      gameState.normalEnemyCount = 0;
      gameState.drops.length = 0;
      gameState.particles.length = 0;
      gameState.hotspots.length = 0;
      gameState.globalEventTimer = 600;
      gameState.bossEncounter = {
        portalSpawned: false,
        bossActive: false,
        bossDefeated: false,
        uniqueBossId: null,
      } as BossEncounterState;
      gameState.bossPortal = null;
      gameState.exitPortal = null;
      gameState.bossFailSafe = {
        spawnTime: 0,
        respawned: false,
        lastHpCheck: 0,
        lastHpValue: 0,
      };
      gameState.postBossSurvival = {
        active: false,
        elapsed: 0,
        nextReward: POST_BOSS_REWARD_INTERVAL,
        rewardsGranted: 0,
        lootBiasBonus: { rare: 0, epic: 0, legendary: 0 },
      };
      gameState.nearbyBossPortal = null;
      gameState.nearbyExitPortal = null;
      gameState.nearbyChest = null;
      gameState.pendingChestDrop = null;
      gameState.chestBanishesRemaining = 3;
      gameState.chestSkipsRemaining = 3;
      gameState.pausedForChest = false;
      gameState.auditLog = createEmptyAuditLog();

      // Resetear jugador
      gameState.worldWidth = Math.max(gameState.worldWidth, Math.max(W, 2200));
      gameState.worldHeight = Math.max(gameState.worldHeight, Math.max(H, 1600));
      gameState.player.x = gameState.worldWidth / 2;
      gameState.player.y = gameState.worldHeight / 2;
      if (gameState.camera) {
        gameState.camera.x = gameState.player.x;
        gameState.camera.y = gameState.player.y;
      }
      gameState.player.hp = 100;
      gameState.player.maxhp = 100;
      gameState.player.stamina = 20;
      gameState.player.maxStamina = 20;
      gameState.player.isSprinting = false;
      gameState.player.shotsFired = 0;
      gameState.player.shield = 0;
      gameState.player.ifr = 0;
      gameState.player.magnet = 120;
      gameState.player.rageTimer = 0;
      gameState.player.tempMagnetTimer = 0;
      gameState.player.tempShieldTimer = 0;
      gameState.player.weapons = [{ ...WEAPONS[0] }];
      gameState.player.tomes = [];
      gameState.player.items = [];
      gameState.player.itemStacks = {};
      gameState.player.stats = {
        damageMultiplier: 1,
        speedMultiplier: 1,
        rangeMultiplier: 1,
        fireRateMultiplier: 1,
        bounces: 0,
        multishot: 0,
        auraRadius: 0,
        vampire: 0,
        xpMultiplier: 1,
        precision: 0,
        regenRate: 0,
        regenInterval: 0,
        magnetMultiplier: 1,
        cameraZoomMultiplier: 1,
        bounceOnEnemies: false,
        damageReduction: 0,
        powerupDuration: 1,
        xpBonus: 0,
        firstHitImmuneChargesUsed: 0,
        chaosDamage: false,
        solarGauntletKills: 0,
        bloodstoneKills: 0,
        reactiveShieldActive: false,
        sprintEfficiencyMultiplier: 1,
        sprintRecoveryMultiplier: 1,
        adrenalineStacks: 0,
        adrenalineSpeedBonus: 0,
        adrenalineDamageBonus: 0,
        adrenalineThreshold: 0,
        droneAttackLevel: 0,
        droneSupportLevel: 0,
        droneShieldLevel: 0,
      };

      // Resetear juego
      gameState.score = 0;
      gameState.level = 1;
      gameState.xp = 0;
      gameState.xpDisplay = 0;
      gameState.xpDisplayTarget = 0;
      gameState.nextXP = 25;
      gameState.nextXpDisplay = 25;
      gameState.nextXpDisplayTarget = 25;
      gameState.time = 0;
      gameState.elapsedTime = 0;
      gameState.difficulty = createInitialDifficultyState();
      gameState.difficulty.api = difficultyApi;
      gameState.maxConcurrentEnemies = 12;
      gameState.lastSpawn = 0;
      gameState.spawnCooldown = 0;
      gameState.canSpawn = true;
      gameState.weaponCooldowns = {};
      gameState.regenTimer = 0;
      gameState.droneAttackCooldown = 0;
      gameState.droneSupportCooldown = 0;
      gameState.droneShieldCooldown = 0;
      gameState.auraTimer = 0;
      gameState.hotspotTimer = 0;
      gameState.dangerZoneTimer = 0;
      gameState.inDangerZone = false;
      gameState.levelUpAnimation = 0;
      gameState.upgradeAnimation = 0;
      gameState.xpBarRainbow = false;
      gameState.difficulty.notification = 0;
      gameState.minimapOpacity = 0;
      gameState.minimapDetailLevel = 0;
      gameState.minimapHeading = 0;
      gameState.itemNotification = "";
      gameState.itemNotificationTimer = 0;
      gameState.musicMuted = false;
      gameState.sfxMuted = false;
      audioManager.setMusicMuted("background", false);
      audioManager.setMusicMuted("gameOver", false);
      audioManager.setSfxMuted(false);
      audioManager.setMusicVolume("background", gameState.musicVolume);
      audioManager.setMusicVolume("gameOver", gameState.musicVolume);
      gameState.pauseMenuAudioOpen = false;
      gameState.restartTimer = 0;
      gameState.showUpgradeUI = false;
      gameState.upgradeOptions = [];
      gameState.environmentalEvent = null;
      gameState.eventNotification = 0;
      gameState.eventDuration = 0;
      gameState.eventTimer = 0;
      gameState.eventPhase = "none";
      gameState.eventIntensity = 0;
      gameState.eventActivatedThisTier = false;
      gameState.lightningTimer = 0;
      gameState.fogOpacity = 0;
      gameState.fogZones = [];
      gameState.fogWarningZones = [];
      gameState.stormZone = null;

      if (gameState.camera) {
        gameState.camera.zoom = getTargetCameraZoom();
      }

      // Reset tutorial
      gameState.tutorialActive = true;
      gameState.tutorialStartTime = performance.now();
      setTutorialStep(0);
      setTutorialCompleted(false);

      // Actualizar React state
      setScore(0);
      setLevel(1);

      // Reset timers/flags
      gameState.gameOverTimer = 0;

      // Cambiar a running
      gameState.state = "running";

      audioManager.stopMusic("gameOver");
      gameState.gameOverMusic = audioManager.getMusicElement("gameOver");
      if (gameState.musicStarted) {
        const backgroundElement = audioManager.getMusicElement("background");
        gameState.music = backgroundElement ?? null;
        audioManager.setMusicMuted("background", gameState.musicMuted);
        audioManager.setMusicVolume("background", gameState.musicVolume);

        if (!gameState.musicMuted) {
          if (backgroundElement && backgroundElement.paused) {
            audioManager
              .resumeMusic("background")
              .then(() => {
                gameState.musicIsPlaying = true;
              })
              .catch(() => {
                gameState.musicIsPlaying = false;
              });
          } else {
            gameState.musicIsPlaying = Boolean(backgroundElement && !backgroundElement.paused);
          }
        } else {
          gameState.musicIsPlaying = false;
        }
      }
    }

    // Exponer resetGame al ref para usarlo desde el JSX
    resetGameRef.current = resetGame;

    function activateBossPortal() {
      const portal = gameState.bossPortal;
      if (!portal || portal.activated || !portal.active) {
        return;
      }

      portal.activated = true;
      portal.interactable = false;
      portal.status = "spawningBoss";
      portal.bossSpawnAt = gameState.time + PORTAL_BOSS_SPAWN_DELAY;
      portal.activationProgress = 1;

      spawnPortalActivationEffects(portal.x, portal.y, PORTAL_GLOW_COLORS.boss);
    }

    function enterExitPortal() {
      const portal = gameState.exitPortal;
      if (!portal || !portal.active) {
        return;
      }

      portal.active = false;
      gameState.exitPortal = null;
      gameState.postBossSurvival.active = false;
      endGame();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "º" || e.key === "§") {
        e.preventDefault();
        if (consoleVisibleRef.current) {
          setConsoleVisible(false);
        } else {
          setConsoleVisible(true);
        }
        return;
      }

      if (consoleVisibleRef.current) {
        if (e.key === "Escape") {
          e.preventDefault();
          setConsoleVisible(false);
        }
        return;
      }

      gameState.keys[e.key.toLowerCase()] = true;

      if (gameState.state === "running" && e.key.toLowerCase() === "e") {
        if (gameState.nearbyBossPortal) {
          e.preventDefault();
          return;
        }
        if (gameState.nearbyExitPortal) {
          e.preventDefault();
          enterExitPortal();
          return;
        }
      }

      // Game Over: Enter para reiniciar inmediatamente
      if (gameState.state === "gameover" && (e.key === "Enter" || e.key === "r" || e.key === "R")) {
        audioManager.stopMusic("gameOver");
        gameState.gameOverMusic = audioManager.getMusicElement("gameOver");
        resetGame();
        return;
      }

      // Running: Sostener R para reiniciar (modo hold)
      if (gameState.state === "running" && e.key.toLowerCase() === "r") {
        // R key ya está siendo presionada, no hacer nada aquí
      }

      // Escape para pausar/reanudar (solo en running o paused)
      if (e.key === "Escape" && gameState.state !== "gameover") {
        if (gameState.state === "running") {
          gameState.state = "paused";
          gameState.pauseMenuTab = "home";
          gameState.pauseMenuAudioOpen = false;
          audioManager.stopAllSfx();
          weaponAudioController.stopAllLooping();
          weaponAudioController.resetTimers();
          PAUSE_MENU_TABS.forEach((tab) => {
            gameState.pauseMenuScroll[tab] = 0;
          });
        } else if (gameState.state === "paused" && gameState.countdownTimer > 0) {
          gameState.countdownTimer = 0;
        } else if (
          gameState.state === "paused" &&
          !gameState.showUpgradeUI &&
          !gameState.pausedForChest &&
          !gameState.activeChestChoice
        ) {
          // Iniciar countdown de 3 segundos
          gameState.countdownTimer = 3;
          gameState.pauseMenuAudioOpen = false;
        }
      }

      if (e.key.toLowerCase() === "n") {
        gameState.player.nightVisionActive = !gameState.player.nightVisionActive;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.keys[e.key.toLowerCase()] = false;
    };

    const handleResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
      const overlayCanvasEl = overlayCanvasRef.current;
      if (overlayCanvasEl) {
        overlayCanvasEl.width = W;
        overlayCanvasEl.height = H;
        overlayCanvasEl.style.width = `${W}px`;
        overlayCanvasEl.style.height = `${H}px`;
      }
      if (gameState.player) {
        gameState.worldWidth = Math.max(gameState.worldWidth, Math.max(W, 2200));
        gameState.worldHeight = Math.max(gameState.worldHeight, Math.max(H, 1600));
        gameState.player.x = clamp(
          gameState.player.x,
          gameState.player.rad,
          gameState.worldWidth - gameState.player.rad,
        );
        gameState.player.y = clamp(
          gameState.player.y,
          gameState.player.rad,
          gameState.worldHeight - gameState.player.rad,
        );
      }
      if (gameState.camera) {
        const targetZoom = getTargetCameraZoom();
        gameState.camera.zoom = targetZoom;
        const { halfViewW, halfViewH } = getCameraViewExtents(W, H, targetZoom);
        const maxX = Math.max(halfViewW, gameState.worldWidth - halfViewW);
        const maxY = Math.max(halfViewH, gameState.worldHeight - halfViewH);
        gameState.camera.x = clamp(gameState.camera.x, halfViewW, maxX);
        gameState.camera.y = clamp(gameState.camera.y, halfViewH, maxY);
      }
      if (overlaySupportedRef.current && overlayWorkerRef.current) {
        overlayWorkerRef.current.postMessage({ type: "resize", width: W, height: H });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", handleResize);

    // Funciones del juego
    const DEFAULT_SPAWN_DISTANCE_MIN = 450;
    const DEFAULT_SPAWN_DISTANCE_MAX = 650;
    const RESPAWN_DISTANCE_MIN = 320;
    const RESPAWN_DISTANCE_MAX = 480;
    const MAX_DISTANCE_FROM_PLAYER = 1200;
    const MAX_DISTANCE_FROM_PLAYER_SQ = MAX_DISTANCE_FROM_PLAYER * MAX_DISTANCE_FROM_PLAYER;

    function getSpawnPositionAroundPlayer(
      enemyRadius: number,
      options: { minDistance?: number; maxDistance?: number } = {},
    ) {
      const worldW = gameState.worldWidth;
      const worldH = gameState.worldHeight;
      const player = gameState.player;
      const margin = enemyRadius + 10;
      const minDistance = options.minDistance ?? DEFAULT_SPAWN_DISTANCE_MIN;
      const maxDistance = Math.max(minDistance, options.maxDistance ?? DEFAULT_SPAWN_DISTANCE_MAX);

      if (!player) {
        return {
          x: clamp(worldW / 2, margin, worldW - margin),
          y: clamp(worldH / 2, margin, worldH - margin),
        };
      }

      for (let attempt = 0; attempt < 8; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = minDistance + Math.random() * (maxDistance - minDistance);
        const x = player.x + Math.cos(angle) * distance;
        const y = player.y + Math.sin(angle) * distance;

        if (x >= margin && x <= worldW - margin && y >= margin && y <= worldH - margin) {
          return { x, y };
        }
      }

      const fallbackAngle = Math.random() * Math.PI * 2;
      const fallbackDistance = minDistance;
      let fallbackX = player ? player.x + Math.cos(fallbackAngle) * fallbackDistance : worldW / 2;
      let fallbackY = player ? player.y + Math.sin(fallbackAngle) * fallbackDistance : worldH / 2;

      fallbackX = clamp(fallbackX, margin, worldW - margin);
      fallbackY = clamp(fallbackY, margin, worldH - margin);

      return { x: fallbackX, y: fallbackY };
    }

    function spawnEnemy() {
      // Horde Totem: +1 enemigo adicional spawn
      const hordeStacks = gameState.player.itemStacks.hordetotem ?? 0;
      const spawnCount = 1 + hordeStacks;

      const difficultyLevel = gameState.difficulty.level;

      for (let spawnIdx = 0; spawnIdx < spawnCount; spawnIdx++) {
        const roll = Math.random();
        const typeRoll = Math.random();
        let enemyType: "strong" | "medium" | "weak" | "explosive" | "fast" | "tank" | "summoner";
        let color: string;
        let damage: number;
        let baseHp: number;
        let rad: number;
        let spd: number;
        let isElite = false;
        let specialType: "explosive" | "fast" | "tank" | "summoner" | null = null;

        // Tipos especiales de enemigos (escalado por dificultad creciente)
        let specialChance = 0;
        if (difficultyLevel <= 3) {
          specialChance = 0.05;
        } else if (difficultyLevel <= 7) {
          specialChance = 0.15;
        } else if (difficultyLevel <= 12) {
          specialChance = 0.25;
        } else if (difficultyLevel <= 18) {
          specialChance = 0.35;
        } else {
          specialChance = 0.45;
        }

        if (typeRoll < specialChance) {
          const specialRoll = Math.random();
          if (specialRoll < 0.25) {
            specialType = "explosive";
            enemyType = "explosive";
            color = "#ef4444";
            // NUEVO: Zombie Bomber - daño base MUY alto
            let bomberBaseDamage = 30;
            // Escalado agresivo del bomber por dificultad
            if (difficultyLevel <= 5) {
              bomberBaseDamage = 20 + difficultyLevel * 3; // 23-35
            } else if (difficultyLevel <= 10) {
              bomberBaseDamage = 35 + (difficultyLevel - 5) * 5; // 40-65
            } else if (difficultyLevel <= 15) {
              bomberBaseDamage = 65 + (difficultyLevel - 10) * 7; // 72-100
            } else if (difficultyLevel <= 20) {
              bomberBaseDamage = 100 + (difficultyLevel - 15) * 16; // 116-180
            } else {
              bomberBaseDamage = 180 + (difficultyLevel - 20) * 20; // 200+
            }
            damage = Math.floor(bomberBaseDamage * 0.8);
            baseHp = 2;
            rad = EXPLOSIVE_ENEMY_BASE_RADIUS;
            spd = 1.8 * 0.85;
          } else if (specialRoll < 0.5) {
            specialType = "fast";
            enemyType = "fast";
            color = FAST_ENEMY_COLOR;
            damage = 3;
            baseHp = 1;
            rad = FAST_ENEMY_BASE_RADIUS;
            spd = 2.5;
          } else if (specialRoll < 0.75) {
            specialType = "tank";
            enemyType = "tank";
            color = "#78716c";
            damage = 20;
            baseHp = 15;
            rad = TANK_ENEMY_BASE_RADIUS;
            spd = 0.6;
          } else {
            specialType = "summoner";
            enemyType = "summoner";
            color = MEDIUM_ENEMY_COLOR;
            damage = 5;
            baseHp = 8;
            rad = SUMMONER_ENEMY_BASE_RADIUS;
            spd = 0.9;
          }
        } else {
          // Enemigos normales
          specialType = null;

          // Progresión detallada por dificultad
          if (difficultyLevel === 1) {
            // Wave 1: Solo verdes
            enemyType = "weak";
            color = WEAK_ENEMY_COLOR;
            damage = 5;
            baseHp = 3;
            rad = WEAK_ENEMY_BASE_RADIUS;
            spd = 1.3;
          } else if (difficultyLevel === 2) {
            // Wave 2: Mayoría verdes, algunos morados (≤10%)
            if (roll < 0.9) {
              enemyType = "weak";
              color = WEAK_ENEMY_COLOR;
              damage = 5;
              baseHp = 3;
              rad = WEAK_ENEMY_BASE_RADIUS;
              spd = 1.3;
            } else {
              enemyType = "medium";
              color = MEDIUM_ENEMY_COLOR;
              damage = 10;
              baseHp = 5;
              rad = MEDIUM_ENEMY_BASE_RADIUS;
              spd = 1.1;
            }
          } else if (difficultyLevel === 3) {
            // Wave 3: Mezcla verde/morado (20-30% morado)
            if (roll < 0.75) {
              enemyType = "weak";
              color = WEAK_ENEMY_COLOR;
              damage = 5;
              baseHp = 3;
              rad = WEAK_ENEMY_BASE_RADIUS;
              spd = 1.3;
            } else {
              enemyType = "medium";
              color = MEDIUM_ENEMY_COLOR;
              damage = 10;
              baseHp = 5;
              rad = MEDIUM_ENEMY_BASE_RADIUS;
              spd = 1.1;
            }
          } else if (difficultyLevel === 4) {
            // Wave 4: Más morado (30-40%)
            if (roll < 0.65) {
              enemyType = "weak";
              color = WEAK_ENEMY_COLOR;
              damage = 5;
              baseHp = 3;
              rad = WEAK_ENEMY_BASE_RADIUS;
              spd = 1.3;
            } else {
              enemyType = "medium";
              color = MEDIUM_ENEMY_COLOR;
              damage = 10;
              baseHp = 5;
              rad = MEDIUM_ENEMY_BASE_RADIUS;
              spd = 1.1;
            }
          } else if (difficultyLevel === 5) {
            // Wave 5: Introducir amarillo (3-5%)
            if (roll < 0.04) {
              enemyType = "strong";
              color = STRONG_ENEMY_COLOR;
              damage = 20;
              baseHp = 8;
              rad = STRONG_ENEMY_BASE_RADIUS;
              spd = 0.9;
            } else if (roll < 0.6) {
              enemyType = "medium";
              color = MEDIUM_ENEMY_COLOR;
              damage = 10;
              baseHp = 5;
              rad = MEDIUM_ENEMY_BASE_RADIUS;
              spd = 1.1;
            } else {
              enemyType = "weak";
              color = WEAK_ENEMY_COLOR;
              damage = 5;
              baseHp = 3;
              rad = WEAK_ENEMY_BASE_RADIUS;
              spd = 1.3;
            }
          } else if (difficultyLevel === 6) {
            // Wave 6: Mezcla estable 50/40/10%
            if (roll < 0.1) {
              enemyType = "strong";
              color = STRONG_ENEMY_COLOR;
              damage = 20;
              baseHp = 8;
              rad = STRONG_ENEMY_BASE_RADIUS;
              spd = 0.9;
            } else if (roll < 0.5) {
              enemyType = "medium";
              color = MEDIUM_ENEMY_COLOR;
              damage = 10;
              baseHp = 5;
              rad = MEDIUM_ENEMY_BASE_RADIUS;
              spd = 1.1;
            } else {
              enemyType = "weak";
              color = WEAK_ENEMY_COLOR;
              damage = 5;
              baseHp = 3;
              rad = WEAK_ENEMY_BASE_RADIUS;
              spd = 1.3;
            }
          } else if (difficultyLevel === 7) {
            // Wave 7: Amarillos hasta 12-15%
            if (roll < 0.13) {
              enemyType = "strong";
              color = STRONG_ENEMY_COLOR;
              damage = 20;
              baseHp = 8;
              rad = STRONG_ENEMY_BASE_RADIUS;
              spd = 0.9;
            } else if (roll < 0.6) {
              enemyType = "medium";
              color = MEDIUM_ENEMY_COLOR;
              damage = 10;
              baseHp = 5;
              rad = MEDIUM_ENEMY_BASE_RADIUS;
              spd = 1.1;
            } else {
              enemyType = "weak";
              color = WEAK_ENEMY_COLOR;
              damage = 5;
              baseHp = 3;
              rad = WEAK_ENEMY_BASE_RADIUS;
              spd = 1.3;
            }
          } else {
            // Wave 8+: Escalado progresivo (amarillos hasta 25-30%)
            const yellowChance = Math.min(0.3, 0.15 + (difficultyLevel - 8) * 0.02);

            if (roll < strongChance) {
              enemyType = "strong";
              color = STRONG_ENEMY_COLOR;
              damage = 20;
              baseHp = 8;
              rad = STRONG_ENEMY_BASE_RADIUS;
              spd = 0.9;
            } else if (roll < strongChance + 0.45) {
              enemyType = "medium";
              color = MEDIUM_ENEMY_COLOR;
              damage = 10;
              baseHp = 5;
              rad = MEDIUM_ENEMY_BASE_RADIUS;
              spd = 1.1;
            } else {
              enemyType = "weak";
              color = WEAK_ENEMY_COLOR;
              damage = 5;
              baseHp = 3;
              rad = WEAK_ENEMY_BASE_RADIUS;
              spd = 1.3;
            }

            // Posibilidad de enemigos élite (5% chance en dificultad 8+)
            if (Math.random() < 0.05) {
              isElite = true;
              baseHp *= 1.5;
              rad += 3;
              color =
                enemyType === "strong"
                  ? STRONG_ELITE_COLOR
                  : enemyType === "medium"
                    ? MEDIUM_ELITE_COLOR
                    : WEAK_ELITE_COLOR;
            }
            const survivalEliteBonus = gameState.postBossSurvival.active
              ? (gameState.postBossSurvival.elapsed / 60) * POST_BOSS_ELITE_CHANCE_PER_MIN
              : 0;
            const eliteChance = Math.min(0.35, 0.05 + survivalEliteBonus);
            if (!isElite && Math.random() < eliteChance) {
              isElite = true;
              baseHp *= 1.35;
              color =
                enemyType === "strong"
                  ? STRONG_ELITE_COLOR
                  : enemyType === "medium"
                    ? MEDIUM_ELITE_COLOR
                    : WEAK_ELITE_COLOR;
            }
          }

          // Escalado de dificultad estilo COD Zombies - Velocidad
          let speedScale = 1;
          if (difficultyLevel <= 10) {
            speedScale = 1 + (difficultyLevel - 1) * 0.03;
          } else if (difficultyLevel <= 20) {
            speedScale = 1 + (difficultyLevel - 1) * 0.05;
          } else {
            speedScale = Math.min(3, 1 + (difficultyLevel - 1) * 0.07); // Cap en +200%
          }

          // Escalado de daño - NUEVO SISTEMA POST-WAVE 13
          let damageScale = 1;
          if (difficultyLevel <= 5) {
            damageScale = 1.0; // Base
          } else if (difficultyLevel <= 10) {
            damageScale = 1.3; // +30%
          } else if (difficultyLevel <= 13) {
            damageScale = 1.6; // +60%
          } else if (difficultyLevel <= 17) {
            damageScale = 2.0; // +100% (doble)
          } else if (difficultyLevel <= 21) {
            damageScale = 2.5; // +150%
          } else {
            damageScale = 3.0; // +200% (triple)
          }

          spd *= speedScale;
          spd = applyEnemySpeedModifier(spd);
          // IMPORTANTE: NO escalar daño de bombers otra vez (ya escalaron arriba)
          if (specialType !== "explosive") {
            damage = Math.floor(damage * damageScale);
          }
        }

        // HP scaling estilo COD Zombies - Escalado exponencial
        let hpMultiplier = 1;
        if (difficultyLevel <= 5) {
          hpMultiplier = 1 + (difficultyLevel - 1) * 0.2;
        } else if (difficultyLevel <= 15) {
          hpMultiplier = 1 + (difficultyLevel - 1) * 0.35;
        } else {
          hpMultiplier = 1 + (difficultyLevel - 1) * 0.5;
        }
        const scaledHp = Math.floor(baseHp * hpMultiplier);
        rad = scaleEnemyRadius(rad);

        const spawnPos = getSpawnPositionAroundPlayer(rad);

        const enemy: EnemyWithCategory = {
          x: spawnPos.x + (Math.random() - 0.5) * 20,
          y: spawnPos.y + (Math.random() - 0.5) * 20,
          rad,
          hp: scaledHp,
          maxhp: scaledHp,
          spd,
          category: inferEnemyCategory({ specialType }),
          enemyType,
          damage,
          isElite,
          isBoss: false,
          color,
          specialType,
          frozenTimer: 0,
          burnTimer: 0,
          poisonTimer: 0,
          summonCooldown: 0,
          // Bomber-specific properties
          explosionTimer: specialType === "explosive" ? -1 : undefined, // -1 = no activado, >= 0 = contando
          explosionDelay: specialType === "explosive" ? (Math.random() < 0.5 ? 0 : 1) : undefined, // 50% instant, 50% 1s delay
          acceleration: specialType === "explosive" ? 0.9 : undefined,
          currentSpeed: specialType === "explosive" ? 0 : undefined,
          allyAvoidanceRadius: specialType === "explosive" ? 140 : undefined,
        };

        gameState.enemies.push(enemy);
        if (!enemy.isBoss) {
          gameState.normalEnemyCount++;
        }
      }
    }

    function spawnBoss() {
      const bossRad = scaleEnemyRadius(40);
      const { x, y } = getSpawnPositionAroundPlayer(bossRad, {
        minDistance: DEFAULT_SPAWN_DISTANCE_MAX,
        maxDistance: DEFAULT_SPAWN_DISTANCE_MAX + 200,
      });

      // Boss HP escalado agresivo estilo COD Zombies
      const baseHp = 150;
      const difficultyLevel = gameState.difficulty.level;
      const bossHpMultiplier = 1 + (difficultyLevel - 1) * 3; // Mucho más tanque
      const scaledHp = Math.floor(baseHp * bossHpMultiplier);

      const boss: EnemyWithCategory = {
        x,
        y,
        rad: bossRad,
        hp: scaledHp,
        maxhp: scaledHp,
        spd: applyEnemySpeedModifier(0.8),
        category: inferEnemyCategory({}),
        enemyType: "strong",
        damage: 30,
        isElite: false,
        isBoss: true,
        color: BOSS_COLOR,
        specialType: null,
        frozenTimer: 0,
        burnTimer: 0,
        poisonTimer: 0,
        phase: 1,
        attackCooldown: 0,
        jumpCooldown: 0,
        projectileCooldown: 0,
      };

      gameState.enemies.push(boss);
    }

    function spawnMiniBoss() {
      const miniBossRad = scaleEnemyRadius(28);
      const { x, y } = getSpawnPositionAroundPlayer(miniBossRad, {
        minDistance: DEFAULT_SPAWN_DISTANCE_MAX - 50,
        maxDistance: DEFAULT_SPAWN_DISTANCE_MAX + 120,
      });

      // Mini-boss HP escalado estilo COD Zombies
      const baseHp = 25;
      const difficultyLevel = gameState.difficulty.level;
      const miniBossHpMultiplier = 1 + (difficultyLevel - 1) * 2; // Más tanque que antes
      const scaledHp = Math.floor(baseHp * miniBossHpMultiplier);

      const miniBoss: EnemyWithCategory = {
        x,
        y,
        rad: miniBossRad,
        hp: scaledHp,
        maxhp: scaledHp,
        spd: applyEnemySpeedModifier(1.0),
        category: inferEnemyCategory({}),
        isElite: false,
        isMiniBoss: true,
        color: "#ffc300",
        damage: Math.floor(25 * (1 + (difficultyLevel - 1) * 0.05)),
      };

      gameState.enemies.push(miniBoss);
    }

    function spawnBossPortal() {
      if (gameState.bossEncounter.portalSpawned || gameState.bossPortal || gameState.bossEncounter.bossDefeated) {
        return;
      }

      const angle = Math.random() * Math.PI * 2;
      const distance = 220;
      const margin = 80;
      const rawX = gameState.player.x + Math.cos(angle) * distance;
      const rawY = gameState.player.y + Math.sin(angle) * distance;
      const x = clamp(rawX, margin, gameState.worldWidth - margin);
      const y = clamp(rawY, margin, gameState.worldHeight - margin);

      const portal: GamePortal = {
        x,
        y,
        rad: 48,
        type: "boss",
        active: true,
        activated: false,
        spawnTime: gameState.time,
        status: "awaitingActivation",
        activationProgress: 0,
        activationHoldSeconds: PORTAL_ACTIVATION_HOLD_SECONDS,
        bossSpawnAt: null,
        interactable: true,
      };

      gameState.bossPortal = portal;
      gameState.bossEncounter.portalSpawned = true;
      gameState.bossEncounter.bossDefeated = false;
      gameState.postBossSurvival.active = false;
      gameState.globalEventTimer = 0;
    }

    function spawnUniqueBoss() {
      const bossRad = scaleEnemyRadius(44);
      const { x, y } = getSpawnPositionAroundPlayer(bossRad, {
        minDistance: DEFAULT_SPAWN_DISTANCE_MAX - 80,
        maxDistance: DEFAULT_SPAWN_DISTANCE_MAX + 200,
      });

      const uniqueBossId = `unique-boss-${Date.now()}`;
      const boss: EnemyWithCategory = {
        x,
        y,
        rad: bossRad,
        hp: 1500,
        maxhp: 1500,
        spd: applyEnemySpeedModifier(0.85),
        category: inferEnemyCategory({}),
        enemyType: "strong",
        damage: 32,
        isElite: false,
        isMiniBoss: false,
        isBoss: true,
        color: "#7c3aed",
        specialType: null,
        frozenTimer: 0,
        burnTimer: 0,
        poisonTimer: 0,
        phase: 1,
        attackCooldown: 0,
        jumpCooldown: 0,
        projectileCooldown: 0,
        isUniqueBoss: true,
        uniqueBossId,
      } as EnemyWithCategory & { isUniqueBoss: true; uniqueBossId: string };

      gameState.enemies.push(boss);
      gameState.bossEncounter.bossActive = true;
      gameState.bossEncounter.uniqueBossId = uniqueBossId;
      gameState.lastBossSpawn = gameState.elapsedTime;
      gameState.bossFailSafe = {
        spawnTime: gameState.time,
        respawned: gameState.bossFailSafe?.respawned ?? false,
        lastHpCheck: gameState.time,
        lastHpValue: boss.hp,
      };
    }

    function spawnExitPortal(position?: { x: number; y: number }) {
      if (gameState.exitPortal) {
        return;
      }

      const margin = 80;
      const x = clamp(position?.x ?? gameState.player.x, margin, gameState.worldWidth - margin);
      const y = clamp(position?.y ?? gameState.player.y, margin, gameState.worldHeight - margin);

      const portal: GamePortal = {
        x,
        y,
        rad: 52,
        type: "exit",
        active: true,
        spawnTime: gameState.time,
        status: "open",
        activationProgress: 0,
        activationHoldSeconds: PORTAL_ACTIVATION_HOLD_SECONDS,
        interactable: true,
      };

      gameState.exitPortal = portal;
    }

    const computeExplosionFalloff = (distance: number) => {
      if (distance >= EXPLODER_OUTER_RADIUS) return 0;
      if (distance <= EXPLODER_INNER_RADIUS) return 1;
      const normalized =
        (distance - EXPLODER_INNER_RADIUS) /
        Math.max(EXPLODER_OUTER_RADIUS - EXPLODER_INNER_RADIUS, 1);
      return 1 - normalized * (1 - EXPLODER_OUTER_MULTIPLIER);
    };

    function spawnShockwaveExplosion(
      x: number,
      y: number,
      radius: number,
      {
        primary = "#ff7a2a",
        secondary = "#facc15",
        debrisColor = "rgba(90, 99, 109, 0.9)",
        emberColor = "rgba(255, 147, 65, 0.8)",
        distortion = 0.3,
        debrisCount = 24,
        emberCount = 48,
      }: {
        primary?: string;
        secondary?: string;
        debrisColor?: string;
        emberColor?: string;
        distortion?: number;
        debrisCount?: number;
        emberCount?: number;
      } = {},
    ) {
      const slotsNeeded = debrisCount + emberCount + 4;
      if (gameState.particles.length > gameState.maxParticles - slotsNeeded) {
        return;
      }

      gameState.particles.push({
        x,
        y,
        life: 0.32,
        maxLife: 0.32,
        radius,
        maxRadius: radius,
        size: radius * 0.3,
        style: "shockwave",
        opacity: 0.9,
        distortion,
      });

      for (let i = 0; i < debrisCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 6 + Math.random() * 8;
        gameState.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.9 + Math.random() * 0.4,
          color: debrisColor,
          size: 3 + Math.random() * 2,
          style: "debris",
        });
      }

      for (let i = 0; i < emberCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 2;
        gameState.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.7,
          life: 0.6 + Math.random() * 0.4,
          color: emberColor,
          size: 2 + Math.random() * 1.5,
          style: "ember",
        });
      }

      gameState.particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        life: 0.4,
        color: secondary,
        size: radius * 0.12,
        style: "heat",
        opacity: 0.4,
      });

      gameState.particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        life: 0.26,
        color: primary,
        size: radius * 0.08,
        style: "core",
        opacity: 0.7,
      });
    }

    function spawnPortalActivationEffects(x: number, y: number, color: string) {
      spawnShockwaveExplosion(x, y, EXPLODER_OUTER_RADIUS * 0.85, {
        primary: color,
        secondary: hexToRgba(color, 0.5),
        debrisColor: hexToRgba(color, 0.35),
        emberColor: hexToRgba(color, 0.6),
        distortion: 0.45,
        debrisCount: 18,
        emberCount: 32,
      });

      for (let i = 0; i < 28 && gameState.particles.length < gameState.maxParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 2;
        gameState.particles.push({
          x: x + Math.cos(angle) * 12,
          y: y + Math.sin(angle) * 12,
          vx: Math.cos(angle + Math.PI / 2) * speed,
          vy: Math.sin(angle + Math.PI / 2) * speed,
          life: 0.8 + Math.random() * 0.3,
          color: hexToRgba(color, 0.75),
          size: 3,
        });
      }
    }

    function resolveExploderExplosion(enemy: any, dt = 0.016) {
      const originX = enemy.x;
      const originY = enemy.y;
      const explosionDamage = enemy.damage ?? 0;
      const victims: any[] = [];

      const distToPlayer = Math.hypot(originX - gameState.player.x, originY - gameState.player.y);
      if (distToPlayer < EXPLODER_OUTER_RADIUS) {
        const falloff = computeExplosionFalloff(distToPlayer);
        if (falloff > 0 && gameState.player.ifr <= 0) {
          const finalDamage = explosionDamage * falloff * EXPLODER_PLAYER_DAMAGE_MULTIPLIER;
          if (gameState.player.shield > 0) {
            gameState.player.shield--;
          } else {
            const reducedDamage = finalDamage * (1 - gameState.player.stats.damageReduction);
            gameState.player.hp = Math.max(0, gameState.player.hp - reducedDamage);
            const knockbackForce = EXPLODER_RAGDOLL_FORCE;
            const angle = Math.atan2(gameState.player.y - originY, gameState.player.x - originX);
            const displacement = knockbackForce * falloff * dt * 6;
            gameState.player.x += Math.cos(angle) * displacement;
            gameState.player.y += Math.sin(angle) * displacement;
            gameState.player.x = Math.max(
              gameState.player.rad,
              Math.min(gameState.worldWidth - gameState.player.rad, gameState.player.x),
            );
            gameState.player.y = Math.max(
              gameState.player.rad,
              Math.min(gameState.worldHeight - gameState.player.rad, gameState.player.y),
            );
            if (gameState.player.hp <= 0) {
              endGame();
            }
          }
          gameState.player.ifr = gameState.player.ifrDuration;
        }
      }

      const impactedEnemies = [...gameState.enemies];
      for (const otherEnemy of impactedEnemies) {
        if (!otherEnemy || otherEnemy === enemy || (otherEnemy as any).__removed) continue;
        const distToEnemy = Math.hypot(originX - otherEnemy.x, originY - otherEnemy.y);
        if (distToEnemy >= EXPLODER_OUTER_RADIUS) continue;
        const falloff = computeExplosionFalloff(distToEnemy);
        if (falloff <= 0) continue;
        otherEnemy.hp -= explosionDamage * falloff;
        if (distToEnemy > 0) {
          const push = (EXPLODER_RAGDOLL_FORCE * falloff) / Math.max(distToEnemy, 1) * 0.6;
          otherEnemy.x += (otherEnemy.x - originX) * push * 0.01;
          otherEnemy.y += (otherEnemy.y - originY) * push * 0.01;
        }
        if (otherEnemy.hp <= 0) {
          victims.push(otherEnemy);
        }
      }

      spawnShockwaveExplosion(originX, originY, EXPLODER_OUTER_RADIUS, {
        primary: "#ff7a2a",
        secondary: "rgba(255, 208, 110, 0.85)",
        emberColor: "rgba(255, 138, 76, 0.8)",
        debrisColor: "rgba(70, 60, 55, 0.9)",
      });

      gameState.explosionMarks.push({
        x: originX,
        y: originY,
        radius: EXPLODER_OUTER_RADIUS * 0.7,
        life: 3.5,
      });

      audioManager.playSfx("death", { volume: 1 });

      for (const victim of victims) {
        handleEnemyDeath(victim, null);
      }
    }

    function nearestEnemy() {
      const camera = gameState.camera ?? {
        x: gameState.player.x,
        y: gameState.player.y,
        zoom: getTargetCameraZoom(),
      };
      const { minX, maxX, minY, maxY } = getCameraBounds(camera, W, H, 50);

      let closest: any | null = null;
      let closestDistSq = Infinity;

      for (const enemy of gameState.enemies) {
        if (!enemy || enemy.hp <= 0) continue;
        if (enemy.x < minX || enemy.x > maxX || enemy.y < minY || enemy.y > maxY) continue;

        const dx = enemy.x - gameState.player.x;
        const dy = enemy.y - gameState.player.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closest = enemy;
        }
      }

      return closest;
    }

    const CLUSTER_RADIUS = 180;
    const CLUSTER_RADIUS_SQ = CLUSTER_RADIUS * CLUSTER_RADIUS;
    const CLUSTER_CELL_SIZE = CLUSTER_RADIUS;

    function buildClusterScoreMap() {
      const clusterScores = new WeakMap<any, number>();

      if (gameState.enemies.length <= 1) {
        return clusterScores;
      }

      type ClusterBucket = { cellX: number; cellY: number; enemies: any[] };
      const buckets = new Map<string, ClusterBucket>();

      for (const enemy of gameState.enemies) {
        if (!enemy || enemy.hp <= 0) continue;
        const cellX = Math.floor(enemy.x / CLUSTER_CELL_SIZE);
        const cellY = Math.floor(enemy.y / CLUSTER_CELL_SIZE);
        const key = `${cellX}:${cellY}`;
        let bucket = buckets.get(key);
        if (!bucket) {
          bucket = { cellX, cellY, enemies: [] };
          buckets.set(key, bucket);
        }
        bucket.enemies.push(enemy);
      }

      for (const bucket of buckets.values()) {
        if (!bucket.enemies.length) continue;
        const { cellX, cellY, enemies } = bucket;

        for (const enemy of enemies) {
          let closeCount = 0;
          for (let ix = -1; ix <= 1; ix++) {
            for (let iy = -1; iy <= 1; iy++) {
              const neighborBucket = buckets.get(`${cellX + ix}:${cellY + iy}`);
              if (!neighborBucket) continue;
              for (const other of neighborBucket.enemies) {
                if (other === enemy || other.hp <= 0) continue;
                const ndx = other.x - enemy.x;
                if (Math.abs(ndx) > CLUSTER_RADIUS) continue;
                const ndy = other.y - enemy.y;
                if (Math.abs(ndy) > CLUSTER_RADIUS) continue;
                if (ndx * ndx + ndy * ndy <= CLUSTER_RADIUS_SQ) {
                  closeCount++;
                  if (closeCount >= 6) break;
                }
              }
              if (closeCount >= 6) break;
            }
            if (closeCount >= 6) break;
          }
          clusterScores.set(enemy, clamp(closeCount / 4, 0, 1));
        }
      }

      return clusterScores;
    }

    function scoreEnemyForAutoAim(
      enemy: any,
      range: number,
      preferredTarget: any | null,
      clusterScoreMap: WeakMap<any, number>,
    ) {
      const dx = enemy.x - gameState.player.x;
      const dy = enemy.y - gameState.player.y;
      const dist = Math.hypot(dx, dy);

      if (!Number.isFinite(dist)) {
        return { score: -Infinity, dist: 0 };
      }

      if (dist > range * 1.25) {
        return { score: -Infinity, dist };
      }

      const camera = gameState.camera ?? {
        x: gameState.player.x,
        y: gameState.player.y,
        zoom: getTargetCameraZoom(),
      };
      const { minX, maxX, minY, maxY } = getCameraBounds(camera, W, H, 50);
      const onScreen = enemy.x >= minX && enemy.x <= maxX && enemy.y >= minY && enemy.y <= maxY;

      const normalizedDistance = 1 - clamp(dist / Math.max(range, 1), 0, 1);

      let typePriority = 0.4;
      if (enemy.isBoss) typePriority = 1;
      else if (enemy.isElite) typePriority = 0.7;
      else if (enemy.specialType === "explosive") typePriority = 0.6;

      const damageValue = Number.isFinite(enemy.damage) ? enemy.damage : 0;
      const damageScore = clamp(damageValue / 30, 0, 1);

      const approachScore = clamp((range - dist) / Math.max(range, 1), 0, 1);

      let imminentImpactScore = 0;
      if (dist < (enemy.rad || 0) + gameState.player.rad + 40) {
        imminentImpactScore = 1;
      }

      let explosiveUrgency = 0;
      if (enemy.specialType === "explosive" && typeof enemy.explosionTimer === "number" && enemy.explosionTimer >= 0) {
        explosiveUrgency = 1 - clamp(enemy.explosionTimer / 3, 0, 1);
      }

      const healthRatio = enemy.maxhp ? clamp(enemy.hp / enemy.maxhp, 0, 1) : 1;
      const finishingScore = (1 - healthRatio) * 0.3;

      const clusterScore = clusterScoreMap.get(enemy) ?? 0;

      const baseScore =
        typePriority * 0.3 +
        damageScore * 0.12 +
        normalizedDistance * 0.18 +
        Math.max(imminentImpactScore, explosiveUrgency) * 0.18 +
        approachScore * 0.08 +
        finishingScore * 0.08 +
        clusterScore * 0.06;

      const sameTargetBonus = preferredTarget && enemy === preferredTarget ? 0.2 : 0;
      const visibilityBonus = onScreen ? 0.05 : 0;

      return { score: baseScore + sameTargetBonus + visibilityBonus, dist };
    }

    function selectSmartTarget(
      range: number,
      preferredTarget: any | null,
      clusterScoreMap: WeakMap<any, number>,
    ) {
      let bestEnemy: any | null = null;
      let bestScore = -Infinity;
      let bestDistance = Infinity;

      const consider = (enemy: any) => {
        if (!enemy || enemy.hp <= 0) return;
        const { score, dist } = scoreEnemyForAutoAim(enemy, range, preferredTarget, clusterScoreMap);
        if (score === -Infinity) return;

        const betterScore = score > bestScore + 0.05;
        const similarScore = Math.abs(score - bestScore) <= 0.05;
        const closer = dist < bestDistance - 5;

        if (!bestEnemy || betterScore || (similarScore && closer)) {
          bestEnemy = enemy;
          bestScore = score;
          bestDistance = dist;
        }
      };

      if (preferredTarget) {
        consider(preferredTarget);
      }

      for (const enemy of gameState.enemies) {
        if (enemy === preferredTarget) continue;
        consider(enemy);
      }

      return { target: bestEnemy, score: bestScore, distance: bestDistance };
    }

    function shootWeapon(weapon: Weapon, target: any) {
      // Incrementar contador de disparos para el tutorial
      gameState.player.shotsFired = (gameState.player.shotsFired || 0) + 1;

      const stats = gameState.player.stats;
      const range = weapon.range * stats.rangeMultiplier;
      let baseDamage = weapon.damage * stats.damageMultiplier;

      if (
        stats.adrenalineStacks > 0 &&
        stats.adrenalineThreshold > 0 &&
        gameState.player.hp <= gameState.player.maxhp * stats.adrenalineThreshold
      ) {
        baseDamage *= 1 + stats.adrenalineDamageBonus;
      }

      // Amuleto del Caos: daño aleatorio +10% a +50%
      if (stats.chaosDamage) {
        const chaosStacks = Math.max(1, getItemStacks("chaosamuleto"));
        const chaosBonus = 1 + (Math.random() * 0.4 + 0.1) * chaosStacks; // 1.1x a 1.5x por stack
        baseDamage *= chaosBonus;
      }

      // Chance de crítico (10% base)
      const critChance = 0.1;
      const isCrit = Math.random() < critChance;
      if (isCrit) baseDamage *= 2;

      const damage = baseDamage;
      const dir = Math.atan2(target.y - gameState.player.y, target.x - gameState.player.x);

      const isPierce = weapon.special === "pierce";
      const isAoe = weapon.special === "aoe";
      const isSpread = weapon.special === "spread";
      const isChain = weapon.special === "chain";
      const isFire = weapon.special === "fire";
      const isFreeze = weapon.special === "freeze";
      const isHoming = weapon.special === "homing";

      // Aplicar dispersión reducida por precisión
      const baseSpread = 0.15;
      const spreadReduction = stats.precision > 0 ? 1 - stats.precision / 100 : 1;
      const multishotTightening = 1 / (1 + stats.multishot * 0.5);
      const actualSpread = baseSpread * spreadReduction * multishotTightening;
      
      const visualType =
        weapon.id === "flamethrower"
          ? "flame"
          : weapon.id === "frostbow"
            ? "frost"
            : weapon.id === "rocket"
              ? "rocket"
              : weapon.id === "homing"
                ? "missile"
                : "bullet";
      const muzzleColor =
        visualType === "flame"
          ? "#fb923c"
          : visualType === "frost"
            ? "#60a5fa"
            : visualType === "rocket"
              ? "#f97316"
              : visualType === "missile"
                ? "#a855f7"
                : "#facc15";

      const explosiveSettings =
        weapon.id === "rocket"
          ? {
              radius: 130,
              damageMultiplier: 0.85,
              color: "#ff7a2a",
              secondaryColor: "#facc15",
              ringColor: "rgba(255, 255, 255, 0.9)",
              trailColor: "rgba(249, 115, 22, 0.9)",
            }
          : weapon.id === "homing"
            ? {
                radius: 115,
                damageMultiplier: 0.8,
                color: "#c084fc",
                secondaryColor: "#8e44ad",
                ringColor: "rgba(255, 255, 255, 0.85)",
                trailColor: "rgba(168, 85, 247, 0.85)",
              }
            : null;

      const projectileSpeed = weapon.projectileSpeed;

      const createPlayerBullet = (
        bulletDir: number,
        overrides: Partial<{
          pierce: boolean;
          aoe: boolean;
          chain: boolean;
          fire: boolean;
          freeze: boolean;
          homing: boolean;
          homingTarget: any;
          chainCount: number;
        }> = {},
      ) => ({
        x: gameState.player.x,
        y: gameState.player.y,
        dir: bulletDir,
        spd: projectileSpeed,
        life: range / projectileSpeed,
        damage,
        color: weapon.color,
        weaponId: weapon.id,
        bounces: gameState.player.stats.bounces,
        bounceOnEnemies: gameState.player.stats.bounceOnEnemies,
        pierce: overrides.pierce ?? isPierce,
        aoe: overrides.aoe ?? (isAoe || Boolean(explosiveSettings)),
        chain: overrides.chain ?? isChain,
        fire: overrides.fire ?? isFire,
        freeze: overrides.freeze ?? isFreeze,
        homing: overrides.homing ?? isHoming,
        homingTarget: overrides.homingTarget ?? (isHoming ? target : null),
        chainCount: overrides.chainCount ?? (isChain ? 3 : 0),
        isCrit,
        originX: gameState.player.x,
        originY: gameState.player.y,
        frostTarget: (overrides.freeze ?? isFreeze) ? target : null,
        visualType,
        explosive: Boolean(explosiveSettings),
        explosionRadius: explosiveSettings?.radius,
        explosionDamageMultiplier: explosiveSettings?.damageMultiplier,
        explosionColor: explosiveSettings?.color,
        explosionSecondaryColor: explosiveSettings?.secondaryColor,
        explosionRingColor: explosiveSettings?.ringColor,
        trailColor: explosiveSettings?.trailColor,
        explosionTriggered: false,
      });

      const shots = 1 + gameState.player.stats.multishot;
      for (let i = 0; i < shots; i++) {
        const spreadAngle = (i - (shots - 1) / 2) * actualSpread;
        const finalDir = dir + spreadAngle;

        if (isSpread) {
          const spreadVariance = 0.3 * spreadReduction * multishotTightening;
          for (let j = -1; j <= 1; j++) {
            gameState.bullets.push(
              createPlayerBullet(finalDir + j * spreadVariance, {
                pierce: false,
                aoe: false,
                chain: false,
                fire: false,
                freeze: false,
                homing: false,
                homingTarget: null,
                chainCount: 0,
              }),
            );
          }
        } else {
          gameState.bullets.push(createPlayerBullet(finalDir));
        }
      }

      // Partículas de disparo con límite
      if (gameState.particles.length < gameState.maxParticles) {
        const particlesToAdd = Math.min(3, gameState.maxParticles - gameState.particles.length);
        for (let i = 0; i < particlesToAdd; i++) {
          gameState.particles.push({
            x: gameState.player.x,
            y: gameState.player.y,
            vx: Math.cos(dir) * 2 + (Math.random() - 0.5),
            vy: Math.sin(dir) * 2 + (Math.random() - 0.5),
            life: 0.3,
            color: muzzleColor,
            size: 2,
          });
        }
      }

      weaponAudioController.onWeaponFired(weapon.id);
    }

    function autoShoot(dt: number) {
      const player = gameState.player;
      const clusterScoreMap = buildClusterScoreMap();

      for (const weapon of player.weapons) {
        const cooldownKey = weapon.id;
        if (!gameState.weaponCooldowns[cooldownKey]) {
          gameState.weaponCooldowns[cooldownKey] = 0;
        }

        const interval = 1 / (weapon.fireRate * player.stats.fireRateMultiplier);
        const maxStored = interval * 2;
        gameState.weaponCooldowns[cooldownKey] = Math.min(
          gameState.weaponCooldowns[cooldownKey] + dt,
          maxStored,
        );

        const memory =
          gameState.autoAimMemory[cooldownKey] ??
          (gameState.autoAimMemory[cooldownKey] = {
            target: null,
            lostTimer: 0,
            lastScore: -Infinity,
          });

        if (memory.target && (!gameState.enemies.includes(memory.target) || memory.target.hp <= 0)) {
          memory.target = null;
          memory.lastScore = -Infinity;
          memory.lostTimer = 0;
        }

        const range = weapon.range * player.stats.rangeMultiplier;
        const { target, score, distance } = selectSmartTarget(range, memory.target, clusterScoreMap);

        memory.target = target;
        memory.lastScore = score;

        if (!target) {
          memory.lostTimer = 0;
          continue;
        }

        if (distance > range) {
          memory.lostTimer += dt;
          if (memory.lostTimer > 0.35) {
            memory.target = null;
            memory.lastScore = -Infinity;
          }
          continue;
        }

        memory.lostTimer = 0;

        if (gameState.weaponCooldowns[cooldownKey] >= interval) {
          gameState.weaponCooldowns[cooldownKey] -= interval;
          if (gameState.weaponCooldowns[cooldownKey] < 0) {
            gameState.weaponCooldowns[cooldownKey] = 0;
          }

          shootWeapon(weapon, target);
        }
      }
    }

    function dropXP(x: number, y: number, val: number) {
      gameState.drops.push({
        x,
        y,
        rad: scaleEntitySize(8),
        type: "xp",
        val,
        color: "#8e44ad",
        lifetime: 10,
      });
    }

    function dropHeal(x: number, y: number) {
      const healAmount = Math.random() < 0.5 ? 15 : 25; // Curación pequeña o mediana
      gameState.drops.push({
        x,
        y,
        rad: scaleEntitySize(10),
        type: "heal",
        val: healAmount,
        color: "#ff3b3b",
      });
    }

    function dropPowerup(x: number, y: number, type: "magnet" | "shield" | "rage" | "speed") {
      const powerupData = {
        magnet: { color: "#5dbb63", rarity: "uncommon" as Rarity, duration: 10 },
        shield: { color: "#2e86c1", rarity: "rare" as Rarity, duration: 15 },
        rage: { color: "#ff7a2a", rarity: "epic" as Rarity, duration: 8 },
        speed: { color: "#ffc300", rarity: "common" as Rarity, duration: 0 }, // duration 0 porque es permanente
      };

      const data = powerupData[type];
      gameState.drops.push({
        x,
        y,
        rad: scaleEntitySize(12),
        type: "powerup",
        powerupType: type,
        duration: data.duration,
        color: data.color,
        rarity: data.rarity,
      });
    }

    function dropHorizonVisor(x: number, y: number) {
      const currentStacks = getItemStacks(HORIZON_VISOR_ITEM.id);
      const maxStacks = HORIZON_VISOR_ITEM.maxStacks ?? Infinity;

      if (currentStacks >= maxStacks) {
        return;
      }

      gameState.drops.push({
        x,
        y,
        rad: scaleEntitySize(14),
        type: "itemPickup",
        item: { ...HORIZON_VISOR_ITEM },
        color: HORIZON_VISOR_ITEM.color,
        glowColor: "#b794f4",
        spawnTime: gameState.time,
      });
    }

    function spawnChestParticles(x: number, y: number, color: string) {
      const availableSlots = gameState.maxParticles - gameState.particles.length;
      if (availableSlots <= 0) {
        return;
      }

      const particleCount = Math.min(14, availableSlots);
      if (particleCount <= 0) {
        return;
      }

      const distributionCount = Math.max(8, particleCount * 2);
      const swirlOffset = Math.random() * Math.PI * 2;
      for (let i = 0; i < particleCount; i++) {
        const ratio = i / particleCount;
        const angle = swirlOffset + (Math.PI * 2 * ratio);
        const swirl = Math.sin(ratio * Math.PI * 4) * 0.3;
        const outwardSpeed = 0.8 + Math.random() * 0.9;
        const upwardLift = 0.4 + Math.random() * 0.6;
        const vx = Math.cos(angle + swirl) * outwardSpeed * 0.7;
        const vy = Math.sin(angle + swirl) * outwardSpeed * 0.3 - upwardLift;
        const isSpark = i % Math.ceil(distributionCount / particleCount) === 0;
        const particleColor = isSpark ? hexToRgba(color, 0.95) : hexToRgba(color, 0.55);
        const life = isSpark ? 1.1 + Math.random() * 0.5 : 0.8 + Math.random() * 0.4;
        const size = isSpark ? 2.2 + Math.random() * 0.7 : 1.4 + Math.random() * 0.6;
        gameState.particles.push({
          x,
          y,
          vx,
          vy,
          life,
          color: particleColor,
          size,
        });
      }
    }

    function spawnChestSpawnParticles(x: number, y: number, rarity: Rarity | null) {
      const baseColor = (rarity && rarityColors[rarity]) || "#ff7a2a";
      const availableSlots = gameState.maxParticles - gameState.particles.length;
      if (availableSlots <= 0) {
        return;
      }

      const particleCount = Math.min(12, availableSlots);
      if (particleCount <= 0) {
        return;
      }

      for (let i = 0; i < particleCount; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
        const speed = 2 + Math.random() * 2.5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - Math.random() * 0.3;
        gameState.particles.push({
          x,
          y,
          vx,
          vy,
          life: 0.55 + Math.random() * 0.35,
          color: baseColor,
          size: 2 + Math.random() * 1.2,
        });
      }
    }

    function dropChest(x: number, y: number) {
      const cachedLoot = chooseChestItem();

      gameState.drops.push({
        x,
        y,
        rad: scaleEntitySize(14),
        type: "chest",
        color: "#ff7a2a",
        spawnTime: gameState.time,
        lootItemId: cachedLoot?.id ?? null,
        lootRarity: cachedLoot?.rarity ?? null,
        opened: false,
      });

      spawnChestSpawnParticles(x, y, cachedLoot?.rarity ?? null);
    }

    function chooseChestItem(): Item | null {
      const blacklist = gameState.chestBlacklist ?? new Set<string>();

      const availableItems = ITEMS.filter((item) => {
        if (blacklist.has(item.id)) {
          return false;
        }
        const currentStacks = gameState.player.itemStacks[item.id] ?? 0;
        if (item.maxStacks !== undefined) {
          return currentStacks < item.maxStacks;
        }
        return true;
      });

      if (availableItems.length === 0) {
        return null;
      }

      const rarityBuckets: Record<Rarity, Item[]> = {
        common: [],
        uncommon: [],
        rare: [],
        epic: [],
        legendary: [],
      };

      for (const item of availableItems) {
        rarityBuckets[item.rarity].push(item);
      }

      const rarityWeights: Record<Rarity, number> = {
        common: 0.5,
        uncommon: 0.15,
        rare: 0.2,
        epic: 0.1,
        legendary: 0.05,
      };

      if (gameState.postBossSurvival.active) {
        const bias = gameState.postBossSurvival.lootBiasBonus;
        rarityWeights.rare += bias.rare ?? 0;
        rarityWeights.epic += bias.epic ?? 0;
        rarityWeights.legendary += bias.legendary ?? 0;
      }

      const availableRarities = (Object.keys(rarityBuckets) as Rarity[]).filter(
        (rarity) => rarityBuckets[rarity].length > 0,
      );

      if (availableRarities.length === 0) {
        return null;
      }

      const totalWeight = availableRarities.reduce((sum, rarity) => {
        return sum + (rarityWeights[rarity] ?? 0);
      }, 0);

      if (totalWeight <= 0) {
        const fallbackRarity = availableRarities[Math.floor(Math.random() * availableRarities.length)];
        const pool = rarityBuckets[fallbackRarity];
        return pool[Math.floor(Math.random() * pool.length)];
      }

      let roll = Math.random() * totalWeight;
      for (const rarity of availableRarities) {
        const weight = rarityWeights[rarity] ?? 0;
        if (weight <= 0) {
          continue;
        }
        if (roll < weight) {
          const pool = rarityBuckets[rarity];
          return pool[Math.floor(Math.random() * pool.length)];
        }
        roll -= weight;
      }

      const lastRarity = availableRarities[availableRarities.length - 1];
      const pool = rarityBuckets[lastRarity];
      return pool[Math.floor(Math.random() * pool.length)];
    }

    function openChest(chest: any) {
      if (gameState.activeChestChoice) {
        return;
      }
      if (!chest || chest.opened) {
        return;
      }

      const pausedByChest = gameState.state === "running";
      if (pausedByChest) {
        gameState.state = "paused";
        gameState.pausedForChest = true;
        audioManager.stopAllSfx();
        weaponAudioController.stopAllLooping();
        weaponAudioController.resetTimers();
      } else {
        gameState.pausedForChest = false;
      }

      chest.opened = true;
      gameState.nearbyChest = null;
      gameState.pendingChestDrop = chest;

      const refreshedItem = chooseChestItem();
      chest.lootItemId = refreshedItem?.id ?? null;
      chest.lootRarity = refreshedItem?.rarity ?? null;

      const lootItemId = chest.lootItemId as string | null;
      const lootRarity = (chest.lootRarity as Rarity | null) ?? null;
      const chestBurstColor = lootRarity ? rarityColors[lootRarity] : "#5dbb63";

      if (!lootItemId) {
        collectXP(25);
        playPowerupSound();
        spawnChestParticles(chest.x, chest.y, chestBurstColor);
        finalizeChestDrop();
        return;
      }

      const item = ITEMS.find((candidate) => candidate.id === lootItemId) ?? null;

      if (!item) {
        collectXP(25);
        playPowerupSound();
        spawnChestParticles(chest.x, chest.y, chestBurstColor);
        finalizeChestDrop();
        return;
      }

      gameState.chestParticleSnapshot = gameState.particles.map((particle) => ({ ...particle }));
      gameState.particles.length = 0;
      if (gameState.maxParticlesBeforeChest == null) {
        gameState.maxParticlesBeforeChest = gameState.maxParticles;
      }
      gameState.maxParticles = 0;
      gameState.suppressParticlesForChest = true;

      gameState.activeChestChoice = {
        item,
        chestPosition: { x: chest.x, y: chest.y },
      };
      gameState.chestUIAnimation = 0;
    }

    function finalizeChestDrop() {
      const chest = gameState.pendingChestDrop;
      if (!chest) {
        return;
      }

      const index = gameState.drops.indexOf(chest);
      if (index !== -1) {
        gameState.drops.splice(index, 1);
      }

      if (gameState.nearbyChest === chest) {
        gameState.nearbyChest = null;
      }

      gameState.pendingChestDrop = null;

      if (gameState.pausedForChest) {
        gameState.state = "running";
        gameState.pausedForChest = false;
      }

      if (gameState.suppressParticlesForChest) {
        if (gameState.chestParticleSnapshot) {
          gameState.particles = gameState.chestParticleSnapshot;
        } else {
          gameState.particles.length = 0;
        }

        if (gameState.maxParticlesBeforeChest != null) {
          gameState.maxParticles = gameState.maxParticlesBeforeChest;
        }

        gameState.chestParticleSnapshot = null;
        gameState.maxParticlesBeforeChest = null;
        gameState.suppressParticlesForChest = false;
      }
    }

    function grantChestFallbackReward(position: { x: number; y: number }, color = "#5dbb63") {
      collectXP(25);
      playPowerupSound();
      spawnChestParticles(position.x, position.y, color);
    }

    function keepChestItem() {
      const choice = gameState.activeChestChoice;
      if (!choice) return;

      const granted = grantItemToPlayer(choice.item, { notify: true, playSound: true });

      if (!granted) {
        grantChestFallbackReward(choice.chestPosition, rarityColors[choice.item.rarity]);
      }

      gameState.activeChestChoice = null;
      gameState.chestUIAnimation = 0;
      finalizeChestDrop();
    }

    function banishChestItem() {
      const choice = gameState.activeChestChoice;
      if (!choice) return;
      if (gameState.chestBanishesRemaining <= 0) {
        return;
      }

      if (!gameState.chestBlacklist) {
        gameState.chestBlacklist = new Set<string>();
      }
      gameState.chestBlacklist.add(choice.item.id);

      gameState.chestBanishesRemaining = Math.max(0, gameState.chestBanishesRemaining - 1);
      const pendingChest = gameState.pendingChestDrop;

      const rerolledItem = chooseChestItem();

      if (!rerolledItem) {
        if (pendingChest) {
          pendingChest.lootItemId = null;
          pendingChest.lootRarity = null;
        }
        gameState.activeChestChoice = null;
        gameState.chestUIAnimation = 0;
        grantChestFallbackReward(choice.chestPosition);
        finalizeChestDrop();
        return;
      }

      if (pendingChest) {
        pendingChest.lootItemId = rerolledItem.id;
        pendingChest.lootRarity = rerolledItem.rarity;
      }

      gameState.activeChestChoice = {
        item: rerolledItem,
        chestPosition: choice.chestPosition,
      };
      gameState.chestUIAnimation = 0;
    }

    function skipChestItem() {
      if (!gameState.activeChestChoice) return;
      if (gameState.chestSkipsRemaining <= 0) {
        return;
      }

      gameState.chestSkipsRemaining = Math.max(0, gameState.chestSkipsRemaining - 1);
      gameState.activeChestChoice = null;
      gameState.chestUIAnimation = 0;
      finalizeChestDrop();
    }

    function collectXP(v: number) {
      // Aplicar multiplicador y bonus de XP
      const xpGained = (v + gameState.player.stats.xpBonus) * gameState.player.stats.xpMultiplier;
      gameState.xp += xpGained;
      recordXpPickup(xpGained);
      let leveledUp = false;
      while (gameState.xp >= gameState.nextXP) {
        gameState.xp -= gameState.nextXP;
        gameState.level++;
        setLevel(gameState.level);

        // Progresión de XP más suave al inicio
        // Niveles 1-5: crecimiento lento (1.15x + 10)
        // Niveles 6-10: crecimiento medio (1.2x + 15)
        // Niveles 11+: crecimiento normal (1.3x + 25)
        if (gameState.level <= 5) {
          gameState.nextXP = Math.floor(gameState.nextXP * 1.15 + 10);
        } else if (gameState.level <= 10) {
          gameState.nextXP = Math.floor(gameState.nextXP * 1.2 + 15);
        } else {
          gameState.nextXP = Math.floor(gameState.nextXP * 1.3 + 25);
        }

        gameState.levelUpAnimation = 1;
        gameState.xpBarRainbow = true; // Activar animación rainbow
        playLevelUpSound();
        showUpgradeScreen();
        leveledUp = true;
      }

      gameState.xpDisplayTarget = gameState.xp;
      gameState.nextXpDisplayTarget = gameState.nextXP;

      if (leveledUp) {
        gameState.nextXpDisplay = gameState.nextXpDisplayTarget;
        gameState.xpDisplay = gameState.nextXpDisplayTarget;
      }
    }

    function collectPowerup(drop: any) {
      const type = drop.powerupType;
      let duration = drop.duration;

      // Aplicar bonus de duración de powerups (solo para powerups temporales)
      if (duration > 0) {
        duration *= gameState.player.stats.powerupDuration;
      }

      playPowerupSound();

      if (type === "magnet") {
        gameState.player.tempMagnetTimer = duration;
      } else if (type === "shield") {
        gameState.player.tempShieldTimer = duration;
        gameState.player.shield = Math.min(3, gameState.player.shield + 1);
      } else if (type === "rage") {
        gameState.player.rageTimer = duration;
      } else if (type === "speed") {
        // Incrementar velocidad permanentemente en 1%, máximo 200% (2.0x)
        gameState.player.stats.speedMultiplier = Math.min(2.0, gameState.player.stats.speedMultiplier + 0.01);
      }

      recordPowerupPickup(type);
    }

    function spawnHotspot(isNegative = false) {
      const x = Math.random() * (gameState.worldWidth - 200) + 100;
      const y = Math.random() * (gameState.worldHeight - 200) + 100;
      gameState.hotspots.push({
        x,
        y,
        rad: scaleHotspotRadius(isNegative ? 120 : 80), // Hotspots negativos son más grandes
        progress: 0,
        required: isNegative ? 10 : 3, // Positivos: 3s para completar, Negativos: no aplica
        expirationTimer: 0,
        maxExpiration: isNegative ? 6 : 5, // Positivos: 5s, Negativos: 6s (estilo COD Zombies)
        active: false,
        isNegative, // true = zona de peligro, false = zona positiva
      });
    }

    function showUpgradeScreen() {
      gameState.state = "paused";
      gameState.showUpgradeUI = true;
      gameState.upgradeUIAnimation = 0; // Start animation from 0
      audioManager.stopAllSfx();
      weaponAudioController.stopAllLooping();
      weaponAudioController.resetTimers();

      const options: Upgrade[] = [];
      const usedKeys: Set<string> = new Set(); // Para evitar duplicados

      // Verificar si tiene pistola (reemplazable) o si slots están realmente llenos
      const hasPistol = gameState.player.weapons.some((w: Weapon) => w.id === "pistol");
      const weaponsFull = gameState.player.weapons.length >= 3 && !hasPistol;
      const tomesFull = gameState.player.tomes.length >= 3;

      // Generar pool de posibles upgrades
      const availableUpgrades: Upgrade[] = [];

      // Weapon upgrades
      if (weaponsFull) {
        // Ofrecer mejoras variadas para armas existentes
        for (let i = 0; i < gameState.player.weapons.length; i++) {
          const w = gameState.player.weapons[i];
          const upgradeVariants: Array<{
            upgradeType: "damage" | "fireRate" | "range" | "special";
            descriptionKey: string;
            rarity: Rarity;
          }> = [
            {
              upgradeType: "damage",
              descriptionKey: "weapon.damage",
              rarity: "uncommon",
            },
            {
              upgradeType: "fireRate",
              descriptionKey: "weapon.fireRate",
              rarity: "rare",
            },
            {
              upgradeType: "range",
              descriptionKey: "weapon.range",
              rarity: "uncommon",
            },
          ];

          // Agregar variante especial según el tipo de arma
          if (w.special === "spread") {
            upgradeVariants.push({
              upgradeType: "special" as const,
              descriptionKey: "weapon.spread",
              rarity: "rare" as Rarity,
            });
          } else if (w.special === "aoe") {
            upgradeVariants.push({
              upgradeType: "special" as const,
              descriptionKey: "weapon.aoe",
              rarity: "epic" as Rarity,
            });
          } else if (w.special === "pierce") {
            upgradeVariants.push({
              upgradeType: "special" as const,
              descriptionKey: "weapon.pierce",
              rarity: "rare" as Rarity,
            });
          }

          for (const variant of upgradeVariants) {
            availableUpgrades.push({
              type: "weapon",
              data: { ...w },
              rarity: variant.rarity,
              isLevelUp: true,
              targetIndex: i,
              upgradeType: variant.upgradeType,
              descriptionKey: variant.descriptionKey,
            });
          }
        }
      } else {
        // Armas nuevas disponibles
        const available = WEAPONS.filter((w) => !gameState.player.weapons.find((pw: Weapon) => pw.id === w.id));
        for (const weapon of available) {
          availableUpgrades.push({
            type: "weapon",
            data: { ...weapon },
            rarity: weapon.rarity,
          });
        }
      }

      // Book upgrades
      if (tomesFull) {
        // Ofrecer mejoras variadas para libros existentes
        for (let i = 0; i < gameState.player.tomes.length; i++) {
          const t = gameState.player.tomes[i];
          type UpgradeVariant = {
            upgradeType: "effect" | "special";
            descriptionKey: string;
            rarity: Rarity;
          };
          const upgradeVariants: UpgradeVariant[] = [];

          if (t.effect === "damage") {
            upgradeVariants.push(
              { upgradeType: "effect", descriptionKey: "tome.damage.effect", rarity: "rare" },
              { upgradeType: "special", descriptionKey: "tome.damage.special", rarity: "epic" },
            );
          } else if (t.effect === "speed") {
            upgradeVariants.push(
              { upgradeType: "effect", descriptionKey: "tome.speed.effect", rarity: "uncommon" },
              { upgradeType: "special", descriptionKey: "tome.speed.special", rarity: "rare" },
            );
          } else if (t.effect === "range") {
            upgradeVariants.push(
              { upgradeType: "effect", descriptionKey: "tome.range.effect", rarity: "uncommon" },
              { upgradeType: "special", descriptionKey: "tome.range.special", rarity: "rare" },
            );
          } else if (t.effect === "fireRate") {
            upgradeVariants.push(
              { upgradeType: "effect", descriptionKey: "tome.fireRate.effect", rarity: "rare" },
              { upgradeType: "special", descriptionKey: "tome.fireRate.special", rarity: "epic" },
            );
          } else if (t.effect === "bounce") {
            upgradeVariants.push(
              { upgradeType: "effect", descriptionKey: "tome.bounce.effect", rarity: "epic" },
              { upgradeType: "special", descriptionKey: "tome.bounce.special", rarity: "legendary" },
            );
          } else if (t.effect === "multishot") {
            upgradeVariants.push(
              { upgradeType: "effect", descriptionKey: "tome.multishot.effect", rarity: "legendary" },
              { upgradeType: "special", descriptionKey: "tome.multishot.special", rarity: "epic" },
            );
          } else if (t.effect === "xp") {
            upgradeVariants.push(
              { upgradeType: "effect", descriptionKey: "tome.xp.effect", rarity: "rare" },
              { upgradeType: "special", descriptionKey: "tome.xp.special", rarity: "epic" },
            );
          }

          for (const variant of upgradeVariants) {
            availableUpgrades.push({
              type: "tome",
              data: { ...t },
              rarity: variant.rarity,
              isLevelUp: true,
              targetIndex: i,
              upgradeType: variant.upgradeType,
              descriptionKey: variant.descriptionKey,
            });
          }
        }
      } else {
        // Libros nuevos disponibles
        const available = TOMES.filter((t) => !gameState.player.tomes.find((pt: Tome) => pt.id === t.id));
        for (const tome of available) {
          availableUpgrades.push({
            type: "tome",
            data: { ...tome },
            rarity: tome.rarity,
          });
        }
      }

      // Items siempre disponibles (pero filtrar los que ya tiene)
      for (const item of ITEMS) {
        const currentStacks = gameState.player.itemStacks[item.id] ?? 0;
        if (item.maxStacks !== undefined && currentStacks >= item.maxStacks) {
          continue;
        }

        // Control de legendarios: máximo uno cada 3 niveles de dificultad
        if (item.rarity === "legendary") {
          // Solo permitir legendarios en picos de dificultad múltiplos de 3
          if (gameState.difficulty.level % 3 === 0) {
            availableUpgrades.push({
              type: "item",
              data: item,
              rarity: item.rarity,
            });
          }
        } else {
          availableUpgrades.push({
            type: "item",
            data: item,
            rarity: item.rarity,
          });
        }
      }

      // Seleccionar 3 upgrades únicos
      while (options.length < 3 && availableUpgrades.length > 0) {
        const index = Math.floor(Math.random() * availableUpgrades.length);
        const upgrade = availableUpgrades[index];

        // Crear clave única para evitar duplicados
        let key = "";
        if (upgrade.isLevelUp) {
          key = `${upgrade.type}-${upgrade.targetIndex}-${upgrade.upgradeType}`;
        } else {
          key = `${upgrade.type}-${(upgrade.data as any).id}`;
        }

        if (!usedKeys.has(key)) {
          usedKeys.add(key);
          options.push(upgrade);
        }

        // Remover de disponibles para evitar repetir
        availableUpgrades.splice(index, 1);
      }

      gameState.upgradeOptions = options;
    }

    function updateHorizonVisionEffect() {
      const totalStacks =
        getItemStacks("horizonscanner") + getItemStacks(HORIZON_VISOR_ITEM.id);
      const stats = gameState.player.stats;

      const minimapDetailLevel = totalStacks >= 2 ? 2 : totalStacks >= 1 ? 1 : 0;

      stats.cameraZoomMultiplier = totalStacks >= 1 ? 0.7 : 1;

      if (gameState.camera) {
        gameState.camera.zoom = getTargetCameraZoom();
      }

      gameState.minimapDetailLevel = minimapDetailLevel;
      gameState.minimapOpacity =
        minimapDetailLevel === 2 ? 1 : minimapDetailLevel === 1 ? 0.45 : 0;
    }

    function applyItemEffect(item: Item) {
      const player = gameState.player;
      const stats = player.stats;
      const effect = item.effect;

      const statMultKeys: Partial<Record<string, keyof PlayerStats>> = {
        damageMultiplier: "damageMultiplier",
        speedMultiplier: "speedMultiplier",
        rangeMultiplier: "rangeMultiplier",
        fireRateMultiplier: "fireRateMultiplier",
        xpMultiplier: "xpMultiplier",
        magnetMultiplier: "magnetMultiplier",
        powerupDuration: "powerupDuration",
        cameraZoomMultiplier: "cameraZoomMultiplier",
      };

      if (effect.startsWith("stat-mult:")) {
        const [, key, valueStr] = effect.split(":");
        const multiplier = parseFloat(valueStr ?? "1");
        const statKey = statMultKeys[key ?? ""];
        if (statKey && Number.isFinite(multiplier)) {
          (stats as Record<string, number>)[statKey] =
            ((stats as Record<string, number>)[statKey] ?? 0) * multiplier;
        }
        return;
      }

      const statAddKeys: Partial<Record<string, keyof PlayerStats>> = {
        xpBonus: "xpBonus",
        precision: "precision",
        bounces: "bounces",
        multishot: "multishot",
        damageReduction: "damageReduction",
      };

      if (effect.startsWith("stat-add:")) {
        const [, key, valueStr] = effect.split(":");
        const value = parseFloat(valueStr ?? "0");
        const statKey = statAddKeys[key ?? ""];
        if (statKey && Number.isFinite(value)) {
          (stats as Record<string, number>)[statKey] =
            ((stats as Record<string, number>)[statKey] ?? 0) + value;
        }
        return;
      }

      if (effect.startsWith("maxhp-flat:")) {
        const value = parseFloat(effect.split(":")[1] ?? "0");
        if (Number.isFinite(value) && value !== 0) {
          const amount = Math.round(value);
          player.maxhp += amount;
          player.hp = Math.min(player.maxhp, player.hp + amount);
        }
        return;
      }

      if (effect.startsWith("maxhp-percent:")) {
        const percent = parseFloat(effect.split(":")[1] ?? "0");
        if (Number.isFinite(percent) && percent > 0) {
          const bonus = Math.max(1, Math.round(player.maxhp * percent));
          player.maxhp += bonus;
          player.hp = Math.min(player.maxhp, player.hp + bonus);
        }
        return;
      }

      if (effect.startsWith("stamina-max:")) {
        const value = parseFloat(effect.split(":")[1] ?? "0");
        if (Number.isFinite(value) && value > 0) {
          player.maxStamina += value;
          player.stamina = Math.min(player.maxStamina, player.stamina + value);
        }
        return;
      }

      if (effect.startsWith("sprint-efficiency:")) {
        const value = parseFloat(effect.split(":")[1] ?? "1");
        if (Number.isFinite(value) && value > 0) {
          stats.sprintEfficiencyMultiplier = Math.max(
            0.25,
            stats.sprintEfficiencyMultiplier * value,
          );
        }
        return;
      }

      if (effect.startsWith("sprint-recovery:")) {
        const value = parseFloat(effect.split(":")[1] ?? "1");
        if (Number.isFinite(value) && value > 0) {
          stats.sprintRecoveryMultiplier = Math.min(
            4,
            stats.sprintRecoveryMultiplier * value,
          );
        }
        return;
      }

      if (effect.startsWith("adrenaline:")) {
        const [, speedBonusStr, damageBonusStr, thresholdStr] = effect.split(":");
        const speedBonus = parseFloat(speedBonusStr ?? "0");
        const damageBonus = parseFloat(damageBonusStr ?? "0");
        const threshold = parseFloat(thresholdStr ?? "0");
        stats.adrenalineStacks += 1;
        if (Number.isFinite(speedBonus)) stats.adrenalineSpeedBonus += speedBonus;
        if (Number.isFinite(damageBonus)) stats.adrenalineDamageBonus += damageBonus;
        if (Number.isFinite(threshold)) {
          stats.adrenalineThreshold = Math.max(stats.adrenalineThreshold, threshold);
        }
        return;
      }

      if (effect.startsWith("drone:")) {
        const [, type, amountStr] = effect.split(":");
        const amount = parseFloat(amountStr ?? "0");
        if (Number.isFinite(amount) && amount > 0) {
          if (type === "attack") {
            stats.droneAttackLevel += amount;
          } else if (type === "support") {
            stats.droneSupportLevel += amount;
          } else if (type === "shield") {
            stats.droneShieldLevel += amount;
          }
        }
        return;
      }

      switch (effect) {
        case "firsthitimmune":
          stats.firstHitImmuneChargesUsed = 0;
          break;
        case "jetspeed":
          stats.speedMultiplier *= 1.15;
          break;
        case "reactiveshield":
          stats.reactiveShieldActive = true;
          break;
        case "horizonscanner":
        case "horizonvisor": {
          updateHorizonVisionEffect();
          break;
        }
        case "chaosdamage":
          stats.chaosDamage = true;
          break;
        case "maxhp15": {
          const bonus15 = Math.floor(player.maxhp * 0.15);
          player.maxhp += bonus15;
          player.hp = Math.min(player.maxhp, player.hp + bonus15);
          break;
        }
        case "heavyarmor":
          stats.speedMultiplier *= 0.9;
          stats.damageReduction += 0.25;
          break;
        case "plasmafrag":
          stats.bounces += 1;
          stats.rangeMultiplier *= 1.15;
          break;
        case "doublexp":
          stats.xpMultiplier *= 2;
          break;
        case "solargauntlet":
          stats.solarGauntletKills = 0;
          break;
        case "infernalengine":
          stats.speedMultiplier *= 1.25;
          stats.damageMultiplier *= 1.2;
          stats.damageReduction -= 0.1;
          break;
        case "bloodstone":
          stats.bloodstoneKills = 0;
          break;
        case "hordetotem":
          // Se maneja en spawn de enemigos y XP
          break;
        case "artificialheart":
          player.maxhp += 50;
          player.hp = Math.min(player.maxhp, player.hp + 50);
          break;
        case "infinitylens":
          stats.speedMultiplier *= 1.1;
          stats.damageMultiplier *= 1.1;
          stats.rangeMultiplier *= 1.1;
          stats.xpMultiplier *= 1.1;
          break;
      }
    }

    function grantItemToPlayer(item: Item, options: { notify?: boolean; playSound?: boolean } = {}) {
      const currentStacks = gameState.player.itemStacks[item.id] ?? 0;
      if (item.maxStacks !== undefined && currentStacks >= item.maxStacks) {
        return false;
      }

      gameState.player.items.push({ ...item });
      gameState.player.itemStacks[item.id] = currentStacks + 1;
      recordItemDrop(item);

      applyItemEffect(item);

      if (options.playSound) {
        playPowerupSound();
      }

      if (options.notify) {
        const currentLanguage = (gameState.language ?? language) as Language;
        const itemText = getItemText(item, currentLanguage);
        const prefix = currentLanguage === "es" ? "Nuevo ítem" : "New item";
        const stackLabel = currentStacks > 0 ? ` x${currentStacks + 1}` : "";
        gameState.itemNotification = `${prefix}: ${itemText.name}${stackLabel}`;
        gameState.itemNotificationTimer = 3;
      }

      return true;
    }

    function selectUpgrade(index: number) {
      const option = gameState.upgradeOptions[index];
      if (!option) return;

      gameState.upgradeAnimation = 1.5;
      gameState.state = "running";

      if (option.type === "weapon") {
        const weapon = option.data as Weapon;

        if (option.isLevelUp && option.targetIndex !== undefined) {
          // Mejora de nivel de arma existente
          const existingWeapon = gameState.player.weapons[option.targetIndex];
          existingWeapon.level++;

          // Aplicar mejora según el tipo
          if (option.upgradeType === "damage") {
            existingWeapon.damage *= 1.3;
          } else if (option.upgradeType === "fireRate") {
            existingWeapon.fireRate *= 1.25;
          } else if (option.upgradeType === "range") {
            existingWeapon.range *= 1.2;
          } else if (option.upgradeType === "special") {
            // Mejoras especiales según tipo de arma
            if (existingWeapon.special === "spread") {
              existingWeapon.damage *= 1.15; // Más pellets = más daño total
            } else if (existingWeapon.special === "aoe") {
              existingWeapon.damage *= 1.5; // Mayor radio
            } else if (existingWeapon.special === "pierce") {
              existingWeapon.damage *= 1.2; // Más perforaciones
            }
          }
        } else {
          // Nueva arma
          if (gameState.player.weapons.length < 3) {
            // Tiene menos de 3 armas, agregar directamente
            gameState.player.weapons.push(weapon);
          } else {
            // Tiene 3 armas, buscar y reemplazar la pistola si existe
            const pistolIndex = gameState.player.weapons.findIndex((w: Weapon) => w.id === "pistol");
            if (pistolIndex !== -1) {
              gameState.player.weapons[pistolIndex] = weapon;
            }
          }
        }
      } else if (option.type === "tome") {
        const tome = option.data as Tome;

        if (option.isLevelUp && option.targetIndex !== undefined) {
          // Mejora de nivel de libro existente
          const existingTome = gameState.player.tomes[option.targetIndex];
          const currentLevel = existingTome.level;
          existingTome.level++;

          // Aplicar bonificación según el efecto del libro y su nivel específico
          if (existingTome.effect === "damage") {
            // +10% daño por nivel (sin límite)
            gameState.player.stats.damageMultiplier *= 1.1;
          } else if (existingTome.effect === "speed") {
            // +5% velocidad por nivel (max 5 = 25%)
            if (currentLevel < 5) {
              gameState.player.stats.speedMultiplier *= 1.05;
            }
          } else if (existingTome.effect === "bounce") {
            // +1 rebote por nivel (max 5 rebotes)
            if (currentLevel < 5) {
              gameState.player.stats.bounces += 1;
            }
          } else if (existingTome.effect === "range") {
            // Niveles específicos: +10%, +25%, +40%, +60%, +80% (max 5)
            if (currentLevel < 5) {
              const rangeBonuses = [1.1, 1.25, 1.4, 1.6, 1.8]; // Multiplicadores acumulativos totales
              const prevBonus = currentLevel > 0 ? rangeBonuses[currentLevel - 1] : 1;
              const newBonus = rangeBonuses[currentLevel];
              gameState.player.stats.rangeMultiplier = (gameState.player.stats.rangeMultiplier / prevBonus) * newBonus;
              const percentages = [10, 25, 40, 60, 80];
            }
          } else if (existingTome.effect === "precision") {
            // +10% precisión por nivel, -10% dispersión por nivel (max 5 = 50%)
            if (currentLevel < 5) {
              gameState.player.stats.precision += 10;
            }
          } else if (existingTome.effect === "multishot") {
            // +1 proyectil por nivel (sin límite)
            gameState.player.stats.multishot += 1;
          } else if (existingTome.effect === "regen") {
            // Niveles específicos de regeneración
            const regenLevels = [
              { rate: 1, interval: 5 }, // LVL 1: 1 HP cada 5s
              { rate: 1, interval: 4 }, // LVL 2: 1 HP cada 4s
              { rate: 2, interval: 5 }, // LVL 3: 2 HP cada 5s
              { rate: 2, interval: 4 }, // LVL 4: 2 HP cada 4s
              { rate: 3, interval: 4 }, // LVL 5: 3 HP cada 4s
            ];
            if (currentLevel < regenLevels.length) {
              const config = regenLevels[currentLevel];
              gameState.player.stats.regenRate = config.rate;
              gameState.player.stats.regenInterval = config.interval;
            } else {
              // Más allá del nivel 5, continuar mejorando
              const extraLevels = currentLevel - 4;
              gameState.player.stats.regenRate = 3 + extraLevels;
            }
          } else if (existingTome.effect === "magnet") {
            // +10% por nivel hasta nivel 5 (80%)
            if (currentLevel < 5) {
              gameState.player.stats.magnetMultiplier *= 1.1;
              const totalBonus = Math.round((gameState.player.stats.magnetMultiplier - 1) * 100);
            }
          } else if (existingTome.effect === "fireRate") {
            // +10% cadencia por nivel (sin límite)
            gameState.player.stats.fireRateMultiplier *= 1.1;
            const totalBonus = Math.round((gameState.player.stats.fireRateMultiplier - 1) * 100);
          }
        } else {
          // Nuevo libro
          if (gameState.player.tomes.length < 3) {
            gameState.player.tomes.push(tome);

            // Aplicar efecto inicial
            if (tome.effect === "damage") {
              gameState.player.stats.damageMultiplier *= tome.value;
            } else if (tome.effect === "speed") {
              gameState.player.stats.speedMultiplier *= tome.value;
            } else if (tome.effect === "range") {
              gameState.player.stats.rangeMultiplier *= tome.value;
            } else if (tome.effect === "fireRate") {
              gameState.player.stats.fireRateMultiplier *= tome.value;
            } else if (tome.effect === "bounce") {
              gameState.player.stats.bounces += tome.value;
              gameState.player.stats.bounceOnEnemies = true;
            } else if (tome.effect === "multishot") {
              gameState.player.stats.multishot += tome.value;
            } else if (tome.effect === "precision") {
              gameState.player.stats.precision += 10;
            } else if (tome.effect === "regen") {
              gameState.player.stats.regenRate = 1;
              gameState.player.stats.regenInterval = 5;
            } else if (tome.effect === "magnet") {
              gameState.player.stats.magnetMultiplier *= tome.value;
            }
          }
        }
      } else if (option.type === "item") {
        const item = option.data as Item;
        grantItemToPlayer(item);
      }

      gameState.showUpgradeUI = false;
      gameState.xpBarRainbow = false; // Desactivar animación rainbow al cerrar menú
      gameState.upgradeOptions = [];
    }

    // Click handler para upgrades, pause menu y botón de música
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const pointInRect = (rect: { x: number; y: number; w: number; h: number }) =>
        mx >= rect.x && mx <= rect.x + rect.w && my >= rect.y && my <= rect.y + rect.h;

      // Controles de música (solo cuando el juego está corriendo)
      if (gameState.state === "running") {
        const menuButtonRect = getMusicMenuButtonRect(W, H);
        if (pointInRect(menuButtonRect)) {
          gameState.musicControlsVisible = !gameState.musicControlsVisible;
          gameState.musicButtonClickAnim.toggle = 1;
          return;
        }

        if (gameState.musicControlsVisible) {
          const trackCount = gameState.musicTracks.length;
          const panelRect = getMusicControlPanelRect(W, H, trackCount);
          const totalControlsWidth = MUSIC_MENU_CONTROL_SIZE * 2 + MUSIC_MENU_CONTROL_GAP;
          const controlsStartX = panelRect.x + (panelRect.w - totalControlsWidth) / 2;
          const controlsY = panelRect.y + 54;

          const playBtn = {
            x: controlsStartX,
            y: controlsY,
            w: MUSIC_MENU_CONTROL_SIZE,
            h: MUSIC_MENU_CONTROL_SIZE,
          };
          const skipBtn = {
            x: controlsStartX + MUSIC_MENU_CONTROL_SIZE + MUSIC_MENU_CONTROL_GAP,
            y: controlsY,
            w: MUSIC_MENU_CONTROL_SIZE,
            h: MUSIC_MENU_CONTROL_SIZE,
          };

          if (pointInRect(playBtn)) {
            gameState.musicButtonClickAnim.play = 1;
            if (!gameState.musicStarted) {
              playNextTrack({ avoidIndex: null, resetPosition: true });
            } else if (gameState.musicIsPlaying) {
              audioManager.pauseMusic("background");
              gameState.musicIsPlaying = false;
            } else {
              const musicElement = audioManager.getMusicElement("background");
              gameState.music = musicElement ?? null;
              if (musicElement?.ended) {
                playNextTrack({ avoidIndex: gameState.currentMusicIndex, resetPosition: true });
              } else {
                audioManager.setMusicMuted("background", gameState.musicMuted);
                audioManager.setMusicVolume("background", gameState.musicVolume);
                audioManager
                  .resumeMusic("background")
                  .then(() => {
                    gameState.musicIsPlaying = true;
                  })
                  .catch((e) => {
                    console.warn("Audio resume failed:", e);
                    gameState.musicIsPlaying = false;
                  });
              }
            }
            return;
          }

          if (pointInRect(skipBtn)) {
            if (trackCount > 0) {
              gameState.musicButtonClickAnim.skip = 1;
              playNextTrack({ avoidIndex: gameState.musicStarted ? gameState.currentMusicIndex : null, resetPosition: true });
            }
            return;
          }

          const trackStartY = controlsY + MUSIC_MENU_CONTROL_SIZE + 36;
          for (let i = 0; i < trackCount; i++) {
            const trackRect = {
              x: panelRect.x + MUSIC_MENU_PANEL_PADDING_X,
              y: trackStartY + i * MUSIC_MENU_TRACK_ROW_HEIGHT,
              w: panelRect.w - MUSIC_MENU_PANEL_PADDING_X * 2,
              h: MUSIC_MENU_TRACK_ROW_HEIGHT,
            };
            if (pointInRect(trackRect)) {
              playNextTrack({ forceIndex: i, avoidIndex: i, resetPosition: true });
              return;
            }
          }
        }
      }

      if (gameState.activeChestChoice) {
        const layout = getChestChoiceLayout(W, H);
        const {
          buttons: { keep: keepBtn, banish: banishBtn, skip: skipBtn },
        } = layout;

        if (pointInRect(keepBtn)) {
          keepChestItem();
        } else if (pointInRect(banishBtn)) {
          if (gameState.chestBanishesRemaining > 0) {
            banishChestItem();
          }
        } else if (pointInRect(skipBtn)) {
          if (gameState.chestSkipsRemaining > 0) {
            skipChestItem();
          }
        }
        return;
      }

      if (gameState.showUpgradeUI) {
        const cardW = 280;
        const cardH = 220;
        const gap = 40;
        const startX = W / 2 - (cardW * 1.5 + gap);
        const startY = H / 2 - cardH / 2 + 20;

        for (let i = 0; i < 3; i++) {
          const cx = startX + i * (cardW + gap);
          if (mx >= cx && mx <= cx + cardW && my >= startY && my <= startY + cardH) {
            selectUpgrade(i);
            break;
          }
        }
      } else if (
        gameState.state === "paused" &&
        !gameState.showUpgradeUI &&
        gameState.countdownTimer <= 0 &&
        !gameState.pausedForChest
      ) {
        const layout = getPauseMenuLayout(W, H);
        const homeLayout = getPauseMenuHomeLayout(layout, gameState.pauseMenuAudioOpen);
        const {
          buttons: { continue: continueBtn, audio: audioBtn, language: languageBtn, restart: restartBtn },
          audioPanel,
        } = homeLayout;

        if (
          mx >= continueBtn.x &&
          mx <= continueBtn.x + continueBtn.w &&
          my >= continueBtn.y &&
          my <= continueBtn.y + continueBtn.h
        ) {
          gameState.countdownTimer = 3;
          gameState.pauseMenuAudioOpen = false;
          return;
        }

        if (mx >= audioBtn.x && mx <= audioBtn.x + audioBtn.w && my >= audioBtn.y && my <= audioBtn.y + audioBtn.h) {
          gameState.pauseMenuAudioOpen = !gameState.pauseMenuAudioOpen;
          return;
        }

        if (
          mx >= languageBtn.x &&
          mx <= languageBtn.x + languageBtn.w &&
          my >= languageBtn.y &&
          my <= languageBtn.y + languageBtn.h
        ) {
          const currentLanguage = (gameState.language ?? language) as Language;
          const currentIndex = LANGUAGE_ORDER.indexOf(currentLanguage);
          const nextLanguage = LANGUAGE_ORDER[(currentIndex + 1) % LANGUAGE_ORDER.length];
          setLanguage(nextLanguage);
          localStorage.setItem("language", nextLanguage);
          gameState.language = nextLanguage;
          return;
        }

        if (
          mx >= restartBtn.x &&
          mx <= restartBtn.x + restartBtn.w &&
          my >= restartBtn.y &&
          my <= restartBtn.y + restartBtn.h
        ) {
          resetGame();
          return;
        }

        if (gameState.pauseMenuAudioOpen) {
          const { slider, toggles } = audioPanel;

          if (
            mx >= slider.hitArea.x &&
            mx <= slider.hitArea.x + slider.hitArea.w &&
            my >= slider.hitArea.y &&
            my <= slider.hitArea.y + slider.hitArea.h
          ) {
            const relative = clamp((mx - slider.rect.x) / slider.rect.w, 0, 1);
            gameState.targetMusicVolume = relative;
            if (!gameState.musicMuted) {
              gameState.musicVolume = relative;
              audioManager.setMusicVolume("background", relative);
              audioManager.setMusicVolume("gameOver", relative);
            }
            return;
          }

          if (
            mx >= toggles.music.x &&
            mx <= toggles.music.x + toggles.music.w &&
            my >= toggles.music.y &&
            my <= toggles.music.y + toggles.music.h
          ) {
            gameState.musicMuted = !gameState.musicMuted;
            audioManager.setMusicMuted("background", gameState.musicMuted);
            audioManager.setMusicMuted("gameOver", gameState.musicMuted);
            const musicElement = audioManager.getMusicElement("background");
            gameState.music = musicElement ?? null;
            if (gameState.musicMuted) {
              audioManager.pauseMusic("background");
              gameState.musicIsPlaying = false;
            } else {
              audioManager.setMusicVolume("background", gameState.targetMusicVolume);
              audioManager.setMusicVolume("gameOver", gameState.targetMusicVolume);
              if (gameState.musicStarted && !gameState.musicIsPlaying) {
                audioManager
                  .resumeMusic("background")
                  .then(() => {
                    gameState.musicIsPlaying = true;
                  })
                  .catch((err) => console.warn("Audio play failed:", err));
              }
            }
            return;
          }

          if (
            mx >= toggles.sfx.x &&
            mx <= toggles.sfx.x + toggles.sfx.w &&
            my >= toggles.sfx.y &&
            my <= toggles.sfx.y + toggles.sfx.h
          ) {
            gameState.sfxMuted = !gameState.sfxMuted;
            audioManager.setSfxMuted(gameState.sfxMuted);
            return;
          }
        }
      } else if (gameState.state === "gameover") {
        // GAME OVER SCREEN CLICK HANDLER
        const menuW = 700;
        const menuH = 650;
        const menuX = W / 2 - menuW / 2;
        const menuY = H / 2 - menuH / 2;

        const btnW = 400;
        const btnH = 70;
        const btnX = W / 2 - btnW / 2;
        const btnY = menuY + menuH - 120;

        if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
          audioManager.stopMusic("gameOver");
          gameState.gameOverMusic = audioManager.getMusicElement("gameOver");
          resetGame();
        }
      }
    });

    const handlePauseMenuScroll = (e: WheelEvent) => {
      // Simplified - no scrolling needed in new design
      e.preventDefault();
    };

    canvas.addEventListener("wheel", handlePauseMenuScroll, { passive: false });

    function update(dt: number) {
      // Actualizar tiempo siempre (necesario para animaciones)
      gameState.time += dt;

      // Solo incrementar el temporizador de partida cuando el juego está corriendo
      if (gameState.state === "running" && gameState.countdownTimer <= 0) {
        gameState.elapsedTime += dt;
        if (!gameState.bossEncounter.bossDefeated) {
          if (gameState.globalEventTimer > 0) {
            gameState.globalEventTimer = Math.max(0, gameState.globalEventTimer - dt);
          }
          if (gameState.globalEventTimer === 0 && !gameState.bossEncounter.portalSpawned) {
            spawnBossPortal();
          }
        }
      }

      for (const key of MUSIC_CONTROL_KEYS) {
        const value = gameState.musicButtonClickAnim[key];
        if (value > 0) {
          gameState.musicButtonClickAnim[key] = Math.max(0, value - dt * 3);
        }
      }

      // Animations que deben correr siempre
      if (gameState.levelUpAnimation > 0) gameState.levelUpAnimation = Math.max(0, gameState.levelUpAnimation - dt * 2);
      if (gameState.upgradeAnimation > 0) gameState.upgradeAnimation = Math.max(0, gameState.upgradeAnimation - dt);
      if (gameState.upgradeUIAnimation < 1 && gameState.showUpgradeUI)
        gameState.upgradeUIAnimation = Math.min(1, gameState.upgradeUIAnimation + dt * 3);
      if (gameState.activeChestChoice) {
        if (gameState.chestUIAnimation < 1) {
          gameState.chestUIAnimation = Math.min(1, gameState.chestUIAnimation + dt * 3.2);
        }
      } else if (gameState.chestUIAnimation > 0) {
        gameState.chestUIAnimation = Math.max(0, gameState.chestUIAnimation - dt * 6);
      }

      if (gameState.itemNotificationTimer > 0) {
        gameState.itemNotificationTimer = Math.max(0, gameState.itemNotificationTimer - dt);
        if (gameState.itemNotificationTimer === 0) {
          gameState.itemNotification = "";
        }
      }

      let positiveHotspotCount = 0;
      let negativeHotspotCount = 0;
      let radioactiveHotspotCount = 0;
      for (const hotspot of gameState.hotspots) {
        if (hotspot.isRadioactive) {
          radioactiveHotspotCount++;
          continue;
        }
        if (hotspot.isNegative) {
          negativeHotspotCount++;
        } else {
          positiveHotspotCount++;
        }
      }

      const xpApproachSpeed = 12;
      const xpDiff = gameState.xpDisplayTarget - gameState.xpDisplay;
      if (Math.abs(xpDiff) > 0.01) {
        const lerpFactor = Math.min(1, dt * xpApproachSpeed);
        gameState.xpDisplay += xpDiff * lerpFactor;
      } else {
        gameState.xpDisplay = gameState.xpDisplayTarget;
      }

      const nextXpApproachSpeed = 8;
      const nextXpDiff = gameState.nextXpDisplayTarget - gameState.nextXpDisplay;
      if (Math.abs(nextXpDiff) > 0.01) {
        const lerpFactor = Math.min(1, dt * nextXpApproachSpeed);
        gameState.nextXpDisplay += nextXpDiff * lerpFactor;
      } else {
        gameState.nextXpDisplay = gameState.nextXpDisplayTarget;
      }

      // Smooth volume transition (animación suave del volumen)
      if (Math.abs(gameState.musicVolume - gameState.targetMusicVolume) > 0.001) {
        const volumeSpeed = 2; // Velocidad de transición (más alto = más rápido)
        gameState.musicVolume += (gameState.targetMusicVolume - gameState.musicVolume) * dt * volumeSpeed;

        // Aplicar el volumen al audio
        audioManager.setMusicVolume("background", gameState.musicVolume);
        audioManager.setMusicVolume("gameOver", gameState.musicVolume);

        // Snap al valor final si está muy cerca
        if (Math.abs(gameState.musicVolume - gameState.targetMusicVolume) < 0.001) {
          gameState.musicVolume = gameState.targetMusicVolume;
        }
      }

      // Actualizar explosion marks
      for (let i = gameState.explosionMarks.length - 1; i >= 0; i--) {
        gameState.explosionMarks[i].life -= dt;
        if (gameState.explosionMarks[i].life <= 0) {
          gameState.explosionMarks.splice(i, 1);
        }
      }

      // Hold R para reiniciar (solo durante running)
      if (gameState.state === "running" && gameState.keys["r"]) {
        gameState.restartTimer += dt;
        if (gameState.restartTimer >= gameState.restartHoldTime) {
          resetGame();
          gameState.restartTimer = 0;
        }
      } else {
        gameState.restartTimer = 0;
      }

      // Game Over - seguir corriendo el tiempo durante la animación
      if (gameState.state === "gameover") {
        gameState.gameOverAnimationTimer += dt;
        return;
      }

      // Countdown timer después de pausa (más rápido: 2x velocidad)
      if (gameState.countdownTimer > 0) {
        gameState.countdownTimer -= dt * 2; // 2x más rápido
        if (gameState.countdownTimer <= 0) {
          gameState.countdownTimer = 0;
          gameState.state = "running";
        }
        // NO return aquí - seguir actualizando para que se vea el juego
      }

      // Solo actualizar lógica del juego si está corriendo (pero no durante countdown)
      if (gameState.state !== "running" || gameState.countdownTimer > 0) return;

      // ═══════════════════════════════════════════════════════════
      // TUTORIAL - Mantener ayudas durante el arranque
      // ═══════════════════════════════════════════════════════════
      // Tutorial simplificado: solo mostrar WASD
      if (gameState.tutorialActive && !tutorialCompleted && gameState.difficulty.level === 1) {
        const { w, a, s, d } = gameState.keys;
        const timeInTutorial = (performance.now() - gameState.tutorialStartTime) / 1000;

        // Completar después de 5 segundos O cuando presione WASD
        if (timeInTutorial > 5 || w || a || s || d) {
          setTutorialCompleted(true);
          localStorage.setItem("gameHasTutorial", "completed");
          gameState.tutorialActive = false;
        }
      }

      // ═══════════════════════════════════════════════════════════
      // SISTEMA DE DIFICULTAD PROGRESIVA - Inspirado en Risk of Rain 2
      // ═══════════════════════════════════════════════════════════
      const previousDifficultyLevel = gameState.difficulty.level;
      const previousTierIndex = gameState.difficulty.tierIndex;

      if (gameState.postBossSurvival.active) {
        const survival = gameState.postBossSurvival;
        survival.elapsed = Math.min(POST_BOSS_SURVIVAL_LIMIT, survival.elapsed + dt);
        if (survival.elapsed >= survival.nextReward && survival.nextReward <= POST_BOSS_SURVIVAL_LIMIT) {
          collectXP(POST_BOSS_REWARD_XP);
          survival.rewardsGranted++;
          survival.nextReward += POST_BOSS_REWARD_INTERVAL;
        }
      }

      const difficultyVars = gameState.difficulty.variables;
      difficultyVars.time_minutes = gameState.elapsedTime / 60;
      difficultyVars.player_level = gameState.level;
      difficultyVars.no_kill_seconds = Math.min(
        difficultyVars.no_kill_seconds + dt,
        9999,
      );

      if (gameState.difficulty.damageDeltaTimer > 0) {
        gameState.difficulty.damageDeltaTimer = Math.max(
          0,
          gameState.difficulty.damageDeltaTimer - dt,
        );
        if (gameState.difficulty.damageDeltaTimer === 0) {
          gameState.difficulty.damageDeltaApplied = 0;
        }
      }

      if (gameState.difficulty.freezeTimer > 0) {
        gameState.difficulty.freezeTimer = Math.max(
          0,
          gameState.difficulty.freezeTimer - dt,
        );
      }

      const baseDifficultyValue = evaluateDifficultyValue(difficultyVars);
      let desiredDifficultyValue =
        baseDifficultyValue + gameState.difficulty.eventValue;

      if (
        DIFFICULTY_COOLING_RULES.enabled &&
        difficultyVars.no_kill_seconds >=
          DIFFICULTY_COOLING_RULES.start_after_seconds_without_kill &&
        (!DIFFICULTY_COOLING_RULES.pauses_during_boss ||
          !gameState.bossEncounter.bossActive)
      ) {
        const cooledValue =
          desiredDifficultyValue - DIFFICULTY_COOLING_RULES.decay_per_second * dt;
        if (desiredDifficultyValue > DIFFICULTY_COOLING_RULES.floor) {
          desiredDifficultyValue = Math.max(
            DIFFICULTY_COOLING_RULES.floor,
            cooledValue,
          );
        } else {
          desiredDifficultyValue = Math.max(DIFFICULTY_RANGE.min, cooledValue);
        }
      }

      desiredDifficultyValue = clampDifficultyValue(desiredDifficultyValue);

      const difficultyWasFrozen = gameState.difficulty.freezeTimer > 0;
      const nextDifficultyValue = difficultyWasFrozen
        ? gameState.difficulty.value
        : desiredDifficultyValue;

      gameState.difficulty.value = nextDifficultyValue;
      if (!difficultyWasFrozen) {
        gameState.difficulty.eventValue =
          gameState.difficulty.value - baseDifficultyValue;
      }

      const difficultyIntensity = getDifficultyIntensity(
        gameState.difficulty.value,
      );
      const difficultyLevel = getDifficultyLevel(gameState.difficulty.value);
      const tierIndex = getDifficultyTierIndex(gameState.difficulty.value);
      const tier = DIFFICULTY_TIERS[tierIndex];
      const nextTier = DIFFICULTY_TIERS[tierIndex + 1];
      const tierProgress = getTierProgress(
        gameState.difficulty.value,
        tier,
        nextTier,
      );

      gameState.difficulty.intensity = difficultyIntensity;
      gameState.difficulty.level = difficultyLevel;
      gameState.difficulty.tierIndex = tierIndex;
      gameState.difficulty.tierLabel = tier.labels?.[language] ?? tier.label;
      gameState.difficulty.tierProgress = tierProgress;
      gameState.difficulty.stateId = tier.id;

      if (previousTierIndex !== tierIndex) {
        gameState.difficulty.notification = 2.5;
      } else if (gameState.difficulty.notification > 0) {
        gameState.difficulty.notification = Math.max(0, gameState.difficulty.notification - dt);
      }

      const baseTargetConcurrent = Math.min(55, Math.round(12 + difficultyIntensity * 8));
      const survivalDensityMultiplier = gameState.postBossSurvival.active
        ? 1 + (gameState.postBossSurvival.elapsed / 60) * POST_BOSS_SPAWN_DENSITY_PER_MIN
        : 1;
      const targetConcurrent = Math.min(70, Math.round(baseTargetConcurrent * survivalDensityMultiplier));
      gameState.maxConcurrentEnemies = targetConcurrent;

      if (previousDifficultyLevel !== difficultyLevel) {
        if (gameState.player.stats.firstHitImmuneCharges > 0) {
          gameState.player.stats.firstHitImmuneChargesUsed = 0;
        }

        if (gameState.environmentalEvent) {
          gameState.environmentalEvent = null;
          gameState.eventPhase = "none";
          gameState.eventIntensity = 0;
          gameState.eventNotification = 0;
          gameState.fogOpacity = 0;
          gameState.fogZones = [];
          gameState.fogWarningZones = [];
          gameState.stormZone = null;
          gameState.hotspots = gameState.hotspots.filter((h) => !h.isRadioactive);
        }

        collectXP(10 + difficultyLevel * 4);
        gameState.eventActivatedThisTier = false;
      }

      if (!gameState.tutorialActive && !gameState.eventActivatedThisTier) {
        let eventProbability = 0;
        if (difficultyLevel <= 3) {
          eventProbability = 0.015;
        } else if (difficultyLevel <= 6) {
          eventProbability = 0.04;
        } else if (difficultyLevel <= 10) {
          eventProbability = 0.07;
        } else {
          eventProbability = 0.1;
        }

        if (Math.random() < eventProbability) {
          const events = ["storm", "fog", "rain"] as const;
          const newEvent = events[Math.floor(Math.random() * events.length)];

          gameState.environmentalEvent = newEvent;
          gameState.eventPhase = "notification";
          gameState.eventIntensity = 0;
          gameState.eventTimer = 0;
          gameState.eventNotification = 5;
          gameState.fogOpacity = 0;
          gameState.fogZones = [];
          gameState.fogWarningZones = [];
          gameState.stormZone = null;
        }

        gameState.eventActivatedThisTier = true;
      }

      // ═══════════════════════════════════════════════════════════
      // EVENTOS AMBIENTALES - Lógica y Efectos
      // ═══════════════════════════════════════════════════════════

      // Fase de notificación
      if (gameState.eventNotification > 0) {
        gameState.eventNotification = Math.max(0, gameState.eventNotification - dt);

        // Cuando termina la notificación, empezar fade in
        if (gameState.eventNotification === 0 && gameState.eventPhase === "notification") {
          gameState.eventPhase = "fadein";
          gameState.eventIntensity = 0;
        }
      }

      if (gameState.environmentalEvent && gameState.eventPhase !== "notification") {
        // Fase de Fade In (5 segundos)
        if (gameState.eventPhase === "fadein") {
          gameState.eventIntensity = Math.min(1, gameState.eventIntensity + dt * 0.2); // 5 segundos para llegar a 1

          if (gameState.eventIntensity >= 1) {
            gameState.eventPhase = "active";
          }
        }

        // Aplicar efectos solo en fase active
        if (
          gameState.eventPhase === "active" ||
          gameState.eventPhase === "fadein" ||
          gameState.eventPhase === "fadeout"
        ) {
          const intensity = gameState.eventIntensity;

          switch (gameState.environmentalEvent) {
            case "storm":
              // TORMENTA: Sigue al jugador LENTAMENTE pero de forma impredecible
              // Crear zona de tormenta si no existe
              if (!gameState.stormZone) {
                gameState.stormZone = {
                  x: Math.random() * gameState.worldWidth,
                  y: Math.random() * gameState.worldHeight,
                  radius: 150,
                  vx: 0,
                  vy: 0,
                };
              }

              // Calcular dirección hacia el jugador
              const dx = gameState.player.x - gameState.stormZone.x;
              const dy = gameState.player.y - gameState.stormZone.y;
              const distToPlayer = Math.hypot(dx, dy);

              // Velocidad base AUMENTADA (sigue al jugador más rápidamente)
              const baseSpeed = 60; // Aumentado de 20 a 60
              const maxSpeed = 120; // Aumentado de 40 a 120

              // Componente hacia el jugador (80% del tiempo)
              const followStrength = Math.random() < 0.8 ? 1 : 0;
              const targetVx = (dx / distToPlayer) * baseSpeed * followStrength;
              const targetVy = (dy / distToPlayer) * baseSpeed * followStrength;

              // Componente aleatorio impredecible (20% del tiempo o cambio brusco)
              if (Math.random() < 0.02 || followStrength === 0) {
                // Cambio de dirección impredecible
                const randomAngle = Math.random() * Math.PI * 2;
                gameState.stormZone.vx = Math.cos(randomAngle) * baseSpeed * 1.5;
                gameState.stormZone.vy = Math.sin(randomAngle) * baseSpeed * 1.5;
              } else {
                // Interpolar suavemente hacia la dirección objetivo
                gameState.stormZone.vx += (targetVx - gameState.stormZone.vx) * 0.05;
                gameState.stormZone.vy += (targetVy - gameState.stormZone.vy) * 0.05;
              }

              // Añadir ruido aleatorio continuo (hace el movimiento impredecible)
              gameState.stormZone.vx += (Math.random() - 0.5) * 15;
              gameState.stormZone.vy += (Math.random() - 0.5) * 15;

              // Mover la tormenta
              gameState.stormZone.x += gameState.stormZone.vx * dt;
              gameState.stormZone.y += gameState.stormZone.vy * dt;

              // Mantener dentro del mapa (rebotar suavemente en bordes)
              if (gameState.stormZone.x < gameState.stormZone.radius) {
                gameState.stormZone.x = gameState.stormZone.radius;
                gameState.stormZone.vx = Math.abs(gameState.stormZone.vx);
              }
              if (gameState.stormZone.x > gameState.worldWidth - gameState.stormZone.radius) {
                gameState.stormZone.x = gameState.worldWidth - gameState.stormZone.radius;
                gameState.stormZone.vx = -Math.abs(gameState.stormZone.vx);
              }
              if (gameState.stormZone.y < gameState.stormZone.radius) {
                gameState.stormZone.y = gameState.stormZone.radius;
                gameState.stormZone.vy = Math.abs(gameState.stormZone.vy);
              }
              if (gameState.stormZone.y > gameState.worldHeight - gameState.stormZone.radius) {
                gameState.stormZone.y = gameState.worldHeight - gameState.stormZone.radius;
                gameState.stormZone.vy = -Math.abs(gameState.stormZone.vy);
              }

              // Limitar velocidad máxima
              const stormSpeed = Math.hypot(gameState.stormZone.vx, gameState.stormZone.vy);
              if (stormSpeed > maxSpeed) {
                gameState.stormZone.vx = (gameState.stormZone.vx / stormSpeed) * maxSpeed;
                gameState.stormZone.vy = (gameState.stormZone.vy / stormSpeed) * maxSpeed;
              }

              // Daño continuo si el jugador está dentro (escalado por intensidad)
              const distToStorm = Math.hypot(
                gameState.player.x - gameState.stormZone.x,
                gameState.player.y - gameState.stormZone.y,
              );
              if (distToStorm < gameState.stormZone.radius) {
                gameState.player.hp -= 10 * dt * intensity; // 10 HP/s escalado por intensidad
                if (gameState.player.hp <= 0) {
                  gameState.state = "gameover";
                  gameState.gameOverTimer = 3;
                }

                // Partículas de daño eléctrico
                if (Math.random() < 0.3 * intensity && gameState.particles.length < gameState.maxParticles) {
                  gameState.particles.push({
                    x: gameState.player.x + (Math.random() - 0.5) * 30,
                    y: gameState.player.y + (Math.random() - 0.5) * 30,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 0.5,
                    color: "#2e86c1",
                    size: 4,
                  });
                }
              }

              // Partículas de tormenta
              if (Math.random() < 0.5 * intensity && gameState.particles.length < gameState.maxParticles) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * gameState.stormZone.radius;
                gameState.particles.push({
                  x: gameState.stormZone.x + Math.cos(angle) * dist,
                  y: gameState.stormZone.y + Math.sin(angle) * dist,
                  vx: (Math.random() - 0.5) * 2,
                  vy: (Math.random() - 0.5) * 2,
                  life: 0.8,
                  color: "#2e86c1",
                  size: 3,
                });
              }
              break;

            case "fog":
              // NIEBLA TÓXICA: Warning antes de aparecer, luego 1 zona rectangular
              // Fase 1: Warning zones (mostrar dónde aparecerá)
              if (gameState.fogWarningZones.length === 0 && intensity < 0.3) {
                const width = 250 + Math.random() * 150;
                const height = 200 + Math.random() * 100;
                gameState.fogWarningZones.push({
                  x: Math.random() * (gameState.worldWidth - width),
                  y: Math.random() * (gameState.worldHeight - height),
                  width,
                  height,
                  warningTime: 0,
                });
              }

              // Actualizar warning timer
              if (gameState.fogWarningZones.length > 0) {
                gameState.fogWarningZones[0].warningTime += dt;
              }

              // Fase 2: Crear zona de niebla real después del warning
              if (gameState.fogZones.length === 0 && intensity > 0.3 && gameState.fogWarningZones.length > 0) {
                const warning = gameState.fogWarningZones[0];
                gameState.fogZones.push({
                  x: warning.x,
                  y: warning.y,
                  width: warning.width,
                  height: warning.height,
                });
                gameState.fogWarningZones = []; // Limpiar warnings
              }

              // Fade in niebla
              if (gameState.fogOpacity < 0.8 * intensity) {
                gameState.fogOpacity = Math.min(0.8 * intensity, gameState.fogOpacity + dt * 0.3);
              }

              // Verificar si el jugador está en la zona de niebla
              let inFogZone = false;
              for (const zone of gameState.fogZones) {
                if (
                  gameState.player.x > zone.x &&
                  gameState.player.x < zone.x + zone.width &&
                  gameState.player.y > zone.y &&
                  gameState.player.y < zone.y + zone.height
                ) {
                  inFogZone = true;
                  break;
                }
              }

              // Daño aumentado si está en zona de niebla (escalado por intensidad)
              if (inFogZone) {
                gameState.player.hp -= 5 * dt * intensity; // 5 HP/s escalado por intensidad
                if (gameState.player.hp <= 0) {
                  gameState.state = "gameover";
                  gameState.gameOverTimer = 3;
                }

                // Partículas de daño en el jugador
                if (Math.random() < 0.2 * intensity && gameState.particles.length < gameState.maxParticles) {
                  gameState.particles.push({
                    x: gameState.player.x + (Math.random() - 0.5) * 30,
                    y: gameState.player.y + (Math.random() - 0.5) * 30,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 3,
                    life: 0.8,
                    color: "#5dbb63",
                    size: 4,
                  });
                }
              }

              // Partículas de niebla en las zonas
              if (
                Math.random() < 0.3 * intensity &&
                gameState.particles.length < gameState.maxParticles &&
                gameState.fogZones.length > 0
              ) {
                const zone = gameState.fogZones[0];
                gameState.particles.push({
                  x: zone.x + Math.random() * zone.width,
                  y: zone.y + Math.random() * zone.height,
                  vx: (Math.random() - 0.5) * 0.5,
                  vy: (Math.random() - 0.5) * 0.5,
                  life: 3,
                  color: "#5dbb63",
                  size: 20,
                });
              }
              break;

            case "rain":
              // LLUVIA RADIACTIVA: Enemigos ganan velocidad en zonas específicas - SOLO 1 CÍRCULO
              // Crear zona radiactiva tipo negative hotspot - MUY GRANDE
              if (radioactiveHotspotCount === 0 && intensity > 0.3) {
                const x = Math.random() * (gameState.worldWidth - 600) + 300;
                const y = Math.random() * (gameState.worldHeight - 600) + 300;
                gameState.hotspots.push({
                  x,
                  y,
                  rad: 300,
                  progress: 0,
                  required: 0,
                  expirationTimer: 0,
                  maxExpiration: 999, // No expira durante el evento
                  active: false,
                  isNegative: false,
                  isRadioactive: true, // Marca especial para lluvia radiactiva
                });
                radioactiveHotspotCount++;
              }

              // Partículas de lluvia
              if (Math.random() < 0.3 * intensity && gameState.particles.length < gameState.maxParticles) {
                gameState.particles.push({
                  x: Math.random() * gameState.worldWidth,
                  y: -10,
                  vx: 0,
                  vy: 15,
                  life: 2,
                  color: "#8e44ad",
                  size: 2,
                });
              }
              break;
          }
        }
      }

      // Hotspot spawning (positivos)
      gameState.hotspotTimer += dt;
      if (gameState.hotspotTimer >= 30 && positiveHotspotCount < 2) {
        gameState.hotspotTimer = 0;
        spawnHotspot(false);
        positiveHotspotCount++;
      }

      // Danger Zone spawning (negativos) - Más frecuentes estilo COD Zombies
      if (
        gameState.difficulty.level >= 3 &&
        negativeHotspotCount < (gameState.difficulty.level >= 11 ? 2 : 1)
      ) {
        let dangerChance = 0.02;
        if (gameState.difficulty.level >= 6 && gameState.difficulty.level < 11) {
          dangerChance = 0.025; // Cada ~40s
        } else if (gameState.difficulty.level >= 11) {
          dangerChance = 0.033; // Cada ~30s, hasta 2 zonas
        }

        if (Math.random() < dangerChance * dt) {
          spawnHotspot(true);
          negativeHotspotCount++;
        }
      }

      // Resetear flag de zona peligrosa
      gameState.inDangerZone = false;

      // Hotspot logic
      for (let i = gameState.hotspots.length - 1; i >= 0; i--) {
        const h = gameState.hotspots[i];
        const d = Math.hypot(h.x - gameState.player.x, h.y - gameState.player.y);

        // Zonas radiactivas solo afectan enemigos, no jugador
        if (h.isRadioactive) {
          h.expirationTimer += dt;
          if (h.expirationTimer >= h.maxExpiration) {
            gameState.hotspots.splice(i, 1);
          }
          continue; // Skip player interaction
        }

        // Danger zones permanentes desde dificultad 8
        const isDangerZonePermanent = h.isNegative && gameState.difficulty.level >= 8;

        if (d < h.rad) {
          h.active = true;

          if (h.isNegative) {
            // HOTSPOT NEGATIVO (Zona de Peligro)
            gameState.inDangerZone = true;
            gameState.dangerZoneTimer += dt;

            // Daño continuo: 8 HP/s (sin activar invulnerabilidad)
            gameState.player.hp -= 8 * dt;

            // Partículas de daño
            if (Math.random() < 0.15 && gameState.particles.length < gameState.maxParticles) {
              gameState.particles.push({
                x: gameState.player.x + (Math.random() - 0.5) * 30,
                y: gameState.player.y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3,
                life: 0.8,
                color: "#ef4444",
                size: 4,
              });
            }

            // No incrementa timer de caducación mientras el jugador está dentro
            h.progress += dt;

            // Check game over
            if (gameState.player.hp <= 0) {
              gameState.state = "gameover";
              gameState.gameOverTimer = 3;
            }
          } else {
            // HOTSPOT POSITIVO (recompensa)
            h.progress += dt;

            if (h.progress >= h.required) {
              // ¡Recompensa!
              const availableItems = ITEMS.filter((item) => {
                const currentStacks = gameState.player.itemStacks[item.id] ?? 0;
                if (item.maxStacks !== undefined) {
                  return currentStacks < item.maxStacks;
                }
                return true;
              });
              if (availableItems.length > 0) {
                const rewardItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                grantItemToPlayer(rewardItem, { notify: true, playSound: true });
              } else {
                const currentLanguage = (gameState.language ?? language) as Language;
                const prefix = currentLanguage === "es" ? "Todos los ítems obtenidos" : "All items unlocked";
                gameState.itemNotification = prefix;
                gameState.itemNotificationTimer = 3;
              }
              gameState.hotspots.splice(i, 1);
              // Particles
              for (let j = 0; j < 30; j++) {
                const angle = (Math.PI * 2 * j) / 30;
                gameState.particles.push({
                  x: h.x,
                  y: h.y,
                  vx: Math.cos(angle) * 8,
                  vy: Math.sin(angle) * 8,
                  life: 1,
                  color: "#ffc300",
                  size: 4,
                });
              }
            }
          }
        } else {
          // Jugador FUERA
          h.active = false;

          // Solo incrementar timer de expiración si no es permanente
          if (!isDangerZonePermanent) {
            h.expirationTimer += dt;

            // Si pasa el tiempo de caducación, eliminar
            if (h.expirationTimer >= h.maxExpiration) {
              gameState.hotspots.splice(i, 1);
            }
          }
        }
      }

      // Resetear timer si sale de la zona de peligro
      if (!gameState.inDangerZone) {
        gameState.dangerZoneTimer = 0;
      }

      // Temporary powerup timers
      if (gameState.player.tempMagnetTimer > 0) {
        gameState.player.tempMagnetTimer = Math.max(0, gameState.player.tempMagnetTimer - dt);
      }
      if (gameState.player.tempShieldTimer > 0) {
        gameState.player.tempShieldTimer = Math.max(0, gameState.player.tempShieldTimer - dt);
        if (gameState.player.tempShieldTimer === 0 && gameState.player.shield > 0) {
          gameState.player.shield = Math.max(0, gameState.player.shield - 1);
        }
      }
      if (gameState.player.rageTimer > 0) {
        gameState.player.rageTimer = Math.max(0, gameState.player.rageTimer - dt);
      }

      // Sprint system (Spacebar)
      const isMoving =
        gameState.keys["w"] ||
        gameState.keys["a"] ||
        gameState.keys["s"] ||
        gameState.keys["d"] ||
        gameState.keys["arrowup"] ||
        gameState.keys["arrowleft"] ||
        gameState.keys["arrowdown"] ||
        gameState.keys["arrowright"];

      if (gameState.keys[" "] && isMoving && gameState.player.stamina > 0) {
        // Sprint activado
        gameState.player.isSprinting = true;
        const staminaDrainRate = 5 * gameState.player.stats.sprintEfficiencyMultiplier;
        gameState.player.stamina = Math.max(0, gameState.player.stamina - staminaDrainRate * dt);
      } else {
        // Sprint desactivado, regenerar stamina
        gameState.player.isSprinting = false;
        if (gameState.player.stamina < gameState.player.maxStamina) {
          const staminaRecoveryRate = 10 * gameState.player.stats.sprintRecoveryMultiplier;
          gameState.player.stamina = Math.min(
            gameState.player.maxStamina,
            gameState.player.stamina + staminaRecoveryRate * dt,
          );
        }
      }

      // Si se acabó la stamina, forzar desactivar sprint
      if (gameState.player.stamina <= 0) {
        gameState.player.isSprinting = false;
      }

      // Regeneración del libro
      if (gameState.player.stats.regenRate > 0 && gameState.player.stats.regenInterval > 0) {
        gameState.regenTimer += dt;
        if (gameState.regenTimer >= gameState.player.stats.regenInterval) {
          gameState.regenTimer = 0;
          gameState.player.hp = Math.min(
            gameState.player.maxhp,
            gameState.player.hp + gameState.player.stats.regenRate,
          );
        }
      }

      // Regeneración del item (si lo tiene)
      if (gameState.player.items.find((it: Item) => it.id === "regen")) {
        // El item de regeneración es adicional al libro
        if (gameState.regenTimer >= 10) {
          gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + 1);
        }
      }

      const droneStats = gameState.player.stats;
      if (droneStats.droneAttackLevel > 0) {
        gameState.droneAttackCooldown -= dt;
        if (gameState.droneAttackCooldown <= 0) {
          let target: any | null = null;
          let bestDist = Infinity;
          for (const enemy of gameState.enemies) {
            if (!enemy || enemy.hp <= 0) continue;
            const dist = Math.hypot(enemy.x - gameState.player.x, enemy.y - gameState.player.y);
            if (dist < bestDist && dist <= 360) {
              bestDist = dist;
              target = enemy;
            }
          }

          const attackLevel = droneStats.droneAttackLevel;
          const nextCooldown = Math.max(0.45, 1.4 - attackLevel * 0.15);
          gameState.droneAttackCooldown = nextCooldown;

          if (target) {
            const damage = (8 + attackLevel * 6) * droneStats.damageMultiplier;
            target.hp -= damage;
            if (target.hp <= 0) {
              handleEnemyDeath(target, null);
            }

            if (gameState.particles.length < gameState.maxParticles) {
              gameState.particles.push({
                x: target.x,
                y: target.y,
                vx: (Math.random() - 0.5) * 2,
                vy: -2,
                life: 0.4,
                color: "#8e44ad",
                size: 3,
              });
            }
          }
        }
      } else {
        gameState.droneAttackCooldown = Math.max(0, gameState.droneAttackCooldown);
      }

      if (droneStats.droneSupportLevel > 0) {
        gameState.droneSupportCooldown -= dt;
        if (gameState.droneSupportCooldown <= 0) {
          const level = droneStats.droneSupportLevel;
          const heal = 3 * level;
          gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + heal);
          gameState.droneSupportCooldown = Math.max(3, 6 - level * 0.5);

          if (gameState.particles.length < gameState.maxParticles) {
            gameState.particles.push({
              x: gameState.player.x,
              y: gameState.player.y,
              vx: (Math.random() - 0.5) * 1.5,
              vy: -1.5,
              life: 0.6,
              color: "#5dbb63",
              size: 4,
            });
          }
        }
      } else {
        gameState.droneSupportCooldown = Math.max(0, gameState.droneSupportCooldown);
      }

      if (droneStats.droneShieldLevel > 0) {
        gameState.droneShieldCooldown -= dt;
        if (gameState.droneShieldCooldown <= 0) {
          const level = droneStats.droneShieldLevel;
          const shieldGain = 1 + Math.floor(level / 2);
          gameState.player.shield = Math.min(8, gameState.player.shield + shieldGain);
          gameState.droneShieldCooldown = Math.max(5, 9 - level * 0.6);

          if (gameState.particles.length < gameState.maxParticles) {
            gameState.particles.push({
              x: gameState.player.x,
              y: gameState.player.y - 10,
              vx: (Math.random() - 0.5) * 1.2,
              vy: -1,
              life: 0.5,
              color: "#2e86c1",
              size: 3,
            });
          }
        }
      } else {
        gameState.droneShieldCooldown = Math.max(0, gameState.droneShieldCooldown);
      }

      // Aura de fuego
      if (gameState.player.stats.auraRadius > 0) {
        gameState.auraTimer += dt;
        if (gameState.auraTimer >= 0.5) {
          gameState.auraTimer = 0;
          for (const e of gameState.enemies) {
            const d = Math.hypot(e.x - gameState.player.x, e.y - gameState.player.y);
            if (d < gameState.player.stats.auraRadius) {
              e.hp -= 0.5;
              // Partículas de fuego
              for (let i = 0; i < 2; i++) {
                gameState.particles.push({
                  x: e.x,
                  y: e.y,
                  vx: (Math.random() - 0.5) * 2,
                  vy: (Math.random() - 0.5) * 2,
                  life: 0.5,
                  color: "#ff3b3b",
                  size: 3,
                });
              }
            }
          }
        }
      }

      if (gameState.player.ifr > 0) gameState.player.ifr = Math.max(0, gameState.player.ifr - dt);

      // Movimiento (WASD o flechas)
      let vx =
        (gameState.keys["d"] || gameState.keys["arrowright"] ? 1 : 0) -
        (gameState.keys["a"] || gameState.keys["arrowleft"] ? 1 : 0);
      let vy =
        (gameState.keys["s"] || gameState.keys["arrowdown"] ? 1 : 0) -
        (gameState.keys["w"] || gameState.keys["arrowup"] ? 1 : 0);
      const len = Math.hypot(vx, vy) || 1;
      vx /= len;
      vy /= len;

      let spd = gameState.player.spd * gameState.player.stats.speedMultiplier;
      const adrenalineActive =
        gameState.player.stats.adrenalineStacks > 0 &&
        gameState.player.stats.adrenalineThreshold > 0 &&
        gameState.player.hp <=
          gameState.player.maxhp * gameState.player.stats.adrenalineThreshold;
      if (adrenalineActive) {
        spd *= 1 + gameState.player.stats.adrenalineSpeedBonus;
      }
      if (gameState.player.rageTimer > 0) spd *= 1.5; // Rage mode: +50% velocidad
      if (gameState.player.isSprinting) spd *= 1.7; // Sprint: +70% velocidad

      // Movimiento tentativo
      let newX = gameState.player.x + vx * spd;
      let newY = gameState.player.y + vy * spd;

      // Restricción de movimiento en zonas de niebla
      if (gameState.environmentalEvent === "fog" && gameState.fogZones.length > 0) {
        for (const zone of gameState.fogZones) {
          // Verificar si el jugador está en la zona actualmente
          const isInZone =
            gameState.player.x >= zone.x &&
            gameState.player.x <= zone.x + zone.width &&
            gameState.player.y >= zone.y &&
            gameState.player.y <= zone.y + zone.height;

          if (isInZone) {
            // Restringir movimiento para que no pueda salir de la zona
            if (newX < zone.x) newX = zone.x;
            if (newX > zone.x + zone.width) newX = zone.x + zone.width;
            if (newY < zone.y) newY = zone.y;
            if (newY > zone.y + zone.height) newY = zone.y + zone.height;
            break; // Solo aplicar restricción de la primera zona que contenga al jugador
          }
        }
      }

      // Clamp a los límites del mapa
      newX = Math.max(gameState.player.rad, Math.min(gameState.worldWidth - gameState.player.rad, newX));
      newY = Math.max(gameState.player.rad, Math.min(gameState.worldHeight - gameState.player.rad, newY));

      gameState.player.x = newX;
      gameState.player.y = newY;

      if (gameState.camera) {
        const camera = gameState.camera;
        const dx = gameState.player.x - camera.x;
        const dy = gameState.player.y - camera.y;
        const distance = Math.hypot(dx, dy);
        const deadzone = camera.deadzone ?? CAMERA_DEADZONE_RADIUS;

        if (distance > deadzone) {
          const moveRatio = (distance - deadzone) / distance;
          camera.x += dx * moveRatio;
          camera.y += dy * moveRatio;
        }

        const targetZoom = getTargetCameraZoom();
        camera.zoom = targetZoom;
        const { halfViewW, halfViewH } = getCameraViewExtents(W, H, targetZoom);
        const maxX = Math.max(halfViewW, gameState.worldWidth - halfViewW);
        const maxY = Math.max(halfViewH, gameState.worldHeight - halfViewH);
        camera.x = clamp(camera.x, halfViewW, maxX);
        camera.y = clamp(camera.y, halfViewH, maxY);
      }

      const visibilityCamera = gameState.camera ?? {
        x: gameState.player.x,
        y: gameState.player.y,
        zoom: getTargetCameraZoom(),
      };
      const visibilityZoom = visibilityCamera.zoom ?? getTargetCameraZoom();
      const visibilityExtents = getCameraViewExtents(W, H, visibilityZoom);
      const visibilityBounds: Bounds = {
        left: visibilityCamera.x - visibilityExtents.halfViewW,
        top: visibilityCamera.y - visibilityExtents.halfViewH,
        right: visibilityCamera.x + visibilityExtents.halfViewW,
        bottom: visibilityCamera.y + visibilityExtents.halfViewH,
      };
      const allEnemies = [...gameState.enemies];
      const visibleEnemies = cullEntities(
        allEnemies,
        expandBounds(visibilityBounds, MAX_ENEMY_RADIUS),
        (enemy) => enemy.rad,
      );
      const visibleEnemySet =
        visibleEnemies.length === allEnemies.length ? null : new Set(visibleEnemies);

      // ═══════════════════════════════════════════════════════════
      // SISTEMA DE SPAWN DINÁMICO BASADO EN DIFICULTAD
      // ═══════════════════════════════════════════════════════════

      gameState.lastSpawn += dt;

      const spawnLoopIntensity = gameState.difficulty.intensity;

      if (gameState.spawnCooldown > 0) {
        gameState.spawnCooldown = Math.max(0, gameState.spawnCooldown - dt);
      }

      if (
        gameState.enemies.length === 0 &&
        gameState.normalEnemyCount === 0 &&
        gameState.canSpawn
      ) {
        gameState.canSpawn = false;
        gameState.spawnCooldown = Math.max(0.5, 2.5 - spawnLoopIntensity * 0.15);
      }

      if (!gameState.canSpawn && gameState.spawnCooldown === 0) {
        gameState.canSpawn = true;
      }

      let normalEnemyCount = gameState.normalEnemyCount;
      const canSpawnNow =
        !gameState.tutorialActive &&
        normalEnemyCount < gameState.maxConcurrentEnemies &&
        gameState.canSpawn;

      if (canSpawnNow) {
        const spawnInterval = Math.max(0.18, 1.15 / (1 + spawnLoopIntensity * 0.55));
        if (gameState.lastSpawn >= spawnInterval) {
          const burstChance = Math.min(0.55, 0.12 + spawnLoopIntensity * 0.05);
          const burstBase = spawnLoopIntensity > 5 ? 3 : 2;
          let spawnCount = 1;
          if (Math.random() < burstChance) {
            const burstExtra = spawnLoopIntensity > 8 ? 3 : spawnLoopIntensity > 4 ? 2 : 1;
            spawnCount = Math.min(6, burstBase + Math.floor(Math.random() * burstExtra));
          }

          for (let i = 0; i < spawnCount; i++) {
            if (normalEnemyCount < gameState.maxConcurrentEnemies) {
              spawnEnemy();
              normalEnemyCount = gameState.normalEnemyCount;
            }
          }

          gameState.lastSpawn = 0;
        }
      }

      const bossInterval = Math.max(75, 240 - difficultyIntensity * 18);
      if (
        !gameState.tutorialActive &&
        !gameState.bossEncounter.portalSpawned &&
        !gameState.bossEncounter.bossActive &&
        gameState.elapsedTime - gameState.lastBossSpawn > bossInterval
      ) {
        spawnBoss();
        gameState.lastBossSpawn = gameState.elapsedTime;
      }

      const handleEnemyDeath = (enemy: any, killer: any | null) => {
        if (!enemy || (enemy as any).__removed) {
          return;
        }

        const enemyIndex = gameState.enemies.indexOf(enemy);
        if (enemyIndex === -1) {
          (enemy as any).__removed = true;
          return;
        }

        recordEnemyKill(enemy);
        (enemy as any).__removed = true;

        applyDifficultyEvent(enemy.isElite || enemy.isBoss ? "on_elite_kill" : "on_enemy_kill");
        gameState.difficulty.variables.no_kill_seconds = 0;

        if (!enemy.isBoss) {
          gameState.normalEnemyCount = Math.max(0, gameState.normalEnemyCount - 1);
          normalEnemyCount = gameState.normalEnemyCount;
        }
        gameState.enemies.splice(enemyIndex, 1);

        if (enemy.isBoss && (enemy as any).isUniqueBoss) {
          gameState.bossEncounter.bossActive = false;
          if (gameState.bossEncounter.uniqueBossId === (enemy as any).uniqueBossId) {
            gameState.bossEncounter.uniqueBossId = null;
          }
          gameState.bossEncounter.portalSpawned = false;
          if (!gameState.bossEncounter.bossDefeated) {
            gameState.bossEncounter.bossDefeated = true;
            const portal = gameState.bossPortal ?? gameState.exitPortal;
            if (portal) {
              portal.type = "exit";
              portal.active = true;
              portal.interactable = true;
              portal.status = "open" as BossPortalStatus;
              portal.activated = true;
              portal.bossSpawnAt = null;
              portal.activationProgress = 0;
              portal.spawnTime = gameState.time;
              gameState.exitPortal = portal;
              gameState.bossPortal = null;
            } else {
              spawnExitPortal({ x: enemy.x, y: enemy.y });
            }
            gameState.postBossSurvival = {
              active: true,
              elapsed: 0,
              nextReward: POST_BOSS_REWARD_INTERVAL,
              rewardsGranted: 0,
              lootBiasBonus: { rare: 5, epic: 3, legendary: 1 },
            };
            gameState.bossFailSafe.respawned = false;
          }
        }

        if (enemy.specialType === "explosive") {
          resolveExploderExplosion(enemy);
        }

        let points = 10;
        let xpBundles = 1;
        let dropChance = 0;

        if (enemy.isBoss) {
          points = 500;
          xpBundles = 10;
          const legendaryItems = ITEMS.filter((it) => {
            if (it.rarity !== "legendary") return false;
            const currentStacks = gameState.player.itemStacks[it.id] ?? 0;
            if (it.maxStacks !== undefined && currentStacks >= it.maxStacks) {
              return false;
            }
            return true;
          });
          if (legendaryItems.length > 0) {
            const randomLegendary = legendaryItems[Math.floor(Math.random() * legendaryItems.length)];
            grantItemToPlayer(randomLegendary, { notify: true, playSound: true });
          }
          gameState.player.hp = gameState.player.maxhp;
        } else if (enemy.isElite) {
          points = 25;
          xpBundles = 2;
          dropChance = 0.15;
        } else if (enemy.specialType) {
          points = 15;
          xpBundles = 1;
          dropChance = 0.08;
        } else if (enemy.enemyType === "strong") {
          points = 10;
          xpBundles = 1;
          dropChance = 0.05;
        } else if (enemy.enemyType === "medium") {
          points = 7;
          xpBundles = 1;
          dropChance = 0.03;
        } else {
          points = 5;
          xpBundles = 1;
          dropChance = 0.02;
        }

        gameState.score += points;
        setScore(gameState.score);

        for (let k = 0; k < xpBundles; k++) {
          const offsetX = (Math.random() - 0.5) * 40;
          const offsetY = (Math.random() - 0.5) * 40;
          let xpValue =
            enemy.enemyType === "strong"
              ? 5
              : enemy.enemyType === "medium"
                ? 3
                : 2;

          const hordeStacksForXp = getItemStacks("hordetotem");
          if (hordeStacksForXp > 0) {
            xpValue += 2 * hordeStacksForXp;
          }

          dropXP(enemy.x + offsetX, enemy.y + offsetY, xpValue);
        }

        const healRoll = Math.random();
        const luckStacks = getItemStacks("luck");
        const luckMultiplier = luckStacks > 0 ? 1 + 0.5 * luckStacks : 1;
        const chestDropLuckBonus = luckStacks > 0 ? Math.min(0.02 * luckStacks, 0.06) : 0;
        const chestDropChance = Math.min(1, CHEST_DROP_RATE + chestDropLuckBonus);

        if (healRoll < 0.05 * luckMultiplier) {
          dropHeal(enemy.x, enemy.y);
        }

        if (Math.random() < dropChance) {
          const roll = Math.random();
          const powerupType = roll < 0.3 ? "magnet" : roll < 0.5 ? "shield" : roll < 0.65 ? "rage" : "speed";
          dropPowerup(enemy.x, enemy.y, powerupType);
        }

        if (Math.random() < chestDropChance) {
          dropChest(enemy.x, enemy.y);
        }

        if (
          enemy.specialType === "tank" &&
          getItemStacks(HORIZON_VISOR_ITEM.id) < (HORIZON_VISOR_ITEM.maxStacks ?? Infinity) &&
          Math.random() < 0.15
        ) {
          dropHorizonVisor(enemy.x, enemy.y);
        }

        if (gameState.player.stats.vampire > 0 && killer) {
          const healAmount = Math.floor(killer.damage * gameState.player.stats.vampire * 10);
          gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + healAmount);
        }

        const solarStacks = getItemStacks("solargauntlet");
        if (solarStacks > 0) {
          gameState.player.stats.solarGauntletKills++;
          const requiredKills = Math.max(2, 10 - (solarStacks - 1) * 2);
          if (gameState.player.stats.solarGauntletKills >= requiredKills) {
            gameState.player.stats.solarGauntletKills = 0;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
              gameState.bullets.push({
                x: gameState.player.x,
                y: gameState.player.y,
                dir: angle,
                spd: 15 * 60,
                life: 3,
                damage: gameState.player.stats.damageMultiplier * 50 * solarStacks,
                color: "#ffc300",
                bounces: 0,
                bounceOnEnemies: false,
                pierce: true,
                aoe: false,
              });
            }
            if (gameState.particles.length < gameState.maxParticles - 30) {
              for (let j = 0; j < 30; j++) {
                const angle = (Math.PI * 2 * j) / 30;
                gameState.particles.push({
                  x: gameState.player.x,
                  y: gameState.player.y,
                  vx: Math.cos(angle) * 10,
                  vy: Math.sin(angle) * 10,
                  life: 1,
                  color: "#ffc300",
                  size: 5,
                });
              }
            }
            playPowerupSound();
          }
        }

        const bloodstoneStacks = getItemStacks("bloodstone");
        if (bloodstoneStacks > 0) {
          gameState.player.stats.bloodstoneKills++;
          const killsRequired = Math.max(10, 30 - (bloodstoneStacks - 1) * 5);
          if (gameState.player.stats.bloodstoneKills >= killsRequired) {
            gameState.player.stats.bloodstoneKills = 0;
            const healAmount = 5 * bloodstoneStacks;
            gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + healAmount);
            if (gameState.particles.length < gameState.maxParticles - 12) {
              for (let j = 0; j < 12; j++) {
                const angle = (Math.PI * 2 * j) / 12;
                gameState.particles.push({
                  x: gameState.player.x,
                  y: gameState.player.y,
                  vx: Math.cos(angle) * 4,
                  vy: Math.sin(angle) * 4,
                  life: 0.8,
                  color: BOSS_COLOR,
                  size: 4,
                });
              }
            }
          }
        }
      };

      // Mover enemigos y aplicar efectos elementales
      for (const e of allEnemies) {
        const isVisible = visibleEnemySet ? visibleEnemySet.has(e) : true;
        // Efectos elementales (DoT)
        if (e.burnTimer > 0) {
          e.burnTimer -= dt;
          e.hp -= 0.5 * dt; // 0.5 daño por segundo
          // Partículas de fuego
          if (
            isVisible &&
            Math.random() < 0.1 &&
            gameState.particles.length < gameState.maxParticles
          ) {
            gameState.particles.push({
              x: e.x + (Math.random() - 0.5) * e.rad,
              y: e.y + (Math.random() - 0.5) * e.rad,
              vx: Math.random() - 0.5,
              vy: -1,
              life: 0.5,
              color: "#ff7a2a",
              size: 3,
            });
          }
        }

        if (e.poisonTimer > 0) {
          e.poisonTimer -= dt;
          e.hp -= 0.3 * dt; // 0.3 daño por segundo (ignora defensa)
          // Partículas de veneno
          if (
            isVisible &&
            Math.random() < 0.1 &&
            gameState.particles.length < gameState.maxParticles
          ) {
            gameState.particles.push({
              x: e.x + (Math.random() - 0.5) * e.rad,
              y: e.y + (Math.random() - 0.5) * e.rad,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              life: 0.8,
              color: "#5dbb63",
              size: 2,
            });
          }
        }

        if (e.hp <= 0) {
          handleEnemyDeath(e, null);
          continue;
        }

        // Movimiento (ralentizado si está congelado)
        let movementSpeed = e.spd;
        if (e.frozenTimer > 0) {
          e.frozenTimer -= dt;
          movementSpeed *= 0.5; // 50% más lento
        }

        if (typeof (e as any).acceleration === "number") {
          const accel = Math.max(0.1, (e as any).acceleration);
          const current = typeof (e as any).currentSpeed === "number" ? (e as any).currentSpeed : 0;
          const target = movementSpeed;
          const blend = Math.min(1, accel * dt * 4);
          const nextSpeed = current + (target - current) * blend;
          (e as any).currentSpeed = nextSpeed;
          movementSpeed = nextSpeed;
        }

        // Comportamientos especiales de enemigos

        // BOMBER: Countdown de explosión
        if (e.specialType === "explosive" && e.explosionTimer !== undefined && e.explosionTimer >= 0) {
          e.explosionTimer -= dt;

          // Partículas de advertencia (más intensas cerca de explotar)
          const warningIntensity = e.explosionTimer < 0.5 ? 0.8 : 0.3;
          if (
            isVisible &&
            Math.random() < warningIntensity &&
            gameState.particles.length < gameState.maxParticles
          ) {
            gameState.particles.push({
              x: e.x + (Math.random() - 0.5) * e.rad * 2,
              y: e.y + (Math.random() - 0.5) * e.rad * 2,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              life: 0.3,
              color: e.explosionTimer < 0.5 ? "#ffc300" : "#ef4444",
              size: e.explosionTimer < 0.5 ? 5 : 3,
            });
          }

          // BOOM! Explosión
          if (e.explosionTimer <= 0) {
            resolveExploderExplosion(e, dt);
            e.specialType = null;
            e.hp = 0;
            handleEnemyDeath(e, null);
            continue;
          }
        }

        if (e.specialType === "summoner" && e.summonCooldown !== undefined) {
          e.summonCooldown -= dt;
          if (e.summonCooldown <= 0 && normalEnemyCount < gameState.maxConcurrentEnemies) {
            // Invocar zombi pequeño (NO cuenta en límite si viene de summoner en jefe)
            for (let i = 0; i < 2 && normalEnemyCount < gameState.maxConcurrentEnemies; i++) {
              const angle = Math.random() * Math.PI * 2;
              const dist = 30;
              const summonedEnemy: EnemyWithCategory = {
                x: e.x + Math.cos(angle) * dist,
                y: e.y + Math.sin(angle) * dist,
                rad: scaleEnemyRadius(8),
                hp: 1,
                maxhp: 1,
                spd: applyEnemySpeedModifier(2.5),
                category: inferEnemyCategory({ isSummoned: true }),
                enemyType: "weak",
                damage: 3,
                isElite: false,
                isBoss: false,
                isSummoned: true, // Marcado como invocado, no cuenta para la dificultad
                color: "#8e44ad",
                specialType: null,
                frozenTimer: 0,
                burnTimer: 0,
                poisonTimer: 0,
              };

              gameState.enemies.push(summonedEnemy);
              gameState.normalEnemyCount++;
              normalEnemyCount = gameState.normalEnemyCount;
            }
            e.summonCooldown = 8; // 8 segundos entre invocaciones
          }
        }

        // Movimiento hacia el jugador (excepto bosses con comportamiento especial)
        if (!e.isBoss) {
          const dx = gameState.player.x - e.x;
          const dy = gameState.player.y - e.y;
          const distanceSq = dx * dx + dy * dy;

          if (distanceSq > MAX_DISTANCE_FROM_PLAYER_SQ) {
            const { x: respawnX, y: respawnY } = getSpawnPositionAroundPlayer(e.rad ?? scaleEnemyRadius(12), {
              minDistance: RESPAWN_DISTANCE_MIN,
              maxDistance: RESPAWN_DISTANCE_MAX,
            });
            e.x = respawnX;
            e.y = respawnY;
            continue;
          }

          const d = Math.sqrt(distanceSq) || 1;

          // Bonus de velocidad si está en zona radiactiva (lluvia)
          let speedBonus = 1;
          if (gameState.environmentalEvent === "rain") {
            for (const h of gameState.hotspots) {
              if (h.isRadioactive) {
                const distToZone = Math.hypot(e.x - h.x, e.y - h.y);
                if (distToZone < h.rad) {
                  speedBonus = 1.5; // +50% velocidad en zona radiactiva
                  break;
                }
              }
            }
          }

          let targetDirX = dx / d;
          let targetDirY = dy / d;

          if (e.specialType === "explosive" && typeof (e as any).allyAvoidanceRadius === "number") {
            const avoidanceRadius = (e as any).allyAvoidanceRadius as number;
            const radiusSq = avoidanceRadius * avoidanceRadius;
            let avoidX = 0;
            let avoidY = 0;
            let avoidCount = 0;
            for (const other of gameState.enemies) {
              if (!other || other === e || other.hp <= 0 || (other as any).__removed) continue;
              const adx = e.x - other.x;
              const ady = e.y - other.y;
              const distSq = adx * adx + ady * ady;
              if (distSq > 0 && distSq < radiusSq) {
                const dist = Math.sqrt(distSq);
                avoidX += adx / dist;
                avoidY += ady / dist;
                avoidCount++;
              }
            }

            if (avoidCount > 0) {
              const weight = 0.35;
              const avgX = avoidX / avoidCount;
              const avgY = avoidY / avoidCount;
              targetDirX = targetDirX * (1 - weight) + avgX * weight;
              targetDirY = targetDirY * (1 - weight) + avgY * weight;
              movementSpeed *= 1 / (1 + avoidCount * 0.25);
            }
          }

          const targetDirLength = Math.hypot(targetDirX, targetDirY) || 1;
          targetDirX /= targetDirLength;
          targetDirY /= targetDirLength;

          e.x += targetDirX * movementSpeed * speedBonus;
          e.y += targetDirY * movementSpeed * speedBonus;
        } else {
          // Comportamiento de boss
          if (e.phase === 1 && e.hp < e.maxhp * 0.66) e.phase = 2;
          if (e.phase === 2 && e.hp < e.maxhp * 0.33) e.phase = 3;

          e.attackCooldown -= dt;
          e.jumpCooldown -= dt;
          e.projectileCooldown -= dt;

          // Fase 1: movimiento normal + proyectiles ocasionales
          if (e.phase === 1) {
            const dx = gameState.player.x - e.x;
            const dy = gameState.player.y - e.y;
            const d = Math.hypot(dx, dy) || 1;
            e.x += (dx / d) * movementSpeed;
            e.y += (dy / d) * movementSpeed;

            if (e.projectileCooldown <= 0) {
              // Disparar proyectil al jugador
              const dir = Math.atan2(gameState.player.y - e.y, gameState.player.x - e.x);
              gameState.bullets.push({
                x: e.x,
                y: e.y,
                dir,
                spd: 5 * 60,
                life: 3,
                damage: 15,
                color: "#ef4444",
                bounces: 0,
                bounceOnEnemies: false,
                pierce: false,
                aoe: false,
                isEnemyBullet: true,
              });
              e.projectileCooldown = 2;
            }
          }
          // Fase 2: saltos + más proyectiles
          else if (e.phase === 2) {
            if (e.jumpCooldown <= 0) {
              // Saltar a posición aleatoria
              e.x = Math.random() * (gameState.worldWidth - 100) + 50;
              e.y = Math.random() * (gameState.worldHeight - 100) + 50;
              e.jumpCooldown = 4;

              // Partículas de salto
              if (isVisible) {
                for (let j = 0; j < 20; j++) {
                  const angle = (Math.PI * 2 * j) / 20;
                  gameState.particles.push({
                    x: e.x,
                    y: e.y,
                    vx: Math.cos(angle) * 8,
                    vy: Math.sin(angle) * 8,
                    life: 0.8,
                    color: BOSS_COLOR,
                    size: 4,
                  });
                }
              }
            }

            if (e.projectileCooldown <= 0) {
              // Disparar 3 proyectiles en spread
              for (let i = -1; i <= 1; i++) {
                const dir = Math.atan2(gameState.player.y - e.y, gameState.player.x - e.x) + i * 0.3;
                gameState.bullets.push({
                  x: e.x,
                  y: e.y,
                  dir,
                  spd: 6 * 60,
                  life: 3,
                  damage: 15,
                  color: "#ef4444",
                  bounces: 0,
                  bounceOnEnemies: false,
                  pierce: false,
                  aoe: false,
                  isEnemyBullet: true,
                });
              }
              e.projectileCooldown = 1.5;
            }
          }
          // Fase 3: frenético - saltos rápidos + patrón circular de proyectiles
          else if (e.phase === 3) {
            if (e.jumpCooldown <= 0) {
              e.x = Math.random() * (gameState.worldWidth - 100) + 50;
              e.y = Math.random() * (gameState.worldHeight - 100) + 50;
              e.jumpCooldown = 2.5;

              // Patrón circular de proyectiles
              for (let j = 0; j < 8; j++) {
                const angle = (Math.PI * 2 * j) / 8;
                gameState.bullets.push({
                  x: e.x,
                  y: e.y,
                  dir: angle,
                  spd: 5 * 60,
                  life: 4,
                  damage: 20,
                  color: BOSS_COLOR,
                  bounces: 0,
                  bounceOnEnemies: false,
                  pierce: false,
                  aoe: false,
                  isEnemyBullet: true,
                });
              }

              // Partículas de salto
              if (isVisible) {
                for (let j = 0; j < 30; j++) {
                  const angle = (Math.PI * 2 * j) / 30;
                  gameState.particles.push({
                    x: e.x,
                    y: e.y,
                    vx: Math.cos(angle) * 10,
                    vy: Math.sin(angle) * 10,
                    life: 1,
                    color: BOSS_COLOR,
                    size: 5,
                  });
                }
              }
            }
          }
        }
      }

      for (const enemy of [...gameState.enemies]) {
        if (enemy.hp <= 0 && !(enemy as any).__removed) {
          handleEnemyDeath(enemy, null);
        }
      }

      // Disparo automático
      autoShoot(dt);
      weaponAudioController.updateLoopingSounds();

      // Actualizar balas
      for (const b of gameState.bullets) {
        // Homing missiles
        if (b.homing && b.homingTarget && gameState.enemies.includes(b.homingTarget)) {
          const target = b.homingTarget;
          const targetDir = Math.atan2(target.y - b.y, target.x - b.x);
          const turnSpeed = 0.1;
          let angleDiff = targetDir - b.dir;
          // Normalizar ángulo
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          b.dir += angleDiff * turnSpeed;
        }

        const distance = b.spd * dt;
        b.x += Math.cos(b.dir) * distance;
        b.y += Math.sin(b.dir) * distance;
        b.life -= dt;

        if (b.explosive && b.trailColor && gameState.particles.length < gameState.maxParticles - 5) {
          const jitter = (Math.random() - 0.5) * 4;
          gameState.particles.push({
            x: b.x - Math.cos(b.dir) * 10 + jitter,
            y: b.y - Math.sin(b.dir) * 10 + (Math.random() - 0.5) * 4,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 0.35 + Math.random() * 0.2,
            color: b.trailColor,
            size: 3.5 + Math.random() * 2,
          });

          if (gameState.particles.length < gameState.maxParticles - 2) {
            gameState.particles.push({
              x: b.x - Math.cos(b.dir) * 14 + (Math.random() - 0.5) * 6,
              y: b.y - Math.sin(b.dir) * 14 + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 1.2,
              vy: (Math.random() - 0.5) * 1.2,
              life: 0.5 + Math.random() * 0.3,
              color: "rgba(55, 65, 81, 0.5)",
              size: 4 + Math.random() * 3,
            });
          }
        }

        // Rebote en bordes
        if (b.bounces > 0) {
          if (b.x < 0 || b.x > gameState.worldWidth) {
            b.dir = Math.PI - b.dir;
            b.bounces--;
            b.x = Math.max(0, Math.min(gameState.worldWidth, b.x));
          }
          if (b.y < 0 || b.y > gameState.worldHeight) {
            b.dir = -b.dir;
            b.bounces--;
            b.y = Math.max(0, Math.min(gameState.worldHeight, b.y));
          }
        }
      }

      {
        const camera = gameState.camera ?? {
          x: gameState.player.x,
          y: gameState.player.y,
          zoom: getTargetCameraZoom(),
        };
        const { minX, maxX, minY, maxY } = getCameraBounds(camera, W, H, 50);
        gameState.bullets = gameState.bullets.filter(
          (b: any) => b.life > 0 && b.x >= minX && b.x <= maxX && b.y >= minY && b.y <= maxY,
        );
      }

      const spatialHash = spatialHashRef.current;
      const neighborBuffer = bulletNeighborBufferRef.current;
      const fallbackEnemies = fallbackEnemyListRef.current;
      const chainedEnemies = chainedEnemiesRef.current;
      const useSpatialHash = gameState.enemies.length >= 6 && gameState.bullets.length >= 4;

      spatialHash.reset();
      fallbackEnemies.length = 0;

      for (const enemy of gameState.enemies) {
        spatialHash.insertEnemy(enemy);
        if (!useSpatialHash) {
          fallbackEnemies.push(enemy);
        }
        (enemy as any).__removed = false;
      }

      for (const bullet of gameState.bullets) {
        const projectile = bullet as typeof bullet & { rad?: number };
        if (projectile.rad === undefined) {
          projectile.rad = BULLET_RADIUS;
        }
        spatialHash.insertProjectile(projectile as any);
      }

      const triggerExplosion = (bullet: any, hitCategories: EnemyCategory[]) => {
        if (!bullet.explosive || bullet.explosionTriggered) {
          return;
        }

        bullet.explosionTriggered = true;

        const originX = bullet.x;
        const originY = bullet.y;
        const explosionRadius = bullet.explosionRadius ?? 100;
        const explosionRadiusSq = explosionRadius * explosionRadius;
        const splashMultiplier = bullet.explosionDamageMultiplier ?? 0.75;
        const splashBaseDamage = bullet.damage * splashMultiplier;

        const enemiesSnapshot = [...gameState.enemies];
        for (const candidate of enemiesSnapshot) {
          if (!candidate || (candidate as any).__removed || candidate.hp <= 0) continue;

          const cdx = candidate.x - originX;
          const cdy = candidate.y - originY;
          const distSq = cdx * cdx + cdy * cdy;
          if (distSq > explosionRadiusSq) continue;

          const distance = Math.sqrt(distSq);
          const damageMultiplier = 1 - (distance / explosionRadius) * 0.5;
          const damageAmount = splashBaseDamage * damageMultiplier;
          if (damageAmount <= 0) continue;

          candidate.hp -= damageAmount;
          trackEnemyCategoryHit(candidate as EnemyWithCategory, hitCategories);

          if (candidate.hp <= 0) {
            handleEnemyDeath(candidate, bullet);
          }
        }

        const pushParticle = (particle: any) => {
          if (gameState.particles.length < gameState.maxParticles) {
            gameState.particles.push(particle);
          }
        };

        const primaryColor = bullet.explosionColor ?? "#ff7a2a";
        const secondaryColor = bullet.explosionSecondaryColor ?? "#facc15";
        const ringColor = bullet.explosionRingColor ?? "rgba(255, 255, 255, 0.85)";

        pushParticle({
          x: originX,
          y: originY,
          vx: 0,
          vy: 0,
          life: 0.22,
          color: ringColor,
          size: 16,
        });

        for (let j = 0; j < 36; j++) {
          const angle = (Math.PI * 2 * j) / 36;
          const speed = 7 + Math.random() * 7;
          pushParticle({
            x: originX,
            y: originY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.7 + Math.random() * 0.4,
            color: j % 2 === 0 ? primaryColor : secondaryColor,
            size: 5 + Math.random() * 3,
          });
        }

        for (let j = 0; j < 24; j++) {
          const angle = (Math.PI * 2 * j) / 24;
          const outward = explosionRadius * 0.12;
          pushParticle({
            x: originX + Math.cos(angle) * (explosionRadius * 0.25),
            y: originY + Math.sin(angle) * (explosionRadius * 0.25),
            vx: Math.cos(angle) * outward,
            vy: Math.sin(angle) * outward,
            life: 0.45 + Math.random() * 0.25,
            color: ringColor,
            size: 3 + Math.random() * 1.5,
          });
        }

        for (let j = 0; j < 18; j++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2.5;
          pushParticle({
            x: originX,
            y: originY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.8 + Math.random() * 0.6,
            color: "rgba(31, 41, 55, 0.55)",
            size: 6 + Math.random() * 4,
          });
        }

        gameState.explosionMarks.push({
          x: originX,
          y: originY,
          radius: explosionRadius * 0.65,
          life: 3.5,
        });

        bullet.life = 0;
      };

      if (gameState.bossEncounter.bossActive) {
        const uniqueBoss = gameState.enemies.find(
          (candidate: any) => candidate?.isBoss && (candidate as any).isUniqueBoss,
        );
        if (uniqueBoss) {
          const failSafe = gameState.bossFailSafe;
          if (gameState.time - failSafe.lastHpCheck > 5) {
            failSafe.lastHpCheck = gameState.time;
            failSafe.lastHpValue = uniqueBoss.hp;
          }

          if (
            !failSafe.respawned &&
            gameState.time - failSafe.spawnTime > PORTAL_STUCK_FAILSAFE_SECONDS &&
            uniqueBoss.hp >= failSafe.lastHpValue - 1
          ) {
            const bossIndex = gameState.enemies.indexOf(uniqueBoss as any);
            if (bossIndex !== -1) {
              gameState.enemies.splice(bossIndex, 1);
            }
            failSafe.respawned = true;
            spawnUniqueBoss();
          }
        } else {
          gameState.bossEncounter.bossActive = false;
        }
      } else {
        gameState.bossFailSafe.respawned = false;
      }

      for (const bullet of gameState.bullets) {
        if (bullet.isEnemyBullet || bullet.life <= 0) continue;

        neighborBuffer.length = 0;
        const neighbors = useSpatialHash
          ? spatialHash.queryEnemies(bullet.x, bullet.y, BULLET_QUERY_RADIUS, neighborBuffer)
          : fallbackEnemies;

        if (neighbors.length === 0) continue;

        let hitSomething = false;
        const hitCategories: EnemyCategory[] = [];

        for (const enemy of neighbors) {
          if (!enemy || enemy.hp <= 0 || (enemy as any).__removed) continue;

          const combinedRadius = enemy.rad + BULLET_RADIUS;
          const dx = enemy.x - bullet.x;
          if (Math.abs(dx) > combinedRadius) continue;
          const dy = enemy.y - bullet.y;
          if (Math.abs(dy) > combinedRadius) continue;

          const distSq = dx * dx + dy * dy;
          if (distSq > combinedRadius * combinedRadius) continue;

          hitSomething = true;
          enemy.hp -= bullet.damage;
          trackEnemyCategoryHit(enemy as EnemyWithCategory, hitCategories);

          if (bullet.fire) {
            enemy.burnTimer = 3;
          }
          if (bullet.freeze) {
            enemy.frozenTimer = 2;
          }

          if (bullet.chain && bullet.chainCount > 0) {
            bullet.chainCount--;
            let closestEnemy: any = null;
            let closestDistSq = MAX_CHAIN_RADIUS * MAX_CHAIN_RADIUS;
            for (const candidate of neighbors) {
              if (!candidate || candidate === enemy || candidate.hp <= 0 || (candidate as any).__removed) continue;
              if (candidate.chainedThisShot) continue;
              const cdx = candidate.x - bullet.x;
              const cdy = candidate.y - bullet.y;
              const candidateDistSq = cdx * cdx + cdy * cdy;
              if (candidateDistSq < closestDistSq) {
                closestDistSq = candidateDistSq;
                closestEnemy = candidate;
              }
            }

            if (closestEnemy) {
              closestEnemy.hp -= bullet.damage * 0.7;
              trackEnemyCategoryHit(closestEnemy as EnemyWithCategory, hitCategories);
              closestEnemy.chainedThisShot = true;
              if (!chainedEnemies.includes(closestEnemy)) {
                chainedEnemies.push(closestEnemy);
              }
              if (gameState.particles.length < gameState.maxParticles - 5) {
                for (let j = 0; j < 5; j++) {
                  const t = j / 5;
                  gameState.particles.push({
                    x: bullet.x + (closestEnemy.x - bullet.x) * t,
                    y: bullet.y + (closestEnemy.y - bullet.y) * t,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 0.3,
                    color: "#2e86c1",
                    size: 3,
                  });
                }
              }
              bullet.x = closestEnemy.x;
              bullet.y = closestEnemy.y;
              if (closestEnemy.hp <= 0) {
                handleEnemyDeath(closestEnemy, bullet);
              }
            } else {
              bullet.life = 0;
            }
          }

          if (bullet.aoe) {
            if (bullet.explosive) {
              triggerExplosion(bullet, hitCategories);
              if (bullet.life <= 0) {
                break;
              }
            } else {
              const explosionRadius = 100;
              const splashDamage = bullet.damage * 0.75;
              const explosionRadiusSq = explosionRadius * explosionRadius;

              for (const candidate of neighbors) {
                if (!candidate || (candidate as any).__removed) continue;
                const cdx = candidate.x - bullet.x;
                const cdy = candidate.y - bullet.y;
                const candidateDistSq = cdx * cdx + cdy * cdy;
                if (candidateDistSq < explosionRadiusSq) {
                  const distance = Math.sqrt(candidateDistSq);
                  const damageMultiplier = 1 - (distance / explosionRadius) * 0.5;
                  candidate.hp -= splashDamage * damageMultiplier;
                  trackEnemyCategoryHit(candidate as EnemyWithCategory, hitCategories);

                  if (gameState.particles.length < gameState.maxParticles - 3) {
                    for (let k = 0; k < 3; k++) {
                      gameState.particles.push({
                        x: candidate.x,
                        y: candidate.y,
                        vx: (Math.random() - 0.5) * 3,
                        vy: (Math.random() - 0.5) * 3,
                        life: 0.4,
                        color: "#ef4444",
                        size: 4,
                      });
                    }
                  }

                  if (candidate.hp <= 0) {
                    handleEnemyDeath(candidate, bullet);
                  }
                }
              }

              if (gameState.particles.length < gameState.maxParticles - 30) {
                for (let j = 0; j < 30; j++) {
                  const angle = (Math.PI * 2 * j) / 30;
                  const speed = 3 + Math.random() * 5;
                  gameState.particles.push({
                    x: bullet.x,
                    y: bullet.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.8,
                    color: j % 2 === 0 ? "#8e44ad" : "#ff7a2a",
                    size: 4,
                  });
                }
              }
            }
          }

          if (bullet.bounceOnEnemies && bullet.bounces > 0) {
            let closestEnemy: any = null;
            let closestDistSq = MAX_BOUNCE_RADIUS * MAX_BOUNCE_RADIUS;
            for (const candidate of neighbors) {
              if (!candidate || candidate === enemy || (candidate as any).__removed || candidate.hp <= 0) continue;
              const cdx = candidate.x - bullet.x;
              const cdy = candidate.y - bullet.y;
              const candidateDistSq = cdx * cdx + cdy * cdy;
              if (candidateDistSq < closestDistSq) {
                closestDistSq = candidateDistSq;
                closestEnemy = candidate;
              }
            }

            if (closestEnemy) {
              bullet.dir = Math.atan2(closestEnemy.y - bullet.y, closestEnemy.x - bullet.x);
              bullet.bounces--;
              if (gameState.particles.length < gameState.maxParticles - 5) {
                const bounceParticleColor =
                  bullet.visualType === "flame"
                    ? "#fb923c"
                    : bullet.visualType === "frost"
                      ? "#60a5fa"
                      : "#facc15";
                for (let j = 0; j < 5; j++) {
                  gameState.particles.push({
                    x: bullet.x,
                    y: bullet.y,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    life: 0.3,
                    color: bounceParticleColor,
                    size: 2,
                  });
                }
              }
            } else if (!bullet.pierce) {
              bullet.life = 0;
            }
          } else if (!bullet.pierce) {
            bullet.life = 0;
          }

          if (enemy.hp <= 0) {
            handleEnemyDeath(enemy, bullet);
          }

          if (bullet.life <= 0) {
            break;
          }
        }

        if (hitSomething) {
          playImpactSoundForWeapon(bullet.weaponId, hitCategories);
        }

        for (let i = chainedEnemies.length - 1; i >= 0; i--) {
          const chainedEnemy = chainedEnemies[i];
          chainedEnemy.chainedThisShot = false;
        }
        chainedEnemies.length = 0;
      }

      // Actualizar lifetime de drops y eliminar expirados
      for (let i = gameState.drops.length - 1; i >= 0; i--) {
        const g = gameState.drops[i];

        // Decrementar lifetime solo para XP
        if (g.type === "xp" && g.lifetime !== undefined) {
          g.lifetime -= dt;
          if (g.lifetime <= 0) {
            gameState.drops.splice(i, 1);
            continue;
          }
        }
      }

      // Recoger drops
      let playerPickupSpeed = gameState.player.spd * gameState.player.stats.speedMultiplier;
      if (gameState.player.rageTimer > 0) playerPickupSpeed *= 1.5;
      if (gameState.player.isSprinting) playerPickupSpeed *= 1.7;
      const pickupAttractionSpeed = playerPickupSpeed * 1.2;

      let nearbyChest: any | null = null;

      for (let i = gameState.drops.length - 1; i >= 0; i--) {
        const g = gameState.drops[i];
        const dx = gameState.player.x - g.x;
        const dy = gameState.player.y - g.y;
        const d = Math.hypot(dx, dy) || 1;

        if (g.type === "chest") {
          if (!g.opened && !gameState.activeChestChoice) {
            const interactRange = gameState.player.rad + g.rad;
            if (d < interactRange) {
              nearbyChest = g;
              if (gameState.state === "running") {
                openChest(g);
              }
            }
          }
          continue;
        }

        // Magnet: aplicar multiplicadores del libro y del powerup temporal
        let magnetRange = gameState.player.magnet * gameState.player.stats.magnetMultiplier;
        if (gameState.player.tempMagnetTimer > 0) {
          magnetRange *= 2; // Powerup temporal duplica el rango
        }

        if (d < magnetRange) {
          g.x += (dx / d) * pickupAttractionSpeed;
          g.y += (dy / d) * pickupAttractionSpeed;
        }

        if (d < gameState.player.rad + g.rad) {
          if (gameState.activeChestChoice) {
            continue;
          }
          if (g.type === "xp") {
            collectXP(g.val);
          } else if (g.type === "heal") {
            const beforeHp = gameState.player.hp;
            gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + g.val);
            const healedAmount = Math.max(0, gameState.player.hp - beforeHp);
            recordHealPickup(healedAmount);
            playPowerupSound();
            // Partículas de curación con límite
            if (gameState.particles.length < gameState.maxParticles - 15) {
              for (let j = 0; j < 15; j++) {
                const angle = (Math.PI * 2 * j) / 15;
                gameState.particles.push({
                  x: gameState.player.x,
                  y: gameState.player.y,
                  vx: Math.cos(angle) * 3,
                  vy: Math.sin(angle) * 3,
                  life: 0.6,
                  color: "#5dbb63",
                  size: 4,
                });
              }
            }
          } else if (g.type === "powerup") {
            collectPowerup(g);
          } else if (g.type === "itemPickup") {
            const dropItem = g.item as Item | null | undefined;
            if (dropItem) {
              grantItemToPlayer(dropItem, { notify: true, playSound: true });
            }
          }
          gameState.drops.splice(i, 1);
        }
      }

      gameState.nearbyChest = gameState.activeChestChoice ? null : nearbyChest;

      gameState.nearbyBossPortal = null;
      gameState.nearbyExitPortal = null;

      const checkPortalProximity = (portal: GamePortal | null) => {
        if (!portal || !portal.active || portal.interactable === false) {
          return;
        }
        const dx = gameState.player.x - portal.x;
        const dy = gameState.player.y - portal.y;
        const dist = Math.hypot(dx, dy);
        const interactRadius = portal.rad + gameState.player.rad + 20;
        if (dist <= interactRadius) {
          if (portal.type === "boss") {
            gameState.nearbyBossPortal = portal;
          } else {
            gameState.nearbyExitPortal = portal;
          }
        }
      };

      checkPortalProximity(gameState.bossPortal);
      checkPortalProximity(gameState.exitPortal);

      const bossPortal = gameState.bossPortal;
      if (bossPortal) {
        const holdSeconds = bossPortal.activationHoldSeconds ?? PORTAL_ACTIVATION_HOLD_SECONDS;
        const activationProgress = bossPortal.activationProgress ?? 0;
        const interactHeld = Boolean(gameState.keys["e"]);
        const canInteract = bossPortal.interactable !== false;
        const isNearby =
          canInteract &&
          gameState.nearbyBossPortal === bossPortal &&
          bossPortal.status !== "spawningBoss" &&
          bossPortal.status !== "sealed";

        if (
          (bossPortal.status === "awaitingActivation" || bossPortal.status === "activating") &&
          isNearby &&
          interactHeld
        ) {
          bossPortal.status = "activating";
          bossPortal.activationProgress = Math.min(1, activationProgress + dt / Math.max(holdSeconds, 0.001));
          if ((bossPortal.activationProgress ?? 0) >= 1) {
            activateBossPortal();
          }
        } else if (bossPortal.status === "activating") {
          bossPortal.activationProgress = Math.max(0, activationProgress - dt * 0.75);
          if ((bossPortal.activationProgress ?? 0) <= 0.001) {
            bossPortal.activationProgress = 0;
            bossPortal.status = "awaitingActivation";
          }
        }

        if (bossPortal.status === "spawningBoss" && bossPortal.bossSpawnAt && gameState.time >= bossPortal.bossSpawnAt) {
          spawnUniqueBoss();
          bossPortal.status = "sealed";
          bossPortal.interactable = false;
          bossPortal.bossSpawnAt = null;
          bossPortal.activationProgress = 0;
        }
      }

      // Colisión jugador-enemigo con separación física - Rage mode invulnerable
      for (const e of gameState.enemies) {
        const dx = e.x - gameState.player.x;
        const dy = e.y - gameState.player.y;
        const d = Math.hypot(dx, dy);
        const minDist = e.rad + gameState.player.rad;

        if (d < minDist) {
          // Separación física (push)
          if (d > 0) {
            const overlap = minDist - d;
            const nx = dx / d;
            const ny = dy / d;

            // Empujar a ambos pero más al enemigo
            gameState.player.x -= nx * overlap * 0.3;
            gameState.player.y -= ny * overlap * 0.3;
            e.x += nx * overlap * 0.7;
            e.y += ny * overlap * 0.7;

            // Clamp player dentro del mapa después del empuje
            gameState.player.x = Math.max(
              gameState.player.rad,
              Math.min(gameState.worldWidth - gameState.player.rad, gameState.player.x),
            );
            gameState.player.y = Math.max(
              gameState.player.rad,
              Math.min(gameState.worldHeight - gameState.player.rad, gameState.player.y),
            );
          }

          // Daño solo si no está en rage mode y no es un boss (los bosses no hacen daño por contacto)
          if (!e.isBoss && gameState.player.rageTimer <= 0 && gameState.player.ifr <= 0) {
            // BOMBER: Activar explosión al contacto
            if (e.specialType === "explosive" && e.explosionTimer === -1) {
              e.explosionTimer = e.explosionDelay || 0; // Iniciar countdown

              // Efecto visual de activación
              if (gameState.particles.length < gameState.maxParticles - 15) {
                for (let j = 0; j < 15; j++) {
                  const angle = (Math.PI * 2 * j) / 15;
                  gameState.particles.push({
                    x: e.x,
                    y: e.y,
                    vx: Math.cos(angle) * 6,
                    vy: Math.sin(angle) * 6,
                    life: 0.5,
                    color: "#ef4444",
                    size: 4,
                  });
                }
              }

              // Si es instantáneo, explotar ahora
              if (e.explosionDelay === 0) {
                // Marcar para explosión inmediata (se maneja abajo)
                e.explosionTimer = 0;
              }

              continue; // No hacer daño de contacto normal, solo explosión
            }

            const reactiveImpactCategories: EnemyCategory[] = [];
            let playerWasHit = false;

            // First Hit Immune: revisar si es el primer golpe del ciclo actual
            const helmetStacks = getItemStacks("ballistichelmet");
            if (helmetStacks > gameState.player.stats.firstHitImmuneChargesUsed) {
              // Inmunidad al primer golpe
              gameState.player.stats.firstHitImmuneChargesUsed++;
              gameState.player.ifr = gameState.player.ifrDuration;
              // Efecto visual de inmunidad con límite
              if (gameState.particles.length < gameState.maxParticles - 15) {
                for (let j = 0; j < 15; j++) {
                  const angle = (Math.PI * 2 * j) / 15;
                  gameState.particles.push({
                    x: gameState.player.x,
                    y: gameState.player.y,
                    vx: Math.cos(angle) * 8,
                    vy: Math.sin(angle) * 8,
                    life: 1,
                    color: "#ffc300",
                    size: 4,
                  });
                }
              }
            } else if (gameState.player.shield > 0) {
              gameState.player.shield--;
              gameState.player.ifr = gameState.player.ifrDuration;
              playerWasHit = true;
              // Shield break particles con límite
              if (gameState.particles.length < gameState.maxParticles - 12) {
                for (let j = 0; j < 12; j++) {
                  const angle = (Math.PI * 2 * j) / 12;
                  gameState.particles.push({
                    x: gameState.player.x,
                    y: gameState.player.y,
                    vx: Math.cos(angle) * 6,
                    vy: Math.sin(angle) * 6,
                    life: 0.8,
                    color: "#2e86c1",
                    size: 3,
                  });
                }
              }
            } else {
              const safeCurrentHp = Number.isFinite(Number(gameState.player.hp))
                ? Number(gameState.player.hp)
                : Number(gameState.player.maxhp) || 0;
              const rawDmg = (e as any).damage;
              let dmg = Number.isFinite(Number(rawDmg)) ? Number(rawDmg) : 10;

              // Aplicar reducción de daño
              dmg *= 1 - gameState.player.stats.damageReduction;

              const nextHp = Math.max(0, Math.min(Number(gameState.player.maxhp) || 0, safeCurrentHp - dmg));
              gameState.player.hp = nextHp;
              const playerDied = nextHp <= 0;
              playerWasHit = true;
              gameState.player.ifr = gameState.player.ifrDuration;

              // Escudo Reactivo: empuja enemigos
              if (gameState.player.stats.reactiveShieldActive) {
                const reactiveStacks = Math.max(1, getItemStacks("reactiveshield"));
                const reactiveRadius = 150 * (1 + 0.1 * (reactiveStacks - 1));
                const reactivePush = 50 * reactiveStacks;
                const shieldKills: any[] = [];
                for (const enemy of gameState.enemies) {
                  const dist = Math.hypot(enemy.x - gameState.player.x, enemy.y - gameState.player.y);
                  if (dist < reactiveRadius) {
                    const pushDir = Math.atan2(enemy.y - gameState.player.y, enemy.x - gameState.player.x);
                    enemy.x += Math.cos(pushDir) * reactivePush;
                    enemy.y += Math.sin(pushDir) * reactivePush;
                    // Daño a enemigos empujados
                    enemy.hp -= gameState.player.stats.damageMultiplier * 5 * reactiveStacks;
                    if (enemy.hp <= 0) {
                      shieldKills.push(enemy);
                    }
                    trackEnemyCategoryHit(enemy as EnemyWithCategory, reactiveImpactCategories);
                  }
                }
                for (const slain of shieldKills) {
                  handleEnemyDeath(slain, null);
                }
                // Efecto visual de onda con límite
                if (gameState.particles.length < gameState.maxParticles - 20) {
                  for (let j = 0; j < 20; j++) {
                    const angle = (Math.PI * 2 * j) / 20;
                    gameState.particles.push({
                      x: gameState.player.x,
                      y: gameState.player.y,
                      vx: Math.cos(angle) * 12,
                      vy: Math.sin(angle) * 12,
                      life: 0.8,
                      color: "#8e44ad",
                      size: 4,
                    });
                  }
                }
              }

              // Hit particles con límite
              if (!playerDied && gameState.particles.length < gameState.maxParticles - 10) {
                for (let j = 0; j < 10; j++) {
                  const angle = (Math.PI * 2 * j) / 10;
                  gameState.particles.push({
                    x: gameState.player.x,
                    y: gameState.player.y,
                    vx: Math.cos(angle) * 4,
                    vy: Math.sin(angle) * 4,
                    life: 0.4,
                    color: "#ef4444",
                    size: 3,
                  });
                }
              }
            }

            if (playerWasHit) {
              playHitSound();
            }

            if (gameState.player.hp <= 0) {
              endGame();
            }

            if (reactiveImpactCategories.length > 0) {
              playImpactSoundForWeapon(undefined, reactiveImpactCategories);
            }
          }
        }
      }

      // Colisión jugador-balas de enemigos
      for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const b = gameState.bullets[i];
        if (b.isEnemyBullet) {
          const d = Math.hypot(b.x - gameState.player.x, b.y - gameState.player.y);
          if (d < gameState.player.rad + 4) {
            if (gameState.player.ifr <= 0) {
              let playerWasHit = false;
              if (gameState.player.shield > 0) {
                gameState.player.shield--;
                playerWasHit = true;
              } else {
                gameState.player.hp -= b.damage;
                playerWasHit = true;
              }
              gameState.player.ifr = gameState.player.ifrDuration;

              if (playerWasHit) {
                playHitSound();
              }

              if (gameState.player.hp <= 0) {
                endGame();
              }
            }
            gameState.bullets.splice(i, 1);
          }
        }
      }

      // Construir grilla espacial para colisiones entre enemigos
      let enemyCellSize = 1;
      const enemyGrid = new Map<string, number[]>();
      if (gameState.enemies.length > 0) {
        let maxEnemyRadius = 0;
        for (const enemy of gameState.enemies) {
          const radius = Number(enemy?.rad) || 0;
          if (radius > maxEnemyRadius) {
            maxEnemyRadius = radius;
          }
        }
        enemyCellSize = Math.max(1, maxEnemyRadius * 2);

        for (let i = 0; i < gameState.enemies.length; i++) {
          const enemy = gameState.enemies[i];
          const cellX = Math.floor(enemy.x / enemyCellSize);
          const cellY = Math.floor(enemy.y / enemyCellSize);
          const key = `${cellX},${cellY}`;
          let bucket = enemyGrid.get(key);
          if (!bucket) {
            bucket = [];
            enemyGrid.set(key, bucket);
          }
          bucket.push(i);
        }
      }

      // Colisión entre enemigos utilizando la grilla espacial
      for (let i = 0; i < gameState.enemies.length; i++) {
        const a = gameState.enemies[i];
        const cellX = Math.floor(a.x / enemyCellSize);
        const cellY = Math.floor(a.y / enemyCellSize);

        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            const neighborKey = `${cellX + ox},${cellY + oy}`;
            const bucket = enemyGrid.get(neighborKey);
            if (!bucket) continue;

            for (const j of bucket) {
              if (j <= i) continue;

              const b = gameState.enemies[j];
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const d = Math.hypot(dx, dy);
              const minDist = a.rad + b.rad;

              if (d < minDist && d > 0) {
                const overlap = minDist - d;
                const nx = dx / d;
                const ny = dy / d;
                a.x -= (nx * overlap) / 2;
                a.y -= (ny * overlap) / 2;
                b.x += (nx * overlap) / 2;
                b.y += (ny * overlap) / 2;
              }
            }
          }
        }
      }

      // Actualizar partículas
      for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        if (p.style === "shockwave") {
          const maxLife = p.maxLife ?? 0.32;
          p.life -= dt;
          const progress = 1 - Math.max(0, p.life) / Math.max(maxLife, 0.001);
          p.radius = (p.maxRadius ?? p.radius ?? 0) * Math.min(1, progress);
          p.opacity = Math.max(0, (p.opacity ?? 1) * (1 - progress));
          if (p.life <= 0) gameState.particles.splice(i, 1);
          continue;
        }

        p.x += p.vx ?? 0;
        p.y += p.vy ?? 0;
        p.life -= dt;
        if (p.vx) p.vx *= 0.98;
        if (p.vy) p.vy *= 0.98;
        if (p.style === "heat" || p.style === "core") {
          p.opacity = Math.max(0, (p.opacity ?? 1) - dt * (p.style === "heat" ? 1.8 : 2.4));
        }
        if (p.life <= 0 || (p.opacity !== undefined && p.opacity <= 0)) {
          gameState.particles.splice(i, 1);
        }
      }
    }

    function drawHUD() {
      const currentLanguage = (gameState.language ?? "es") as Language;
      const t = translations[currentLanguage];
      ctx.save();

      const isRage = gameState.player.rageTimer > 0;
      const isNightVision = Boolean(gameState.player.nightVisionActive);
      const accentColor = isNightVision ? UI_COLORS.minimap : isRage ? UI_COLORS.rageAccent : UI_COLORS.accent;
      const accentGlow = isRage ? UI_COLORS.rageGlow : UI_COLORS.accentGlow;
      const textPrimary = isNightVision ? "rgba(220, 255, 220, 0.95)" : UI_COLORS.textPrimary;
      const textSecondary = isNightVision ? "rgba(190, 255, 190, 0.8)" : UI_COLORS.textSecondary;

      const bossEventTexts = t.bossEvent;

      const drawTopStatus = (message: string, color: string) => {
        if (!message) return;
        ctx.save();
        ctx.font = withTerminalFont("bold 20px system-ui");
        ctx.textAlign = "center";
        const paddingX = 20;
        const paddingY = 8;
        const textWidth = ctx.measureText(message).width;
        const boxW = textWidth + paddingX * 2;
        const boxH = 24 + paddingY * 2;
        const boxX = W / 2 - boxW / 2;
        const boxY = 28 - boxH / 2;

        drawPixelPanel(ctx, boxX, boxY, boxW, boxH, {
          border: hexToRgba(color, 0.8),
          highlight: hexToRgba(color, 0.15),
        });
        ctx.fillStyle = hexToRgba(color, 0.12);
        for (let row = 0; row < boxH - 4; row += 4) {
          ctx.fillRect(boxX + 2, boxY + 2 + row, boxW - 4, 1);
        }

        ctx.fillStyle = color;
        ctx.shadowColor = hexToRgba(color, 0.5);
        ctx.shadowBlur = 0;
        ctx.fillText(message, W / 2, boxY + boxH / 2 + 6);
        ctx.restore();
      };

      if (!gameState.bossEncounter.bossDefeated) {
        if (gameState.globalEventTimer > 0) {
          const minutes = Math.floor(gameState.globalEventTimer / 60);
          const seconds = Math.floor(gameState.globalEventTimer % 60)
            .toString()
            .padStart(2, "0");
          drawTopStatus(`${bossEventTexts.prePortalTimerLabel}: ${minutes}:${seconds}`, PORTAL_COLORS.boss);
        } else if (gameState.bossEncounter.bossActive) {
          drawTopStatus(bossEventTexts.objective, PORTAL_COLORS.boss);
        } else if (gameState.bossPortal) {
          const status = gameState.bossPortal.status;
          if (status === "spawningBoss") {
            drawTopStatus(bossEventTexts.spawnWarning, PORTAL_COLORS.boss);
          } else if (status === "activating") {
            drawTopStatus(bossEventTexts.activateHold, PORTAL_COLORS.boss);
          } else {
            drawTopStatus(bossEventTexts.portalReady, PORTAL_COLORS.boss);
          }
        }
      } else {
        if (gameState.postBossSurvival.active) {
          const elapsed = Math.min(POST_BOSS_SURVIVAL_LIMIT, gameState.postBossSurvival.elapsed);
          const minutes = Math.floor(elapsed / 60);
          const seconds = Math.floor(elapsed % 60)
            .toString()
            .padStart(2, "0");
          drawTopStatus(`${bossEventTexts.timerLabel}: ${minutes}:${seconds}`, PORTAL_COLORS.exit);
        } else if (gameState.exitPortal) {
          drawTopStatus(bossEventTexts.exitPortalReady, PORTAL_COLORS.exit);
        }
      }

      const uniqueBoss = gameState.enemies.find(
        (enemy: any) => enemy?.isBoss && Boolean(enemy?.isUniqueBoss),
      ) as (EnemyWithCategory & { isUniqueBoss?: boolean }) | undefined;

      if (uniqueBoss) {
        const barW = Math.min(W - 160, 600);
        const barH = 28;
        const barX = W / 2 - barW / 2;
        const barY = 60;

        ctx.save();
        drawPixelPanel(ctx, barX, barY, barW, barH, {
          border: hexToRgba(PORTAL_COLORS.boss, 0.8),
          highlight: hexToRgba(PORTAL_COLORS.boss, 0.18),
        });

        const progress = uniqueBoss.maxhp ? Math.max(0, Math.min(1, uniqueBoss.hp / uniqueBoss.maxhp)) : 0;
        const fillW = (barW - 8) * progress;
        if (fillW > 0) {
          drawSegmentedBar(
            ctx,
            barX + 4,
            barY + 4,
            fillW,
            barH - 8,
            PORTAL_COLORS.boss,
            8,
          );
        }

        ctx.beginPath();
        drawRoundedRect(ctx, barX, barY, barW, barH, 14);
        ctx.strokeStyle = hexToRgba(PORTAL_GLOW_COLORS.boss, 0.65);
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = textPrimary;
        ctx.font = withTerminalFont("bold 18px system-ui");
        ctx.textAlign = "center";
        ctx.shadowColor = hexToRgba(PORTAL_GLOW_COLORS.boss, 0.4);
        ctx.shadowBlur = 0;
        const currentHp = Math.max(0, Math.ceil(uniqueBoss.hp));
        const label = `${bossEventTexts.bossName} — ${currentHp} / ${uniqueBoss.maxhp}`;
        ctx.fillText(label, W / 2, barY + barH / 2 + 6);
        ctx.restore();
      }

      // HP Bar - Barra horizontal con valor numérico
      const hpBarX = 20;
      const hpBarY = 70; // Movido más abajo para no chocar con el anuncio del evento
      const hpBarW = 300;
      const hpBarH = 32;

      // Fondo de la barra de HP
      drawPixelPanel(ctx, hpBarX, hpBarY, hpBarW, hpBarH, {
        border: hexToRgba(UI_COLORS.healthHigh, 0.5),
        highlight: hexToRgba(UI_COLORS.healthHigh, 0.12),
      });

      // Barra de HP actual (roja)
      const safeMaxHp = Math.max(1, Number(gameState.player.maxhp) || 1);
      const hpPercentRaw = Number(gameState.player.hp) / safeMaxHp;
      const hpPercent = Math.max(0, Math.min(1, Number.isFinite(hpPercentRaw) ? hpPercentRaw : 0));
      const currentHpBarW = Math.max(0, hpBarW * hpPercent);

      // Gradiente para la barra de HP
      if (currentHpBarW > 0) {
        const barHeight = hpBarH - 6;
        const innerWidth = Math.max(0, currentHpBarW - 6);
        if (innerWidth > 0) {
          drawSegmentedBar(
            ctx,
            hpBarX + 3,
            hpBarY + 3,
            innerWidth,
            barHeight,
            UI_COLORS.healthHigh,
            7,
          );
          ctx.fillStyle = hexToRgba(UI_COLORS.healthLow, 0.35);
          for (let row = 0; row < barHeight; row += 4) {
            ctx.fillRect(hpBarX + 3, hpBarY + 3 + row, innerWidth, 1);
          }
        }
      }

      // Texto de HP en el centro
      ctx.fillStyle = textPrimary;
      ctx.font = withTerminalFont("bold 18px system-ui");
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 0;
      ctx.fillText(
        `HP ${Math.floor(gameState.player.hp)} / ${gameState.player.maxhp}`,
        hpBarX + hpBarW / 2,
        hpBarY + hpBarH / 2 + 6,
      );
      ctx.shadowBlur = 0;

      if (hpPercent < 0.3) {
        const flicker = (Math.sin(gameState.time * 14) + 1) / 2;
        ctx.save();
        ctx.globalAlpha = 0.4 + flicker * 0.35;
        ctx.strokeStyle = UI_COLORS.healthHigh;
        ctx.lineWidth = 4;
        ctx.shadowColor = UI_COLORS.healthHigh;
        ctx.shadowBlur = 0;
        ctx.strokeRect(hpBarX - 3, hpBarY - 3, hpBarW + 6, hpBarH + 6);
        ctx.restore();

        drawWarningIcon(ctx, hpBarX - 32, hpBarY + 2, 22, UI_COLORS.healthHigh);
      }

      // Efecto de parpadeo durante invulnerabilidad
      if (gameState.player.ifr > 0) {
        const flashAlpha = Math.sin(gameState.time * 20) * 0.3 + 0.3;
        ctx.globalAlpha = flashAlpha;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 4;
        ctx.strokeRect(hpBarX - 2, hpBarY - 2, hpBarW + 4, hpBarH + 4);
        ctx.globalAlpha = 1;
      }

      // Shield icons
      if (gameState.player.shield > 0) {
        ctx.textAlign = "left";
        ctx.fillStyle = UI_COLORS.shield;
        ctx.font = withTerminalFont("bold 16px system-ui");
        for (let i = 0; i < gameState.player.shield; i++) {
          const shieldX = hpBarX + hpBarW + 15 + i * 30;
          ctx.beginPath();
          ctx.arc(shieldX, hpBarY + hpBarH / 2, 12, 0, Math.PI * 2);
          ctx.save();
          ctx.shadowColor = `${UI_COLORS.shield}aa`;
          ctx.shadowBlur = 0;
          ctx.fill();
          ctx.restore();
          ctx.strokeStyle = "rgba(222, 239, 255, 0.6)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Stamina Bar (debajo de la HP bar)
      const staminaBarX = 20;
      const staminaBarY = hpBarY + hpBarH + 8;
      const staminaBarW = 300;
      const staminaBarH = 20;

      // Fondo de la barra de stamina
      drawPixelPanel(ctx, staminaBarX, staminaBarY, staminaBarW, staminaBarH, {
        border: hexToRgba(accentColor, 0.4),
        highlight: hexToRgba(accentColor, 0.12),
      });

      // Barra de stamina actual (amarilla/verde)
      const staminaPercent = Math.max(0, Math.min(1, gameState.player.stamina / gameState.player.maxStamina));
      const currentStaminaBarW = Math.max(0, staminaBarW * staminaPercent);

      if (currentStaminaBarW > 0) {
        const staminaWidth = Math.max(0, currentStaminaBarW - 4);
        if (staminaWidth > 0) {
          drawSegmentedBar(
            ctx,
            staminaBarX + 2,
            staminaBarY + 2,
            staminaWidth,
            staminaBarH - 4,
            accentColor,
            6,
          );
        }
      }

      // Texto de stamina
      ctx.textAlign = "center";
      ctx.fillStyle = textSecondary;
      ctx.font = withTerminalFont("bold 12px system-ui");
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 0;
      ctx.fillText(
        `STAMINA ${Math.floor(gameState.player.stamina)}`,
        staminaBarX + staminaBarW / 2,
        staminaBarY + staminaBarH / 2 + 4,
      );
      ctx.shadowBlur = 0;

      // Indicador de sprint activo
      if (gameState.player.isSprinting) {
        ctx.globalAlpha = 0.6 + Math.sin(gameState.time * 10) * 0.4;
        ctx.strokeStyle = hexToRgba(accentColor, 0.8);
        ctx.lineWidth = 3;
        ctx.strokeRect(staminaBarX - 2, staminaBarY - 2, staminaBarW + 4, staminaBarH + 4);
        ctx.globalAlpha = 1;
      }

      // Level info (arriba izquierda, debajo de stamina)
      ctx.textAlign = "left";
      ctx.fillStyle = textPrimary;
      ctx.font = withTerminalFont("bold 18px system-ui");
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 0;
      ctx.fillText(`${t.level.toUpperCase()} ${gameState.level}`, 20, staminaBarY + staminaBarH + 22);
      ctx.shadowBlur = 0;

      // Termómetro de dificultad (inspirado en Risk of Rain 2)
      const minimapCenterX = MINIMAP_SIZE / 2 + MINIMAP_PADDING;
      const minimapCenterY = H - MINIMAP_SIZE / 2 - MINIMAP_BOTTOM_OFFSET;
      const minimapTop = minimapCenterY - MINIMAP_FRAME_RADIUS;
      const aspectRatio = W / Math.max(H, 1);

      let meterScale = 1;
      let meterOffsetX = 0;
      let meterOffsetY = -12;
      if (aspectRatio > 2.05) {
        meterScale = 1.1;
        meterOffsetX = 24;
        meterOffsetY = -18;
      } else if (W <= 900 || H <= 720) {
        meterScale = 0.9;
        meterOffsetX = 0;
        meterOffsetY = -6;
      }

      const baseMeterW = 24;
      const baseMeterH = 150;
      const meterW = Math.round(baseMeterW * meterScale);
      const meterH = Math.round(baseMeterH * meterScale);
      const meterGap = 12;
      const meterBottom = minimapTop - meterGap + meterOffsetY;
      const meterX = minimapCenterX - meterW / 2 + meterOffsetX;
      const meterY = meterBottom - meterH;
      const tierIndex = gameState.difficulty.tierIndex;
      const tierProgress = gameState.difficulty.tierProgress;
      const difficultyLevel = gameState.difficulty.level;
      const tierSteps = Math.max(1, DIFFICULTY_TIERS.length - 1);
      const normalizedFill = Math.min(1, (tierIndex + tierProgress) / tierSteps);

      drawPixelPanel(ctx, meterX, meterY, meterW, meterH, {
        background: "rgba(26, 26, 26, 0.95)",
        border: UI_COLORS.panelBorder,
        highlight: "rgba(255, 255, 255, 0.05)",
      });

      const innerHeight = meterH - 4;
      const fillHeight = Math.max(0, innerHeight * normalizedFill);
      let remainingFill = fillHeight;
      const stepHeight = innerHeight / tierSteps;
      const innerTop = meterY + 2;
      const innerBottom = meterY + meterH - 2;
      for (let i = 0; i < DIFFICULTY_TIERS.length; i++) {
        if (remainingFill <= 0) break;
        const tierHeight = Math.min(remainingFill, stepHeight);
        if (tierHeight <= 0) continue;
        const baseY = innerBottom - tierHeight;
        ctx.fillStyle = DIFFICULTY_TIERS[i].color;
        for (let offset = 0; offset < tierHeight; offset += 6) {
          const blockHeight = Math.min(4, tierHeight - offset);
          const blockY = baseY + tierHeight - offset - blockHeight;
          ctx.fillRect(meterX + 2, Math.max(innerTop, blockY), meterW - 4, blockHeight);
        }
        remainingFill -= tierHeight;
      }

      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1;
      for (let i = 0; i < DIFFICULTY_TIERS.length; i++) {
        const ratio = i / tierSteps;
        const y = meterY + meterH - ratio * meterH;
        ctx.beginPath();
        ctx.moveTo(meterX, y);
        ctx.lineTo(meterX + meterW, y);
        ctx.stroke();
      }

      const pointerY = meterY + meterH - 2 - fillHeight;
      const pointerX = meterX + meterW + 8;
      ctx.fillStyle = UI_COLORS.xp;
      ctx.beginPath();
      ctx.moveTo(pointerX, pointerY);
      ctx.lineTo(pointerX + 12 * meterScale, pointerY - 6 * meterScale);
      ctx.lineTo(pointerX + 12 * meterScale, pointerY + 6 * meterScale);
      ctx.closePath();
      ctx.fill();

      const labelCenterX = minimapCenterX + meterOffsetX;
      ctx.textAlign = "center";
      ctx.fillStyle = textPrimary;
      ctx.font = withTerminalFont(`bold ${Math.round(16 * meterScale)}px system-ui`);
      ctx.fillText(t.difficulty.toUpperCase(), labelCenterX, meterY - 16 * meterScale);

      ctx.font = withTerminalFont(`bold ${Math.round(20 * meterScale)}px system-ui`);
      ctx.fillStyle = DIFFICULTY_TIERS[tierIndex].color;
      ctx.fillText(gameState.difficulty.tierLabel.toUpperCase(), labelCenterX, meterY + meterH + 22 * meterScale);

      ctx.font = withTerminalFont(`${Math.round(12 * meterScale)}px system-ui`);
      ctx.fillStyle = textSecondary;
      ctx.fillText(
        `${t.levelShort ?? t.level} ${difficultyLevel}`,
        labelCenterX,
        meterY + meterH + 38 * meterScale,
      );

      if (meterScale >= 1) {
        ctx.font = withTerminalFont("11px system-ui");
        ctx.fillStyle = textSecondary;
        ctx.fillText(t.difficultyHint, labelCenterX, meterY - 32 * meterScale);
      }

      // Score
      ctx.textAlign = "right";
      ctx.fillStyle = UI_COLORS.xp;
      ctx.font = withTerminalFont("bold 24px system-ui");
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 0;
      ctx.fillText(`${gameState.score}`, W - 20, 40);
      ctx.shadowBlur = 0;

      // ========== BARRA DE XP FULL-WIDTH (PARTE INFERIOR) ==========
      const xpBarH = 40;
      const xpBarY = H - xpBarH - 10;
      const xpBarX = 20;
      const xpBarW = W - 40;
      const xpBarRadius = 20;

      // Fondo de la barra (redondeada)
      drawPixelPanel(ctx, xpBarX, xpBarY, xpBarW, xpBarH, {
        border: hexToRgba(UI_COLORS.xp, 0.4),
        highlight: hexToRgba(UI_COLORS.xp, 0.15),
      });

      // Progreso de XP
      const xpProgress = Math.min(1, gameState.xpDisplay / Math.max(1, gameState.nextXpDisplay));
      const currentXpBarW = (xpBarW - 8) * xpProgress;

      if (currentXpBarW > 0) {
        const innerWidth = Math.max(0, currentXpBarW - 6);
        const innerHeight = xpBarH - 6;
        const barX = xpBarX + 3;
        const barY = xpBarY + 3;
        if (innerWidth > 0) {
          if (gameState.xpBarRainbow) {
            const rainbowColors = [
              UI_COLORS.healthHigh,
              UI_COLORS.ammo,
              UI_COLORS.accent,
              UI_COLORS.shield,
              UI_COLORS.xp,
            ];
            const segmentWidth = 12;
            const shift = Math.floor((gameState.time * 8) % rainbowColors.length);
            for (let offset = 0; offset < innerWidth; offset += segmentWidth) {
              const colorIndex = (Math.floor(offset / segmentWidth) + shift) % rainbowColors.length;
              const blockWidth = Math.min(segmentWidth - 2, innerWidth - offset);
              if (blockWidth <= 0) continue;
              ctx.fillStyle = rainbowColors[colorIndex];
              ctx.fillRect(barX + offset, barY, blockWidth, innerHeight);
            }
          } else {
            drawSegmentedBar(ctx, barX, barY, innerWidth, innerHeight, UI_COLORS.xp, 8);
          }

          ctx.fillStyle = hexToRgba(UI_COLORS.xp, 0.25);
          for (let row = 0; row < innerHeight; row += 4) {
            ctx.fillRect(barX, barY + row, innerWidth, 1);
          }
        }
      }

      // Texto de XP centrado
      ctx.fillStyle = textPrimary;
      ctx.font = withTerminalFont("bold 20px system-ui");
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 0;
      ctx.fillText(
        `XP: ${Math.floor(gameState.xpDisplay)} / ${Math.max(1, Math.floor(gameState.nextXpDisplay))}`,
        xpBarX + xpBarW / 2,
        xpBarY + xpBarH / 2 + 7,
      );
      ctx.shadowBlur = 0;

      // Weapons display
      ctx.textAlign = "left";
      ctx.font = withTerminalFont("bold 14px system-ui");
      ctx.save();
      ctx.shadowColor = `${UI_COLORS.ammo}aa`;
      ctx.shadowBlur = 0;
      ctx.fillStyle = UI_COLORS.ammo;
      ctx.fillText(t.weapons, W - 220, 70);
      ctx.restore();
      ctx.fillStyle = textPrimary;
      ctx.fillText(t.weapons, W - 220, 70);
      for (let i = 0; i < gameState.player.weapons.length; i++) {
        const w = gameState.player.weapons[i];
        ctx.fillStyle = w.color;
        ctx.save();
        ctx.shadowColor = `${w.color}aa`;
        ctx.shadowBlur = 0;
        ctx.fillRect(W - 220, 80 + i * 25, 18, 18);
        ctx.restore();
        ctx.fillStyle = textSecondary;
        ctx.font = withTerminalFont("12px system-ui");
        const weaponName = getWeaponName(w.id, currentLanguage);
        const weaponText = w.level > 1 ? `${weaponName} LVL ${w.level}` : weaponName;
        ctx.fillText(weaponText, W - 195, 93 + i * 25);
      }

      // Books display
      ctx.fillStyle = textPrimary;
      ctx.font = withTerminalFont("bold 14px system-ui");
      const tomeY = 80 + gameState.player.weapons.length * 25 + 10;
      ctx.fillText(t.tomes, W - 220, tomeY);
      for (let i = 0; i < gameState.player.tomes.length; i++) {
        const tome = gameState.player.tomes[i];
        ctx.fillStyle = tome.color;
        ctx.save();
        ctx.shadowColor = `${tome.color}aa`;
        ctx.shadowBlur = 0;
        ctx.fillRect(W - 220, tomeY + 10 + i * 25, 18, 18);
        ctx.restore();
        ctx.fillStyle = textSecondary;
        ctx.font = withTerminalFont("12px system-ui");
        const tomeName = getTomeName(tome.id, currentLanguage);
        const tomeText = tome.level > 1 ? `${tomeName} LVL ${tome.level}` : tomeName;
        ctx.fillText(tomeText, W - 195, tomeY + 23 + i * 25);
      }

      // Items display
      if (gameState.player.items.length > 0) {
        ctx.fillStyle = textPrimary;
        ctx.font = withTerminalFont("bold 14px system-ui");
        const itemY = tomeY + gameState.player.tomes.length * 25 + 20;
        ctx.fillText(t.items, W - 220, itemY);

        // Mostrar solo primeros 10 ítems (si hay más, scroll)
        const maxItemsToShow = Math.min(10, gameState.player.items.length);
        for (let i = 0; i < maxItemsToShow; i++) {
          const item = gameState.player.items[i];
          ctx.fillStyle = item.color;
          ctx.save();
          ctx.shadowColor = `${item.color}aa`;
          ctx.shadowBlur = 0;
          ctx.fillRect(W - 220, itemY + 10 + i * 20, 12, 12);
          ctx.restore();
          ctx.fillStyle = textSecondary;
          ctx.font = withTerminalFont("10px system-ui");
          // Truncar nombre si es muy largo
          const itemNameFull = getItemText(item, currentLanguage).name;
          const itemName = itemNameFull.length > 18 ? itemNameFull.substring(0, 16) + "..." : itemNameFull;
          ctx.fillText(itemName, W - 202, itemY + 20 + i * 20);
        }

        // Indicador de más ítems
        if (gameState.player.items.length > 10) {
          ctx.fillStyle = textSecondary;
          ctx.font = withTerminalFont("10px system-ui");
          const remaining = gameState.player.items.length - 10;
          const moreItemsText = currentLanguage === "es" ? `+${remaining} más` : `+${remaining} more`;
          ctx.fillText(moreItemsText, W - 220, itemY + 10 + maxItemsToShow * 20 + 15);
        }
      }

      if (isNightVision) {
        ctx.save();
        ctx.textAlign = "right";
        ctx.font = withTerminalFont("bold 16px system-ui");
        ctx.shadowColor = accentGlow;
        ctx.shadowBlur = 0;
        ctx.fillStyle = accentColor;
        ctx.fillText("NIGHT VISION", W - 40, 40);
        ctx.restore();
      }

      // Level up animation
      if (gameState.levelUpAnimation > 0) {
        const alpha = gameState.levelUpAnimation;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = accentColor;
        ctx.font = withTerminalFont("bold 72px system-ui");
        ctx.textAlign = "center";
        const scale = 1 + (1 - alpha) * 0.5;
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(scale, scale);
        ctx.fillText(t.levelUp, 0, 0);
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      if (gameState.difficulty.notification > 0) {
        const alpha = Math.min(1, gameState.difficulty.notification / 2.5);
        ctx.save();
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = UI_COLORS.overlay;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        ctx.save();
        ctx.translate(W / 2, H * 0.3);
        ctx.textAlign = "center";
        ctx.fillStyle = DIFFICULTY_TIERS[gameState.difficulty.tierIndex].color;
        ctx.shadowColor = `${DIFFICULTY_TIERS[gameState.difficulty.tierIndex].color}80`;
        ctx.shadowBlur = 40;
        ctx.font = withTerminalFont("bold 56px system-ui");
        ctx.fillText(gameState.difficulty.tierLabel.toUpperCase(), 0, 0);
        ctx.shadowBlur = 0;
        ctx.fillStyle = textSecondary;
        ctx.font = withTerminalFont("18px system-ui");
        ctx.fillText(t.difficultyEscalation, 0, 34);
        ctx.restore();
      }

      // Barra de notificación ambiental - Estilo noticiero (visible durante todo el evento)
      if (gameState.eventPhase !== "none") {
        // Calcular opacidad según la fase del evento
        let notifAlpha = 1;
        if (gameState.eventPhase === "notification") {
          notifAlpha = Math.min(1, gameState.eventNotification / 2);
        }
        ctx.globalAlpha = notifAlpha;

        // Barra superior roja de alerta
        ctx.fillStyle = "rgba(176, 0, 32, 0.92)";
        ctx.fillRect(0, 0, W, 60);

        // Borde inferior brillante
        ctx.fillStyle = UI_COLORS.healthHigh;
        ctx.fillRect(0, 58, W, 2);

        // Texto de noticia con descripción de efectos
        const eventTexts =
          currentLanguage === "es"
            ? {
                storm: "ALERTA: Tormenta eléctrica aproximándose...",
                fog: "ALERTA: Niebla tóxica detectada en el área...",
                rain: "ALERTA: Lluvia radiactiva inminente...",
              }
            : {
                storm: "ALERT: Electrical storm approaching...",
                fog: "ALERT: Toxic fog detected in the area...",
                rain: "ALERT: Radioactive rain incoming...",
              };

        // Mostrar texto del evento actual
        const eventText = gameState.environmentalEvent ? eventTexts[gameState.environmentalEvent] : "";

        ctx.fillStyle = textPrimary;
        ctx.font = withTerminalFont("bold 20px system-ui");
        ctx.textAlign = "left";
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 0;
        ctx.fillText(eventText, 20, 40);
        ctx.shadowBlur = 0;

        ctx.globalAlpha = 1;
      }

      const drawPortalPrompt = (
        primary: string,
        secondary: string | null,
        color: string,
        progress?: number | null,
      ) => {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = withTerminalFont("bold 20px system-ui");
        const primaryWidth = ctx.measureText(primary).width;
        ctx.font = withTerminalFont("14px system-ui");
        const secondaryWidth = secondary ? ctx.measureText(secondary).width : 0;
        const boxW = Math.max(primaryWidth, secondaryWidth) + 40;
        const boxH = secondary ? 96 : 64;
        const boxX = W / 2 - boxW / 2;
        const boxY = H - boxH - 60;

        ctx.fillStyle = UI_COLORS.panelBg;
        ctx.beginPath();
        drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 16);
        ctx.fill();

        ctx.beginPath();
        drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 16);
        ctx.strokeStyle = hexToRgba(color, 0.65);
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = withTerminalFont("bold 20px system-ui");
        ctx.fillStyle = color;
        ctx.shadowColor = hexToRgba(color, 0.45);
        ctx.shadowBlur = 0;
        ctx.fillText(primary, W / 2, boxY + 26);

        if (secondary) {
          ctx.font = withTerminalFont("14px system-ui");
          ctx.fillStyle = textSecondary;
          ctx.shadowBlur = 0;
          ctx.fillText(secondary, W / 2, boxY + boxH - 18);
        }

        if (typeof progress === "number") {
          const clamped = Math.max(0, Math.min(1, progress));
          const barW = boxW - 60;
          const barX = boxX + 30;
          const barY = boxY + boxH - 34;
          ctx.fillStyle = hexToRgba(color, 0.25);
          ctx.fillRect(barX, barY, barW, 8);
          ctx.fillStyle = color;
          ctx.fillRect(barX, barY, barW * clamped, 8);
        }

        ctx.restore();
      };

      if (gameState.state === "running") {
        if (gameState.nearbyBossPortal) {
          const portal = gameState.nearbyBossPortal;
          const status = portal.status;
          if (status === "spawningBoss") {
            drawPortalPrompt(bossEventTexts.spawnWarning, null, PORTAL_COLORS.boss);
          } else {
            const prompt = bossEventTexts.activatePrompt.replace("{key}", "E");
            drawPortalPrompt(prompt, bossEventTexts.activateHold, PORTAL_COLORS.boss, portal.activationProgress ?? 0);
          }
        } else if (gameState.nearbyExitPortal) {
          const prompt = bossEventTexts.exitPrompt.replace("{key}", "E");
          drawPortalPrompt(prompt, bossEventTexts.stayNotice, PORTAL_COLORS.exit);
        }
      }

      if (gameState.itemNotificationTimer > 0 && gameState.itemNotification) {
        const notifAlpha = Math.min(1, gameState.itemNotificationTimer);
        ctx.globalAlpha = notifAlpha;

        const notifY = 170;
        const notifPadding = 20;
        const notifText = gameState.itemNotification;

        ctx.font = withTerminalFont("bold 22px system-ui");
        ctx.textAlign = "center";
        const textMetrics = ctx.measureText(notifText);
        const notifW = textMetrics.width + notifPadding * 2;
        const notifH = 44;
        const notifX = W / 2 - notifW / 2;

        ctx.fillStyle = UI_COLORS.panelBg;
        ctx.beginPath();
        drawRoundedRect(ctx, notifX, notifY - notifH / 2, notifW, notifH, 12);
        ctx.fill();

        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = textPrimary;
        ctx.shadowColor = accentGlow;
        ctx.shadowBlur = 0;
        ctx.fillText(notifText, W / 2, notifY + 6);

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      // Controles de música (esquina inferior derecha)
      const menuButtonRect = getMusicMenuButtonRect(W, H);
      const buttonCenterX = menuButtonRect.x + menuButtonRect.w / 2;
      const buttonCenterY = menuButtonRect.y + menuButtonRect.h / 2;
      const toggleAnim = gameState.musicButtonClickAnim.toggle ?? 0;
      const toggleScale = 1 - toggleAnim * 0.08;

      ctx.save();
      ctx.translate(buttonCenterX, buttonCenterY);
      ctx.scale(toggleScale, toggleScale);
      ctx.translate(-buttonCenterX, -buttonCenterY);
      ctx.beginPath();
      drawRoundedRect(ctx, menuButtonRect.x, menuButtonRect.y, menuButtonRect.w, menuButtonRect.h, 12);
      ctx.fillStyle = gameState.musicControlsVisible ? "rgba(15, 23, 42, 0.9)" : "rgba(15, 23, 42, 0.72)";
      ctx.fill();
      ctx.strokeStyle = gameState.musicControlsVisible ? "rgba(148, 163, 184, 0.55)" : "rgba(71, 85, 105, 0.52)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      const statusColor = !gameState.musicStarted
        ? "rgba(148, 163, 184, 0.85)"
        : gameState.musicIsPlaying
        ? "#22c55e"
        : "#facc15";

      ctx.save();
      ctx.fillStyle = statusColor;
      ctx.beginPath();
      ctx.arc(menuButtonRect.x + 12, menuButtonRect.y + menuButtonRect.h / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.textAlign = "center";
      ctx.font = withTerminalFont("600 14px system-ui");
      ctx.fillStyle = "rgba(226, 232, 240, 0.92)";
      ctx.fillText(t.musicControls.buttonLabel, buttonCenterX, menuButtonRect.y + menuButtonRect.h / 2 + 5);
      ctx.restore();

      if (gameState.musicControlsVisible) {
        const trackCount = gameState.musicTracks.length;
        const panelRect = getMusicControlPanelRect(W, H, trackCount);
        const panelRadius = 14;

        ctx.save();
        ctx.beginPath();
        drawRoundedRect(ctx, panelRect.x, panelRect.y, panelRect.w, panelRect.h, panelRadius);
        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.fill();
        ctx.strokeStyle = "rgba(100, 116, 139, 0.45)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        const headerX = panelRect.x + MUSIC_MENU_PANEL_PADDING_X;
        const titleY = panelRect.y + 24;

        ctx.save();
        ctx.textAlign = "left";
        ctx.font = withTerminalFont("600 14px system-ui");
        ctx.fillStyle = "rgba(226, 232, 240, 0.92)";
        ctx.fillText(t.musicControls.menuTitle, headerX, titleY);
        ctx.restore();

        const statusY = titleY + 18;
        const currentTrack = gameState.musicTracks[gameState.currentMusicIndex];
        const statusText = gameState.musicStarted && currentTrack
          ? `${t.musicControls.nowPlaying}: ${currentTrack.name}`
          : t.musicControls.selectTrack;

        ctx.save();
        ctx.textAlign = "left";
        ctx.font = withTerminalFont("12px system-ui");
        ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
        ctx.fillText(statusText, headerX, statusY);
        ctx.restore();

        const totalControlsWidth = MUSIC_MENU_CONTROL_SIZE * 2 + MUSIC_MENU_CONTROL_GAP;
        const controlsStartX = panelRect.x + (panelRect.w - totalControlsWidth) / 2;
        const controlsY = panelRect.y + 54;

        const playRect = {
          x: controlsStartX,
          y: controlsY,
          w: MUSIC_MENU_CONTROL_SIZE,
          h: MUSIC_MENU_CONTROL_SIZE,
        };
        const skipRect = {
          x: controlsStartX + MUSIC_MENU_CONTROL_SIZE + MUSIC_MENU_CONTROL_GAP,
          y: controlsY,
          w: MUSIC_MENU_CONTROL_SIZE,
          h: MUSIC_MENU_CONTROL_SIZE,
        };

        const drawControlButton = (
          rect: { x: number; y: number; w: number; h: number },
          icon: string,
          animValue: number,
          highlighted: boolean,
        ) => {
          const centerX = rect.x + rect.w / 2;
          const centerY = rect.y + rect.h / 2;
          const scale = 1 - animValue * 0.12;

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.scale(scale, scale);
          ctx.translate(-centerX, -centerY);

          ctx.beginPath();
          drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
          ctx.fillStyle = highlighted ? "rgba(148, 163, 184, 0.18)" : "rgba(30, 41, 59, 0.92)";
          ctx.fill();
          ctx.strokeStyle = highlighted ? "rgba(226, 232, 240, 0.45)" : "rgba(51, 65, 85, 0.65)";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = "rgba(226, 232, 240, 0.95)";
          ctx.font = withTerminalFont("600 20px system-ui");
          ctx.textAlign = "center";
          ctx.fillText(icon, centerX, rect.y + rect.h / 2 + 7);

          ctx.restore();
        };

        drawControlButton(
          playRect,
          gameState.musicIsPlaying ? "⏸" : "▶",
          gameState.musicButtonClickAnim.play ?? 0,
          gameState.musicIsPlaying,
        );
        drawControlButton(skipRect, "⏭", gameState.musicButtonClickAnim.skip ?? 0, false);

        ctx.save();
        ctx.textAlign = "center";
        ctx.font = withTerminalFont("11px system-ui");
        ctx.fillStyle = "rgba(148, 163, 184, 0.78)";
        ctx.fillText(
          gameState.musicIsPlaying ? t.musicControls.pause : t.musicControls.play,
          playRect.x + playRect.w / 2,
          playRect.y + playRect.h + 14,
        );
        ctx.fillText(t.musicControls.skip, skipRect.x + skipRect.w / 2, skipRect.y + skipRect.h + 14);
        ctx.restore();

        const trackStartY = controlsY + MUSIC_MENU_CONTROL_SIZE + 36;
        const trackRowWidth = panelRect.w - MUSIC_MENU_PANEL_PADDING_X * 2;
        const trackRowHeight = MUSIC_MENU_TRACK_ROW_HEIGHT - 6;

        for (let i = 0; i < trackCount; i++) {
          const rowY = trackStartY + i * MUSIC_MENU_TRACK_ROW_HEIGHT;
          const isCurrent = gameState.musicStarted && gameState.currentMusicIndex === i;
          const track = gameState.musicTracks[i];

          ctx.save();
          ctx.beginPath();
          drawRoundedRect(
            ctx,
            panelRect.x + MUSIC_MENU_PANEL_PADDING_X,
            rowY,
            trackRowWidth,
            trackRowHeight,
            8,
          );
          ctx.fillStyle = isCurrent ? "rgba(56, 189, 248, 0.18)" : "rgba(30, 41, 59, 0.75)";
          ctx.fill();
          ctx.strokeStyle = isCurrent ? "rgba(125, 211, 252, 0.55)" : "rgba(51, 65, 85, 0.55)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();

          ctx.save();
          ctx.textAlign = "left";
          ctx.font = withTerminalFont("12px system-ui");
          ctx.fillStyle = isCurrent ? "rgba(224, 242, 254, 0.95)" : "rgba(203, 213, 225, 0.9)";
          ctx.fillText(
            track.name,
            panelRect.x + MUSIC_MENU_PANEL_PADDING_X + 12,
            rowY + trackRowHeight / 2 + 4,
          );
          ctx.restore();

          if (isCurrent) {
            ctx.save();
            ctx.fillStyle = gameState.musicIsPlaying ? "#22c55e" : "#facc15";
            ctx.beginPath();
            ctx.arc(
              panelRect.x + panelRect.w - MUSIC_MENU_PANEL_PADDING_X - 10,
              rowY + trackRowHeight / 2,
              4,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.restore();
          }
        }

        if (trackCount === 0) {
          ctx.save();
          ctx.textAlign = "center";
          ctx.font = withTerminalFont("12px system-ui");
          ctx.fillStyle = "rgba(148, 163, 184, 0.75)";
          ctx.fillText(
            t.musicControls.selectTrack,
            panelRect.x + panelRect.w / 2,
            panelRect.y + panelRect.h / 2,
          );
          ctx.restore();
        }
      }

      // Overlay de Game Over con fade
      if (gameState.state === "gameover") {
        ctx.fillStyle = UI_COLORS.overlay;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.restore();
    }

    function drawCRTOverlay() {
      ctx.save();
      ctx.globalCompositeOperation = "soft-light";
      ctx.globalAlpha = CRT_SETTINGS.vignetteOpacity;
      const vignette = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H));
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignette.addColorStop(1, "rgba(0, 0, 0, 1)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      ctx.save();
      const flicker = 0.9 + Math.sin(gameState.time * 18) * 0.08;
      ctx.globalAlpha = CRT_SETTINGS.scanlineOpacity * flicker;
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      for (let y = 0; y < H; y += CRT_SETTINGS.scanlineSpacing) {
        ctx.fillRect(0, y, W, 1);
      }
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "rgba(0, 255, 170, 0.25)";
      ctx.fillRect(-CRT_SETTINGS.chromaShift, 0, W, H);
      ctx.fillStyle = "rgba(255, 70, 0, 0.18)";
      ctx.fillRect(CRT_SETTINGS.chromaShift, 0, W, H);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.12;
      const glitchBands = 5;
      for (let i = 0; i < glitchBands; i++) {
        const bandHeight = 2 + (i % 2);
        const y = Math.floor((gameState.time * 90 + i * 37) % H);
        const shift = Math.sin(gameState.time * 6 + i) * 8;
        ctx.fillStyle = i % 2 === 0 ? hexToRgba(UI_COLORS.accent, 0.4) : hexToRgba(UI_COLORS.healthHigh, 0.35);
        ctx.fillRect(shift, y, W, bandHeight);
      }
      ctx.restore();
    }

    function getChestChoiceLayout(W: number, H: number) {
      const panelW = Math.min(520, W * 0.75);
      const panelH = Math.min(420, H * 0.7);
      const panelX = W / 2 - panelW / 2;
      const panelY = H / 2 - panelH / 2;
      const horizontalPadding = 32;
      const buttonGap = 16;
      const buttonH = 54;
      const keepButton = {
        x: panelX + horizontalPadding,
        y: panelY + panelH - buttonH - 32,
        w: panelW - horizontalPadding * 2,
        h: buttonH,
      };
      const secondaryY = keepButton.y - buttonH - buttonGap;
      const secondaryW = (keepButton.w - buttonGap) / 2;

      return {
        panel: { x: panelX, y: panelY, w: panelW, h: panelH },
        buttons: {
          keep: keepButton,
          banish: {
            x: keepButton.x,
            y: secondaryY,
            w: secondaryW,
            h: buttonH,
          },
          skip: {
            x: keepButton.x + secondaryW + buttonGap,
            y: secondaryY,
            w: secondaryW,
            h: buttonH,
          },
        },
        content: {
          x: panelX + horizontalPadding,
          y: panelY + 96,
          w: panelW - horizontalPadding * 2,
          h: Math.max(140, secondaryY - (panelY + 96) - 16),
        },
      };
    }

    function drawChestChoiceUI() {
      const choice = gameState.activeChestChoice;
      if (!choice) return;

      const currentLanguage = (gameState.language ?? "es") as Language;
      const t = translations[currentLanguage];
      const layout = getChestChoiceLayout(W, H);
      const { panel, buttons, content } = layout;
      const rarityColor = rarityColors[choice.item.rarity];
      const itemText = getItemText(choice.item, currentLanguage);

      const fade = Math.min(1, gameState.chestUIAnimation);
      const easeOutBack = (t: number) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      };
      const panelProgress = easeOutBack(fade);
      const panelScale = 0.82 + panelProgress * 0.18;
      const panelCenterX = panel.x + panel.w / 2;
      const panelCenterY = panel.y + panel.h / 2;

      ctx.save();

      const overlayGradient = ctx.createRadialGradient(
        W / 2,
        H / 2,
        Math.min(W, H) * 0.1,
        W / 2,
        H / 2,
        Math.max(W, H),
      );
      overlayGradient.addColorStop(0, "rgba(6, 10, 18, 0.55)");
      overlayGradient.addColorStop(0.45, "rgba(4, 8, 16, 0.82)");
      overlayGradient.addColorStop(1, "rgba(2, 4, 9, 0.94)");
      ctx.globalAlpha = 0.88 * fade;
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;

      if (fade > 0) {
        ctx.save();
        ctx.translate(panelCenterX, panelCenterY);
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.5 * fade;
        const swirlRadius = Math.max(panel.w, panel.h) * 0.95;
        const swirlCount = 6;
        const rayWidth = (Math.PI * 0.8) / swirlCount;
        const baseRotation = gameState.time * 0.9;
        const innerGlow = hexToRgba(rarityColor, 0.45);
        const midGlow = hexToRgba(rarityColor, 0.16);
        for (let i = 0; i < swirlCount; i++) {
          const angle = baseRotation + (i * Math.PI * 2) / swirlCount;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, swirlRadius, angle - rayWidth / 2, angle + rayWidth / 2);
          ctx.closePath();
          const glowGradient = ctx.createRadialGradient(0, 0, swirlRadius * 0.08, 0, 0, swirlRadius);
          glowGradient.addColorStop(0, innerGlow);
          glowGradient.addColorStop(0.6, midGlow);
          glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = glowGradient;
          ctx.fill();
        }
        ctx.restore();
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }

      const drawRoundedRectPath = (x: number, y: number, w: number, h: number, r: number) => {
        const radius = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      };

      const fitTextWithinWidth = (
        text: string,
        {
          weight,
          baseSize,
          minSize,
          maxWidth,
          padding = 0,
        }: {
          weight: string;
          baseSize: number;
          minSize: number;
          maxWidth: number;
          padding?: number;
        },
      ) => {
        let size = baseSize;
        let font = withTerminalFont(`${weight} ${size}px system-ui`);
        let displayText = text;
        ctx.font = font;
        let measured = ctx.measureText(displayText).width + padding;

        while (size > minSize && measured > maxWidth) {
          size -= 1;
          font = withTerminalFont(`${weight} ${size}px system-ui`);
          ctx.font = font;
          measured = ctx.measureText(displayText).width + padding;
        }

        if (measured > maxWidth) {
          const ellipsis = "…";
          let trimmed = displayText;
          while (trimmed.length > 1) {
            trimmed = trimmed.slice(0, -1);
            const candidate = `${trimmed}${ellipsis}`;
            const candidateWidth = ctx.measureText(candidate).width + padding;
            if (candidateWidth <= maxWidth) {
              displayText = candidate;
              measured = candidateWidth;
              break;
            }
          }
          if (measured > maxWidth) {
            displayText = ellipsis;
            measured = ctx.measureText(displayText).width + padding;
          }
        }

        ctx.font = font;
        return { font, text: displayText, width: measured };
      };

      ctx.save();
      ctx.translate(panelCenterX, panelCenterY);
      ctx.scale(panelScale, panelScale);
      ctx.translate(-panelCenterX, -panelCenterY);
      ctx.globalAlpha = Math.min(1, 0.35 + fade * 0.75);

      const panelGradient = ctx.createLinearGradient(panel.x, panel.y, panel.x, panel.y + panel.h);
      panelGradient.addColorStop(0, "rgba(15, 23, 42, 0.96)");
      panelGradient.addColorStop(1, "rgba(10, 13, 24, 0.94)");
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 28;
      drawRoundedRectPath(panel.x, panel.y, panel.w, panel.h, 28);
      ctx.fillStyle = panelGradient;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 2;
      ctx.strokeStyle = `${rarityColor}55`;
      ctx.stroke();

      ctx.fillStyle = "#f8fafc";
      ctx.font = withTerminalFont("600 28px system-ui");
      ctx.textAlign = "center";
      ctx.fillText(t.chestUI.title, panel.x + panel.w / 2, panel.y + 58);

      const accentLineWidth = Math.min(panel.w - 140, 180);
      const accentLineX = panel.x + panel.w / 2 - accentLineWidth / 2;
      const accentLineY = panel.y + 76;
      const accentGradient = ctx.createLinearGradient(accentLineX, accentLineY, accentLineX + accentLineWidth, accentLineY);
      accentGradient.addColorStop(0, `${rarityColor}00`);
      accentGradient.addColorStop(0.5, `${rarityColor}aa`);
      accentGradient.addColorStop(1, `${rarityColor}00`);
      ctx.strokeStyle = accentGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(accentLineX, accentLineY);
      ctx.lineTo(accentLineX + accentLineWidth, accentLineY);
      ctx.stroke();

      const cardX = content.x;
      const cardY = content.y;
      const cardW = content.w;
      const cardH = content.h;
      const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
      cardGradient.addColorStop(0, `${rarityColor}1f`);
      cardGradient.addColorStop(0.35, "rgba(18, 24, 39, 0.92)");
      cardGradient.addColorStop(1, "rgba(12, 16, 28, 0.95)");
      drawRoundedRectPath(cardX, cardY, cardW, cardH, 20);
      ctx.fillStyle = cardGradient;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `${rarityColor}55`;
      ctx.stroke();

      const sheenGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
      sheenGradient.addColorStop(0, "rgba(255, 255, 255, 0.04)");
      sheenGradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
      sheenGradient.addColorStop(1, "rgba(255, 255, 255, 0.04)");
      ctx.fillStyle = sheenGradient;
      drawRoundedRectPath(cardX + 2, cardY + 2, cardW - 4, cardH - 4, 18);
      ctx.fill();

      const rarityLabel = choice.item.rarity.toUpperCase();
      const rarityFit = fitTextWithinWidth(rarityLabel, {
        weight: "600",
        baseSize: 13,
        minSize: 11,
        maxWidth: cardW - 40,
        padding: 28,
      });
      const rarityLabelWidth = rarityFit.width;
      const rarityLabelHeight = 28;
      const rarityLabelX = cardX + cardW / 2 - rarityLabelWidth / 2;
      const rarityLabelY = cardY - rarityLabelHeight / 2;
      drawRoundedRectPath(rarityLabelX, rarityLabelY, rarityLabelWidth, rarityLabelHeight, rarityLabelHeight / 2);
      ctx.fillStyle = `${rarityColor}28`;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `${rarityColor}aa`;
      ctx.stroke();
      ctx.fillStyle = rarityColor;
      ctx.font = rarityFit.font;
      ctx.fillText(rarityFit.text, rarityLabelX + rarityLabelWidth / 2, rarityLabelY + rarityLabelHeight / 2 + 4);

      const nameFit = fitTextWithinWidth(itemText.name, {
        weight: "600",
        baseSize: 30,
        minSize: 18,
        maxWidth: cardW - 48,
      });
      ctx.fillStyle = "#f8fafc";
      ctx.font = nameFit.font;
      ctx.fillText(nameFit.text, cardX + cardW / 2, cardY + 68);

      ctx.fillStyle = "rgba(226, 232, 240, 0.92)";
      ctx.font = withTerminalFont("16px system-ui");
      wrapText(ctx, itemText.description, cardX + cardW / 2, cardY + 118, cardW - 60, 24);

      const drawButton = (
        rect: { x: number; y: number; w: number; h: number },
        label: string,
        options: {
          background: string;
          textColor: string;
          subtitle?: string | null;
          disabled?: boolean;
        },
      ) => {
        const { background, textColor, subtitle = null, disabled = false } = options;
        const radius = 14;
        const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
        if (disabled) {
          gradient.addColorStop(0, "rgba(148, 163, 184, 0.18)");
          gradient.addColorStop(1, "rgba(71, 85, 105, 0.18)");
        } else if (background.startsWith("#")) {
          gradient.addColorStop(0, `${background}f0`);
          gradient.addColorStop(1, `${background}cc`);
        } else {
          gradient.addColorStop(0, background);
          gradient.addColorStop(1, background);
        }

        drawRoundedRectPath(rect.x, rect.y, rect.w, rect.h, radius);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = disabled ? "rgba(148, 163, 184, 0.4)" : `${textColor}55`;
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = disabled ? "rgba(226, 232, 240, 0.55)" : textColor;
      ctx.font = withTerminalFont(subtitle ? "600 18px system-ui" : "600 20px system-ui");
        const labelY = subtitle ? rect.y + rect.h / 2 - 2 : rect.y + rect.h / 2 + 6;
        ctx.fillText(label, rect.x + rect.w / 2, labelY);

        if (subtitle) {
          ctx.font = withTerminalFont("600 13px system-ui");
          ctx.fillStyle = disabled ? "rgba(203, 213, 225, 0.55)" : "rgba(248, 250, 252, 0.88)";
          ctx.fillText(subtitle, rect.x + rect.w / 2, rect.y + rect.h - 14);
        }
      };

      drawButton(buttons.keep, t.chestUI.keep, {
        background: UI_COLORS.accent,
        textColor: "#02210f",
      });
      drawButton(buttons.banish, t.chestUI.banish, {
        background: "#ef4444",
        textColor: "#1f0d0d",
        subtitle: `×${gameState.chestBanishesRemaining}`,
        disabled: gameState.chestBanishesRemaining <= 0,
      });
      drawButton(buttons.skip, t.chestUI.skip, {
        background: "#334155",
        textColor: "#e2e8f0",
        subtitle: `×${gameState.chestSkipsRemaining}`,
        disabled: gameState.chestSkipsRemaining <= 0,
      });

      ctx.restore();
      ctx.restore();
    }

    function drawUpgradeUI() {
      const currentLanguage = (gameState.language ?? "es") as Language;
      const t = translations[currentLanguage];
      if (!gameState.showUpgradeUI) return;

      ctx.save();

      // Easing function for smooth animation
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const animProgress = easeOutCubic(gameState.upgradeUIAnimation);

      // Animated overlay with fade-in
      ctx.globalAlpha = animProgress * 0.95;
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;

      const pulse = Math.sin(gameState.time * 3) * 0.15 + 0.85;

      // Título con animación de escala y fade
      ctx.globalAlpha = animProgress;
      const titleScale = 0.8 + animProgress * 0.2;
      ctx.save();
      ctx.translate(W / 2, H / 2 - 180);
      ctx.scale(titleScale, titleScale);

      // Glow effect en el título
      ctx.shadowColor = "#ffc300";
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffc300";
      ctx.font = withTerminalFont("bold 56px system-ui");
      ctx.textAlign = "center";
      ctx.fillText(t.levelUp, 0, 0);

      // Segundo glow para más intensidad
      ctx.shadowBlur = 0;
      ctx.fillText(t.levelUp, 0, 0);
      ctx.shadowBlur = 0;

      ctx.restore();

      // Subtítulo con fade
      ctx.font = withTerminalFont("28px system-ui");
      ctx.fillStyle = `rgba(156, 163, 175, ${animProgress})`;
      ctx.textAlign = "center";
      ctx.fillText(t.chooseUpgrade, W / 2, H / 2 - 100);

      ctx.globalAlpha = 1;

      // Cards con animación escalonada
      const cardW = 280;
      const cardH = 220;
      const gap = 40;
      const startX = W / 2 - (cardW * 1.5 + gap);
      const startY = H / 2 - cardH / 2 + 20;

      for (let i = 0; i < gameState.upgradeOptions.length; i++) {
        const option = gameState.upgradeOptions[i];
        const x = startX + i * (cardW + gap);
        const y = startY;

        // Animación escalonada para cada carta
        const cardDelay = i * 0.15;
        const cardAnimProgress = Math.max(0, Math.min(1, (gameState.upgradeUIAnimation - cardDelay) / 0.5));
        const cardEase = easeOutCubic(cardAnimProgress);

        // Hover effect
        const hover = Math.sin(gameState.time * 4 + i * 1.2) * 8;
        const yOffset = y + hover - (1 - cardEase) * 50; // Slide up animation

        ctx.save();
        ctx.globalAlpha = cardEase;

        // Card shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 10;

        // Card background con gradiente
        const rarityColor = rarityColors[option.rarity];
        const bgGradient = ctx.createLinearGradient(x, yOffset, x, yOffset + cardH);
        bgGradient.addColorStop(0, "rgba(30, 35, 45, 0.98)");
        bgGradient.addColorStop(1, "rgba(15, 20, 30, 0.98)");
        ctx.fillStyle = bgGradient;
        ctx.fillRect(x, yOffset, cardW, cardH);

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Borde de rareza con doble línea
        ctx.strokeStyle = rarityColor;
        ctx.lineWidth = 4;
        ctx.shadowColor = rarityColor;
        ctx.shadowBlur = 0;
        ctx.strokeRect(x, yOffset, cardW, cardH);

        // Inner border
        ctx.lineWidth = 1;
        ctx.strokeStyle = `${rarityColor}80`;
        ctx.strokeRect(x + 5, yOffset + 5, cardW - 10, cardH - 10);
        ctx.shadowBlur = 0;

        // Accent bar en la parte superior
        const accentGradient = ctx.createLinearGradient(x, yOffset, x + cardW, yOffset);
        accentGradient.addColorStop(0, "transparent");
        accentGradient.addColorStop(0.5, rarityColor);
        accentGradient.addColorStop(1, "transparent");
        ctx.fillStyle = accentGradient;
        ctx.fillRect(x, yOffset, cardW, 4);

        // Tipo badge
        const badgeY = yOffset + 25;
        ctx.fillStyle = rarityColor;
        ctx.font = withTerminalFont("bold 14px system-ui");
        ctx.textAlign = "center";
        const typeLabel = option.type === "weapon" ? t.weapon : option.type === "tome" ? t.tome : t.item;
        const typeText = typeLabel;

        // Badge background
        const badgeW = 100;
        const badgeH = 24;
        const badgeX = x + cardW / 2 - badgeW / 2;
        ctx.fillStyle = `${rarityColor}30`;
        ctx.fillRect(badgeX, badgeY - 18, badgeW, badgeH);
        ctx.fillStyle = rarityColor;
        ctx.strokeStyle = rarityColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(badgeX, badgeY - 18, badgeW, badgeH);

        ctx.fillText(typeText, x + cardW / 2, badgeY);

        // Nombre con nivel
        const data = option.data as any;
        ctx.fillStyle = "#fff";
        ctx.font = withTerminalFont("bold 22px system-ui");
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 0;
        let nameText = "";
        if (option.type === "weapon") {
          const weaponData = data as Weapon;
          const weaponName = getWeaponName(weaponData.id, currentLanguage);
          nameText = option.isLevelUp ? `${weaponName} LV${weaponData.level + 1}` : weaponName;
        } else if (option.type === "tome") {
          const tomeData = data as Tome;
          const tomeName = getTomeName(tomeData.id, currentLanguage);
          nameText = option.isLevelUp ? `${tomeName} LV${tomeData.level + 1}` : tomeName;
        } else {
          const itemData = data as Item;
          nameText = getItemText(itemData, currentLanguage).name;
        }

        // Wrap text if too long
        const maxWidth = cardW - 30;
        ctx.fillText(nameText, x + cardW / 2, yOffset + 75, maxWidth);
        ctx.shadowBlur = 0;

        // Descripción con mejor formato
        ctx.fillStyle = "#cbd5e1";
        ctx.font = withTerminalFont("15px system-ui");

        const descriptionText = getUpgradeDescriptionText(option.descriptionKey, currentLanguage);

        if (option.type === "weapon") {
          const w = data as Weapon;
          if (option.isLevelUp && descriptionText) {
            // Wrap description text
            wrapText(ctx, descriptionText, x + cardW / 2, yOffset + 110, maxWidth, 20);
          } else {
            ctx.textAlign = "left";
            const statsX = x + 20;
            ctx.fillText(`${t.damage}: ${w.damage.toFixed(1)}`, statsX, yOffset + 110);
            ctx.fillText(`${t.fireRate}: ${w.fireRate.toFixed(1)}/s`, statsX, yOffset + 135);
            ctx.fillText(`${t.range}: ${w.range}`, statsX, yOffset + 160);
            ctx.textAlign = "center";
          }
        } else if (option.type === "tome") {
          const tomeData = data as Tome;
          const desc =
            option.isLevelUp && descriptionText ? descriptionText : getTomeDescription(tomeData, currentLanguage);
          wrapText(ctx, desc, x + cardW / 2, yOffset + 110, maxWidth, 20);
        } else {
          const itemData = data as Item;
          const itemText = getItemText(itemData, currentLanguage);
          wrapText(ctx, itemText.description, x + cardW / 2, yOffset + 110, maxWidth, 20);
        }

        // Rareza badge en la parte inferior
        const rarityBadgeY = yOffset + cardH - 25;
        ctx.fillStyle = rarityColor;
        ctx.font = withTerminalFont("bold 13px system-ui");
        ctx.textAlign = "center";

        const rarityBadgeW = 120;
        const rarityBadgeH = 22;
        const rarityBadgeX = x + cardW / 2 - rarityBadgeW / 2;

        ctx.fillStyle = `${rarityColor}40`;
        ctx.fillRect(rarityBadgeX, rarityBadgeY - 16, rarityBadgeW, rarityBadgeH);

        ctx.fillStyle = rarityColor;
        ctx.fillText(option.rarity.toUpperCase(), x + cardW / 2, rarityBadgeY);

        ctx.restore();
      }

      // Hint text
      ctx.globalAlpha = animProgress;
      ctx.fillStyle = "rgba(156, 163, 175, 0.6)";
      ctx.font = withTerminalFont("16px system-ui");
      ctx.textAlign = "center";
      ctx.fillText(t.clickToSelect, W / 2, H - 60);

      ctx.restore();
    }

    // Helper function para wrap text
    function wrapText(
      ctx: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      lineHeight: number,
    ) {
      const words = text.split(" ");
      let line = "";
      let currentY = y;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          line = words[n] + " ";
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
    }

    function draw() {
      const currentLanguage = (gameState.language ?? "es") as Language;
      const t = translations[currentLanguage];
      const camera = gameState.camera ?? { x: gameState.player.x, y: gameState.player.y };
      const nightVisionActive = Boolean(gameState.player?.nightVisionActive);
      const textPrimary = nightVisionActive ? "rgba(220, 255, 220, 0.95)" : UI_COLORS.textPrimary;
      const textSecondary = nightVisionActive ? "rgba(190, 255, 190, 0.75)" : UI_COLORS.textSecondary;
      ctx.clearRect(0, 0, W, H);

      const zoom = camera.zoom ?? getTargetCameraZoom();
      const { halfViewW, halfViewH } = getCameraViewExtents(W, H, zoom);
      const viewLeft = camera.x - halfViewW;
      const viewTop = camera.y - halfViewH;
      const viewRight = camera.x + halfViewW;
      const viewBottom = camera.y + halfViewH;
      const viewWidth = halfViewW * 2;
      const viewHeight = halfViewH * 2;

      const viewBounds: Bounds = {
        left: viewLeft,
        top: viewTop,
        right: viewRight,
        bottom: viewBottom,
      };
      const actorBounds = expandBounds(viewBounds, MAX_ENEMY_RADIUS);
      const dropBounds = expandBounds(viewBounds, 64);
      const hotspotBounds = expandBounds(viewBounds, 72);
      const particleBounds = expandBounds(viewBounds, 96);

      const visibleDrops = cullEntities(gameState.drops, dropBounds, (d) => d.rad);
      const visibleHotspots = cullEntities(gameState.hotspots, hotspotBounds, (h) => h.rad);
      const visibleParticles = cullEntities(gameState.particles, particleBounds, (p) => p.size);
      const visibleEnemies = cullEntities(gameState.enemies, actorBounds, (e) => e.rad);
      const visibleExplosionMarks = cullEntities(
        gameState.explosionMarks,
        dropBounds,
        (m) => m.radius,
      );

      const worldToScreen = (x: number, y: number) => ({
        x: (x - camera.x) * zoom + W / 2,
        y: (y - camera.y) * zoom + H / 2,
      });

      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-camera.x, -camera.y);
      const worldTransform = ctx.getTransform();

      const renderBackgroundPass = () => {
      // Draw tiled background map
      if (gameState.mapBackground && gameState.mapBackground.complete) {
        const imgW = gameState.mapBackground.width;
        const imgH = gameState.mapBackground.height;

        const startX = Math.floor(viewLeft / imgW) * imgW;
        const startY = Math.floor(viewTop / imgH) * imgH;

        for (let x = startX; x < viewRight; x += imgW) {
          for (let y = startY; y < viewBottom; y += imgH) {
            ctx.drawImage(gameState.mapBackground, x, y, imgW, imgH);
          }
        }
      } else {
        // Fallback gradient background
        const gradientHeightOffset = viewHeight / 3;
        const gradient = ctx.createRadialGradient(
          camera.x,
          camera.y - gradientHeightOffset,
          0,
          camera.x,
          camera.y - gradientHeightOffset,
          Math.max(viewWidth, viewHeight),
        );
        gradient.addColorStop(0, UI_COLORS.backgroundGradient[0]);
        gradient.addColorStop(0.5, UI_COLORS.backgroundGradient[1]);
        gradient.addColorStop(1, UI_COLORS.backgroundGradient[2]);
        ctx.fillStyle = gradient;
        ctx.fillRect(viewLeft, viewTop, viewWidth, viewHeight);
      }

      // Marcas de explosión en el suelo (quemadura)
      for (const mark of visibleExplosionMarks) {
        const alpha = mark.life / 3;
        ctx.setTransform(worldTransform);
        ctx.translate(mark.x, mark.y);
        ctx.globalAlpha = alpha * 0.4;
        ctx.fillStyle = getExplosionGradient(ctx, mark.radius);
        const path = getHotspotPath(mark.radius);
        ctx.fill(path);

        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = "rgba(139, 69, 19, 0.8)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke(path);
        ctx.setLineDash([]);
      }
      ctx.setTransform(worldTransform);
      ctx.globalAlpha = 1;

      const drawPortal = (portal: GamePortal) => {
        ctx.save();
        ctx.setTransform(worldTransform);
        ctx.translate(portal.x, portal.y);

        const baseColor = PORTAL_COLORS[portal.type];
        const glowColor = PORTAL_GLOW_COLORS[portal.type];
        const pulse = Math.sin((gameState.time - portal.spawnTime) * 4) * 0.5 + 0.5;

        ctx.save();
        ctx.globalAlpha = 0.4 + pulse * 0.2;
        ctx.fillStyle = hexToRgba(glowColor, 0.4 + pulse * 0.3);
        ctx.beginPath();
        ctx.arc(0, 0, portal.rad * (1.8 + pulse * 0.2), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.lineWidth = 4;
        ctx.strokeStyle = hexToRgba(glowColor, 0.75);
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(0, 0, portal.rad * 1.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        const swirlCount = 6;
        const swirlRadius = portal.rad * 1.35;
        for (let i = 0; i < swirlCount; i++) {
          const angle = (gameState.time * 1.5 + (Math.PI * 2 * i) / swirlCount) * (portal.type === "boss" ? 1 : -1);
          ctx.save();
          ctx.rotate(angle);
          const gradient = ctx.createLinearGradient(0, -swirlRadius, 0, swirlRadius);
          gradient.addColorStop(0, hexToRgba(baseColor, 0));
          gradient.addColorStop(0.4, hexToRgba(baseColor, 0.4));
          gradient.addColorStop(0.6, hexToRgba(glowColor, 0.9));
          gradient.addColorStop(1, hexToRgba(baseColor, 0));
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(0, -swirlRadius);
          ctx.lineTo(0, swirlRadius);
          ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        ctx.globalAlpha = 0.8;
        const innerGradient = ctx.createRadialGradient(0, 0, portal.rad * 0.1, 0, 0, portal.rad * 0.9);
        innerGradient.addColorStop(0, hexToRgba(baseColor, 0.7));
        innerGradient.addColorStop(1, hexToRgba(baseColor, 0.05));
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(0, 0, portal.rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
      };

      if (gameState.bossPortal?.active) {
        drawPortal(gameState.bossPortal);
      }
      if (gameState.exitPortal?.active) {
        drawPortal(gameState.exitPortal);
      }

      // ═══════════════════════════════════════════════════════════
      // EFECTOS AMBIENTALES - Renderizado
      // ═══════════════════════════════════════════════════════════

      // Renderizar WARNING zones de niebla (antes de aparecer)
      if (gameState.environmentalEvent === "fog" && gameState.fogWarningZones.length > 0) {
        const fogWarningText = currentLanguage === "es" ? "ALERTA: NIEBLA ENTRANTE" : "ALERT: FOG INCOMING";
        for (const warning of gameState.fogWarningZones) {
          const warningPulse = Math.sin(gameState.time * 5) * 0.3 + 0.7;

          // Fondo rojo semitransparente
          ctx.fillStyle = `rgba(239, 68, 68, ${0.2 * warningPulse})`;
          ctx.fillRect(warning.x, warning.y, warning.width, warning.height);

          // Borde rojo pulsante
          ctx.strokeStyle = `rgba(239, 68, 68, ${warningPulse})`;
          ctx.lineWidth = 4;
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 0;
          ctx.setLineDash([15, 15]);
          ctx.strokeRect(warning.x, warning.y, warning.width, warning.height);
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;

          // Texto de warning
          ctx.fillStyle = `rgba(239, 68, 68, ${warningPulse})`;
          ctx.font = withTerminalFont("bold 32px system-ui");
          ctx.textAlign = "center";
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 0;
          ctx.fillText(fogWarningText, warning.x + warning.width / 2, warning.y + warning.height / 2);
          ctx.shadowBlur = 0;
        }
      }

      // Renderizar zonas de niebla (solo si el evento está activo y con intensidad)
      if (
        gameState.environmentalEvent === "fog" &&
        gameState.fogZones.length > 0 &&
        (gameState.eventPhase === "fadein" || gameState.eventPhase === "active" || gameState.eventPhase === "fadeout")
      ) {
        const intensity = gameState.eventIntensity;

        const fogLabel = currentLanguage === "es" ? "NIEBLA" : "FOG";
        for (const zone of gameState.fogZones) {
          const pulse = Math.sin(gameState.time * 3) * 0.15 + 0.85;

          // Zona de niebla tóxica con intensidad
          ctx.fillStyle = `rgba(132, 204, 22, ${gameState.fogOpacity * 0.4 * intensity})`;
          ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

          // Borde de la zona
          ctx.strokeStyle = `rgba(132, 204, 22, ${pulse * intensity})`;
          ctx.lineWidth = 3;
          ctx.shadowColor = "#5dbb63";
          ctx.shadowBlur = 0;
          ctx.setLineDash([10, 10]);
          ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;

          // Icono de niebla en el centro
          ctx.globalAlpha = intensity;
          ctx.fillStyle = `rgba(132, 204, 22, ${pulse})`;
          ctx.font = withTerminalFont("bold 48px system-ui");
          ctx.textAlign = "center";
          ctx.shadowColor = "#5dbb63";
          ctx.shadowBlur = 0;
          ctx.fillText(fogLabel, zone.x + zone.width / 2, zone.y + zone.height / 2 + 16);
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }

      // Renderizar zona de tormenta (solo si el evento está activo y con intensidad)
      if (
        gameState.environmentalEvent === "storm" &&
        gameState.stormZone &&
        (gameState.eventPhase === "fadein" || gameState.eventPhase === "active" || gameState.eventPhase === "fadeout")
      ) {
        const intensity = gameState.eventIntensity;
        const pulse = Math.sin(gameState.time * 4) * 0.2 + 0.8;
        const storm = gameState.stormZone;

        // Círculo de tormenta con intensidad
        const gradient = ctx.createRadialGradient(storm.x, storm.y, 0, storm.x, storm.y, storm.radius);
        gradient.addColorStop(0, `rgba(96, 165, 250, ${0.4 * intensity})`);
        gradient.addColorStop(0.7, `rgba(96, 165, 250, ${0.2 * intensity})`);
        gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(storm.x, storm.y, storm.radius, 0, Math.PI * 2);
        ctx.fill();

        // Borde pulsante
        ctx.strokeStyle = `rgba(96, 165, 250, ${pulse * intensity})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = "#2e86c1";
        ctx.shadowBlur = 0;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.arc(storm.x, storm.y, storm.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        // Indicador de tormenta
        const stormLabel = currentLanguage === "es" ? "TORMENTA" : "STORM";
        ctx.globalAlpha = intensity;
        ctx.fillStyle = `rgba(96, 165, 250, ${pulse})`;
        ctx.font = withTerminalFont("bold 24px system-ui");
        ctx.textAlign = "center";
        ctx.shadowColor = "#2e86c1";
        ctx.shadowBlur = 0;
        ctx.fillText(stormLabel, storm.x, storm.y + 8);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      if (gameState.environmentalEvent) {
        switch (gameState.environmentalEvent) {
          case "rain":
            // LLUVIA RADIACTIVA: No hay overlay global, solo partículas
            break;
        }
      }

      // Hotspots
      for (const h of visibleHotspots) {
        const pulse = Math.sin(gameState.time * 3) * 0.1 + 0.9;

        if (h.isNegative) {
          // HOTSPOT NEGATIVO (Zona de Peligro)
          const dangerPulse = Math.sin(gameState.time * 5) * 0.3 + 0.7;

          // Outer circle pulsante (rojo intenso)
          const gradient = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.rad);
          gradient.addColorStop(0, "rgba(220, 38, 38, 0.3)");
          gradient.addColorStop(0.7, "rgba(239, 68, 68, 0.2)");
          gradient.addColorStop(1, "rgba(220, 38, 38, 0)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.rad, 0, Math.PI * 2);
          ctx.fill();

          // Borde pulsante
          ctx.strokeStyle = h.active ? `rgba(239, 68, 68, ${dangerPulse})` : "rgba(220, 38, 38, 0.6)";
          ctx.lineWidth = 4;
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 0;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.rad, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;

          // Indicador de peligro
          ctx.fillStyle = "#ef4444";
          ctx.font = withTerminalFont("bold 18px system-ui");
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 0;
          const dangerLabel = currentLanguage === "es" ? "PELIGRO" : "DANGER";
          const dangerZoneText = currentLanguage === "es" ? "ZONA PELIGROSA" : "DANGER ZONE";
          ctx.fillText(dangerLabel, h.x, h.y - 6);
          ctx.shadowBlur = 0;

          // Texto de advertencia
          ctx.fillStyle = "#fff";
          ctx.font = withTerminalFont("bold 14px system-ui");
          ctx.fillText(dangerZoneText, h.x, h.y + 25);

          // Timer de expiración
          if (!h.active) {
            const remaining = h.maxExpiration - h.expirationTimer;
            ctx.fillStyle = "#ffc300";
            ctx.font = withTerminalFont("bold 16px system-ui");
            ctx.fillText(`${Math.ceil(remaining)}s`, h.x, h.y + 45);
          }
        } else if (h.isRadioactive) {
          // ZONA RADIACTIVA (Lluvia Radiactiva)
          const radioPulse = Math.sin(gameState.time * 4) * 0.2 + 0.8;

          // Gradiente púrpura radiactivo
          const radioGradient = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.rad);
          radioGradient.addColorStop(0, "rgba(168, 85, 247, 0.4)");
          radioGradient.addColorStop(0.6, "rgba(147, 51, 234, 0.2)");
          radioGradient.addColorStop(1, "rgba(126, 34, 206, 0)");
          ctx.fillStyle = radioGradient;
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.rad, 0, Math.PI * 2);
          ctx.fill();

          // Borde radiactivo animado
          ctx.strokeStyle = `rgba(168, 85, 247, ${radioPulse})`;
          ctx.lineWidth = 3;
          ctx.shadowColor = "#8e44ad";
          ctx.shadowBlur = 0;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.rad, gameState.time * 2, gameState.time * 2 + Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;

          // Indicador radiactivo
          ctx.fillStyle = "#8e44ad";
          ctx.font = withTerminalFont("bold 18px system-ui");
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 0;
          const radioactiveLabel = currentLanguage === "es" ? "RAD" : "RAD";
          ctx.fillText(radioactiveLabel, h.x, h.y + 6);
          ctx.shadowBlur = 0;
        } else {
          // HOTSPOT POSITIVO (recompensa)
          // Outer circle
          ctx.strokeStyle = h.active ? "#ffc300" : "rgba(251, 191, 36, 0.5)";
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 10]);
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.rad, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Progress circle (cuando está activo - progreso de recompensa)
          if (h.active) {
            ctx.strokeStyle = "#5dbb63";
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(h.x, h.y, h.rad - 10, 0, (Math.PI * 2 * h.progress) / h.required);
            ctx.stroke();
          } else {
            // Timer de caducación (cuando NO está activo)
            const expirationProgress = h.expirationTimer / h.maxExpiration;
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(h.x, h.y, h.rad - 10, 0, Math.PI * 2 * expirationProgress);
            ctx.stroke();
          }

          // Center glow
          ctx.fillStyle = `rgba(251, 191, 36, ${0.1 * pulse})`;
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.rad * 0.6, 0, Math.PI * 2);
          ctx.fill();

          // Time remaining text
          if (h.active) {
            // Mostrar tiempo para completar
            ctx.fillStyle = "#5dbb63";
            ctx.font = withTerminalFont("bold 20px system-ui");
            ctx.textAlign = "center";
            ctx.fillText(`${Math.ceil(h.required - h.progress)}s`, h.x, h.y + 5);
          } else {
            // Mostrar tiempo de caducación
            const remaining = h.maxExpiration - h.expirationTimer;
            ctx.fillStyle = "#ef4444";
            ctx.font = withTerminalFont("bold 18px system-ui");
            ctx.textAlign = "center";
            ctx.fillText(`${Math.ceil(remaining)}s`, h.x, h.y + 5);
          }
        }
      }
      };

      // Drops con glow de rareza para powerups y cofres
      renderBackgroundPass();

      const renderActorPass = () => {
      for (const d of visibleDrops) {
        ctx.setTransform(worldTransform);
        if (d.type === "chest") {
          const spawnTime = d.spawnTime ?? gameState.time;
          const bounce = Math.sin((gameState.time - spawnTime) * 5) * 4;
          const lootRarity = (d.lootRarity as Rarity | null) ?? null;
          const glowColor = (lootRarity && rarityColors[lootRarity]) || d.color || "#ff7a2a";

          ctx.save();
          ctx.setTransform(worldTransform);
          ctx.translate(d.x, d.y + bounce);

          ctx.save();
          ctx.globalAlpha = 0.45;
          ctx.fillStyle = glowColor;
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 32;
          ctx.beginPath();
          ctx.arc(0, 0, d.rad * 2.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = 0.85;
          ctx.strokeStyle = glowColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, d.rad * 1.25, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          const chestImage = gameState.chestImg;
          if (chestImage?.complete) {
            const aspect = chestImage.width && chestImage.height ? chestImage.width / chestImage.height : 1;
            const drawHeight = d.rad * 2.2;
            const drawWidth = drawHeight * aspect;
            ctx.drawImage(chestImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
          } else {
            const chestWidth = d.rad * 2.4;
            const chestHeight = d.rad * 1.6;
            const lidHeight = chestHeight * 0.45;

            ctx.fillStyle = "#7c2d12";
            ctx.fillRect(-chestWidth / 2, -chestHeight / 2 + lidHeight, chestWidth, chestHeight - lidHeight);

            ctx.fillStyle = d.color ?? "#ff7a2a";
            ctx.fillRect(-chestWidth / 2, -chestHeight / 2, chestWidth, lidHeight);

            ctx.fillStyle = "#fcd34d";
            ctx.fillRect(-3, -chestHeight / 2, 6, chestHeight);
            ctx.strokeStyle = "#fcd34d";
            ctx.lineWidth = 2;
            ctx.strokeRect(-chestWidth / 2, -chestHeight / 2, chestWidth, chestHeight);

            ctx.strokeStyle = "rgba(252, 211, 77, 0.6)";
            ctx.beginPath();
            ctx.moveTo(-chestWidth / 2, -chestHeight / 2 + lidHeight);
            ctx.lineTo(chestWidth / 2, -chestHeight / 2 + lidHeight);
            ctx.stroke();
          }

          ctx.restore();
          continue;
        }

        let alpha = 1;
        if (d.type === "xp" && d.lifetime !== undefined && d.lifetime < 3) {
          const blinkSpeed = d.lifetime < 1 ? 10 : 6;
          alpha = Math.abs(Math.sin(gameState.time * blinkSpeed)) * 0.7 + 0.3;
        }

        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = d.color;
        ctx.shadowColor = d.color;

        if (d.type === "powerup") {
          const pulse = Math.sin(gameState.time * 5) * 10 + 20;
          ctx.shadowBlur = 0;
          ctx.strokeStyle = d.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, d.rad + 5, 0, Math.PI * 2);
          ctx.stroke();
        } else if (d.type === "itemPickup") {
          const spawnTime = d.spawnTime ?? gameState.time;
          const bounce = Math.sin((gameState.time - spawnTime) * 6) * 3;
          ctx.translate(0, bounce);

          const glowColor = d.glowColor ?? d.color ?? HORIZON_VISOR_ITEM.color;

          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = glowColor;
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 28;
          ctx.beginPath();
          ctx.arc(0, 0, d.rad * 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          const visorImg = gameState.horizonVisorImg;
          const size = d.rad * 2.6;
          if (visorImg?.complete) {
            ctx.drawImage(visorImg, -size / 2, -size / 2, size, size);
          } else {
            ctx.fillStyle = glowColor;
            ctx.beginPath();
            ctx.arc(0, 0, d.rad, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
          continue;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fill(getDiamondPath(d.rad));
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
        ctx.globalAlpha = 1;
        ctx.restore();
      }
      ctx.setTransform(worldTransform);

      // Partículas
      const shouldRenderParticles = !gameState.activeChestChoice && !gameState.suppressParticlesForChest;
      if (!overlaySupportedRef.current && shouldRenderParticles) {
        for (const p of visibleParticles) {
          ctx.save();
          ctx.globalAlpha = p.opacity ?? Math.max(0, Math.min(1, p.life));
          if (p.style === "shockwave") {
            const radius = Math.max(6, p.radius ?? p.size ?? 12);
            ctx.strokeStyle = hexToRgba(p.color ?? "#ffedd5", ctx.globalAlpha * 0.9);
            ctx.lineWidth = Math.max(2, (p.maxRadius ?? radius) * 0.04);
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            continue;
          }

          if (p.style === "heat") {
            const radius = (p.size ?? 16) * 1.4;
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
            gradient.addColorStop(0, hexToRgba(p.color ?? "#ff9f68", ctx.globalAlpha * 0.7));
            gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            continue;
          }

          if (p.style === "core") {
            ctx.fillStyle = hexToRgba(p.color ?? "#ff7a2a", ctx.globalAlpha);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size ?? 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            continue;
          }

          ctx.fillStyle = p.color ?? "#ffffff";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size ?? 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      if (!overlaySupportedRef.current) {
        ctx.globalAlpha = 1;
      }

      // Enemigos
      for (const e of visibleEnemies) {
        // Determine which image to use based on enemy type and color
        let enemyImage: HTMLImageElement | null = null;

        if (e.isBoss && gameState.bossImg?.complete) {
          enemyImage = gameState.bossImg;
        } else if (e.specialType === "explosive" && gameState.bomberImg?.complete) {
          enemyImage = gameState.bomberImg;
        } else if (e.specialType === "fast" && gameState.larvaImg?.complete) {
          enemyImage = gameState.larvaImg;
        } else if (e.specialType === "tank" && gameState.shieldImg?.complete) {
          enemyImage = gameState.shieldImg;
        } else if (e.specialType === "summoner" && gameState.ghoulImg?.complete) {
          enemyImage = gameState.ghoulImg;
        } else if (e.isSummoned && gameState.hellDogImg?.complete) {
          enemyImage = gameState.hellDogImg;
        } else if ((e.color === "#5dbb63" || e.color === "#16a34a") && gameState.greenZombieImg?.complete) {
          enemyImage = gameState.greenZombieImg;
        } else if (e.color === "#8e44ad" && gameState.mediumZombieImg?.complete) {
          enemyImage = gameState.mediumZombieImg;
        } else if (e.color === "#9333ea" && gameState.purpleZombieImg?.complete) {
          enemyImage = gameState.purpleZombieImg;
        } else if (e.color === "#78716c" && gameState.shieldImg?.complete) {
          enemyImage = gameState.shieldImg;
        }

        if (enemyImage) {
          const logoSize = e.rad * 3;
          ctx.drawImage(enemyImage, e.x - logoSize / 2, e.y - logoSize / 2, logoSize, logoSize);
        } else if (gameState.mediumZombieImg && gameState.mediumZombieImg.complete) {
          const logoSize = e.rad * 3;
          let prerenderedLogo = prerenderedLogosRef.current[e.color];
          if (!prerenderedLogo) {
            const generatedLogo = ensureTintedLogo(e.color);
            if (generatedLogo) {
              prerenderedLogo = generatedLogo;
            }
          }

          if (prerenderedLogo) {
            ctx.drawImage(prerenderedLogo, e.x - logoSize / 2, e.y - logoSize / 2, logoSize, logoSize);
          }
        } else {
          ctx.fillStyle = e.color;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.rad, 0, Math.PI * 2);
          ctx.fill();
        }

        if (e.specialType === "explosive" && e.explosionTimer !== undefined && e.explosionTimer >= 0) {
          const pulse = Math.sin(gameState.time * 12) * 0.4 + 0.6;
          const warningRadius = e.rad + 8 + pulse * 5;
          const intensity = e.explosionTimer < 0.5 ? 1 : 0.6;
          ctx.strokeStyle =
            e.explosionTimer < 0.5
              ? `rgba(251, 191, 36, ${pulse * intensity})`
              : `rgba(239, 68, 68, ${pulse * intensity})`;
          ctx.lineWidth = e.explosionTimer < 0.5 ? 4 : 3;
          ctx.shadowColor = e.explosionTimer < 0.5 ? "#ffc300" : "#ef4444";
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(e.x, e.y, warningRadius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.globalAlpha = 0.15 * pulse;
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(e.x, e.y, 80, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;
          ctx.shadowColor = "transparent";
          ctx.globalAlpha = 1;
        }

        const barW = e.rad * 2;
        const barH = e.isBoss ? 8 : e.isElite ? 5 : 3;
        const barX = e.x - barW / 2;
        const barY = e.y - e.rad - (e.isBoss ? 35 : 10);

        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(barX, barY, barW, barH);

        const hpBarWidth = barW * Math.max(0, Math.min(1, e.hp / e.maxhp));
        ctx.fillStyle =
          e.isBoss
            ? BOSS_COLOR
            : e.isElite
              ? "#ff3b3b"
              : WEAK_ENEMY_COLOR;
        ctx.fillRect(barX, barY, hpBarWidth, barH);

        if (e.isBoss) {
          const prevAlign = ctx.textAlign;
          const prevFill = ctx.fillStyle;
          ctx.fillStyle = "#fff";
          ctx.font = withTerminalFont("bold 14px system-ui");
          ctx.textAlign = "center";
          ctx.fillText(`FASE ${e.phase}`, e.x, e.y + e.rad + 15);
          ctx.textAlign = prevAlign;
          ctx.fillStyle = prevFill;
        }
      }

      // Balas
      for (const b of gameState.bullets) {
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        if (b.isEnemyBullet) {
          ctx.fillStyle = UI_COLORS.healthHigh;
          ctx.shadowColor = UI_COLORS.healthHigh;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.restore();
          continue;
        }

        const visualType =
          b.visualType ??
          (b.weaponId === "flamethrower"
            ? "flame"
            : b.weaponId === "frostbow"
              ? "frost"
              : "bullet");

        if (visualType === "flame") {
          const time = gameState.time;
          const flicker = 0.85 + Math.sin(time * 18 + (b.x + b.y) * 0.05) * 0.15;
          const flameRadius = 6 * flicker;
          const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, flameRadius);
          gradient.addColorStop(0, "rgba(255, 248, 220, 0.95)");
          gradient.addColorStop(0.4, "rgba(251, 146, 60, 0.9)");
          gradient.addColorStop(1, "rgba(234, 88, 12, 0)");
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(b.x, b.y, flameRadius, 0, Math.PI * 2);
          ctx.fill();

          const tailLength = 18;
          ctx.globalAlpha = 0.7;
          ctx.strokeStyle = "rgba(249, 115, 22, 0.85)";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - Math.cos(b.dir) * tailLength, b.y - Math.sin(b.dir) * tailLength);
          ctx.stroke();

          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        } else if (visualType === "frost") {
          const frostColor = "#60a5fa";
          const target =
            b.frostTarget && !(b.frostTarget as any).__removed && b.frostTarget.hp > 0
              ? b.frostTarget
              : null;
          const startX = b.originX ?? gameState.player.x;
          const startY = b.originY ?? gameState.player.y;
          const endX = target ? target.x : b.x;
          const endY = target ? target.y : b.y;

          const beamGradient = ctx.createLinearGradient(startX, startY, endX, endY);
          beamGradient.addColorStop(0, "rgba(191, 219, 254, 0)");
          beamGradient.addColorStop(0.5, "rgba(125, 211, 252, 0.6)");
          beamGradient.addColorStop(1, "rgba(59, 130, 246, 0.9)");
          ctx.strokeStyle = beamGradient;
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          const dirAngle = Math.atan2(endY - startY, endX - startX);
          const normalX = Math.sin(dirAngle);
          const normalY = -Math.cos(dirAngle);
          const oscillation = Math.sin(gameState.time * 12 + (b.x + b.y) * 0.05) * 3;
          ctx.strokeStyle = "rgba(96, 165, 250, 0.35)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(startX + normalX * oscillation, startY + normalY * oscillation);
          ctx.lineTo(endX + normalX * oscillation, endY + normalY * oscillation);
          ctx.stroke();

          ctx.fillStyle = frostColor;
          ctx.shadowColor = "rgba(96, 165, 250, 0.9)";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (visualType === "rocket" || visualType === "missile") {
          const bodyLength = visualType === "rocket" ? 26 : 22;
          const bodyWidth = visualType === "rocket" ? 8 : 6;
          const noseLength = visualType === "rocket" ? 8 : 7;
          const tailLength = visualType === "rocket" ? 16 : 13;
          const bodyColor = visualType === "rocket" ? "#f97316" : "#a855f7";
          const accentColor = visualType === "rocket" ? "#fde68a" : "#c4b5fd";
          const finColor = visualType === "rocket" ? "#7c2d12" : "#5b21b6";
          const glowColor = visualType === "rocket" ? "rgba(249, 115, 22, 0.6)" : "rgba(168, 85, 247, 0.6)";
          const thrusterColor =
            b.trailColor ?? (visualType === "rocket" ? "rgba(249, 115, 22, 0.85)" : "rgba(168, 85, 247, 0.85)");

          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(b.dir);

          const bodyGradient = ctx.createLinearGradient(-bodyLength / 2, 0, bodyLength / 2, 0);
          bodyGradient.addColorStop(0, bodyColor);
          bodyGradient.addColorStop(0.5, "#ffffff");
          bodyGradient.addColorStop(1, bodyColor);

          ctx.fillStyle = bodyGradient;
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 12;
          ctx.fillRect(-bodyLength / 2, -bodyWidth / 2, bodyLength, bodyWidth);

          ctx.shadowBlur = 0;

          ctx.fillStyle = accentColor;
          ctx.beginPath();
          ctx.moveTo(bodyLength / 2, 0);
          ctx.lineTo(bodyLength / 2 - noseLength, bodyWidth / 2);
          ctx.lineTo(bodyLength / 2 - noseLength, -bodyWidth / 2);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = finColor;
          ctx.beginPath();
          ctx.moveTo(-bodyLength / 3, -bodyWidth / 2);
          ctx.lineTo(-bodyLength / 2, -bodyWidth);
          ctx.lineTo(-bodyLength / 2 + bodyWidth * 0.8, -bodyWidth / 2);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(-bodyLength / 3, bodyWidth / 2);
          ctx.lineTo(-bodyLength / 2, bodyWidth);
          ctx.lineTo(-bodyLength / 2 + bodyWidth * 0.8, bodyWidth / 2);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = accentColor;
          ctx.fillRect(-bodyLength / 8, -bodyWidth / 3, bodyLength / 6, bodyWidth / 1.5);

          const tailGradient = ctx.createLinearGradient(-bodyLength / 2 - tailLength, 0, -bodyLength / 2, 0);
          tailGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
          tailGradient.addColorStop(0.3, thrusterColor);
          tailGradient.addColorStop(1, "rgba(255, 255, 255, 0.9)");

          ctx.fillStyle = tailGradient;
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.moveTo(-bodyLength / 2, -bodyWidth * 0.4);
          ctx.lineTo(-bodyLength / 2 - tailLength, 0);
          ctx.lineTo(-bodyLength / 2, bodyWidth * 0.4);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-bodyLength / 6, -bodyWidth / 2 + 1);
          ctx.lineTo(bodyLength / 3, -bodyWidth / 2 + 1);
          ctx.stroke();

          ctx.restore();
        } else {
          const bulletColor = "#facc15";
          const bulletSize = 2.5;
          const tailLength = 14;

          ctx.strokeStyle = "rgba(250, 204, 21, 0.55)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - Math.cos(b.dir) * tailLength, b.y - Math.sin(b.dir) * tailLength);
          ctx.stroke();

          if (b.homing) {
            const extendedTail = 20;
            ctx.strokeStyle = "rgba(250, 204, 21, 0.35)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(
              b.x - Math.cos(b.dir) * extendedTail,
              b.y - Math.sin(b.dir) * extendedTail,
            );
            ctx.stroke();
          }

          if (b.chain) {
            ctx.strokeStyle = "rgba(96, 165, 250, 0.6)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(b.x, b.y, bulletSize + 2, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.fillStyle = bulletColor;
          ctx.shadowColor = bulletColor;
          ctx.shadowBlur = b.isCrit ? 10 : 6;
          ctx.beginPath();
          ctx.arc(b.x, b.y, bulletSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Aura de fuego
      if (gameState.player.stats.auraRadius > 0) {
        ctx.strokeStyle = "rgba(248, 113, 113, 0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gameState.player.x, gameState.player.y, gameState.player.stats.auraRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Jugador con rage mode visual
      const blink = gameState.player.ifr > 0 && Math.floor(gameState.time * 12) % 2 === 0;
      const isRage = gameState.player.rageTimer > 0;
      ctx.save();
      if (blink) ctx.globalAlpha = 0.4;

      // Rage mode glow
      const playerAccent = isRage ? UI_COLORS.rageAccent : UI_COLORS.accent;
      const playerGlow = isRage ? UI_COLORS.rageGlow : UI_COLORS.accentGlow;

      if (isRage) {
        ctx.shadowColor = playerAccent;
        ctx.shadowBlur = 0;
        ctx.strokeStyle = playerAccent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(gameState.player.x, gameState.player.y, gameState.player.rad + 10, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.shadowColor = playerGlow;
      ctx.shadowBlur = 0;

      const playerSprite = gameState.playerImg;
      const hasPlayerSprite = Boolean(
        playerSprite &&
          playerSprite.complete &&
          playerSprite.naturalWidth > 0 &&
          playerSprite.naturalHeight > 0,
      );
      const baseAlpha = ctx.globalAlpha;

      if (hasPlayerSprite) {
        const baseCircleOpacity = 0;
        if (baseCircleOpacity > 0) {
          ctx.fillStyle = playerAccent;
          ctx.beginPath();
          ctx.arc(gameState.player.x, gameState.player.y, gameState.player.rad * 1.15, 0, Math.PI * 2);
          ctx.globalAlpha = baseAlpha * baseCircleOpacity;
          ctx.fill();
          ctx.globalAlpha = baseAlpha;
        }

        const aspectRatio = playerSprite.naturalWidth / playerSprite.naturalHeight || 1;
        const baseHeight = gameState.player.rad * 2.7;
        const drawHeight = baseHeight;
        const drawWidth = baseHeight * aspectRatio;

        ctx.drawImage(
          playerSprite,
          gameState.player.x - drawWidth / 2,
          gameState.player.y - drawHeight / 2,
          drawWidth,
          drawHeight,
        );
      } else {
        ctx.fillStyle = playerAccent;
        ctx.beginPath();
        ctx.arc(gameState.player.x, gameState.player.y, gameState.player.rad, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.restore();

      // Powerup indicators
      let indicatorY = gameState.player.y - gameState.player.rad - 30;
      if (gameState.player.tempMagnetTimer > 0) {
        ctx.fillStyle = "#5dbb63";
        ctx.font = withTerminalFont("bold 12px system-ui");
        ctx.textAlign = "center";
        const magnetLabel = currentLanguage === "es" ? "IMÁN" : "MAGNET";
        ctx.fillText(`${magnetLabel} ${Math.ceil(gameState.player.tempMagnetTimer)}s`, gameState.player.x, indicatorY);
        indicatorY -= 15;
      }
      if (gameState.player.rageTimer > 0) {
        ctx.fillStyle = playerAccent;
        ctx.font = withTerminalFont("bold 12px system-ui");
        const rageLabel = currentLanguage === "es" ? "FURIA" : "RAGE";
        ctx.fillText(`${rageLabel} ${Math.ceil(gameState.player.rageTimer)}s`, gameState.player.x, indicatorY);
      }

      if (overlaySupportedRef.current && overlayWorkerRef.current) {
        const overlayParticles: OverlayParticle[] =
          gameState.showUpgradeUI || !shouldRenderParticles
            ? []
            : visibleParticles.map((particle) => {
                const screen = worldToScreen(particle.x, particle.y);
                return {
                  x: screen.x,
                  y: screen.y,
                  size: Math.max(1, particle.size * zoom),
                  life: particle.life,
                  color: particle.color,
                };
              });

        if (gameState.player) {
          const { vx, vy } = gameState.player;
          if (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05) {
            gameState.minimapHeading = Math.atan2(vy, vx);
          }
        }

        const minimapPlayer: MinimapEntity | null = gameState.player
          ? {
              x: gameState.player.x,
              y: gameState.player.y,
              radius: gameState.player.rad,
              color: UI_COLORS.minimap,
              variant: "player",
            }
          : null;

        const minimapEnemies: MinimapEntity[] = [];
        const minimapBosses: MinimapEntity[] = [];
        for (const enemy of visibleEnemies) {
          const entity: MinimapEntity = {
            x: enemy.x,
            y: enemy.y,
            radius: enemy.rad,
            color: enemy.isBoss ? BOSS_COLOR : enemy.color,
            variant: enemy.isBoss ? "boss" : "enemy",
          };
          if (enemy.isBoss) {
            minimapBosses.push(entity);
          } else {
            minimapEnemies.push(entity);
          }
        }

        const minimapDrops: MinimapEntity[] = visibleDrops.map((drop) => ({
          x: drop.x,
          y: drop.y,
          radius: drop.rad,
          color: drop.color,
          variant: "drop",
        }));

        if (gameState.bossPortal?.active) {
          minimapDrops.push({
            x: gameState.bossPortal.x,
            y: gameState.bossPortal.y,
            radius: gameState.bossPortal.rad,
            color: PORTAL_COLORS.boss,
          });
        }

        if (gameState.exitPortal?.active) {
          minimapDrops.push({
            x: gameState.exitPortal.x,
            y: gameState.exitPortal.y,
            radius: gameState.exitPortal.rad,
            color: PORTAL_COLORS.exit,
          });
        }

        const minimapHotspots: MinimapEntity[] = visibleHotspots.map((hotspot) => ({
          x: hotspot.x,
          y: hotspot.y,
          radius: hotspot.rad,
          color: hotspot.isNegative ? "#ef4444" : hotspot.isRadioactive ? "#8e44ad" : "#ffc300",
          variant: hotspot.isNegative
            ? "hotspot-danger"
            : hotspot.isRadioactive
              ? "hotspot-radioactive"
              : "hotspot-objective",
          pulse: hotspot.active ? 1 : 0,
        }));

        const minimapPortals: MinimapEntity[] = [];
        const chestPortal = gameState.activeChestChoice?.chestPosition;
        if (chestPortal) {
          minimapPortals.push({
            x: chestPortal.x,
            y: chestPortal.y,
            radius: 22,
            color: "#60a5fa",
            variant: "portal",
          });
        }

        const minimapFrame: MinimapFrame = {
          worldWidth: gameState.worldWidth,
          worldHeight: gameState.worldHeight,
          player: minimapPlayer,
          enemies: minimapEnemies,
          bosses: minimapBosses,
          drops: minimapDrops,
          hotspots: minimapHotspots,
          portals: minimapPortals,
          playerHeading: gameState.minimapHeading ?? 0,
          detailLevel: gameState.minimapDetailLevel ?? 0,
          opacity: gameState.showUpgradeUI
            ? 0
            : Math.max(0, Math.min(1, gameState.minimapOpacity ?? 0)),
        };

        overlayWorkerRef.current.postMessage({
          type: "frame",
          width: W,
          height: H,
          particles: overlayParticles,
          minimap: minimapFrame,
        });
      }

      ctx.restore();
      };

      renderActorPass();

      const renderUIPass = () => {
        const textPrimary = UI_COLORS.textPrimary;
      // Restart hold indicator
      if (gameState.restartTimer > 0) {
        const progress = Math.min(1, gameState.restartTimer / gameState.restartHoldTime);
        const panelSize = 140;
        const panelX = W / 2 - panelSize / 2;
        const panelY = H / 2 - panelSize / 2;
        drawPixelPanel(ctx, panelX, panelY, panelSize, panelSize, {
          border: hexToRgba(UI_COLORS.healthHigh, 0.8),
          highlight: hexToRgba(UI_COLORS.healthHigh, 0.18),
        });

        const barX = panelX + 12;
        const barY = panelY + panelSize - 36;
        const barW = panelSize - 24;
        const barH = 18;
        drawPixelPanel(ctx, barX, barY, barW, barH, {
          background: "rgba(26, 26, 26, 0.9)",
          border: hexToRgba(UI_COLORS.healthHigh, 0.45),
          highlight: hexToRgba(UI_COLORS.healthHigh, 0.12),
        });

        const innerWidth = Math.max(0, (barW - 6) * progress);
        if (innerWidth > 0) {
          drawSegmentedBar(ctx, barX + 3, barY + 3, innerWidth, barH - 6, UI_COLORS.healthHigh, 6);
        }

        const remaining = Math.max(0, Math.ceil(gameState.restartHoldTime - gameState.restartTimer));
        ctx.fillStyle = textPrimary;
        ctx.font = withTerminalFont("bold 28px system-ui");
        ctx.textAlign = "center";
        ctx.fillText("R", panelX + panelSize / 2, panelY + panelSize / 2 - 6);

        ctx.font = withTerminalFont("bold 16px system-ui");
        ctx.fillStyle = UI_COLORS.healthHigh;
        ctx.fillText(remaining === 0 ? "0s" : `${remaining}s`, panelX + panelSize / 2, barY - 6);

        drawWarningIcon(ctx, panelX + panelSize - 36, panelY + 10, 18, UI_COLORS.healthHigh);
      }

      drawHUD();
      drawUpgradeUI();
      drawChestChoiceUI();

      // Danger Zone visual effect (pantalla parpadeante roja si está >0.5s en zona de peligro)
      if (gameState.inDangerZone && gameState.dangerZoneTimer > 0.5) {
        const flashIntensity = Math.sin(gameState.time * 8) * 0.2 + 0.3; // Parpadeo rápido
        ctx.save();

        // Borde rojo alrededor de toda la pantalla
        ctx.strokeStyle = `rgba(255, 59, 59, ${flashIntensity})`;
        ctx.lineWidth = 15;
        ctx.strokeRect(7.5, 7.5, W - 15, H - 15);

        // Overlay rojo sutil en toda la pantalla
        ctx.fillStyle = `rgba(176, 0, 32, ${flashIntensity * 0.2})`;
        ctx.fillRect(0, 0, W, H);

        ctx.restore();
      }

      if (gameState.player.nightVisionActive) {
        ctx.save();
        ctx.globalCompositeOperation = "color";
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "rgba(93, 187, 99, 0.9)";
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "rgba(0, 209, 64, 0.9)";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      drawCRTOverlay();

      // Game Over overlay fade
      // GAME OVER SCREEN
      if (gameState.state === "gameover") {
        ctx.save();

        // Fade in del overlay (primeros 2 segundos)
        const fadeAlpha = Math.min(0.9, gameState.gameOverAnimationTimer / 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
        ctx.fillRect(0, 0, W, H);

        // Mostrar mensaje dramático los primeros 3 segundos
        if (gameState.gameOverAnimationTimer < 3) {
          const messageAlpha = Math.min(1, gameState.gameOverAnimationTimer / 1);
          const pulse = Math.sin(gameState.time * 3) * 0.2 + 0.8;

          ctx.globalAlpha = messageAlpha;
          ctx.fillStyle = UI_COLORS.healthHigh;
          ctx.font = withTerminalFont("bold 48px system-ui");
          ctx.textAlign = "center";
          ctx.shadowColor = UI_COLORS.healthHigh;
          ctx.shadowBlur = 0;
          ctx.fillText("Has caído en la horda...", W / 2, H / 2 - 80);
          ctx.shadowBlur = 0;

          // Mostrar tiempo sobrevivido después de 1.5s
          if (gameState.gameOverAnimationTimer > 1.5) {
            const timeAlpha = Math.min(1, (gameState.gameOverAnimationTimer - 1.5) / 1);
            ctx.globalAlpha = timeAlpha;
            const time = Math.floor(gameState.elapsedTime);
            const mm = String(Math.floor(time / 60)).padStart(2, "0");
            const ss = String(time % 60).padStart(2, "0");
            ctx.fillStyle = UI_COLORS.ammo;
            ctx.font = withTerminalFont("bold 56px system-ui");
            ctx.shadowColor = UI_COLORS.ammo;
            ctx.shadowBlur = 0;
            ctx.fillText(`Tiempo sobrevivido: ${mm}:${ss}`, W / 2, H / 2 + 20);
            ctx.shadowBlur = 0;
          }

          ctx.globalAlpha = 1;
          drawCRTOverlay();
          ctx.restore();
          return; // No mostrar el panel hasta después de 3 segundos
        }

        // Panel de resultados (aparece después de 3 segundos)
        const panelAlpha = Math.min(1, (gameState.gameOverAnimationTimer - 3) / 1);
        ctx.globalAlpha = panelAlpha;

        const menuW = 700;
        const menuH = 700;
        const menuX = W / 2 - menuW / 2;
        const menuY = H / 2 - menuH / 2;

        // Background con gradiente
        const bgGradient = ctx.createLinearGradient(menuX, menuY, menuX, menuY + menuH);
        bgGradient.addColorStop(0, "rgba(10, 10, 10, 0.96)");
        bgGradient.addColorStop(1, "rgba(24, 24, 24, 0.96)");
        ctx.fillStyle = bgGradient;
        ctx.fillRect(menuX, menuY, menuW, menuH);

        // Border con glow rojo
        ctx.strokeStyle = UI_COLORS.healthHigh;
        ctx.lineWidth = 4;
        ctx.shadowColor = UI_COLORS.healthHigh;
        ctx.shadowBlur = 0;
        ctx.strokeRect(menuX, menuY, menuW, menuH);
        ctx.shadowBlur = 0;

        // Título GAME OVER
        ctx.fillStyle = UI_COLORS.healthHigh;
        ctx.font = withTerminalFont("bold 64px system-ui");
        ctx.textAlign = "center";
        ctx.shadowColor = UI_COLORS.healthHigh;
        ctx.shadowBlur = 0;
        ctx.fillText(t.gameOver, W / 2, menuY + 90);
        ctx.shadowBlur = 0;

        let contentY = menuY + 160;

        // Separador
        ctx.strokeStyle = "rgba(255, 59, 59, 0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(menuX + 60, contentY);
        ctx.lineTo(menuX + menuW - 60, contentY);
        ctx.stroke();

        contentY += 50;

        // Estadísticas finales
        const leftCol = menuX + 120;
        const rightCol = menuX + menuW / 2 + 80;

        ctx.font = withTerminalFont("bold 28px system-ui");
        ctx.fillStyle = UI_COLORS.accent;
        ctx.textAlign = "left";
        ctx.fillText(t.stats, leftCol, contentY);
        contentY += 60;

        ctx.font = withTerminalFont("24px system-ui");
        ctx.fillStyle = textSecondary;

        // Score
        ctx.fillText(t.finalScore + ":", leftCol, contentY);
        ctx.fillStyle = UI_COLORS.xp;
        ctx.textAlign = "right";
        ctx.fillText(gameState.score.toString(), rightCol + 180, contentY);
        contentY += 50;

        // Level
        ctx.fillStyle = textSecondary;
        ctx.textAlign = "left";
        ctx.fillText(t.finalLevel + ":", leftCol, contentY);
        ctx.fillStyle = UI_COLORS.accent;
        ctx.textAlign = "right";
        ctx.fillText(gameState.level.toString(), rightCol + 180, contentY);
        contentY += 50;

        // Dificultad final
        ctx.fillStyle = textSecondary;
        ctx.textAlign = "left";
        ctx.fillText(t.finalDifficulty + ":", leftCol, contentY);
        ctx.fillStyle = DIFFICULTY_TIERS[gameState.difficulty.tierIndex].color;
        ctx.textAlign = "right";
        ctx.fillText(
          `${gameState.difficulty.tierLabel.toUpperCase()} (Lv. ${gameState.difficulty.level})`,
          rightCol + 180,
          contentY,
        );
        contentY += 50;

        // Tiempo
        const time = Math.floor(gameState.elapsedTime);
        const mm = String(Math.floor(time / 60)).padStart(2, "0");
        const ss = String(time % 60).padStart(2, "0");
        ctx.fillStyle = textSecondary;
        ctx.textAlign = "left";
        ctx.fillText("Tiempo:", leftCol, contentY);
        ctx.fillStyle = UI_COLORS.ammo;
        ctx.textAlign = "right";
        ctx.fillText(`${mm}:${ss}`, rightCol + 180, contentY);

        // Botón de reinicio
        const btnW = 400;
        const btnH = 70;
        const btnX = W / 2 - btnW / 2;
        const btnY = menuY + menuH - 120;

        const btnGradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
        btnGradient.addColorStop(0, UI_COLORS.healthHigh);
        btnGradient.addColorStop(1, UI_COLORS.healthLow);
        ctx.fillStyle = btnGradient;
        ctx.beginPath();
        drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 15);
        ctx.fill();

        ctx.strokeStyle = textPrimary;
        ctx.lineWidth = 3;
        ctx.shadowColor = UI_COLORS.healthHigh;
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = textPrimary;
        ctx.font = withTerminalFont("bold 32px system-ui");
        ctx.textAlign = "center";
        ctx.fillText(t.playAgain, btnX + btnW / 2, btnY + btnH / 2 + 12);

        // Hint de teclas
        ctx.fillStyle = textSecondary;
        ctx.font = withTerminalFont("18px system-ui");
        ctx.fillText("Presiona R o Enter para reiniciar", W / 2, menuY + menuH - 25);

        ctx.restore();
      }

      // Pause menu - Simplified unified design
      if (
        gameState.state === "paused" &&
        !gameState.showUpgradeUI &&
        gameState.countdownTimer <= 0 &&
        !gameState.pausedForChest
      ) {
        ctx.save();
        ctx.fillStyle = UI_COLORS.overlay;
        ctx.fillRect(0, 0, W, H);

        const currentLanguage = (gameState.language ?? language) as Language;
        const locale = translations[currentLanguage];
        const t = locale;
        const layout = getPauseMenuLayout(W, H);
        const { menuX, menuY, menuW, menuH, padding, scale } = layout;
        const homeLayout = getPauseMenuHomeLayout(layout, gameState.pauseMenuAudioOpen);
        const pauseAccent = gameState.player.rageTimer > 0 ? UI_COLORS.rageAccent : UI_COLORS.accent;
        const pauseGlow = gameState.player.rageTimer > 0 ? UI_COLORS.rageGlow : UI_COLORS.accentGlow;

        const scaleValue = (value: number) => value * scale;
        const scaledRadius = (value: number) => Math.max(6, value * scale);
        const getScaledFont = (size: number, weight?: string) => {
          const px = Math.max(12, Math.round(size * scale));
        return withTerminalFont(`${weight ? `${weight} ` : ""}${px}px system-ui`);
        };

        // Main menu background with neon glow
        ctx.save();
        ctx.beginPath();
        drawRoundedRect(ctx, menuX, menuY, menuW, menuH, scaledRadius(20));
        const bgGradient = ctx.createLinearGradient(menuX, menuY, menuX, menuY + menuH);
        bgGradient.addColorStop(0, "rgba(10, 10, 10, 0.96)");
        bgGradient.addColorStop(1, "rgba(24, 24, 24, 0.92)");
        ctx.fillStyle = bgGradient;
        ctx.shadowColor = pauseGlow;
        ctx.shadowBlur = 0;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = pauseAccent;
        ctx.lineWidth = Math.max(2, 2.5 * scale);
        ctx.stroke();
        ctx.restore();

        // Header
        const headerY = menuY + padding;
        ctx.fillStyle = pauseAccent;
        ctx.font = getScaledFont(32, "800");
        ctx.textAlign = "center";
        ctx.shadowColor = pauseGlow;
        ctx.shadowBlur = 0;
        ctx.fillText(t.paused.toUpperCase(), W / 2, headerY);
        ctx.shadowBlur = 0;

        // Quick stats grid
        const statsY = headerY + 60 * scale;
        if (!gameState.pauseMenuAudioOpen) {
          const totalSeconds = Math.floor(gameState.time);
          const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
          const seconds = String(totalSeconds % 60).padStart(2, "0");

          const timeLabel = currentLanguage === "es" ? "TIEMPO" : "TIME";
          const stats = [
            {
              label: t.difficulty,
              value: `${gameState.difficulty.tierLabel.toUpperCase()} (${t.levelShort ?? t.level} ${gameState.difficulty.level})`,
              color: DIFFICULTY_TIERS[gameState.difficulty.tierIndex].color,
            },
            { label: t.level, value: `${gameState.level}`, color: UI_COLORS.ammo },
            { label: timeLabel, value: `${minutes}:${seconds}`, color: UI_COLORS.xp },
          ];

          const statBoxW = (menuW - padding * 2 - 20 * scale) / 3;
          const statBoxH = 70 * scale;

          stats.forEach((stat, i) => {
            const statX = menuX + padding + i * (statBoxW + 10 * scale);

            ctx.save();
            ctx.beginPath();
            drawRoundedRect(ctx, statX, statsY, statBoxW, statBoxH, scaledRadius(12));
            const statGradient = ctx.createLinearGradient(statX, statsY, statX, statsY + statBoxH);
            statGradient.addColorStop(0, `${stat.color}2a`);
            statGradient.addColorStop(1, "rgba(15, 15, 15, 0.7)");
            ctx.fillStyle = statGradient;
            ctx.fill();
            ctx.strokeStyle = `${stat.color}a5`;
            ctx.lineWidth = Math.max(1, 1.5 * scale);
            ctx.stroke();
            ctx.restore();

            ctx.textAlign = "center";
            ctx.fillStyle = textSecondary;
            ctx.font = getScaledFont(13, "500");
            ctx.fillText(stat.label.toUpperCase(), statX + statBoxW / 2, statsY + 22 * scale);

            ctx.fillStyle = stat.color;
            ctx.font = getScaledFont(24, "700");
            ctx.fillText(stat.value, statX + statBoxW / 2, statsY + statBoxH - 18 * scale);
          });
        }

        // Buttons
        const buttonH = 56 * scale;
        const {
          buttons: { continue: continueBtn, audio: audioBtn, language: languageBtn, restart: restartBtn },
          audioPanel,
        } = homeLayout;

        gameState.pauseMenuHitAreas.home.resume = continueBtn;
        gameState.pauseMenuHitAreas.home.language = languageBtn;
        gameState.pauseMenuHitAreas.home.restart = restartBtn;
        gameState.pauseMenuAudioHitAreas.button = audioBtn;

        // Audio settings panel
        if (gameState.pauseMenuAudioOpen) {
          const {
            rect: { x: panelX, y: panelY, w: panelW, h: panelH },
            slider,
            toggles,
          } = audioPanel;

          ctx.save();
          ctx.beginPath();
          drawRoundedRect(ctx, panelX, panelY, panelW, panelH, scaledRadius(18));
          const panelGradient = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
          panelGradient.addColorStop(0, `${UI_COLORS.shield}2f`);
          panelGradient.addColorStop(1, UI_COLORS.panelBg);
          ctx.fillStyle = panelGradient;
          ctx.fill();
          ctx.strokeStyle = `${UI_COLORS.shield}aa`;
          ctx.lineWidth = Math.max(1.5, 2 * scale);
          ctx.shadowColor = `${UI_COLORS.shield}55`;
          ctx.shadowBlur = 0;
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.restore();

          ctx.fillStyle = textPrimary;
          ctx.font = getScaledFont(18, "700");
          ctx.textAlign = "center";
          ctx.fillText(t.pauseMenu.audio.toUpperCase(), panelX + panelW / 2, panelY + Math.min(36 * scale, Math.max(24 * scale, panelH * 0.18)));

          ctx.textAlign = "left";
          ctx.fillStyle = textSecondary;
          ctx.font = getScaledFont(14, "600");
          const volumeLabelY = Math.min(panelY + panelH - 20 * scale, panelY + Math.max(54 * scale, panelH * 0.32));
          ctx.fillText(t.pauseMenu.musicVolume, panelX + 20 * scale, volumeLabelY);

          ctx.textAlign = "right";
          ctx.fillStyle = textPrimary;
          ctx.fillText(
            `${Math.round(gameState.targetMusicVolume * 100)}%`,
            panelX + panelW - 20 * scale,
            volumeLabelY,
          );

          const sliderX = slider.rect.x;
          const sliderW = slider.rect.w;
          const sliderY = slider.rect.y;
          const sliderH = slider.rect.h;

          ctx.save();
          ctx.beginPath();
          drawRoundedRect(ctx, sliderX, sliderY, sliderW, sliderH, scaledRadius(12));
          ctx.fillStyle = UI_COLORS.panelBg;
          ctx.fill();
          ctx.restore();

          const sliderValue = clamp(gameState.targetMusicVolume, 0, 1);
          const sliderFillW = sliderW * sliderValue;

          ctx.save();
          ctx.beginPath();
          drawRoundedRect(ctx, sliderX, sliderY, sliderFillW, sliderH, scaledRadius(12));
          ctx.fillStyle = `${UI_COLORS.shield}bb`;
          ctx.fill();
          ctx.restore();

          const handleX = sliderX + sliderFillW;
          const handleRadius = Math.max(8, 12 * scale);
          ctx.beginPath();
          ctx.arc(handleX, sliderY + sliderH / 2, handleRadius, 0, Math.PI * 2);
          ctx.fillStyle = UI_COLORS.shield;
          ctx.fill();
          ctx.strokeStyle = `${UI_COLORS.shield}cc`;
          ctx.lineWidth = Math.max(1, 1.5 * scale);
          ctx.stroke();

          gameState.pauseMenuAudioHitAreas.slider = slider.hitArea;

          const drawToggle = (
            toggle: PauseMenuButtonLayout,
            label: string,
            active: boolean,
            onText: string,
            offText: string,
          ) => {
            ctx.save();
            ctx.beginPath();
            drawRoundedRect(ctx, toggle.x, toggle.y, toggle.w, toggle.h, scaledRadius(14));
            const gradient = ctx.createLinearGradient(toggle.x, toggle.y, toggle.x, toggle.y + toggle.h);
            if (active) {
              gradient.addColorStop(0, `${pauseAccent}33`);
              gradient.addColorStop(1, `${pauseAccent}1f`);
              ctx.strokeStyle = `${pauseAccent}aa`;
              ctx.shadowColor = pauseGlow;
            } else {
              gradient.addColorStop(0, "rgba(80, 80, 80, 0.45)");
              gradient.addColorStop(1, "rgba(50, 50, 50, 0.35)");
              ctx.strokeStyle = "rgba(120, 120, 120, 0.6)";
              ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
            }
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.lineWidth = Math.max(1.5, 1.8 * scale);
            ctx.shadowBlur = 0;
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.restore();

            ctx.textAlign = "left";
            ctx.fillStyle = textPrimary;
            ctx.font = getScaledFont(15, "600");
            ctx.fillText(label, toggle.x + 18 * scale, toggle.y + 24 * scale);

            ctx.textAlign = "right";
            ctx.fillStyle = active ? pauseAccent : textSecondary;
            ctx.font = getScaledFont(14, "500");
            ctx.fillText(
              active ? onText : offText,
              toggle.x + toggle.w - 18 * scale,
              toggle.y + toggle.h - 18 * scale,
            );
          };

          drawToggle(toggles.music, t.pauseMenu.music.label, !gameState.musicMuted, t.pauseMenu.music.on, t.pauseMenu.music.off);
          drawToggle(toggles.sfx, t.pauseMenu.sfx.label, !gameState.sfxMuted, t.pauseMenu.sfx.on, t.pauseMenu.sfx.off);

          gameState.pauseMenuAudioHitAreas.musicToggle = toggles.music;
          gameState.pauseMenuAudioHitAreas.sfxToggle = toggles.sfx;
        }

        // Continue button
        const continueY = continueBtn.y;
        ctx.save();
        ctx.beginPath();
        drawRoundedRect(ctx, continueBtn.x, continueBtn.y, continueBtn.w, continueBtn.h, scaledRadius(14));
        const continueBg = ctx.createLinearGradient(0, continueY, 0, continueY + buttonH);
        continueBg.addColorStop(0, `${pauseAccent}33`);
        continueBg.addColorStop(1, `${pauseAccent}1d`);
        ctx.fillStyle = continueBg;
        ctx.fill();
        ctx.strokeStyle = `${pauseAccent}aa`;
        ctx.lineWidth = Math.max(2, 2 * scale);
        ctx.shadowColor = pauseGlow;
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        ctx.textAlign = "center";
        ctx.fillStyle = textPrimary;
        ctx.font = getScaledFont(20, "700");
        ctx.fillText("▶  " + t.continue.toUpperCase(), W / 2, continueY + buttonH / 2 + scaleValue(7));

        // Audio button
        const audioY = audioBtn.y;
        ctx.save();
        ctx.beginPath();
        drawRoundedRect(ctx, audioBtn.x, audioBtn.y, audioBtn.w, audioBtn.h, scaledRadius(14));
        const audioBg = ctx.createLinearGradient(0, audioY, 0, audioY + buttonH);
        audioBg.addColorStop(0, `${UI_COLORS.shield}33`);
        audioBg.addColorStop(1, `${UI_COLORS.shield}18`);
        ctx.fillStyle = audioBg;
        ctx.fill();
        ctx.strokeStyle = gameState.pauseMenuAudioOpen ? `${UI_COLORS.shield}cc` : `${UI_COLORS.shield}88`;
        ctx.lineWidth = Math.max(1.5, 1.8 * scale);
        ctx.shadowColor = `${UI_COLORS.shield}55`;
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        ctx.fillStyle = textPrimary;
        ctx.font = getScaledFont(18, "600");
        ctx.fillText(t.pauseMenu.audio, W / 2, audioY + buttonH / 2 + scaleValue(6));

        // Language button
        const languageY = languageBtn.y;
        ctx.save();
        ctx.beginPath();
        drawRoundedRect(ctx, languageBtn.x, languageBtn.y, languageBtn.w, languageBtn.h, scaledRadius(14));
        const languageBg = ctx.createLinearGradient(0, languageY, 0, languageY + buttonH);
        languageBg.addColorStop(0, `${UI_COLORS.minimap}33`);
        languageBg.addColorStop(1, `${UI_COLORS.minimap}18`);
        ctx.fillStyle = languageBg;
        ctx.fill();
        ctx.strokeStyle = `${UI_COLORS.minimap}aa`;
        ctx.lineWidth = Math.max(1.5, 1.8 * scale);
        ctx.shadowColor = `${UI_COLORS.minimap}55`;
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        const languageLabel = t.pauseMenu.languages[currentLanguage];
        ctx.fillStyle = textPrimary;
        ctx.font = getScaledFont(18, "600");
        ctx.fillText(
          `${t.pauseMenu.language}: ${languageLabel ? languageLabel : currentLanguage.toUpperCase()}`,
          W / 2,
          languageY + buttonH / 2 + scaleValue(6),
        );

        // Restart button
        const restartY = restartBtn.y;
        ctx.save();
        ctx.beginPath();
        drawRoundedRect(ctx, restartBtn.x, restartBtn.y, restartBtn.w, restartBtn.h, scaledRadius(14));
        const restartBg = ctx.createLinearGradient(0, restartY, 0, restartY + buttonH);
        restartBg.addColorStop(0, `${UI_COLORS.healthHigh}33`);
        restartBg.addColorStop(1, `${UI_COLORS.healthLow}1f`);
        ctx.fillStyle = restartBg;
        ctx.fill();
        ctx.strokeStyle = `${UI_COLORS.healthHigh}aa`;
        ctx.lineWidth = Math.max(1.5, 1.5 * scale);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = textPrimary;
        ctx.font = getScaledFont(18, "600");
        ctx.fillText(t.restart, W / 2, restartY + buttonH / 2 + scaleValue(6));

        ctx.textAlign = "left";
        ctx.restore();
      }

      // Countdown después de pausa
      if (gameState.countdownTimer > 0) {
        ctx.save();
        ctx.fillStyle = UI_COLORS.overlay;
        ctx.fillRect(0, 0, W, H);

        const countdownNumber = Math.ceil(gameState.countdownTimer);
        const scale = 1 - (gameState.countdownTimer - Math.floor(gameState.countdownTimer)); // Efecto de escala

        // Número del countdown con glow
        ctx.fillStyle = UI_COLORS.ammo;
        ctx.font = withTerminalFont(`bold ${120 * (1 + scale * 0.3)}px system-ui`);
        ctx.textAlign = "center";
        ctx.shadowColor = UI_COLORS.ammo;
        ctx.shadowBlur = 0;
        ctx.fillText(countdownNumber.toString(), W / 2, H / 2 + 20);
        ctx.shadowBlur = 0;

        ctx.restore();
      }
      };

      renderUIPass();
    } // Cierre de función draw()

    // Game loop
    let lastTime = 0;
    function gameLoop(timestamp: number) {
      const dt = Math.min(0.033, (timestamp - lastTime) / 1000 || 0);
      lastTime = timestamp;

      update(dt);
      draw();

      requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);

    // Prevenir scroll y gestos en dispositivos móviles
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("touchmove", preventScroll, { passive: false });
    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });
    document.addEventListener("gestureend", preventGesture, { passive: false });

    return () => {
      weaponAudioController.stopAllLooping();
      weaponAudioController.resetTimers();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("wheel", handlePauseMenuScroll);
      document.removeEventListener("touchmove", preventScroll);
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      musicListenersCleanup.forEach((dispose) => dispose());
      audioManager.stopMusic("background");
      audioManager.stopMusic("gameOver");
      if (overlayWorkerRef.current) {
        overlayWorkerRef.current.terminate();
        overlayWorkerRef.current = null;
        overlaySupportedRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (!consoleVisible) {
      setConsoleInput("");
      return;
    }

    const focusTimeout = window.setTimeout(() => {
      consoleInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimeout);
  }, [consoleVisible]);

  useEffect(() => {
    if (gameStateRef.current) {
      gameStateRef.current.language = language;
      const tier = DIFFICULTY_TIERS[gameStateRef.current.difficulty.tierIndex];
      if (tier) {
        gameStateRef.current.difficulty.tierLabel =
          tier.labels?.[language] ?? tier.label;
      }
    }
  }, [language]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ cursor: "crosshair" }} />
      <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {consoleVisible && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl px-4 md:px-6">
            <div className="bg-zinc-900/95 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
                <h2 className="text-xs font-semibold tracking-[0.35em] uppercase text-zinc-200">
                  {activeConsoleStrings.title}
                </h2>
                <button
                  type="button"
                  onClick={() => setConsoleVisible(false)}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 space-y-4">
                <form onSubmit={handleConsoleSubmit} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    ref={consoleInputRef}
                    value={consoleInput}
                    onChange={(event) => setConsoleInput(event.target.value)}
                    placeholder={activeConsoleStrings.placeholder}
                    className="flex-1 rounded-md border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="rounded-md border border-primary/60 bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary transition-colors"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConsoleVisible(false);
                      }}
                      className="rounded-md border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800/80 transition-colors"
                    >
                      {activeConsoleStrings.close}
                    </button>
                  </div>
                </form>
                <div className="bg-zinc-950/70 border border-zinc-800 rounded-md p-4 min-h-[160px] max-h-[320px] overflow-y-auto">
                  {consoleOutput.length === 0 ? (
                    <p className="text-sm text-zinc-400 italic">{activeConsoleStrings.outputEmpty}</p>
                  ) : (
                    <ul className="space-y-2 text-sm text-zinc-100 font-mono">
                      {consoleOutput.map((line, index) => (
                        <li key={`${line}-${index}`}>{line}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TUTORIAL SIMPLIFICADO */}
      {gameStateRef.current?.tutorialActive &&
        !tutorialCompleted &&
        gameStateRef.current?.difficulty.level === 1 && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          {/* Overlay oscuro sutil */}
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />

          {/* Tutorial card */}
          <div className="relative bg-card/95 backdrop-blur-sm border-2 border-primary/50 rounded-lg p-8 max-w-md mx-4 shadow-2xl animate-scale-in">
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-2xl font-bold text-primary text-center">{t.tutorial.move}</h3>
              <div className="flex justify-center gap-2">
                <KeyButton keyLabel="W" isActive={gameStateRef.current?.keys.w || false} />
              </div>
              <div className="flex justify-center gap-2">
                <KeyButton keyLabel="A" isActive={gameStateRef.current?.keys.a || false} />
                <KeyButton keyLabel="S" isActive={gameStateRef.current?.keys.s || false} />
                <KeyButton keyLabel="D" isActive={gameStateRef.current?.keys.d || false} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de tecla animada para el tutorial
const KeyButton = ({
  keyLabel,
  isActive,
  className = "",
}: {
  keyLabel: string;
  isActive: boolean;
  className?: string;
}) => (
  <div
    className={`
      px-4 py-3 border-2 rounded-md font-bold text-sm transition-all duration-150
      ${
        isActive
          ? "bg-primary text-primary-foreground border-primary scale-95 shadow-lg shadow-primary/50"
          : "bg-muted/50 text-foreground border-border scale-100"
      }
      ${className}
    `}
  >
    {keyLabel}
  </div>
);

export default Index;
