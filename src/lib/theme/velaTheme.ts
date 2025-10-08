export type VelaTheme = typeof velaTheme;

type HSL = `${number} ${number}% ${number}%`;

type SliderConfig = {
  type: "slider";
  key: string;
  min: number;
  max: number;
  step: number;
};

type ToggleConfig = {
  type: "toggle";
  key: string;
};

type SelectConfig = {
  type: "select";
  key: string;
  options: string[];
};

type SettingsControl = SliderConfig | ToggleConfig | SelectConfig;

type SettingsSection = {
  label: string;
  controls: SettingsControl[];
};

export const velaTheme = {
  project: "Vela Digital — Zombie Shooter (Roguelike)",
  goal: "UI/UX premium con identidad Vela Digital; lectura clara, moderna y llena de juice.",
  brand: {
    palette: {
      hole: "0 0% 0%" as HSL,
      vela: "0 0% 93%" as HSL,
      sapphire: "253 100% 50%" as HSL,
      pixel: "138 100% 41%" as HSL,
      royal: "266 100% 50%" as HSL,
      neutrals: {
        n950: "0 0% 4%" as HSL,
        n900: "0 0% 7%" as HSL,
        n850: "216 10% 10%" as HSL,
        n800: "214 12% 12%" as HSL,
        n700: "218 14% 16%" as HSL,
        n600: "220 16% 22%" as HSL,
        n500: "222 16% 28%" as HSL,
        n400: "220 9% 46%" as HSL,
      },
      rarities: {
        common: "211 13% 65%" as HSL,
        uncommon: "138 100% 41%" as HSL,
        rare: "209 100% 61%" as HSL,
        epic: "276 100% 65%" as HSL,
        legendary: "45 100% 70%" as HSL,
      },
      damage: {
        playerHit: "0 100% 62%" as HSL,
        heal: "166 72% 49%" as HSL,
        shield: "45 100% 70%" as HSL,
        xp: "245 100% 68%" as HSL,
      },
    },
    typography: {
      family: "Neulis Sans",
      weights: [300, 400, 500, 700] as const,
      scale: {
        display: 48,
        h1: 36,
        h2: 28,
        h3: 22,
        body: 16,
        small: 13,
        mono: 14,
      },
      tracking: {
        display: 0,
        titles: 0,
        ui: 0.2,
      },
    },
    logo: {
      gridAngle: 35,
      minClearSpaceX: 0.25,
      minSizePx: 64,
      onDark: "use full-color gradient",
      onLight: "use dark monochrome",
    },
  },
  visualTheme: {
    base: "Neon Tech Futurist",
    background: {
      type: "gradient+grain",
      dark: {
        from: "0 0% 4%" as HSL,
        to: "231 28% 10%" as HSL,
        grainOpacity: 0.08,
      },
      animatedGradient: {
        colors: ["253 100% 50%", "266 100% 50%", "138 100% 41%"] as HSL[],
        durationSec: 18,
        easing: "ease-in-out",
      },
    },
    cards: {
      radius: 16,
      bevelInset: 2,
      border: {
        color: "0 0% 0%" as HSL,
        width: 2,
      },
      glow: {
        color: "266 100% 50%" as HSL,
        opacity: 0.35,
        spread: 8,
      },
    },
    effects: {
      bloom: { intensity: 0.16, threshold: 0.8 },
      vignette: { intensity: 0.22 },
      chromaticAberration: { enabled: true, strength: 0.02 },
      scanlines: { enabled: true, opacity: 0.06, density: 2 },
      motionBlur: { enabled: false },
    },
  },
  layout: {
    grid: { columns: 12, gutter: 16, margin: 24 },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    breakpoints: { xs: 360, sm: 640, md: 960, lg: 1280, xl: 1600 },
    safeAreas: { topHUD: 56, bottomHUD: 56 },
  },
  icons: {
    style: "solid-rounded",
    stroke: 2,
    sizes: { sm: 16, md: 20, lg: 28, xl: 36 },
  },
  components: {
    buttons: {
      radius: 14,
      padding: { x: 16, y: 10 },
      fontWeight: 700,
      variants: {
        primary: { bg: "253 100% 50%" as HSL, text: "0 0% 93%" as HSL, glow: "266 100% 50%" as HSL },
        secondary: { bg: "214 12% 12%" as HSL, text: "0 0% 93%" as HSL, stroke: "218 14% 16%" as HSL, glow: "253 100% 50%" as HSL },
        danger: { bg: "0 100% 62%" as HSL, text: "0 0% 0%" as HSL, glow: "0 100% 62%" as HSL },
        ghost: { bg: "transparent", text: "0 0% 93%" as HSL, stroke: "220 16% 22%" as HSL },
      },
      states: {
        hover: { elevate: 2, scale: 1.01, glowBoost: 0.25 },
        active: { elevate: 0, scale: 0.98 },
        focus: { ring: { color: "138 100% 41%" as HSL, width: 2 } },
        disabled: { opacity: 0.45 },
      },
    },
    toggles: {
      track: { off: "218 14% 16%" as HSL, on: "138 100% 41%" as HSL },
      thumb: { color: "0 0% 93%" as HSL, shadow: 6 },
      radius: 16,
      animationMs: 160,
    },
    sliders: {
      trackColor: "220 16% 22%" as HSL,
      fillColor: "266 100% 50%" as HSL,
      thumbColor: "0 0% 93%" as HSL,
      thumbSize: 16,
      showValue: true,
    },
    tabs: {
      activeColor: "0 0% 93%" as HSL,
      inactiveColor: "211 13% 65%" as HSL,
      indicator: { color: "253 100% 50%" as HSL, height: 3, radius: 3 },
    },
    tooltips: {
      bg: "0 0% 4%" as HSL,
      text: "0 0% 93%" as HSL,
      border: "253 100% 50%" as HSL,
      radius: 10,
      elevation: 8,
    },
    modals: {
      backdrop: "rgba(0,0,0,0.55)",
      panel: { bg: "231 28% 10%" as HSL, radius: 18, border: "0 0% 0%" as HSL },
      transitionMs: 220,
    },
    lists: {
      rowHeight: 44,
      divider: "218 14% 16%" as HSL,
      selectedBg: "214 12% 12%" as HSL,
    },
    badges: {
      radius: 10,
      sizes: { sm: 14, md: 18, lg: 22 },
      rarityColors: "@brand.palette.rarities",
    },
  },
  navigation: {
    structure: [
      "boot",
      "start_menu",
      "tutorial",
      "gameplay.running",
      "gameplay.paused",
      "gameplay.gameover",
      "results",
    ],
    focus: { gamepadSupport: true, focusRing: "138 100% 41%" as HSL, wrapAround: true },
    transitions: {
      screen: { type: "crossfade+blur", durationMs: 220 },
      panel: { type: "slide-up", durationMs: 180 },
    },
  },
  screens: {
    startMenu: {
      background: "animatedNeon",
      logoPlacement: "centerTop",
      primaryActions: ["Iniciar", "Continuar", "Wiki", "Ajustes", "Créditos"],
      ctaStyle: "buttons.primary",
      footer: { hint: "Presiona Start/Enter" },
    },
    pause: {
      tabs: ["Settings", "Wiki", "Créditos"],
      countdownResume: { enabled: true, sequence: [3, 2, 1], beep: "ui.beep" },
    },
    settings: {
      sections: {
        gráficos: [
          { type: "toggle", key: "vsync" },
          { type: "slider", key: "fpsLimit", min: 30, max: 240, step: 10 },
          { type: "slider", key: "bloom", min: 0, max: 1, step: 0.01 },
          { type: "slider", key: "vignette", min: 0, max: 1, step: 0.01 },
          { type: "toggle", key: "chromaticAberration" },
          { type: "select", key: "fxQuality", options: ["Low", "Medium", "High"] },
        ] as SettingsControl[],
        audio: [
          { type: "slider", key: "master", min: 0, max: 1, step: 0.01 },
          { type: "slider", key: "music", min: 0, max: 1, step: 0.01 },
          { type: "slider", key: "sfx", min: 0, max: 1, step: 0.01 },
          { type: "toggle", key: "dynamicMusic" },
        ] as SettingsControl[],
        gameplay: [
          { type: "select", key: "aimMode", options: ["Nearest", "Weakest", "Smart"] },
          { type: "slider", key: "cameraShake", min: 0, max: 1, step: 0.01 },
          { type: "slider", key: "autoPickupRange", min: 0.5, max: 4, step: 0.1 },
        ] as SettingsControl[],
        accesibilidad: [
          { type: "toggle", key: "reduceFlashes" },
          { type: "select", key: "colorBlind", options: ["None", "Deuter", "Protan", "Tritan"] },
          { type: "slider", key: "uiScale", min: 0.7, max: 1.3, step: 0.05 },
          { type: "toggle", key: "highContrastOutlines" },
        ] as SettingsControl[],
      },
      applyRevert: { confirmOnExit: true, showToast: true },
    },
    wiki: {
      sections: ["Upgrades", "Ítems", "Enemigos", "Armas", "Rarezas"],
      cards: "components.cards",
      unlockRule: "show when discovered",
    },
    shop: {
      gridColumns: 3,
      cardLayout: {
        showIcon: true,
        showRarityFrame: true,
        statPreview: true,
        priceTag: { bg: "214 12% 12%" as HSL, text: "0 0% 93%" as HSL },
      },
      reroll: { costBase: 20, costScale: 1.25, buttonStyle: "buttons.secondary" },
    },
    levelUp: {
      title: "Elige 1 de 3",
      choices: 3,
      animation: { type: "burst+slowGlow", durationMs: 800 },
      rarityFrames: "@brand.palette.rarities",
    },
    results: {
      stats: ["wave", "kills", "dps", "time", "creditsEarned"],
      shareButton: true,
    },
  },
  hud: {
    hpBar: {
      position: "topLeft",
      size: { w: 220, h: 14 },
      fillGradient: ["138 100% 41%", "266 100% 50%"] as HSL[],
      border: "0 0% 0%" as HSL,
      text: { showValue: true, color: "0 0% 93%" as HSL },
    },
    xpBar: {
      position: "topCenter",
      size: { w: 420, h: 10 },
      fill: "245 100% 68%" as HSL,
      levelUpPulse: true,
    },
    waveAndScore: {
      position: "topRight",
      style: "capsule",
      textColor: "0 0% 93%" as HSL,
    },
    weaponPanel: { position: "bottomLeft", showAmmo: true, icons: true },
    dropNotifications: {
      floatUp: true,
      colorsByRarity: "@brand.palette.rarities",
      durationMs: 900,
    },
    objectiveMarker: { enabled: true, color: "45 100% 70%" as HSL },
  },
  gameJuice: {
    muzzles: { durationMs: 70, sizePx: 18, color: "45 100% 70%" as HSL, bloomBoost: 0.2 },
    trails: { length: 22, thickness: 2, color: "0 0% 93%" as HSL },
    hitFlash: { enemyTint: "0 0% 100%", durationMs: 60 },
    screenShake: {
      small: { amp: 2, freq: 22, durMs: 100 },
      medium: { amp: 4, freq: 18, durMs: 160 },
      big: { amp: 7, freq: 14, durMs: 220 },
    },
    pickupPulse: { scale: 1.12, durMs: 240 },
    levelUpBurst: {
      particles: 36,
      colors: ["253 100% 50%", "266 100% 50%", "138 100% 41%"] as HSL[],
      ringGlow: true,
    },
  },
  postFX: {
    profiles: {
      low: { bloom: 0.08, vignette: 0.12, grain: 0.03, ca: 0 },
      medium: { bloom: 0.16, vignette: 0.22, grain: 0.06, ca: 0.02 },
      high: { bloom: 0.22, vignette: 0.28, grain: 0.08, ca: 0.03 },
    },
  },
  audio: {
    mix: { master: 0.85, music: 0.65, sfx: 0.9 },
    ui: { beep: "sine-600hz-60ms", confirm: "saw-220hz-120ms", error: "noise-100ms" },
    music: {
      layers: [
        { name: "base", intensity: 0 },
        { name: "combat", intensity: 1 },
        { name: "highThreat", intensity: 2 },
      ],
      crossfadeMs: 500,
    },
  },
  accessibility: {
    minContrastAA: true,
    reduceFlashes: true,
    colorBlindModes: ["None", "Deuter", "Protan", "Tritan"],
    uiScale: { min: 0.7, max: 1.3, step: 0.05 },
    inputRemap: true,
    aimAssist: { enabled: true, strength: 0.35 },
  },
  performance: {
    targets: { pc: { minFps: 60, targetFps: 120 } },
    budgets: {
      maxEnemiesOnScreen: 220,
      particlePerFrame: 900,
      decalsOnScreen: 60,
      lights2D: 64,
    },
    pooling: ["projectiles", "enemies", "fx"],
    culling: { gridSize: 64, disableOffscreenFX: true },
  },
  statesAndMicrocopy: {
    toasts: {
      saved: "Ajustes guardados",
      requiresRestart: "Algunos cambios requieren reiniciar",
      levelUp: "¡Nivel +1!",
      newLegendary: "¡Objeto legendario!",
    },
    confirmations: {
      applyGraphics: "¿Aplicar los cambios de gráficos?",
      quitRun: "¿Seguro que quieres abandonar esta partida?",
    },
    emptyStates: {
      wiki: "Descubre ítems y enemigos para llenar la wiki.",
      unlocks: "Completa objetivos para reclamar desbloqueos.",
    },
  },
  dropsAndRarities: {
    frameStyles: {
      common: { stroke: "220 16% 22%" as HSL },
      uncommon: { glow: "138 100% 41%" as HSL },
      rare: { glow: "209 100% 61%" as HSL },
      epic: { glow: "276 100% 65%" as HSL },
      legendary: { glow: "45 100% 70%" as HSL, sparkle: true },
    },
    floatText: { fontWeight: 700, riseMs: 900, fadeMs: 900 },
  },
  themings: {
    dark: { bg: "@visualTheme.background.dark", text: "0 0% 93%" as HSL, components: {} },
    light: {
      bg: "0 0% 93%" as HSL,
      text: "0 0% 0%" as HSL,
      components: { "cards.bg": "0 0% 100%" },
    },
  },
  testingAcceptance: {
    visual: [
      "Todos los botones tienen estados hover/active/focus/disabled",
      "Contraste de texto AA o superior",
      "Transiciones consistentes 200–300 ms",
    ],
    hud: [
      "HP/XP/Wave/Score visibles en 16:9 y 21:9",
      "Level-up muestra 3 opciones con rareza y comparativa",
    ],
    settings: [
      "Apply/Revert funciona y muestra confirmación",
      "UI Scale 70–130% no rompe layout",
      "Color-blind presets cambian iconografía y barras correctamente",
    ],
    performance: [
      "200+ enemigos en pantalla con 60 FPS mínimos",
      "Cap de partículas respeta presupuesto",
    ],
  },
  assets: {
    uiAtlas: { padding: 2, maxSize: 4096, format: "PNG-8/WEBP" },
    fonts: { primary: "Neulis Sans", embedWoff2: true },
    iconSet: "SVG + fallback PNG",
    audio: { format: "OGG", musicLoopPoints: true },
  },
  devNotes: {
    implementation: [
      "Crear theme tokens en un solo archivo (CSS vars/ScriptableObjects)",
      "Centralizar componentes UI en librería interna",
      "Soportar gamepad (focus visible y navegación por tabs)",
      "Guardar ajustes en local/persistent profile",
    ],
    niceToHave: [
      "Minimapa con iconos de XP/drops/boss",
      "Transiciones de cámara al abrir tienda/level-up",
    ],
  },
} as const;

export const settingsSections: SettingsSection[] = Object.entries(velaTheme.screens.settings.sections).map(
  ([label, controls]) => ({
    label,
    controls: controls as SettingsControl[],
  }),
);

export type SettingsValueMap = Record<string, number | boolean | string>;

export const defaultSettings: SettingsValueMap = {
  vsync: true,
  fpsLimit: 120,
  bloom: velaTheme.visualTheme.effects.bloom.intensity,
  vignette: velaTheme.visualTheme.effects.vignette.intensity,
  chromaticAberration: velaTheme.visualTheme.effects.chromaticAberration.enabled,
  fxQuality: "High",
  master: 0.85,
  music: 0.65,
  sfx: 0.9,
  dynamicMusic: true,
  aimMode: "Smart",
  cameraShake: 0.5,
  autoPickupRange: 1.5,
  reduceFlashes: true,
  colorBlind: "None",
  uiScale: 1,
  highContrastOutlines: false,
};

export const rarityOrder = ["common", "uncommon", "rare", "epic", "legendary"] as const;
