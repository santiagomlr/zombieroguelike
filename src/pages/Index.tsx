import { useEffect, useRef, useState } from "react";
import type {
  MinimapEntity,
  MinimapFrame,
  OverlayParticle,
} from "../workers/overlayRenderer";
import { audioManager, type SfxKey } from "../audio/audioManager";

import {
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

const LANGUAGE_ORDER: Language[] = ["es", "en"];

type PauseMenuTab = "home" | "settings" | "stats";

const PAUSE_MENU_TABS: PauseMenuTab[] = ["home", "settings", "stats"];

const CHEST_DROP_RATE = 0.07;
const ENTITY_SCALE = 0.75;
const CAMERA_DEADZONE_RADIUS = 80;
const CAMERA_ZOOM = 1.8;

const PLAYER_BASE_RADIUS = 16;
const WEAK_ENEMY_BASE_RADIUS = 16;
const MEDIUM_ENEMY_BASE_RADIUS = 20;
const STRONG_ENEMY_BASE_RADIUS = 24;
const FAST_ENEMY_BASE_RADIUS = 16;
const EXPLOSIVE_ENEMY_BASE_RADIUS = 18;
const SUMMONER_ENEMY_BASE_RADIUS = 20;
const TANK_ENEMY_BASE_RADIUS = 28;

const scaleEntitySize = (value: number) => Math.max(1, Math.round(value * ENTITY_SCALE));

const ENEMY_SIZE_MULTIPLIER = 1.3;
const ENEMY_SPEED_MULTIPLIER = 0.7;
const HOTSPOT_SIZE_MULTIPLIER = 1.3;

const scaleEnemyRadius = (value: number) =>
  Math.max(1, Math.round(scaleEntitySize(value) * ENEMY_SIZE_MULTIPLIER));

const scaleHotspotRadius = (value: number) =>
  Math.max(1, Math.round(scaleEntitySize(value) * HOTSPOT_SIZE_MULTIPLIER));

const applyEnemySpeedModifier = (value: number) => value * ENEMY_SPEED_MULTIPLIER;

const BULLET_RADIUS = 4;
const MAX_ENEMY_RADIUS = Math.max(
  scaleEnemyRadius(WEAK_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(MEDIUM_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(STRONG_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(FAST_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(EXPLOSIVE_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(SUMMONER_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(TANK_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(40),
);
const MAX_CHAIN_RADIUS = 150;
const MAX_BOUNCE_RADIUS = 200;
const SPATIAL_HASH_CELL_SIZE = Math.max(1, Math.round((MAX_ENEMY_RADIUS + BULLET_RADIUS) * 2));
const BULLET_QUERY_RADIUS = Math.max(MAX_ENEMY_RADIUS + BULLET_RADIUS, MAX_BOUNCE_RADIUS);

const UI_COLORS = {
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
};

type Bounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

const explosionGradientCache = new Map<number, CanvasGradient>();
const dropPathCache = new Map<number, Path2D>();
const hotspotPathCache = new Map<number, Path2D>();

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
  scanlineSpacing: 3,
  scanlineOpacity: 0.08,
  vignetteOpacity: 0.15,
  chromaShift: 1.5,
};

const MUSIC_CONTROL_KEYS = ["start", "previous", "pause", "next"] as const;
type MusicControlKey = (typeof MUSIC_CONTROL_KEYS)[number];

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

const getMusicStartButtonRect = (W: number, H: number) => {
  const width = 170;
  const height = 48;
  const marginX = 20;
  const marginY = 72;

  return {
    x: W - width - marginX,
    y: H - height - marginY,
    w: width,
    h: height,
  };
};

const getMusicControlPanelRect = (W: number, H: number) => {
  const width = 220;
  const height = 76;
  const marginX = 20;
  const marginY = 82;

  return {
    x: W - width - marginX,
    y: H - height - marginY,
    w: width,
    h: height,
  };
};

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
  const spatialHashRef = useRef(new SpatialHash<any, any>(SPATIAL_HASH_CELL_SIZE));
  const bulletNeighborBufferRef = useRef<any[]>([]);
  const fallbackEnemyListRef = useRef<any[]>([]);
  const chainedEnemiesRef = useRef<any[]>([]);

  const t = translations[language];

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
        },
      },
      bullets: [] as any[],
      enemies: [] as any[],
      normalEnemyCount: 0,
      drops: [] as any[],
      particles: [] as any[],
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
      wave: 1,
      waveKills: 0,
      waveEnemiesTotal: 10, // Wave 1 empieza con 10 (estilo COD Zombies)
      waveEnemiesSpawned: 0,
      maxConcurrentEnemies: 12,
      lastSpawn: 0,
      lastBossSpawn: 0,
      lastMiniBossSpawn: 0,
      spawnCooldown: 0, // Cooldown de 3 segundos después de matar todos los enemigos
      canSpawn: true, // Flag para controlar si se puede spawnar
      weaponCooldowns: {} as Record<string, number>,
      autoAimMemory: {} as Record<string, { target: any | null; lostTimer: number; lastScore: number }>,
      keys: {} as Record<string, boolean>,
      showUpgradeUI: false,
      upgradeOptions: [] as Upgrade[],
      regenTimer: 0,
      auraTimer: 0,
      hotspotTimer: 0,
      dangerZoneTimer: 0,
      inDangerZone: false,
      levelUpAnimation: 0,
      upgradeAnimation: 0,
      upgradeUIAnimation: 0,
      xpBarRainbow: false,
      minimapOpacity: 0,
      waveNotification: 0,
      restartTimer: 0,
      restartHoldTime: 2, // 2 segundos para reiniciar sosteniendo R
      gameOverTimer: 0,
      countdownTimer: 0, // Countdown 3-2-1 al reanudar desde pausa
      // Sistema de Eventos Ambientales (vinculado a waves)
      environmentalEvent: null as "storm" | "fog" | "rain" | null,
      eventNotification: 0,
      eventDuration: 0,
      eventTimer: 0,
      eventPhase: "none" as "none" | "notification" | "fadein" | "active" | "fadeout",
      eventIntensity: 0, // 0 a 1 para fade in/out
      eventActivatedThisWave: false, // Control: solo 1 evento por wave
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
      musicNotification: "",
      musicNotificationTimer: 0,
      itemNotification: "",
      itemNotificationTimer: 0,
      musicMuted: false,
      musicVolume: 0.3, // Volumen de la música (0 a 1)
      targetMusicVolume: 0.3, // Volumen objetivo para animación suave
      musicStarted: false, // Flag para saber si el usuario ya inició la música
      musicIsPlaying: false,
      musicButtonClickAnim: {
        start: 0,
        previous: 0,
        pause: 0,
        next: 0,
      } as Record<MusicControlKey, number>,
      musicControlsVisible: false,
      musicLastPointerTime: 0,
      sfxMuted: false,
      enemyLogo: null as HTMLImageElement | null,
      greenZombieImg: null as HTMLImageElement | null,
      bomberImg: null as HTMLImageElement | null,
      ghoulImg: null as HTMLImageElement | null,
      purpleZombieImg: null as HTMLImageElement | null,
      runnerImg: null as HTMLImageElement | null,
      shieldImg: null as HTMLImageElement | null,
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

      if (!gameState.enemyLogo || !gameState.enemyLogo.complete) {
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
      tempCtx.drawImage(gameState.enemyLogo, 0, 0, ENEMY_LOGO_BASE_SIZE, ENEMY_LOGO_BASE_SIZE);
      tempCtx.globalCompositeOperation = "source-in";
      tempCtx.fillStyle = color;
      tempCtx.fillRect(0, 0, ENEMY_LOGO_BASE_SIZE, ENEMY_LOGO_BASE_SIZE);
      tempCtx.globalCompositeOperation = "source-over";

      prerenderedLogosRef.current[color] = tempCanvas;
      return tempCanvas;
    };

    // Load enemy logo
    const enemyLogoImg = new Image();
    enemyLogoImg.src = "/images/enemy-logo.png";
    enemyLogoImg.onload = () => {
      gameState.enemyLogo = enemyLogoImg;
      console.log("Enemy logo loaded successfully");

      // Pre-render colored enemy logos for performance (excluding green since we have a custom image)
      const spawnEnemyColors = ["#8e44ad", "#ffc300", "#5dbb63", "#6e6e6e", "#ff7a2a", "#ff3b3b", "#4a4a4a"];

      spawnEnemyColors.forEach((color) => {
        ensureTintedLogo(color);
      });
    };
    enemyLogoImg.onerror = () => {
      console.error("Failed to load enemy logo");
    };

    // Load all enemy images
    const greenZombieImg = new Image();
    greenZombieImg.src = "/images/green-zombie.png";
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

    const purpleZombieImg = new Image();
    purpleZombieImg.src = "/images/purple_zombie.png";
    purpleZombieImg.onload = () => {
      gameState.purpleZombieImg = purpleZombieImg;
      console.log("Purple zombie loaded successfully");
    };
    purpleZombieImg.onerror = () => {
      console.error("Failed to load purple zombie image");
    };

    const runnerImg = new Image();
    runnerImg.src = "/images/runner.png";
    runnerImg.onload = () => {
      gameState.runnerImg = runnerImg;
      console.log("Runner loaded successfully");
    };
    runnerImg.onerror = () => {
      console.error("Failed to load runner image");
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
            gameState.currentMusicIndex = (gameState.currentMusicIndex + 1) % gameState.musicTracks.length;
            playTrackAtCurrentIndex();
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

    function playTrackAtCurrentIndex(resetPosition: boolean = true) {
      if (!gameState.musicStarted) return;

      const track = gameState.musicTracks[gameState.currentMusicIndex];

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

      // Mostrar notificación
      gameState.musicNotification = track.name;
      gameState.musicNotificationTimer = 3; // 3 segundos
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
    };

    const weaponSoundConfigs: Record<string, WeaponSoundConfig> = {
      pistol: { fireSounds: ["weapon_pistol"] },
      shotgun: { fireSounds: ["weapon_shotgun"] },
      smg: { loopSound: "weapon_smg", loopStopDelay: 0.12 },
      rocket: { fireSounds: ["weapon_rpg"] },
      laser: {
        fireSounds: ["weapon_laser_1", "weapon_laser_2", "weapon_laser_3", "weapon_laser_4"],
      },
      railgun: { fireSounds: ["weapon_railgun"] },
      minigun: { loopSound: "weapon_minigun", loopStopDelay: 0.12 },
      electric: { fireSounds: ["weapon_laser_2", "weapon_laser_3", "weapon_laser_4"] },
      flamethrower: { loopSound: "weapon_flamethrower", loopStopDelay: 0.08 },
      frostbow: { fireSounds: ["weapon_bow"] },
      homing: { fireSounds: ["weapon_homing_missile"] },
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

      // Limpiar arrays
      gameState.bullets.length = 0;
      gameState.enemies.length = 0;
      gameState.normalEnemyCount = 0;
      gameState.drops.length = 0;
      gameState.particles.length = 0;
      gameState.hotspots.length = 0;

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
      gameState.wave = 1;
      gameState.waveKills = 0;
      gameState.waveEnemiesTotal = 10; // Wave 1 empieza con 10 enemigos (estilo COD Zombies)
      gameState.waveEnemiesSpawned = 0;
      gameState.maxConcurrentEnemies = 12;
      gameState.lastSpawn = 0;
      gameState.spawnCooldown = 0;
      gameState.canSpawn = true;
      gameState.lastMiniBossSpawn = 0;
      gameState.weaponCooldowns = {};
      gameState.regenTimer = 0;
      gameState.auraTimer = 0;
      gameState.hotspotTimer = 0;
      gameState.dangerZoneTimer = 0;
      gameState.inDangerZone = false;
      gameState.levelUpAnimation = 0;
      gameState.upgradeAnimation = 0;
      gameState.xpBarRainbow = false;
      gameState.waveNotification = 0;
      gameState.minimapOpacity = 0;
      gameState.musicNotificationTimer = 0;
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
      gameState.eventActivatedThisWave = false;
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
        audioManager.setMusicMuted("background", gameState.musicMuted);
        audioManager.setMusicVolume("background", gameState.musicVolume);
        if (!gameState.musicMuted) {
          audioManager
            .resumeMusic("background")
            .then(() => {
              gameState.musicIsPlaying = true;
            })
            .catch(() => {
              gameState.musicIsPlaying = false;
            });
        } else {
          gameState.musicIsPlaying = false;
        }
      }
    }

    // Exponer resetGame al ref para usarlo desde el JSX
    resetGameRef.current = resetGame;

    const handleKeyDown = (e: KeyboardEvent) => {
      gameState.keys[e.key.toLowerCase()] = true;

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
          PAUSE_MENU_TABS.forEach((tab) => {
            gameState.pauseMenuScroll[tab] = 0;
          });
        } else if (gameState.state === "paused" && gameState.countdownTimer > 0) {
          gameState.countdownTimer = 0;
        } else if (gameState.state === "paused" && !gameState.showUpgradeUI) {
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

        // Tipos especiales de enemigos (escalado estilo COD Zombies)
        let specialChance = 0;
        if (gameState.wave <= 3) {
          specialChance = 0.05;
        } else if (gameState.wave <= 7) {
          specialChance = 0.15;
        } else if (gameState.wave <= 12) {
          specialChance = 0.25;
        } else if (gameState.wave <= 18) {
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
            // Escalado agresivo del bomber por wave
            if (gameState.wave <= 5) {
              bomberBaseDamage = 20 + gameState.wave * 3; // 23-35
            } else if (gameState.wave <= 10) {
              bomberBaseDamage = 35 + (gameState.wave - 5) * 5; // 40-65
            } else if (gameState.wave <= 15) {
              bomberBaseDamage = 65 + (gameState.wave - 10) * 7; // 72-100
            } else if (gameState.wave <= 20) {
              bomberBaseDamage = 100 + (gameState.wave - 15) * 16; // 116-180
            } else {
              bomberBaseDamage = 180 + (gameState.wave - 20) * 20; // 200+
            }
            damage = bomberBaseDamage;
            baseHp = 2;
            rad = EXPLOSIVE_ENEMY_BASE_RADIUS;
            spd = 1.8; // Más rápido para ser más peligroso
          } else if (specialRoll < 0.5) {
            specialType = "fast";
            enemyType = "fast";
            color = "#ffc300";
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
            color = "#8e44ad";
            damage = 5;
            baseHp = 8;
            rad = SUMMONER_ENEMY_BASE_RADIUS;
            spd = 0.9;
          }
        } else {
          // Enemigos normales
          specialType = null;

          // Progresión detallada por wave
          if (gameState.wave === 1) {
            // Wave 1: Solo verdes 🟢
            enemyType = "weak";
            color = "#5dbb63";
            damage = 5;
            baseHp = 3;
            rad = WEAK_ENEMY_BASE_RADIUS;
            spd = 1.3;
          } else if (gameState.wave === 2) {
            // Wave 2: Mayoría verdes, algunos morados (≤10%)
            if (roll < 0.9) {
              enemyType = "weak";
              color = "#5dbb63";
              damage = 5;
              baseHp = 3;
              rad = WEAK_ENEMY_BASE_RADIUS;
              spd = 1.3;
            } else {
              enemyType = "medium";
              color = "#8e44ad";
              damage = 10;
              baseHp = 5;
              rad = MEDIUM_ENEMY_BASE_RADIUS;
              spd = 1.1;
            }
          } else if (gameState.wave === 3) {
            // Wave 3: Mezcla verde/morado (20-30% morado)
            if (roll < 0.75) {
              enemyType = "weak";
              color = "#5dbb63";
              damage = 5;
              baseHp = 3;
              rad = WEAK_ENEMY_BASE_RADIUS;
              spd = 1.3;
            } else {
              enemyType = "medium";
              color = "#8e44ad";
              damage = 10;
              baseHp = 5;
              rad = MEDIUM_ENEMY_BASE_RADIUS;
              spd = 1.1;
            }
          } else if (gameState.wave === 4) {
            // Wave 4: Más morado (30-40%)
            if (roll < 0.65) {
              enemyType = "weak";
              color = "#5dbb63";
              damage = 5;
              baseHp = 3;
              rad = WEAK_ENEMY_BASE_RADIUS;
              spd = 1.3;
            } else {
              enemyType = "medium";
              color = "#8e44ad";
              damage = 10;
              baseHp = 5;
              rad = MEDIUM_ENEMY_BASE_RADIUS;
              spd = 1.1;
            }
          } else if (gameState.wave === 5) {
            // Wave 5: Introducir amarillo (3-5%)
            if (roll < 0.04) {
              enemyType = "strong";
              color = "#ffc300";
              damage = 20;
              baseHp = 8;
              rad = STRONG_ENEMY_BASE_RADIUS;
              spd = 0.9;
            } else if (roll < 0.6) {
              enemyType = "medium";
              color = "#8e44ad";
              damage = 10;
              baseHp = 5;
              rad = MEDIUM_ENEMY_BASE_RADIUS;
              spd = 1.1;
            } else {
              enemyType = "weak";
              color = "#5dbb63";
              damage = 5;
              baseHp = 3;
              rad = WEAK_ENEMY_BASE_RADIUS;
              spd = 1.3;
            }
          } else if (gameState.wave === 6) {
            // Wave 6: Mezcla estable 50/40/10%
            if (roll < 0.1) {
              enemyType = "strong";
              color = "#ffc300";
              damage = 20;
              baseHp = 8;
              rad = STRONG_ENEMY_BASE_RADIUS;
              spd = 0.9;
            } else if (roll < 0.5) {
              enemyType = "medium";
              color = "#8e44ad";
              damage = 10;
              baseHp = 5;
              rad = MEDIUM_ENEMY_BASE_RADIUS;
              spd = 1.1;
            } else {
              enemyType = "weak";
              color = "#5dbb63";
              damage = 5;
              baseHp = 3;
              rad = WEAK_ENEMY_BASE_RADIUS;
              spd = 1.3;
            }
          } else if (gameState.wave === 7) {
            // Wave 7: Amarillos hasta 12-15%
            if (roll < 0.13) {
              enemyType = "strong";
              color = "#ffc300";
              damage = 20;
              baseHp = 8;
              rad = STRONG_ENEMY_BASE_RADIUS;
              spd = 0.9;
            } else if (roll < 0.6) {
              enemyType = "medium";
              color = "#8e44ad";
              damage = 10;
              baseHp = 5;
              rad = MEDIUM_ENEMY_BASE_RADIUS;
              spd = 1.1;
            } else {
              enemyType = "weak";
              color = "#5dbb63";
              damage = 5;
              baseHp = 3;
              rad = WEAK_ENEMY_BASE_RADIUS;
              spd = 1.3;
            }
          } else {
            // Wave 8+: Escalado progresivo (amarillos hasta 25-30%)
            const yellowChance = Math.min(0.3, 0.15 + (gameState.wave - 8) * 0.02);

            if (roll < yellowChance) {
              enemyType = "strong";
              color = "#ffc300";
              damage = 20;
              baseHp = 8;
              rad = 18;
              spd = 0.9;
            } else if (roll < yellowChance + 0.45) {
              enemyType = "medium";
              color = "#8e44ad";
              damage = 10;
              baseHp = 5;
              rad = 15;
              spd = 1.1;
            } else {
              enemyType = "weak";
              color = "#5dbb63";
              damage = 5;
              baseHp = 3;
              rad = 12;
              spd = 1.3;
            }

            // Posibilidad de enemigos élite (5% chance en wave 8+)
            if (Math.random() < 0.05) {
              isElite = true;
              baseHp *= 1.5;
              rad += 3;
              color = enemyType === "strong" ? "#f59e0b" : enemyType === "medium" ? "#9333ea" : "#16a34a";
            }
          }

          // Escalado de dificultad estilo COD Zombies - Velocidad
          let speedScale = 1;
          if (gameState.wave <= 10) {
            speedScale = 1 + (gameState.wave - 1) * 0.03;
          } else if (gameState.wave <= 20) {
            speedScale = 1 + (gameState.wave - 1) * 0.05;
          } else {
            speedScale = Math.min(3, 1 + (gameState.wave - 1) * 0.07); // Cap en +200%
          }

          // Escalado de daño - NUEVO SISTEMA POST-WAVE 13
          let damageScale = 1;
          if (gameState.wave <= 5) {
            damageScale = 1.0; // Base
          } else if (gameState.wave <= 10) {
            damageScale = 1.3; // +30%
          } else if (gameState.wave <= 13) {
            damageScale = 1.6; // +60%
          } else if (gameState.wave <= 17) {
            damageScale = 2.0; // +100% (doble)
          } else if (gameState.wave <= 21) {
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
        if (gameState.wave <= 5) {
          hpMultiplier = 1 + (gameState.wave - 1) * 0.2;
        } else if (gameState.wave <= 15) {
          hpMultiplier = 1 + (gameState.wave - 1) * 0.35;
        } else {
          hpMultiplier = 1 + (gameState.wave - 1) * 0.5;
        }
        const scaledHp = Math.floor(baseHp * hpMultiplier);
        rad = scaleEnemyRadius(rad);

        const spawnPos = getSpawnPositionAroundPlayer(rad);

        const enemy = {
          x: spawnPos.x + (Math.random() - 0.5) * 20,
          y: spawnPos.y + (Math.random() - 0.5) * 20,
          rad,
          hp: scaledHp,
          maxhp: scaledHp,
          spd,
          enemyType,
          damage,
          isElite,
          isMiniBoss: false,
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
        };

        gameState.enemies.push(enemy);
        if (!enemy.isBoss && !enemy.isMiniBoss) {
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
      const bossHpMultiplier = 1 + (gameState.wave - 1) * 3; // Mucho más tanque
      const scaledHp = Math.floor(baseHp * bossHpMultiplier);

      gameState.enemies.push({
        x,
        y,
        rad: bossRad,
        hp: scaledHp,
        maxhp: scaledHp,
        spd: applyEnemySpeedModifier(0.8),
        enemyType: "strong",
        damage: 30,
        isElite: false,
        isMiniBoss: false,
        isBoss: true,
        color: "#dc2626",
        specialType: null,
        frozenTimer: 0,
        burnTimer: 0,
        poisonTimer: 0,
        phase: 1,
        attackCooldown: 0,
        jumpCooldown: 0,
        projectileCooldown: 0,
      });
    }

    function spawnMiniBoss() {
      const miniBossRad = scaleEnemyRadius(28);
      const { x, y } = getSpawnPositionAroundPlayer(miniBossRad, {
        minDistance: DEFAULT_SPAWN_DISTANCE_MAX - 50,
        maxDistance: DEFAULT_SPAWN_DISTANCE_MAX + 120,
      });

      // Mini-boss HP escalado estilo COD Zombies
      const baseHp = 25;
      const miniBossHpMultiplier = 1 + (gameState.wave - 1) * 2; // Más tanque que antes
      const scaledHp = Math.floor(baseHp * miniBossHpMultiplier);

      gameState.enemies.push({
        x,
        y,
        rad: miniBossRad,
        hp: scaledHp,
        maxhp: scaledHp,
        spd: applyEnemySpeedModifier(1.0),
        isElite: false,
        isMiniBoss: true,
        color: "#ffc300",
        damage: Math.floor(25 * (1 + (gameState.wave - 1) * 0.05)),
      });
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
      else if (enemy.isMiniBoss) typePriority = 0.9;
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

      const range = weapon.range * gameState.player.stats.rangeMultiplier;
      let baseDamage = weapon.damage * gameState.player.stats.damageMultiplier;

      // Amuleto del Caos: daño aleatorio +10% a +50%
      if (gameState.player.stats.chaosDamage) {
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
      const spreadReduction = gameState.player.stats.precision > 0 ? (1 - gameState.player.stats.precision / 100) : 1;
      const multishotTightening = 1 / (1 + gameState.player.stats.multishot * 0.5);
      const actualSpread = baseSpread * spreadReduction * multishotTightening;
      
      const shots = 1 + gameState.player.stats.multishot;
      for (let i = 0; i < shots; i++) {
        const spreadAngle = (i - (shots - 1) / 2) * actualSpread;
        const finalDir = dir + spreadAngle;

        if (isSpread) {
          const spreadVariance = 0.3 * spreadReduction * multishotTightening;
          for (let j = -1; j <= 1; j++) {
            gameState.bullets.push({
              x: gameState.player.x,
              y: gameState.player.y,
              dir: finalDir + j * spreadVariance,
              spd: weapon.projectileSpeed,
              life: range / weapon.projectileSpeed / 60,
              damage,
              color: weapon.color,
              bounces: gameState.player.stats.bounces,
              bounceOnEnemies: gameState.player.stats.bounceOnEnemies,
              pierce: false,
              aoe: false,
            });
          }
        } else {
          gameState.bullets.push({
            x: gameState.player.x,
            y: gameState.player.y,
            dir: finalDir,
            spd: weapon.projectileSpeed,
            life: range / weapon.projectileSpeed / 60,
            damage,
            color: weapon.color,
            bounces: gameState.player.stats.bounces,
            bounceOnEnemies: gameState.player.stats.bounceOnEnemies,
            pierce: isPierce,
            aoe: isAoe,
            chain: isChain,
            fire: isFire,
            freeze: isFreeze,
            homing: isHoming,
            homingTarget: isHoming ? target : null,
            chainCount: isChain ? 3 : 0,
            isCrit,
          });
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
            color: weapon.color,
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

    function dropChest(x: number, y: number) {
      gameState.drops.push({
        x,
        y,
        rad: scaleEntitySize(14),
        type: "chest",
        color: "#ff7a2a",
        spawnTime: gameState.time,
      });
    }

    function chooseChestItem(): Item | null {
      const availableItems = ITEMS.filter((item) => {
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
      const item = chooseChestItem();

      if (!item) {
        collectXP(25);
        playPowerupSound();
        spawnChestParticles(chest.x, chest.y, "#5dbb63");
        return;
      }

      const granted = grantItemToPlayer(item, { notify: true, playSound: true });

      if (!granted) {
        collectXP(25);
        playPowerupSound();
        spawnChestParticles(chest.x, chest.y, "#5dbb63");
      }
    }

    function collectXP(v: number) {
      // Aplicar multiplicador y bonus de XP
      const xpGained = (v + gameState.player.stats.xpBonus) * gameState.player.stats.xpMultiplier;
      gameState.xp += xpGained;
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

        // Control de legendarios: máximo uno cada 3 waves
        if (item.rarity === "legendary") {
          // Solo permitir legendarios en waves múltiplos de 3
          if (gameState.wave % 3 === 0) {
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

    function applyItemEffect(item: Item) {
      const player = gameState.player;
      const stats = player.stats;

      switch (item.effect) {
        case "speedboost":
          stats.speedMultiplier *= 1.05;
          break;
        case "firerateitem":
          stats.fireRateMultiplier *= 1.05;
          break;
        case "maxhp10":
          player.maxhp += 10;
          player.hp = Math.min(player.maxhp, player.hp + 10);
          break;
        case "magnetitem":
          stats.magnetMultiplier *= 1.1;
          break;
        case "powerupduration":
          stats.powerupDuration *= 1.05;
          break;
        case "xpbonus":
          stats.xpBonus += 10;
          break;
        case "precisionitem":
          stats.precision += 10;
          break;
        case "damagereduction":
          stats.damageReduction += 0.05;
          break;
        case "bounceitem":
          stats.bounces += 1;
          break;
        case "globalfirerate":
          stats.fireRateMultiplier *= 1.1;
          break;
        case "firsthitimmune":
          // Se maneja en la colisión
          break;
        case "jetspeed":
          stats.speedMultiplier *= 1.15;
          break;
        case "reactiveshield":
          stats.reactiveShieldActive = true;
          break;
        case "horizonscanner": {
          const stacks = gameState.player.itemStacks[item.id] ?? 0;
          stats.cameraZoomMultiplier = stacks >= 1 ? 0.7 : 1;
          if (gameState.camera) {
            gameState.camera.zoom = getTargetCameraZoom();
          }
          gameState.minimapOpacity = stacks >= 2 ? 1 : 0;
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

      // Controles de música (solo cuando el juego está corriendo)
      if (gameState.state === "running") {
        if (!gameState.musicStarted) {
          const startRect = getMusicStartButtonRect(W, H);

          if (
            mx >= startRect.x &&
            mx <= startRect.x + startRect.w &&
            my >= startRect.y &&
            my <= startRect.y + startRect.h
          ) {
            gameState.musicStarted = true;
            gameState.musicControlsVisible = true;
            gameState.musicLastPointerTime = gameState.time;
            gameState.musicButtonClickAnim.start = 1;
            playTrackAtCurrentIndex();
            return;
          }
        } else {
          if (!gameState.musicControlsVisible) {
            return;
          }
          const panelRect = getMusicControlPanelRect(W, H);
          const controlsPaddingY = 16;
          const controlSize = 44;
          const controlGap = 12;
          const controlY = panelRect.y + controlsPaddingY;
          const totalControlsWidth = controlSize * 3 + controlGap * 2;
          const controlsStartX = panelRect.x + (panelRect.w - totalControlsWidth) / 2;

          const previousBtn = {
            x: controlsStartX,
            y: controlY,
            w: controlSize,
            h: controlSize,
          };
          const pauseBtn = {
            x: previousBtn.x + controlSize + controlGap,
            y: controlY,
            w: controlSize,
            h: controlSize,
          };
          const nextBtn = {
            x: pauseBtn.x + controlSize + controlGap,
            y: controlY,
            w: controlSize,
            h: controlSize,
          };

          const pointInRect = (rect: { x: number; y: number; w: number; h: number }) =>
            mx >= rect.x && mx <= rect.x + rect.w && my >= rect.y && my <= rect.y + rect.h;

          if (pointInRect(previousBtn)) {
            if (gameState.musicTracks.length > 0) {
              gameState.musicControlsVisible = true;
              gameState.musicLastPointerTime = gameState.time;
              gameState.musicButtonClickAnim.previous = 1;
              gameState.currentMusicIndex =
                (gameState.currentMusicIndex - 1 + gameState.musicTracks.length) % gameState.musicTracks.length;
              playTrackAtCurrentIndex();
            }
            return;
          }

          if (pointInRect(nextBtn)) {
            if (gameState.musicTracks.length > 0) {
              gameState.musicControlsVisible = true;
              gameState.musicLastPointerTime = gameState.time;
              gameState.musicButtonClickAnim.next = 1;
              gameState.currentMusicIndex = (gameState.currentMusicIndex + 1) % gameState.musicTracks.length;
              playTrackAtCurrentIndex();
            }
            return;
          }

          if (pointInRect(pauseBtn)) {
            gameState.musicControlsVisible = true;
            gameState.musicLastPointerTime = gameState.time;
            gameState.musicButtonClickAnim.pause = 1;
            const musicElement = audioManager.getMusicElement("background");
            gameState.music = musicElement ?? null;
            if (musicElement) {
              if (gameState.musicIsPlaying) {
                audioManager.pauseMusic("background");
                gameState.musicIsPlaying = false;
              } else {
                if (musicElement.ended) {
                  playTrackAtCurrentIndex();
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
                if (gameState.musicTracks[gameState.currentMusicIndex]) {
                  gameState.musicNotification = gameState.musicTracks[gameState.currentMusicIndex].name;
                  gameState.musicNotificationTimer = 2;
                }
              }
            }
            return;
          }
        }
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
      } else if (gameState.state === "paused" && !gameState.showUpgradeUI && gameState.countdownTimer <= 0) {
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

    const handlePointerMove = () => {
      if (!gameState.musicStarted) return;
      gameState.musicControlsVisible = true;
      gameState.musicLastPointerTime = gameState.time;
    };

    canvas.addEventListener("mousemove", handlePointerMove);

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
      }

      for (const key of MUSIC_CONTROL_KEYS) {
        const value = gameState.musicButtonClickAnim[key];
        if (value > 0) {
          gameState.musicButtonClickAnim[key] = Math.max(0, value - dt * 3);
        }
      }

      if (gameState.musicStarted && gameState.musicControlsVisible) {
        const idleDuration = 1.5;
        if (gameState.time - gameState.musicLastPointerTime > idleDuration) {
          gameState.musicControlsVisible = false;
        }
      }

      // Animations que deben correr siempre
      if (gameState.levelUpAnimation > 0) gameState.levelUpAnimation = Math.max(0, gameState.levelUpAnimation - dt * 2);
      if (gameState.upgradeAnimation > 0) gameState.upgradeAnimation = Math.max(0, gameState.upgradeAnimation - dt);
      if (gameState.upgradeUIAnimation < 1 && gameState.showUpgradeUI)
        gameState.upgradeUIAnimation = Math.min(1, gameState.upgradeUIAnimation + dt * 3);

      // Music notification timer
      if (gameState.musicNotificationTimer > 0) {
        gameState.musicNotificationTimer = Math.max(0, gameState.musicNotificationTimer - dt);
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
      // TUTORIAL - Wave 1 como tutorial obligatorio
      // ═══════════════════════════════════════════════════════════
      // Tutorial simplificado: solo mostrar WASD
      if (gameState.tutorialActive && !tutorialCompleted && gameState.wave === 1) {
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
      // SISTEMA DE OLEADAS (WAVES) - Estilo Call of Duty Zombies
      // ═══════════════════════════════════════════════════════════
      //
      // 📊 LÓGICA DE OLEADAS:
      // • Cada wave tiene un número fijo de enemigos (waveEnemiesTotal)
      // • Los enemigos solo spawnean si hay cupo (normalEnemies < maxConcurrentEnemies)
      // • Boss/Mini-boss NO cuentan en el límite de enemigos concurrentes
      // • La siguiente wave NO inicia hasta que waveKills >= waveEnemiesTotal
      // • Al completar: bono de XP + mensaje "✔ Wave X completada" por 3s
      //
      // 📈 PROGRESIÓN:
      // • Enemigos totales: W1: 10 → W10: 90 → W20: ~350 → W25+: ~700+
      // • Concurrentes: 12-15 (W1-5) → 25-30 (W10-15) → 50-60 (W21+)
      // • Spawn rate: 1.2s (W1-2) → 0.5s (W10) → 0.1-0.3s (W16+) + bursts
      // • HP: +20%/wave (1-5) → +35%/wave (6-15) → +50%/wave (16+)
      // • Velocidad: +3%/wave → +5%/wave → +7%/wave (max +200%)
      // • Daño: +15%/wave → +25%/wave → +35%/wave
      // • Especiales: 5% (W1-3) → 15% (W6-10) → 45% (W19+)
      //
      // 🔴 BOSS/MINI-BOSS:
      // • Boss cada 5 waves: HP = base × wave × 3
      // • Mini-boss en W3, W7, W12, W17, W22...: HP = base × wave × 2
      // • Ambos se agregan sin importar el límite concurrente
      //
      // ⚠️ DANGER ZONES:
      // • Desde W11+: hasta 2 zonas simultáneas
      // • Duración: 6 segundos
      // • Daño continuo: 8 HP/s
      //
      // ═══════════════════════════════════════════════════════════

      // Wave system basado en conteo de enemigos eliminados (no durante tutorial)
      if (!gameState.tutorialActive && gameState.waveKills >= gameState.waveEnemiesTotal) {
        // Wave completada!
        gameState.wave++;
        gameState.waveKills = 0;
        gameState.waveEnemiesSpawned = 0;

          // Reset first hit immune para la nueva wave
          gameState.player.stats.firstHitImmuneChargesUsed = 0;

        // Sistema de oleadas estilo COD Zombies - Escalado exponencial
        // POST-WAVE 13: Cantidad de enemigos FIJA, solo aumenta poder
        let waveTarget: number;
        let maxConcurrent: number;

        // Fórmula exponencial para número de enemigos
        if (gameState.wave === 1) {
          waveTarget = 10;
          maxConcurrent = 12;
        } else if (gameState.wave === 2) {
          waveTarget = 15;
          maxConcurrent = 13;
        } else if (gameState.wave === 3) {
          waveTarget = 20;
          maxConcurrent = 15;
        } else if (gameState.wave === 4) {
          waveTarget = 24;
          maxConcurrent = 18;
        } else if (gameState.wave === 5) {
          waveTarget = 30;
          maxConcurrent = 20;
        } else if (gameState.wave === 6) {
          waveTarget = 38;
          maxConcurrent = 22;
        } else if (gameState.wave === 7) {
          waveTarget = 48;
          maxConcurrent = 25;
        } else if (gameState.wave === 8) {
          waveTarget = 60;
          maxConcurrent = 28;
        } else if (gameState.wave === 9) {
          waveTarget = 75;
          maxConcurrent = 30;
        } else if (gameState.wave === 10) {
          waveTarget = 90;
          maxConcurrent = 35;
        } else if (gameState.wave <= 13) {
          // Wave 11-13: Escalado exponencial fuerte (última escalada de cantidad)
          waveTarget = Math.floor(90 + (gameState.wave - 10) * 10 * Math.pow(1.15, gameState.wave - 10));
          maxConcurrent = Math.min(45, 35 + (gameState.wave - 10) * 2);
        } else {
          // Wave 14+: CANTIDAD FIJA - Solo escala poder/daño
          waveTarget = 130; // Cantidad fija de enemigos
          maxConcurrent = 45; // Max concurrente fijo
        }

        // Boss waves (cada 5) y Mini-boss waves (3, 7, 12, 17, 22...) incluyen +1 enemigo
        if (gameState.wave % 5 === 0) {
          waveTarget += 1; // +1 por el boss
        }
        const isMiniBossWave =
          gameState.wave === 3 || (gameState.wave > 3 && (gameState.wave - 3) % 5 === 0 && gameState.wave % 5 !== 0);
        if (isMiniBossWave) {
          waveTarget += 1; // +1 por el mini-boss
        }

        gameState.waveEnemiesTotal = waveTarget;
        gameState.maxConcurrentEnemies = maxConcurrent;

        // Animación de transición entre waves (3 segundos)
        gameState.waveNotification = 3;

        // Partículas de celebración
        for (let i = 0; i < 30; i++) {
          const angle = (Math.PI * 2 * i) / 30;
          gameState.particles.push({
            x: gameState.player.x,
            y: gameState.player.y,
            vx: Math.cos(angle) * 8,
            vy: Math.sin(angle) * 8,
            life: 1.5,
            color: "#8e44ad",
            size: 4,
          });
        }

        // Recompensa por completar wave
        collectXP(20 + gameState.wave * 5);

        // ═══════════════════════════════════════════════════════════
        // LIMPIAR EVENTOS AL FINALIZAR WAVE
        // ═══════════════════════════════════════════════════════════
        // Cuando una wave termina, todos los eventos se detienen inmediatamente
        if (gameState.environmentalEvent) {
          gameState.environmentalEvent = null;
          gameState.eventPhase = "none";
          gameState.eventIntensity = 0;
          gameState.eventNotification = 0;
          gameState.fogOpacity = 0;
          gameState.fogZones = [];
          gameState.fogWarningZones = []; // Limpiar warnings también
          gameState.stormZone = null;

          // FIX: Limpiar TODOS los hotspots radiactivos (lluvia radiactiva)
          gameState.hotspots = gameState.hotspots.filter((h) => !h.isRadioactive);
        }

        // Reset flag para permitir nuevo evento en la siguiente wave
        gameState.eventActivatedThisWave = false;

        // ═══════════════════════════════════════════════════════════
        // ACTIVACIÓN DE EVENTOS AMBIENTALES AL INICIO DE WAVE
        // ═══════════════════════════════════════════════════════════
        // Solo se puede activar 1 evento por wave, con probabilidad creciente (NO durante tutorial)
        // Calcular probabilidad según wave actual (MUCHO MÁS BAJAS)
        if (!gameState.tutorialActive) {
          let eventProbability = 0;
          if (gameState.wave >= 1 && gameState.wave <= 5) {
            eventProbability = 0.01; // 1% en waves 1-5
          } else if (gameState.wave >= 6 && gameState.wave <= 10) {
            eventProbability = 0.03; // 3% en waves 6-10
          } else if (gameState.wave >= 11 && gameState.wave <= 15) {
            eventProbability = 0.06; // 6% en waves 11-15
          } else if (gameState.wave >= 16) {
            eventProbability = 0.1; // 10% en waves 16+
          }

          // Intentar activar evento con la probabilidad calculada (UNA VEZ al inicio de la wave)
          if (Math.random() < eventProbability) {
            const events = ["storm", "fog", "rain"] as const;
            const newEvent = events[Math.floor(Math.random() * events.length)];

            gameState.environmentalEvent = newEvent;
            gameState.eventPhase = "notification";
            gameState.eventIntensity = 0;
            gameState.eventTimer = 0;
            gameState.eventNotification = 5; // 5 segundos de aviso antes de que empiece
            gameState.fogOpacity = 0;
            gameState.fogZones = [];
            gameState.fogWarningZones = [];
            gameState.stormZone = null;
            gameState.eventActivatedThisWave = true; // Marcar que ya se activó en esta wave
          }
        }
      }

      // Reducir timer de notificación de wave
      if (gameState.waveNotification > 0) {
        gameState.waveNotification = Math.max(0, gameState.waveNotification - dt);
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

        // Verificar si la wave terminó (evento termina inmediatamente)
        if (gameState.waveKills >= gameState.waveEnemiesTotal) {
          // Limpiar todos los eventos inmediatamente
          gameState.environmentalEvent = null;
          gameState.fogOpacity = 0;
          gameState.fogZones = [];
          gameState.stormZone = null;
          gameState.eventPhase = "none";
          gameState.eventIntensity = 0;
          gameState.eventNotification = 0;
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
              // ⚡ TORMENTA: Sigue al jugador LENTAMENTE pero de forma impredecible
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
              // 🌫️ NIEBLA TÓXICA: Warning antes de aparecer, luego 1 zona rectangular
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
              // ☢️ LLUVIA RADIACTIVA: Enemigos ganan velocidad en zonas específicas - SOLO 1 CÍRCULO
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
        gameState.wave >= 3 &&
        negativeHotspotCount < (gameState.wave >= 11 ? 2 : 1)
      ) {
        let dangerChance = 0.02;
        if (gameState.wave >= 6 && gameState.wave < 11) {
          dangerChance = 0.025; // Cada ~40s
        } else if (gameState.wave >= 11) {
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

        // Danger zones permanentes desde wave 8
        const isDangerZonePermanent = h.isNegative && gameState.wave >= 8;

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
        gameState.player.stamina = Math.max(0, gameState.player.stamina - 5 * dt); // Consume 5 stamina/segundo (dura 4s)
      } else {
        // Sprint desactivado, regenerar stamina
        gameState.player.isSprinting = false;
        if (gameState.player.stamina < gameState.player.maxStamina) {
          gameState.player.stamina = Math.min(gameState.player.maxStamina, gameState.player.stamina + 10 * dt); // Regenera 10 stamina/segundo (llena en 2s)
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
      const allEnemies = gameState.enemies;
      const visibleEnemies = cullEntities(
        allEnemies,
        expandBounds(visibilityBounds, MAX_ENEMY_RADIUS),
        (enemy) => enemy.rad,
      );
      const visibleEnemySet =
        visibleEnemies.length === allEnemies.length ? null : new Set(visibleEnemies);

      // ═══════════════════════════════════════════════════════════
      // SISTEMA DE SPAWN DE ENEMIGOS - Estilo COD Zombies
      // ═══════════════════════════════════════════════════════════
      //
      // Reglas:
      // 1. Solo se spawnean enemigos normales si waveEnemiesSpawned < waveEnemiesTotal
      // 2. Boss y Mini-boss NO cuentan en el límite de maxConcurrentEnemies
      // 3. Los spawns se detienen cuando se alcanza waveEnemiesTotal
      // 4. La wave NO avanza hasta que waveKills >= waveEnemiesTotal
      // 5. En waves 8+, enemigos aparecen en bursts de 3-5 simultáneos
      //
      // ═══════════════════════════════════════════════════════════

      gameState.lastSpawn += dt;

      // Sistema de cooldown: Reducir el cooldown
      if (gameState.spawnCooldown > 0) {
        gameState.spawnCooldown = Math.max(0, gameState.spawnCooldown - dt);
      }

      // Verificar si todos los enemigos fueron eliminados
      if (gameState.enemies.length === 0 && gameState.waveEnemiesSpawned > 0 && gameState.canSpawn) {
        // Activar cooldown de 3 segundos
        gameState.canSpawn = false;
        gameState.spawnCooldown = 3;
      }

      // Después del cooldown, permitir spawn de nuevo
      if (!gameState.canSpawn && gameState.spawnCooldown === 0) {
        gameState.canSpawn = true;
      }

      // Solo spawnear enemigos normales si:
      // 1. No estamos en tutorial
      // 2. No hemos alcanzado el total de la wave
      // 3. Hay cupo (normalEnemies < maxConcurrentEnemies)
      // 4. El cooldown ha terminado (canSpawn = true)
      let normalEnemyCount = gameState.normalEnemyCount;
      const canSpawnNow =
        !gameState.tutorialActive &&
        gameState.waveEnemiesSpawned < gameState.waveEnemiesTotal &&
        normalEnemyCount < gameState.maxConcurrentEnemies &&
        gameState.canSpawn;

      if (canSpawnNow) {
        // Velocidad de spawn estilo COD Zombies - Spawns en bursts agresivos
        let spawnRate: number;

        if (gameState.wave === 1 || gameState.wave === 2) {
          // Wave 1-2: Spawn controlado
          spawnRate = 1.2 + Math.random() * 0.3;
        } else if (gameState.wave <= 5) {
          // Wave 3-5: Aumenta presión
          spawnRate = 0.8 + Math.random() * 0.2;
        } else if (gameState.wave <= 10) {
          // Wave 6-10: Spawns rápidos en bursts
          spawnRate = 0.4 + Math.random() * 0.3;
        } else if (gameState.wave <= 15) {
          // Wave 11-15: Spawns constantes
          spawnRate = 0.2 + Math.random() * 0.2;
        } else {
          // Wave 16+: Inundación continua
          spawnRate = 0.1 + Math.random() * 0.2;
        }

        if (gameState.lastSpawn > spawnRate) {
          // Spawns en hordas (Wave 8+)
          let spawnCount = 1;
          if (gameState.wave >= 8 && Math.random() < 0.3) {
            spawnCount = Math.floor(Math.random() * 3) + 3; // 3-5 enemigos simultáneos
          }

          for (let i = 0; i < spawnCount; i++) {
            if (
              gameState.waveEnemiesSpawned < gameState.waveEnemiesTotal &&
              normalEnemyCount < gameState.maxConcurrentEnemies
            ) {
              spawnEnemy();
              normalEnemyCount = gameState.normalEnemyCount;
              gameState.waveEnemiesSpawned++;
            }
          }
          gameState.lastSpawn = 0;
        }
      }

      // Boss spawn cada 5 waves (NO durante tutorial, NO cuenta en límite concurrente)
      if (
        !gameState.tutorialActive &&
        gameState.wave % 5 === 0 &&
        gameState.waveEnemiesSpawned === gameState.waveEnemiesTotal - 1 &&
        gameState.enemies.length === 0
      ) {
        spawnBoss();
        gameState.waveEnemiesSpawned++;
      }

      // Mini-boss spawn (wave 3, 7, 12, 17, 22...) (NO durante tutorial, NO cuenta en límite concurrente)
      const isMiniBossWave = gameState.wave === 3 || (gameState.wave > 3 && (gameState.wave - 3) % 5 === 0);
      if (
        !gameState.tutorialActive &&
        isMiniBossWave &&
        gameState.waveEnemiesSpawned === gameState.waveEnemiesTotal - 1 &&
        gameState.enemies.length === 0
      ) {
        spawnMiniBoss();
        gameState.waveEnemiesSpawned++;
      }

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

        // Movimiento (ralentizado si está congelado)
        let movementSpeed = e.spd;
        if (e.frozenTimer > 0) {
          e.frozenTimer -= dt;
          movementSpeed *= 0.5; // 50% más lento
        }

        // Comportamientos especiales de enemigos

        // 💣 BOMBER: Countdown de explosión
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
            const explosionRadius = 80; // Radio AOE
            const explosionDamage = e.damage; // Usar el daño escalado del bomber

            // Daño al jugador si está en rango
            const distToPlayer = Math.hypot(e.x - gameState.player.x, e.y - gameState.player.y);
            if (distToPlayer < explosionRadius) {
              // Daño proporcional a la distancia
              const damageMultiplier = 1 - (distToPlayer / explosionRadius) * 0.5; // 100% en el centro, 50% en el borde
              const finalDamage = explosionDamage * damageMultiplier;

              if (gameState.player.ifr <= 0) {
                if (gameState.player.shield > 0) {
                  gameState.player.shield--;
                } else {
                  // Aplicar reducción de daño
                  const reducedDamage = finalDamage * (1 - gameState.player.stats.damageReduction);
                  gameState.player.hp = Math.max(0, gameState.player.hp - reducedDamage);

                  // Knockback
                  const knockbackForce = 150;
                  const angle = Math.atan2(gameState.player.y - e.y, gameState.player.x - e.x);
                  gameState.player.x += Math.cos(angle) * knockbackForce * dt * 10;
                  gameState.player.y += Math.sin(angle) * knockbackForce * dt * 10;

                  // Clamp dentro del mapa
                  gameState.player.x = Math.max(
                    gameState.player.rad,
                    Math.min(gameState.worldWidth - gameState.player.rad, gameState.player.x),
                  );
                  gameState.player.y = Math.max(
                    gameState.player.rad,
                    Math.min(gameState.worldHeight - gameState.player.rad, gameState.player.y),
                  );
                }
                gameState.player.ifr = gameState.player.ifrDuration;

                if (gameState.player.hp <= 0) {
                  endGame();
                }
              }
            }

            // Daño a enemigos cercanos (también reciben daño de explosión)
            for (const otherEnemy of gameState.enemies) {
              if (otherEnemy === e) continue;
              const distToEnemy = Math.hypot(e.x - otherEnemy.x, e.y - otherEnemy.y);
              if (distToEnemy < explosionRadius) {
                const damageMultiplier = 1 - (distToEnemy / explosionRadius) * 0.5;
                otherEnemy.hp -= explosionDamage * 0.5 * damageMultiplier; // 50% daño a otros enemigos
              }
            }

            // Explosión visual GRANDE
            if (isVisible && gameState.particles.length < gameState.maxParticles - 50) {
              for (let j = 0; j < 50; j++) {
                const angle = (Math.PI * 2 * j) / 50;
                const speed = 8 + Math.random() * 8;
                gameState.particles.push({
                  x: e.x,
                  y: e.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  life: 1 + Math.random() * 0.5,
                  color: j % 2 === 0 ? "#ef4444" : "#ff7a2a",
                  size: 6 + Math.random() * 4,
                });
              }
            }

            // Marca en el suelo
            gameState.explosionMarks.push({
              x: e.x,
              y: e.y,
              radius: explosionRadius,
              life: 3, // 3 segundos
            });

            // Sonido de explosión (más fuerte)
            audioManager.playSfx("death", { volume: 1 });

            // Eliminar bomber
            e.hp = 0;
          }
        }

        if (e.specialType === "summoner" && e.summonCooldown !== undefined) {
          e.summonCooldown -= dt;
          if (e.summonCooldown <= 0 && normalEnemyCount < gameState.maxConcurrentEnemies) {
            // Invocar zombi pequeño (NO cuenta en límite si viene de summoner en wave boss)
            for (let i = 0; i < 2 && normalEnemyCount < gameState.maxConcurrentEnemies; i++) {
              const angle = Math.random() * Math.PI * 2;
              const dist = 30;
              const summonedEnemy = {
                x: e.x + Math.cos(angle) * dist,
                y: e.y + Math.sin(angle) * dist,
                rad: scaleEnemyRadius(8),
                hp: 1,
                maxhp: 1,
                spd: applyEnemySpeedModifier(1.2),
                enemyType: "weak",
                damage: 3,
                isElite: false,
                isMiniBoss: false,
                isBoss: false,
                isSummoned: true, // Marcado como invocado, no cuenta para la wave
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

          // ☢️ Bonus de velocidad si está en zona radiactiva (lluvia)
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

          e.x += (dx / d) * movementSpeed * speedBonus;
          e.y += (dy / d) * movementSpeed * speedBonus;
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
                spd: 5,
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
                    color: "#dc2626",
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
                  spd: 6,
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
                  spd: 5,
                  life: 4,
                  damage: 20,
                  color: "#dc2626",
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
                    color: "#dc2626",
                    size: 5,
                  });
                }
              }
            }
          }
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

        b.x += Math.cos(b.dir) * b.spd;
        b.y += Math.sin(b.dir) * b.spd;
        b.life -= dt;

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

      const handleEnemyDeath = (enemy: any, killer: any | null) => {
        if (!enemy || (enemy as any).__removed) {
          return;
        }

        const enemyIndex = gameState.enemies.indexOf(enemy);
        if (enemyIndex === -1) {
          (enemy as any).__removed = true;
          return;
        }

        (enemy as any).__removed = true;

        if (!enemy.isBoss && !enemy.isMiniBoss) {
          gameState.normalEnemyCount = Math.max(0, gameState.normalEnemyCount - 1);
          normalEnemyCount = gameState.normalEnemyCount;
        }
        gameState.enemies.splice(enemyIndex, 1);

        if (enemy.specialType === "explosive") {
          for (const otherEnemy of gameState.enemies) {
            const dx = otherEnemy.x - enemy.x;
            const dy = otherEnemy.y - enemy.y;
            if (dx * dx + dy * dy < 80 * 80) {
              otherEnemy.hp -= 10;
            }
          }
          const playerDx = gameState.player.x - enemy.x;
          const playerDy = gameState.player.y - enemy.y;
          if (playerDx * playerDx + playerDy * playerDy < 80 * 80) {
            if (gameState.player.ifr <= 0 && gameState.player.shield === 0) {
              gameState.player.hp -= 10;
              gameState.player.ifr = gameState.player.ifrDuration;
            }
          }
          if (gameState.particles.length < gameState.maxParticles - 30) {
            for (let j = 0; j < 30; j++) {
              const angle = (Math.PI * 2 * j) / 30;
              gameState.particles.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * 10,
                vy: Math.sin(angle) * 10,
                life: 1,
                color: "#ef4444",
                size: 5,
              });
            }
          }
        }

        if (!enemy.isSummoned) {
          gameState.waveKills++;
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
        } else if (enemy.isMiniBoss) {
          points = 100;
          xpBundles = Math.floor(Math.random() * 3) + 4;
          dropChance = 0.1;
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
          let xpValue = enemy.isMiniBoss
            ? 30
            : enemy.enemyType === "strong"
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

        if (healRoll < 0.05 * luckMultiplier) {
          dropHeal(enemy.x, enemy.y);
        }

        if (Math.random() < dropChance) {
          const roll = Math.random();
          const powerupType = roll < 0.3 ? "magnet" : roll < 0.5 ? "shield" : roll < 0.65 ? "rage" : "speed";
          dropPowerup(enemy.x, enemy.y, powerupType);
        }

        if (Math.random() < CHEST_DROP_RATE) {
          dropChest(enemy.x, enemy.y);
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
                spd: 15,
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
                  color: "#dc2626",
                  size: 4,
                });
              }
            }
          }
        }
      };

      for (const bullet of gameState.bullets) {
        if (bullet.isEnemyBullet || bullet.life <= 0) continue;

        neighborBuffer.length = 0;
        const neighbors = useSpatialHash
          ? spatialHash.queryEnemies(bullet.x, bullet.y, BULLET_QUERY_RADIUS, neighborBuffer)
          : fallbackEnemies;

        if (neighbors.length === 0) continue;

        let hitSomething = false;

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
                for (let j = 0; j < 5; j++) {
                  gameState.particles.push({
                    x: bullet.x,
                    y: bullet.y,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    life: 0.3,
                    color: bullet.color,
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
          playHitSound();
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

      for (let i = gameState.drops.length - 1; i >= 0; i--) {
        const g = gameState.drops[i];
        const dx = gameState.player.x - g.x;
        const dy = gameState.player.y - g.y;
        const d = Math.hypot(dx, dy) || 1;

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
          if (g.type === "xp") {
            collectXP(g.val);
          } else if (g.type === "heal") {
            gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + g.val);
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
          } else if (g.type === "chest") {
            openChest(g);
          }
          gameState.drops.splice(i, 1);
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
            // 💣 BOMBER: Activar explosión al contacto
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

            // First Hit Immune: revisar si es el primer golpe de la wave
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
              gameState.player.ifr = gameState.player.ifrDuration;

              // Escudo Reactivo: empuja enemigos
              if (gameState.player.stats.reactiveShieldActive) {
                const reactiveStacks = Math.max(1, getItemStacks("reactiveshield"));
                const reactiveRadius = 150 * (1 + 0.1 * (reactiveStacks - 1));
                const reactivePush = 50 * reactiveStacks;
                for (const enemy of gameState.enemies) {
                  const dist = Math.hypot(enemy.x - gameState.player.x, enemy.y - gameState.player.y);
                  if (dist < reactiveRadius) {
                    const pushDir = Math.atan2(enemy.y - gameState.player.y, enemy.x - gameState.player.x);
                    enemy.x += Math.cos(pushDir) * reactivePush;
                    enemy.y += Math.sin(pushDir) * reactivePush;
                    // Daño a enemigos empujados
                    enemy.hp -= gameState.player.stats.damageMultiplier * 5 * reactiveStacks;
                  }
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
              if (gameState.particles.length < gameState.maxParticles - 10) {
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

            if (gameState.player.hp <= 0) {
              endGame();
            }

            playHitSound();
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
              if (gameState.player.shield > 0) {
                gameState.player.shield--;
              } else {
                gameState.player.hp -= b.damage;
              }
              gameState.player.ifr = gameState.player.ifrDuration;

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
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt;
        p.vx *= 0.98;
        p.vy *= 0.98;
        if (p.life <= 0) gameState.particles.splice(i, 1);
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

      // HP Bar - Barra horizontal con valor numérico
      const hpBarX = 20;
      const hpBarY = 70; // Movido más abajo para no chocar con el anuncio del evento
      const hpBarW = 300;
      const hpBarH = 32;

      // Fondo de la barra de HP
      ctx.fillStyle = UI_COLORS.panelBg;
      ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
      ctx.strokeStyle = UI_COLORS.panelBorder;
      ctx.lineWidth = 3;
      ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);

      // Barra de HP actual (roja)
      const safeMaxHp = Math.max(1, Number(gameState.player.maxhp) || 1);
      const hpPercentRaw = Number(gameState.player.hp) / safeMaxHp;
      const hpPercent = Math.max(0, Math.min(1, Number.isFinite(hpPercentRaw) ? hpPercentRaw : 0));
      const currentHpBarW = Math.max(0, hpBarW * hpPercent);

      // Gradiente para la barra de HP
      if (currentHpBarW > 0) {
        const hpGradient = ctx.createLinearGradient(hpBarX, hpBarY, hpBarX + currentHpBarW, hpBarY);
        hpGradient.addColorStop(0, UI_COLORS.healthLow);
        hpGradient.addColorStop(1, UI_COLORS.healthHigh);

        ctx.save();
        ctx.shadowColor = UI_COLORS.healthHigh;
        ctx.shadowBlur = 16;
        ctx.fillStyle = hpGradient;
        ctx.fillRect(hpBarX + 2, hpBarY + 2, currentHpBarW - 4, hpBarH - 4);
        ctx.restore();
      }

      // Texto de HP en el centro
      ctx.fillStyle = textPrimary;
      ctx.font = "bold 18px system-ui";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(
        `HP ${Math.floor(gameState.player.hp)} / ${gameState.player.maxhp}`,
        hpBarX + hpBarW / 2,
        hpBarY + hpBarH / 2 + 6,
      );
      ctx.shadowBlur = 0;

      ctx.save();
      ctx.shadowColor = UI_COLORS.healthHigh;
      ctx.shadowBlur = 18;
      ctx.fillStyle = UI_COLORS.healthHigh;
      ctx.textAlign = "left";
      ctx.font = "bold 20px system-ui";
      ctx.fillText("❤", hpBarX - 24, hpBarY + hpBarH / 2 + 7);
      ctx.restore();

      if (hpPercent < 0.3) {
        const flicker = (Math.sin(gameState.time * 14) + 1) / 2;
        ctx.save();
        ctx.globalAlpha = 0.4 + flicker * 0.35;
        ctx.strokeStyle = UI_COLORS.healthHigh;
        ctx.lineWidth = 4;
        ctx.shadowColor = UI_COLORS.healthHigh;
        ctx.shadowBlur = 18;
        ctx.strokeRect(hpBarX - 3, hpBarY - 3, hpBarW + 6, hpBarH + 6);
        ctx.restore();
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
        ctx.font = "bold 16px system-ui";
        for (let i = 0; i < gameState.player.shield; i++) {
          const shieldX = hpBarX + hpBarW + 15 + i * 30;
          ctx.beginPath();
          ctx.arc(shieldX, hpBarY + hpBarH / 2, 12, 0, Math.PI * 2);
          ctx.save();
          ctx.shadowColor = `${UI_COLORS.shield}aa`;
          ctx.shadowBlur = 12;
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
      ctx.fillStyle = UI_COLORS.panelBg;
      ctx.fillRect(staminaBarX, staminaBarY, staminaBarW, staminaBarH);
      ctx.strokeStyle = UI_COLORS.panelBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(staminaBarX, staminaBarY, staminaBarW, staminaBarH);

      // Barra de stamina actual (amarilla/verde)
      const staminaPercent = Math.max(0, Math.min(1, gameState.player.stamina / gameState.player.maxStamina));
      const currentStaminaBarW = Math.max(0, staminaBarW * staminaPercent);

      if (currentStaminaBarW > 0) {
        const staminaGradient = ctx.createLinearGradient(
          staminaBarX,
          staminaBarY,
          staminaBarX + currentStaminaBarW,
          staminaBarY,
        );
        staminaGradient.addColorStop(0, accentColor);
        staminaGradient.addColorStop(1, `${accentColor}cc`);
        ctx.fillStyle = staminaGradient;
        ctx.fillRect(staminaBarX + 1, staminaBarY + 1, currentStaminaBarW - 2, staminaBarH - 2);
      }

      // Texto de stamina
      ctx.textAlign = "center";
      ctx.fillStyle = textSecondary;
      ctx.font = "bold 12px system-ui";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(
        `STAMINA ${Math.floor(gameState.player.stamina)}`,
        staminaBarX + staminaBarW / 2,
        staminaBarY + staminaBarH / 2 + 4,
      );
      ctx.shadowBlur = 0;

      // Indicador de sprint activo
      if (gameState.player.isSprinting) {
        ctx.globalAlpha = 0.6 + Math.sin(gameState.time * 10) * 0.4;
        ctx.strokeStyle = "#5dbb63";
        ctx.lineWidth = 3;
        ctx.strokeRect(staminaBarX - 2, staminaBarY - 2, staminaBarW + 4, staminaBarH + 4);
        ctx.globalAlpha = 1;
      }

      // Level info (arriba izquierda, debajo de stamina)
      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px system-ui";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(`${t.level.toUpperCase()} ${gameState.level}`, 20, staminaBarY + staminaBarH + 22);
      ctx.shadowBlur = 0;

      // Wave counter (debajo del nivel)
      const waveY = staminaBarY + staminaBarH + 47;
      ctx.fillStyle = "#8e44ad";
      ctx.font = "bold 16px system-ui";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(`WAVE ${gameState.wave}`, 20, waveY);
      ctx.shadowBlur = 0;

      // Wave progression bar (debajo del wave counter)
      const progressBarX = 20;
      const progressBarY = waveY + 10;
      const progressBarW = 300;
      const progressBarH = 20;

      // Fondo de la barra
      ctx.fillStyle = "rgba(20, 25, 35, 0.9)";
      ctx.fillRect(progressBarX, progressBarY, progressBarW, progressBarH);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.strokeRect(progressBarX, progressBarY, progressBarW, progressBarH);

      // Progreso (enemigos eliminados / total de la wave)
      const waveProgress = Math.min(1, gameState.waveKills / Math.max(1, gameState.waveEnemiesTotal));
      const currentProgressW = Math.max(0, progressBarW * waveProgress);

      if (currentProgressW > 0) {
        const progressGradient = ctx.createLinearGradient(
          progressBarX,
          progressBarY,
          progressBarX + currentProgressW,
          progressBarY,
        );
        progressGradient.addColorStop(0, "#8e44ad");
        progressGradient.addColorStop(1, "#7c3aed");
        ctx.fillStyle = progressGradient;
        ctx.fillRect(progressBarX + 1, progressBarY + 1, currentProgressW - 2, progressBarH - 2);
      }

      // Texto de progreso
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px system-ui";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(
        `${gameState.waveKills} / ${gameState.waveEnemiesTotal}`,
        progressBarX + progressBarW / 2,
        progressBarY + progressBarH / 2 + 4,
      );
      ctx.shadowBlur = 0;

      // Score
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffc300";
      ctx.font = "bold 24px system-ui";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(`${gameState.score}`, W - 20, 40);
      ctx.shadowBlur = 0;

      // ========== BARRA DE XP FULL-WIDTH (PARTE INFERIOR) ==========
      const xpBarH = 40;
      const xpBarY = H - xpBarH - 10;
      const xpBarX = 20;
      const xpBarW = W - 40;
      const xpBarRadius = 20;

      // Fondo de la barra (redondeada)
      ctx.fillStyle = UI_COLORS.panelBg;
      ctx.beginPath();
      drawRoundedRect(ctx, xpBarX, xpBarY, xpBarW, xpBarH, xpBarRadius);
      ctx.fill();

      // Borde exterior con glow
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = accentGlow;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Progreso de XP
      const xpProgress = Math.min(1, gameState.xpDisplay / Math.max(1, gameState.nextXpDisplay));
      const currentXpBarW = (xpBarW - 8) * xpProgress;

      if (currentXpBarW > 0) {
        ctx.save();

        // Clip para bordes redondeados
        ctx.beginPath();
        drawRoundedRect(ctx, xpBarX + 4, xpBarY + 4, currentXpBarW, xpBarH - 8, xpBarRadius - 4);
        ctx.clip();

        // Animación Rainbow cuando sube de nivel
        if (gameState.xpBarRainbow) {
          // Gradiente rainbow animado
          const rainbowOffset = (gameState.time * 2) % 1;
          const gradient = ctx.createLinearGradient(xpBarX, xpBarY, xpBarX + xpBarW, xpBarY);

          // Colores rainbow con offset animado
          const colors = [
            { stop: 0, color: UI_COLORS.healthLow },
            { stop: 0.2, color: UI_COLORS.ammo },
            { stop: 0.45, color: UI_COLORS.accent },
            { stop: 0.7, color: UI_COLORS.shield },
            { stop: 1, color: UI_COLORS.xp },
          ];

          colors.forEach(({ stop, color }) => {
            const animatedStop = (stop + rainbowOffset) % 1;
            gradient.addColorStop(animatedStop, color);
          });

          // Agregar colores al final para seamless loop
          colors.slice(0, 2).forEach(({ stop, color }) => {
            const animatedStop = (stop + rainbowOffset + 1) % 1;
            if (animatedStop < 1) {
              gradient.addColorStop(animatedStop, color);
            }
          });

          ctx.fillStyle = gradient;

          // Glow effect pulsante
          const pulse = Math.sin(gameState.time * 5) * 0.3 + 0.7;
          ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
          ctx.shadowBlur = 20 * pulse;
        } else {
          // Gradiente normal (neón cyan-purple)
          const gradient = ctx.createLinearGradient(xpBarX, xpBarY, xpBarX + currentXpBarW, xpBarY);
          gradient.addColorStop(0, "#301a3e");
          gradient.addColorStop(1, UI_COLORS.xp);
          ctx.fillStyle = gradient;

          // Glow sutil
          ctx.shadowColor = `${UI_COLORS.xp}cc`;
          ctx.shadowBlur = 18;
        }

        ctx.fillRect(xpBarX + 4, xpBarY + 4, currentXpBarW, xpBarH - 8);
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Texto de XP centrado
      ctx.fillStyle = textPrimary;
      ctx.font = "bold 20px system-ui";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 6;
      ctx.fillText(
        `XP: ${Math.floor(gameState.xpDisplay)} / ${Math.max(1, Math.floor(gameState.nextXpDisplay))}`,
        xpBarX + xpBarW / 2,
        xpBarY + xpBarH / 2 + 7,
      );
      ctx.shadowBlur = 0;

      // Weapons display
      ctx.textAlign = "left";
      ctx.font = "bold 14px system-ui";
      ctx.save();
      ctx.shadowColor = `${UI_COLORS.ammo}aa`;
      ctx.shadowBlur = 18;
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
        ctx.shadowBlur = 10;
        ctx.fillRect(W - 220, 80 + i * 25, 18, 18);
        ctx.restore();
        ctx.fillStyle = textSecondary;
        ctx.font = "12px system-ui";
        const weaponName = getWeaponName(w.id, currentLanguage);
        const weaponText = w.level > 1 ? `${weaponName} LVL ${w.level}` : weaponName;
        ctx.fillText(weaponText, W - 195, 93 + i * 25);
      }

      // Books display
      ctx.fillStyle = textPrimary;
      ctx.font = "bold 14px system-ui";
      const tomeY = 80 + gameState.player.weapons.length * 25 + 10;
      ctx.fillText(t.tomes, W - 220, tomeY);
      for (let i = 0; i < gameState.player.tomes.length; i++) {
        const tome = gameState.player.tomes[i];
        ctx.fillStyle = tome.color;
        ctx.save();
        ctx.shadowColor = `${tome.color}aa`;
        ctx.shadowBlur = 10;
        ctx.fillRect(W - 220, tomeY + 10 + i * 25, 18, 18);
        ctx.restore();
        ctx.fillStyle = textSecondary;
        ctx.font = "12px system-ui";
        const tomeName = getTomeName(tome.id, currentLanguage);
        const tomeText = tome.level > 1 ? `${tomeName} LVL ${tome.level}` : tomeName;
        ctx.fillText(tomeText, W - 195, tomeY + 23 + i * 25);
      }

      // Items display
      if (gameState.player.items.length > 0) {
        ctx.fillStyle = textPrimary;
        ctx.font = "bold 14px system-ui";
        const itemY = tomeY + gameState.player.tomes.length * 25 + 20;
        ctx.fillText(t.items, W - 220, itemY);

        // Mostrar solo primeros 10 ítems (si hay más, scroll)
        const maxItemsToShow = Math.min(10, gameState.player.items.length);
        for (let i = 0; i < maxItemsToShow; i++) {
          const item = gameState.player.items[i];
          ctx.fillStyle = item.color;
          ctx.save();
          ctx.shadowColor = `${item.color}aa`;
          ctx.shadowBlur = 8;
          ctx.fillRect(W - 220, itemY + 10 + i * 20, 12, 12);
          ctx.restore();
          ctx.fillStyle = textSecondary;
          ctx.font = "10px system-ui";
          // Truncar nombre si es muy largo
          const itemNameFull = getItemText(item, currentLanguage).name;
          const itemName = itemNameFull.length > 18 ? itemNameFull.substring(0, 16) + "..." : itemNameFull;
          ctx.fillText(itemName, W - 202, itemY + 20 + i * 20);
        }

        // Indicador de más ítems
        if (gameState.player.items.length > 10) {
          ctx.fillStyle = textSecondary;
          ctx.font = "10px system-ui";
          const remaining = gameState.player.items.length - 10;
          const moreItemsText = currentLanguage === "es" ? `+${remaining} más` : `+${remaining} more`;
          ctx.fillText(moreItemsText, W - 220, itemY + 10 + maxItemsToShow * 20 + 15);
        }
      }

      if (isNightVision) {
        ctx.save();
        ctx.textAlign = "right";
        ctx.font = "bold 16px system-ui";
        ctx.shadowColor = accentGlow;
        ctx.shadowBlur = 14;
        ctx.fillStyle = accentColor;
        ctx.fillText("NIGHT VISION", W - 40, 40);
        ctx.restore();
      }

      // Level up animation
      if (gameState.levelUpAnimation > 0) {
        const alpha = gameState.levelUpAnimation;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = accentColor;
        ctx.font = "bold 72px system-ui";
        ctx.textAlign = "center";
        const scale = 1 + (1 - alpha) * 0.5;
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(scale, scale);
        ctx.fillText(t.levelUp, 0, 0);
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // Wave notification - Anuncio de la wave que viene
      if (gameState.waveNotification > 0) {
        const alpha = Math.min(1, gameState.waveNotification);
        const fadeOut = gameState.waveNotification < 1 ? gameState.waveNotification : 1;
        ctx.globalAlpha = fadeOut;

        // Fondo semitransparente
        ctx.fillStyle = UI_COLORS.overlay;
        ctx.fillRect(0, H / 2 - 80, W, 160);

        // Icono de wave
        const pulse = Math.sin(gameState.time * 8) * 0.2 + 0.8;
        ctx.fillStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 30 * pulse;
        ctx.font = "bold 72px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("⚡", W / 2, H / 2 - 10);

        // Texto principal con glow - Wave que viene
        ctx.fillStyle = UI_COLORS.ammo;
        ctx.shadowColor = UI_COLORS.ammo;
        ctx.shadowBlur = 30 * pulse;
        ctx.font = "bold 56px system-ui";
        ctx.fillText(`WAVE ${gameState.wave}`, W / 2, H / 2 + 50);

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      // ⚠️ BARRA DE NOTIFICACIÓN AMBIENTAL - Estilo Noticiero (visible durante todo el evento)
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

        // Icono de alerta
        ctx.fillStyle = UI_COLORS.ammo;
        ctx.font = "bold 32px system-ui";
        ctx.textAlign = "left";
        ctx.fillText("⚠️", 20, 40);

        // Texto de noticia con descripción de efectos
        const eventTexts = {
          storm: "⚡ ALERTA: Tormenta eléctrica aproximándose...",
          fog: "🌫️ ALERTA: Niebla tóxica detectada en el área...",
          rain: "☢️ ALERTA: Lluvia radiactiva inminente...",
        };

        // Mostrar texto del evento actual
        const eventText = gameState.environmentalEvent ? eventTexts[gameState.environmentalEvent] : "";

        ctx.fillStyle = textPrimary;
        ctx.font = "bold 20px system-ui";
        ctx.textAlign = "left";
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 4;
        ctx.fillText(eventText, 70, 40);
        ctx.shadowBlur = 0;

        ctx.globalAlpha = 1;
      }

      // Notificación de música
      if (gameState.musicNotificationTimer > 0) {
        const notifAlpha = Math.min(1, gameState.musicNotificationTimer);
        ctx.globalAlpha = notifAlpha;

        const notifY = 120;
        const notifPadding = 20;
        const notifText = `♫ ${gameState.musicNotification}`;

        ctx.font = "bold 24px system-ui";
        ctx.textAlign = "center";
        const textMetrics = ctx.measureText(notifText);
        const notifW = textMetrics.width + notifPadding * 2;
        const notifH = 50;
        const notifX = W / 2 - notifW / 2;

        // Background
        ctx.fillStyle = UI_COLORS.panelBg;
        ctx.beginPath();
        drawRoundedRect(ctx, notifX, notifY, notifW, notifH, 10);
        ctx.fill();

        // Border
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text
        ctx.fillStyle = textPrimary;
        ctx.fillText(notifText, W / 2, notifY + notifH / 2 + 8);

        ctx.globalAlpha = 1;
      }

      if (gameState.itemNotificationTimer > 0 && gameState.itemNotification) {
        const notifAlpha = Math.min(1, gameState.itemNotificationTimer);
        ctx.globalAlpha = notifAlpha;

        const notifY = 170;
        const notifPadding = 20;
        const notifText = `🎁 ${gameState.itemNotification}`;

        ctx.font = "bold 22px system-ui";
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
        ctx.shadowBlur = 10;
        ctx.fillText(notifText, W / 2, notifY + 6);

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      // Controles de música (esquina inferior derecha)
      ctx.textAlign = "center";
      if (!gameState.musicStarted) {
        const startRect = getMusicStartButtonRect(W, H);
        const clickAnim = gameState.musicButtonClickAnim.start ?? 0;
        const scaleFactor = 1 - clickAnim * 0.12;
        const centerX = startRect.x + startRect.w / 2;
        const centerY = startRect.y + startRect.h / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scaleFactor, scaleFactor);
        ctx.translate(-centerX, -centerY);

          ctx.beginPath();
          drawRoundedRect(ctx, startRect.x, startRect.y, startRect.w, startRect.h, 14);
          ctx.fillStyle = UI_COLORS.panelBg;
          ctx.fill();

          ctx.strokeStyle = UI_COLORS.panelBorder;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();

          ctx.save();
          ctx.textAlign = "center";
          ctx.fillStyle = textPrimary;
          ctx.font = "600 16px system-ui";
          ctx.fillText(t.startMusicButton, centerX, startRect.y + startRect.h / 2 + 2);

          ctx.font = "12px system-ui";
          ctx.fillStyle = textSecondary;
          ctx.fillText(t.shufflePlaylistReady, centerX, startRect.y + startRect.h - 10);
          ctx.restore();
      } else if (gameState.musicControlsVisible) {
        const panelRect = getMusicControlPanelRect(W, H);
        const panelRadius = 16;

        ctx.save();
          ctx.beginPath();
          drawRoundedRect(ctx, panelRect.x, panelRect.y, panelRect.w, panelRect.h, panelRadius);
          ctx.fillStyle = UI_COLORS.panelBg;
          ctx.fill();

          ctx.strokeStyle = UI_COLORS.panelBorder;
          ctx.lineWidth = 2;
          ctx.stroke();
        ctx.restore();

        const controlSize = 44;
        const controlGap = 12;
        const totalControlsWidth = controlSize * 3 + controlGap * 2;
        const controlStartX = panelRect.x + (panelRect.w - totalControlsWidth) / 2;
        const controlY = panelRect.y + 16;

        const rainbowColors = ["#2e86c1", "#5dbb63", "#ffc300", "#ff7a2a", "#8e44ad"];

        const controls: Array<{ key: "previous" | "pause" | "next"; icon: string; index: number }> = [
          { key: "previous", icon: "⏮", index: 0 },
          { key: "pause", icon: gameState.musicIsPlaying ? "⏸" : "▶", index: 1 },
          { key: "next", icon: "⏭", index: 2 },
        ];

        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "600 24px system-ui";

        controls.forEach((control) => {
          const btnX = controlStartX + control.index * (controlSize + controlGap);
          const btnY = controlY;
          const centerX = btnX + controlSize / 2;
          const centerY = btnY + controlSize / 2;
          const clickAnim = gameState.musicButtonClickAnim[control.key] ?? 0;
          const scaleFactor = 1 - clickAnim * 0.14;

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.scale(scaleFactor, scaleFactor);
          ctx.translate(-centerX, -centerY);

          const roundedRadius = 12;
          ctx.beginPath();
          drawRoundedRect(ctx, btnX, btnY, controlSize, controlSize, roundedRadius);

          if (clickAnim > 0) {
            const shift = ((gameState.time * 70 + control.index * 40) % controlSize) / controlSize;
            const gradient = ctx.createLinearGradient(
              btnX - shift * controlSize,
              btnY,
              btnX + controlSize - shift * controlSize,
              btnY,
            );
            rainbowColors.forEach((color, colorIndex) => {
              gradient.addColorStop(colorIndex / (rainbowColors.length - 1), color);
            });
            ctx.fillStyle = gradient;
          } else {
            ctx.fillStyle = "rgba(71, 85, 105, 0.98)";
          }

          ctx.fill();

          ctx.strokeStyle = "rgba(15, 23, 42, 0.55)";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = clickAnim > 0 ? "#0f172a" : "#e2e8f0";
          ctx.fillText(control.icon, btnX + controlSize / 2, btnY + controlSize / 2 + 7);

          ctx.restore();
        });

        ctx.restore();
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
      ctx.globalAlpha = CRT_SETTINGS.scanlineOpacity;
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
      ctx.shadowBlur = 40 * pulse * animProgress;
      ctx.fillStyle = "#ffc300";
      ctx.font = "bold 56px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(t.levelUp, 0, 0);

      // Segundo glow para más intensidad
      ctx.shadowBlur = 60 * pulse * animProgress;
      ctx.fillText(t.levelUp, 0, 0);
      ctx.shadowBlur = 0;

      ctx.restore();

      // Subtítulo con fade
      ctx.font = "28px system-ui";
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
        ctx.shadowBlur = 30;
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
        ctx.shadowBlur = 25 * pulse;
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
        ctx.font = "bold 14px system-ui";
        ctx.textAlign = "center";
        const typeLabel = option.type === "weapon" ? t.weapon : option.type === "tome" ? t.tome : t.item;
        const typeText = `${option.type === "weapon" ? "⚔️" : option.type === "tome" ? "📖" : "✨"} ${typeLabel}`;

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
        ctx.font = "bold 22px system-ui";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 4;
        let nameText = "";
        if (option.type === "weapon") {
          const weaponData = data as Weapon;
          const weaponName = getWeaponName(weaponData.id, currentLanguage);
          nameText = option.isLevelUp ? `${weaponName} ★${weaponData.level + 1}` : weaponName;
        } else if (option.type === "tome") {
          const tomeData = data as Tome;
          const tomeName = getTomeName(tomeData.id, currentLanguage);
          nameText = option.isLevelUp ? `${tomeName} ★${tomeData.level + 1}` : tomeName;
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
        ctx.font = "15px system-ui";

        const descriptionText = getUpgradeDescriptionText(option.descriptionKey, currentLanguage);

        if (option.type === "weapon") {
          const w = data as Weapon;
          if (option.isLevelUp && descriptionText) {
            // Wrap description text
            wrapText(ctx, descriptionText, x + cardW / 2, yOffset + 110, maxWidth, 20);
          } else {
            ctx.textAlign = "left";
            const statsX = x + 20;
            ctx.fillText(`💥 ${t.damage}: ${w.damage.toFixed(1)}`, statsX, yOffset + 110);
            ctx.fillText(`⚡ ${t.fireRate}: ${w.fireRate.toFixed(1)}/s`, statsX, yOffset + 135);
            ctx.fillText(`🎯 ${t.range}: ${w.range}`, statsX, yOffset + 160);
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
        ctx.font = "bold 13px system-ui";
        ctx.textAlign = "center";

        const rarityBadgeW = 120;
        const rarityBadgeH = 22;
        const rarityBadgeX = x + cardW / 2 - rarityBadgeW / 2;

        ctx.fillStyle = `${rarityColor}40`;
        ctx.fillRect(rarityBadgeX, rarityBadgeY - 16, rarityBadgeW, rarityBadgeH);

        ctx.fillStyle = rarityColor;
        ctx.fillText(`★ ${option.rarity.toUpperCase()} ★`, x + cardW / 2, rarityBadgeY);

        ctx.restore();
      }

      // Hint text
      ctx.globalAlpha = animProgress;
      ctx.fillStyle = "rgba(156, 163, 175, 0.6)";
      ctx.font = "16px system-ui";
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

      // ═══════════════════════════════════════════════════════════
      // EFECTOS AMBIENTALES - Renderizado
      // ═══════════════════════════════════════════════════════════

      // Renderizar WARNING zones de niebla (antes de aparecer)
      if (gameState.environmentalEvent === "fog" && gameState.fogWarningZones.length > 0) {
        for (const warning of gameState.fogWarningZones) {
          const warningPulse = Math.sin(gameState.time * 5) * 0.3 + 0.7;

          // Fondo rojo semitransparente
          ctx.fillStyle = `rgba(239, 68, 68, ${0.2 * warningPulse})`;
          ctx.fillRect(warning.x, warning.y, warning.width, warning.height);

          // Borde rojo pulsante
          ctx.strokeStyle = `rgba(239, 68, 68, ${warningPulse})`;
          ctx.lineWidth = 4;
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 20 * warningPulse;
          ctx.setLineDash([15, 15]);
          ctx.strokeRect(warning.x, warning.y, warning.width, warning.height);
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;

          // Texto de warning
          ctx.fillStyle = `rgba(239, 68, 68, ${warningPulse})`;
          ctx.font = "bold 32px system-ui";
          ctx.textAlign = "center";
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 15;
          ctx.fillText("⚠️ NIEBLA ENTRANTE", warning.x + warning.width / 2, warning.y + warning.height / 2);
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

        for (const zone of gameState.fogZones) {
          const pulse = Math.sin(gameState.time * 3) * 0.15 + 0.85;

          // Zona de niebla tóxica con intensidad
          ctx.fillStyle = `rgba(132, 204, 22, ${gameState.fogOpacity * 0.4 * intensity})`;
          ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

          // Borde de la zona
          ctx.strokeStyle = `rgba(132, 204, 22, ${pulse * intensity})`;
          ctx.lineWidth = 3;
          ctx.shadowColor = "#5dbb63";
          ctx.shadowBlur = 15 * pulse * intensity;
          ctx.setLineDash([10, 10]);
          ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;

          // Icono de niebla en el centro
          ctx.globalAlpha = intensity;
          ctx.fillStyle = `rgba(132, 204, 22, ${pulse})`;
          ctx.font = "bold 48px system-ui";
          ctx.textAlign = "center";
          ctx.shadowColor = "#5dbb63";
          ctx.shadowBlur = 20;
          ctx.fillText("🌫️", zone.x + zone.width / 2, zone.y + zone.height / 2 + 16);
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
        ctx.shadowBlur = 20 * pulse * intensity;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.arc(storm.x, storm.y, storm.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        // Icono de tormenta
        ctx.globalAlpha = intensity;
        ctx.fillStyle = `rgba(96, 165, 250, ${pulse})`;
        ctx.font = "bold 56px system-ui";
        ctx.textAlign = "center";
        ctx.shadowColor = "#2e86c1";
        ctx.shadowBlur = 25;
        ctx.fillText("⚡", storm.x, storm.y + 20);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      if (gameState.environmentalEvent) {
        switch (gameState.environmentalEvent) {
          case "rain":
            // ☢️ LLUVIA RADIACTIVA: No hay overlay global, solo partículas
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
          ctx.shadowBlur = 15 * dangerPulse;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.rad, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;

          // Icono de peligro
          ctx.fillStyle = "#ef4444";
          ctx.font = "bold 32px system-ui";
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 8;
          ctx.fillText("⚠️", h.x, h.y - 10);
          ctx.shadowBlur = 0;

          // Texto de advertencia
          ctx.fillStyle = "#fff";
          ctx.font = "bold 14px system-ui";
          ctx.fillText("DANGER ZONE", h.x, h.y + 25);

          // Timer de expiración
          if (!h.active) {
            const remaining = h.maxExpiration - h.expirationTimer;
            ctx.fillStyle = "#ffc300";
            ctx.font = "bold 16px system-ui";
            ctx.fillText(`${Math.ceil(remaining)}s`, h.x, h.y + 45);
          }
        } else if (h.isRadioactive) {
          // ☢️ ZONA RADIACTIVA (Lluvia Radiactiva)
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
          ctx.shadowBlur = 20 * radioPulse;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.rad, gameState.time * 2, gameState.time * 2 + Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;

          // Icono radiactivo
          ctx.fillStyle = "#8e44ad";
          ctx.font = "bold 28px system-ui";
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 8;
          ctx.fillText("☢️", h.x, h.y + 8);
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
            ctx.font = "bold 20px system-ui";
            ctx.textAlign = "center";
            ctx.fillText(`${Math.ceil(h.required - h.progress)}s`, h.x, h.y + 5);
          } else {
            // Mostrar tiempo de caducación
            const remaining = h.maxExpiration - h.expirationTimer;
            ctx.fillStyle = "#ef4444";
            ctx.font = "bold 18px system-ui";
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
          ctx.translate(d.x, d.y + bounce);

          const chestWidth = d.rad * 2.4;
          const chestHeight = d.rad * 1.6;
          const lidHeight = chestHeight * 0.45;

          ctx.shadowColor = d.color;
          ctx.shadowBlur = 20;

          ctx.fillStyle = "#7c2d12";
          ctx.fillRect(-chestWidth / 2, -chestHeight / 2 + lidHeight, chestWidth, chestHeight - lidHeight);

          ctx.fillStyle = d.color;
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

          ctx.shadowBlur = 0;
          ctx.shadowColor = "transparent";
          continue;
        }

        let alpha = 1;
        if (d.type === "xp" && d.lifetime !== undefined && d.lifetime < 3) {
          const blinkSpeed = d.lifetime < 1 ? 10 : 6;
          alpha = Math.abs(Math.sin(gameState.time * blinkSpeed)) * 0.7 + 0.3;
        }

        ctx.translate(d.x, d.y);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = d.color;
        ctx.shadowColor = d.color;

        if (d.type === "powerup") {
          const pulse = Math.sin(gameState.time * 5) * 10 + 20;
          ctx.shadowBlur = pulse;
          ctx.strokeStyle = d.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, d.rad + 5, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.shadowBlur = 10;
        }

        ctx.fill(getDiamondPath(d.rad));
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
        ctx.globalAlpha = 1;
      }
      ctx.setTransform(worldTransform);

      // Partículas
      if (!overlaySupportedRef.current) {
        for (const p of visibleParticles) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Enemigos
      for (const e of visibleEnemies) {
        // Determine which image to use based on enemy type and color
        let enemyImage: HTMLImageElement | null = null;

        if (e.specialType === "explosive" && gameState.bomberImg?.complete) {
          enemyImage = gameState.bomberImg;
        } else if (e.specialType === "fast" && gameState.runnerImg?.complete) {
          enemyImage = gameState.runnerImg;
        } else if (e.specialType === "tank" && gameState.shieldImg?.complete) {
          enemyImage = gameState.shieldImg;
        } else if (e.specialType === "summoner" && gameState.ghoulImg?.complete) {
          enemyImage = gameState.ghoulImg;
        } else if (e.isSummoned && gameState.ghoulImg?.complete) {
          enemyImage = gameState.ghoulImg;
        } else if (e.color === "#5dbb63" && gameState.greenZombieImg?.complete) {
          enemyImage = gameState.greenZombieImg;
        } else if ((e.color === "#9333ea" || e.color === "#8e44ad") && gameState.purpleZombieImg?.complete) {
          enemyImage = gameState.purpleZombieImg;
        } else if (e.color === "#78716c" && gameState.shieldImg?.complete) {
          enemyImage = gameState.shieldImg;
        }

        if (enemyImage) {
          const logoSize = e.rad * 3;
          ctx.drawImage(enemyImage, e.x - logoSize / 2, e.y - logoSize / 2, logoSize, logoSize);
        } else if (gameState.enemyLogo && gameState.enemyLogo.complete) {
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
          ctx.shadowBlur = 20 * pulse;
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
        const barH = e.isBoss ? 8 : e.isMiniBoss ? 6 : e.isElite ? 5 : 3;
        const barX = e.x - barW / 2;
        const barY = e.y - e.rad - (e.isBoss ? 35 : 10);

        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(barX, barY, barW, barH);

        const hpBarWidth = barW * Math.max(0, Math.min(1, e.hp / e.maxhp));
        ctx.fillStyle = e.isBoss ? "#dc2626" : e.isMiniBoss ? "#ffc300" : e.isElite ? "#ff3b3b" : "#5dbb63";
        ctx.fillRect(barX, barY, hpBarWidth, barH);

        if (e.isBoss) {
          const prevAlign = ctx.textAlign;
          const prevFill = ctx.fillStyle;
          ctx.fillStyle = "#fff";
          ctx.font = "bold 14px system-ui";
          ctx.textAlign = "center";
          ctx.fillText(`FASE ${e.phase}`, e.x, e.y + e.rad + 15);
          ctx.textAlign = prevAlign;
          ctx.fillStyle = prevFill;
        }
      }

      // Balas
      for (const b of gameState.bullets) {
        ctx.save();

        // Efectos visuales especiales
        let bulletSize = 3;
        let glowSize = 10;

        if (b.aoe) {
          bulletSize = 5;
          glowSize = 20;
        } else if (b.pierce) {
          bulletSize = 4;
          glowSize = 15;
        } else if (b.homing) {
          bulletSize = 4;
          glowSize = 12;
          // Trail para misiles teledirigidos
          ctx.strokeStyle = b.color + "40";
          ctx.lineWidth = 2;
          ctx.beginPath();
          const trailLength = 20;
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - Math.cos(b.dir) * trailLength, b.y - Math.sin(b.dir) * trailLength);
          ctx.stroke();
        } else if (b.chain) {
          // Efecto eléctrico
          glowSize = 15;
          ctx.shadowBlur = 20;
          ctx.shadowColor = "#2e86c1";
        } else if (b.fire) {
          // Efecto de fuego
          glowSize = 12;
          ctx.shadowColor = "#ff7a2a";
        } else if (b.freeze) {
          // Efecto de hielo
          glowSize = 12;
          ctx.shadowColor = "#2e86c1";
        }

        // Balas de enemigos (rojo)
        if (b.isEnemyBullet) {
          ctx.fillStyle = UI_COLORS.healthHigh;
          ctx.shadowColor = UI_COLORS.healthHigh;
          bulletSize = 4;
          glowSize = 15;
        } else {
          ctx.fillStyle = b.color;
          ctx.shadowColor = b.color;
        }

        // Crítico: partículas adicionales y glow
        if (b.isCrit) {
          glowSize *= 1.5;
          ctx.shadowBlur = glowSize * 2;
        } else {
          ctx.shadowBlur = glowSize;
        }

        ctx.beginPath();
        ctx.arc(b.x, b.y, bulletSize, 0, Math.PI * 2);
        ctx.fill();
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
        ctx.shadowBlur = 40;
        ctx.strokeStyle = playerAccent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(gameState.player.x, gameState.player.y, gameState.player.rad + 10, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = playerAccent;
      ctx.shadowColor = playerGlow;
      ctx.shadowBlur = isRage ? 32 : 20;
      ctx.beginPath();
      ctx.arc(gameState.player.x, gameState.player.y, gameState.player.rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Powerup indicators
      let indicatorY = gameState.player.y - gameState.player.rad - 30;
        if (gameState.player.tempMagnetTimer > 0) {
          ctx.fillStyle = "#5dbb63";
        ctx.font = "bold 12px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(`🧲 ${Math.ceil(gameState.player.tempMagnetTimer)}s`, gameState.player.x, indicatorY);
        indicatorY -= 15;
      }
      if (gameState.player.rageTimer > 0) {
        ctx.fillStyle = playerAccent;
        ctx.font = "bold 12px system-ui";
        ctx.fillText(`⚡ ${Math.ceil(gameState.player.rageTimer)}s`, gameState.player.x, indicatorY);
      }

      if (overlaySupportedRef.current && overlayWorkerRef.current) {
        const overlayParticles: OverlayParticle[] = gameState.showUpgradeUI
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

        const minimapPlayer: MinimapEntity | null = gameState.player
          ? {
              x: gameState.player.x,
              y: gameState.player.y,
              radius: gameState.player.rad,
              color: UI_COLORS.minimap,
            }
          : null;

        const minimapEnemies: MinimapEntity[] = visibleEnemies.map((enemy) => ({
          x: enemy.x,
          y: enemy.y,
          radius: enemy.rad,
          color: enemy.isBoss ? "#dc2626" : enemy.isMiniBoss ? "#ffc300" : enemy.color,
        }));

        const minimapDrops: MinimapEntity[] = visibleDrops.map((drop) => ({
          x: drop.x,
          y: drop.y,
          radius: drop.rad,
          color: drop.color,
        }));

        const minimapHotspots: MinimapEntity[] = visibleHotspots.map((hotspot) => ({
          x: hotspot.x,
          y: hotspot.y,
          radius: hotspot.rad,
          color: hotspot.isNegative ? "#ef4444" : hotspot.isRadioactive ? "#8e44ad" : "#ffc300",
        }));

        const minimapFrame: MinimapFrame = {
          worldWidth: gameState.worldWidth,
          worldHeight: gameState.worldHeight,
          player: minimapPlayer,
          enemies: minimapEnemies,
          drops: minimapDrops,
          hotspots: minimapHotspots,
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
      // Restart hold indicator
      if (gameState.restartTimer > 0) {
        const progress = Math.min(1, gameState.restartTimer / gameState.restartHoldTime);
        const centerX = W / 2;
        const centerY = H / 2;
        const radius = 60;

        // Background circle
        ctx.strokeStyle = "rgba(217, 217, 217, 0.25)";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Progress arc
        ctx.strokeStyle = UI_COLORS.healthHigh;
        ctx.lineWidth = 8;
        ctx.shadowColor = UI_COLORS.healthHigh;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Text
        ctx.fillStyle = textPrimary;
        ctx.font = "bold 24px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("R", centerX, centerY + 8);

        // Timer text - prevent negative numbers
        const remaining = Math.max(0, Math.ceil(gameState.restartHoldTime - gameState.restartTimer));
        ctx.font = "bold 18px system-ui";
        ctx.fillStyle = UI_COLORS.healthHigh;
        ctx.fillText(remaining === 0 ? "0s" : `${remaining}s`, centerX, centerY + 35);
      }

      drawHUD();
      drawUpgradeUI();

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
          ctx.font = "bold 48px system-ui";
          ctx.textAlign = "center";
          ctx.shadowColor = UI_COLORS.healthHigh;
          ctx.shadowBlur = 30 * pulse;
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
            ctx.font = "bold 56px system-ui";
            ctx.shadowColor = UI_COLORS.ammo;
            ctx.shadowBlur = 20 * pulse;
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
        ctx.shadowBlur = 30;
        ctx.strokeRect(menuX, menuY, menuW, menuH);
        ctx.shadowBlur = 0;

        // Título GAME OVER
        ctx.fillStyle = UI_COLORS.healthHigh;
        ctx.font = "bold 64px system-ui";
        ctx.textAlign = "center";
        ctx.shadowColor = UI_COLORS.healthHigh;
        ctx.shadowBlur = 20;
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

        ctx.font = "bold 28px system-ui";
        ctx.fillStyle = UI_COLORS.accent;
        ctx.textAlign = "left";
        ctx.fillText("📊 " + t.stats, leftCol, contentY);
        contentY += 60;

        ctx.font = "24px system-ui";
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

        // Wave
        ctx.fillStyle = textSecondary;
        ctx.textAlign = "left";
        ctx.fillText(t.finalWave + ":", leftCol, contentY);
        ctx.fillStyle = UI_COLORS.shield;
        ctx.textAlign = "right";
        ctx.fillText(gameState.wave.toString(), rightCol + 180, contentY);
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
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = textPrimary;
        ctx.font = "bold 32px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("🔄 " + t.playAgain, btnX + btnW / 2, btnY + btnH / 2 + 12);

        // Hint de teclas
        ctx.fillStyle = textSecondary;
        ctx.font = "18px system-ui";
        ctx.fillText("Presiona R o Enter para reiniciar", W / 2, menuY + menuH - 25);

        ctx.restore();
      }

      // Pause menu - Simplified unified design
      if (gameState.state === "paused" && !gameState.showUpgradeUI && gameState.countdownTimer <= 0) {
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
          return `${weight ? `${weight} ` : ""}${px}px system-ui`;
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
        ctx.shadowBlur = scaleValue(36);
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
        ctx.shadowBlur = scaleValue(15);
        ctx.fillText("⏸  " + t.paused.toUpperCase(), W / 2, headerY);
        ctx.shadowBlur = 0;

        // Quick stats grid
        const statsY = headerY + 60 * scale;
        if (!gameState.pauseMenuAudioOpen) {
          const totalSeconds = Math.floor(gameState.time);
          const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
          const seconds = String(totalSeconds % 60).padStart(2, "0");

          const stats = [
            { label: t.wave, value: `${gameState.wave}`, color: UI_COLORS.shield },
            { label: t.level, value: `${gameState.level}`, color: UI_COLORS.ammo },
            { label: "⏱️", value: `${minutes}:${seconds}`, color: UI_COLORS.xp },
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
          ctx.shadowBlur = scaleValue(16);
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
            ctx.shadowBlur = scaleValue(active ? 18 : 10);
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
        ctx.shadowBlur = scaleValue(15);
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
        ctx.shadowBlur = scaleValue(gameState.pauseMenuAudioOpen ? 18 : 12);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        ctx.fillStyle = textPrimary;
        ctx.font = getScaledFont(18, "600");
        ctx.fillText(
          `${gameState.pauseMenuAudioOpen ? "🎚️" : "🎧"}  ${t.pauseMenu.audio}`,
          W / 2,
          audioY + buttonH / 2 + scaleValue(6),
        );

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
        ctx.shadowBlur = scaleValue(12);
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
        ctx.fillText("🔄  " + t.restart, W / 2, restartY + buttonH / 2 + scaleValue(6));

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
        ctx.font = `bold ${120 * (1 + scale * 0.3)}px system-ui`;
        ctx.textAlign = "center";
        ctx.shadowColor = UI_COLORS.ammo;
        ctx.shadowBlur = 40;
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
      canvas.removeEventListener("mousemove", handlePointerMove);
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
    if (gameStateRef.current) {
      gameStateRef.current.language = language;
    }
  }, [language]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ cursor: "crosshair" }} />
      <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* TUTORIAL SIMPLIFICADO */}
      {gameStateRef.current?.tutorialActive && !tutorialCompleted && gameStateRef.current?.wave === 1 && (
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
