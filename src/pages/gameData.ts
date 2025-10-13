export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type Language = "es" | "en";

export interface Translations {
  levelUp: string;
  chooseUpgrade: string;
  weapon: string;
  tome: string;
  item: string;
  damage: string;
  fireRate: string;
  range: string;
  level: string;
  wave: string;
  difficulty: string;
  difficultyHint: string;
  difficultyEscalation: string;
  weapons: string;
  tomes: string;
  items: string;
  movement: string;
  restart: string;
  pause: string;
  sprint: string;
  autoShoot: string;
  gameOver: string;
  finalScore: string;
  finalLevel: string;
  finalDifficulty: string;
  playAgain: string;
  leaderboard: string;
  stats: string;
  continue: string;
  paused: string;
  levelShort: string;
  musicControls: {
    buttonLabel: string;
    menuTitle: string;
    play: string;
    pause: string;
    skip: string;
    nowPlaying: string;
    selectTrack: string;
  };
  clickToSelect: string;
  tutorial: {
    move: string;
  };
  pauseMenu: {
    home: string;
    settings: string;
    stats: string;
    overviewTitle: string;
    overviewSubtitle: string;
    tabSubtitles: {
      home: string;
      settings: string;
      stats: string;
    };
    summaryHeading: string;
    summaryDescription: string;
    quickActionsHeading: string;
    quickActionsHint: string;
    summary: {
      wave: string;
      level: string;
      score: string;
      time: string;
      kills: string;
    };
    audio: string;
    musicVolume: string;
    music: {
      label: string;
      on: string;
      off: string;
    };
    sfx: {
      label: string;
      on: string;
      off: string;
    };
    language: string;
    languages: Record<Language, string>;
    statsHighlights: string;
    statsDetails: {
      damageMultiplier: string;
      speedMultiplier: string;
      rangeMultiplier: string;
      fireRateMultiplier: string;
      bounces: string;
      multishot: string;
      vampire: string;
      regen: string;
      magnet: string;
      xpBonus: string;
      damageReduction: string;
    };
  };
  chestUI: {
    title: string;
    description: string;
    keep: string;
    banish: string;
    skip: string;
    interactHint: string;
  };
}

export interface WeaponLocalization {
  name: string;
}

export interface TomeLocalization {
  name: string;
}

export interface ItemLocalization {
  name: string;
  description: string;
}

export interface PlayerStats {
  damageMultiplier: number;
  speedMultiplier: number;
  rangeMultiplier: number;
  fireRateMultiplier: number;
  bounces: number;
  multishot: number;
  auraRadius: number;
  vampire: number;
  xpMultiplier: number;
  precision: number;
  regenRate: number;
  regenInterval: number;
  magnetMultiplier: number;
  cameraZoomMultiplier: number;
  bounceOnEnemies: boolean;
  damageReduction: number;
  powerupDuration: number;
  xpBonus: number;
  firstHitImmuneChargesUsed: number;
  chaosDamage: boolean;
  solarGauntletKills: number;
  bloodstoneKills: number;
  reactiveShieldActive: boolean;
  sprintEfficiencyMultiplier: number;
  sprintRecoveryMultiplier: number;
  adrenalineStacks: number;
  adrenalineSpeedBonus: number;
  adrenalineDamageBonus: number;
  adrenalineThreshold: number;
  droneAttackLevel: number;
  droneSupportLevel: number;
  droneShieldLevel: number;
}

export interface Weapon {
  id: string;
  damage: number;
  fireRate: number;
  range: number;
  projectileSpeed: number;
  rarity: Rarity;
  color: string;
  special?: string;
  level: number;
}

export interface Tome {
  id: string;
  effect: string;
  value: number;
  rarity: Rarity;
  color: string;
  level: number;
}

export interface Item {
  id: string;
  effect: string;
  rarity: Rarity;
  color: string;
  maxStacks?: number;
}

export interface Upgrade {
  type: "weapon" | "tome" | "item";
  data: Weapon | Tome | Item;
  rarity: Rarity;
  isLevelUp?: boolean;
  targetIndex?: number;
  upgradeType?: "damage" | "fireRate" | "range" | "special" | "effect";
  descriptionKey?: string;
}

const translationsES: Translations = {
  levelUp: "¡SUBISTE DE NIVEL!",
  chooseUpgrade: "Elige una mejora:",
  weapon: "ARMA",
  tome: "LIBRO",
  item: "ÍTEM",
  damage: "Daño",
  fireRate: "Cadencia",
  range: "Alcance",
  level: "Nivel",
  wave: "Wave",
  difficulty: "Dificultad",
  difficultyHint: "Aumenta de forma constante con el tiempo.",
  difficultyEscalation: "La amenaza escala con el paso de los minutos.",
  weapons: "Armas:",
  tomes: "Libros:",
  items: "Ítems:",
  movement: "WASD - Movimiento",
  restart: "R - Reiniciar",
  pause: "ESC - Pausa",
  sprint: "SPACE - Correr",
  autoShoot: "Disparo automático",
  gameOver: "GAME OVER",
  finalScore: "Puntuación",
  finalLevel: "Nivel alcanzado",
  finalDifficulty: "Dificultad alcanzada",
  playAgain: "Jugar de nuevo",
  leaderboard: "TOP 10",
  stats: "Estadísticas",
  continue: "Continuar",
  paused: "PAUSA",
  levelShort: "Nv.",
  musicControls: {
    buttonLabel: "Música",
    menuTitle: "Control de música",
    play: "Reproducir",
    pause: "Pausar",
    skip: "Saltar pista",
    nowPlaying: "Reproduciendo ahora",
    selectTrack: "Elegir pista",
  },
  clickToSelect: "Click para seleccionar",
  tutorial: {
    move: "Usa WASD para moverte",
  },
  pauseMenu: {
    home: "Inicio",
    settings: "Ajustes",
    stats: "Estadísticas",
    overviewTitle: "Partida en Pausa",
    overviewSubtitle: "Tómate un respiro y planifica tu próxima jugada.",
    tabSubtitles: {
      home: "Resumen instantáneo de la partida.",
      settings: "Configura todo sin salir de la acción.",
      stats: "Visualiza cómo escalan tus mejoras.",
    },
    summaryHeading: "Resumen de la partida",
    summaryDescription: "Datos clave de tu carrera actual.",
    quickActionsHeading: "Acciones rápidas",
    quickActionsHint: "Todo listo para volver al combate.",
    summary: {
      wave: "Oleada",
      level: "Nivel",
      score: "Puntuación",
      time: "Tiempo",
      kills: "Bajas",
    },
    audio: "Audio",
    musicVolume: "Volumen de la música",
    music: {
      label: "Música",
      on: "Activa",
      off: "Silenciada",
    },
    sfx: {
      label: "Efectos",
      on: "Activos",
      off: "Silenciados",
    },
    language: "Idioma",
    languages: {
      es: "Español",
      en: "Inglés",
    },
    statsHighlights: "Mejoras clave",
    statsDetails: {
      damageMultiplier: "Multiplicador de daño",
      speedMultiplier: "Multiplicador de velocidad",
      rangeMultiplier: "Multiplicador de alcance",
      fireRateMultiplier: "Multiplicador de cadencia",
      bounces: "Rebotes",
      multishot: "Proyectiles extra",
      vampire: "Vampirismo",
      regen: "Regeneración",
      magnet: "Magnetismo",
      xpBonus: "Bonus de XP",
      damageReduction: "Reducción de daño",
    },
  },
  chestUI: {
    title: "Cofre de botín",
    description: "Un cofre antiguo rebosa energía.",
    keep: "Conservar",
    banish: "Desterrar",
    skip: "Omitir",
    interactHint: "Pulsa {key} para abrir el cofre",
  },
};

const translationsEN: Translations = {
  levelUp: "LEVEL UP!",
  chooseUpgrade: "Choose an upgrade:",
  weapon: "WEAPON",
  tome: "BOOK",
  item: "ITEM",
  damage: "Damage",
  fireRate: "Fire Rate",
  range: "Range",
  level: "Level",
  wave: "Wave",
  difficulty: "Difficulty",
  difficultyHint: "Scales relentlessly over time.",
  difficultyEscalation: "Threat level continues to climb.",
  weapons: "Weapons:",
  tomes: "Books:",
  items: "Items:",
  movement: "WASD - Movement",
  restart: "R - Restart",
  pause: "ESC - Pause",
  sprint: "SPACE - Sprint",
  autoShoot: "Auto Shoot",
  gameOver: "GAME OVER",
  finalScore: "Score",
  finalLevel: "Level Reached",
  finalDifficulty: "Difficulty Reached",
  playAgain: "Play Again",
  leaderboard: "TOP 10",
  stats: "Stats",
  continue: "Continue",
  paused: "PAUSED",
  levelShort: "Lv.",
  musicControls: {
    buttonLabel: "Music",
    menuTitle: "Music controls",
    play: "Play",
    pause: "Pause",
    skip: "Skip track",
    nowPlaying: "Now playing",
    selectTrack: "Choose a track",
  },
  clickToSelect: "Click to select",
  tutorial: {
    move: "Use WASD to move",
  },
  pauseMenu: {
    home: "Home",
    settings: "Settings",
    stats: "Stats",
    overviewTitle: "Game Paused",
    overviewSubtitle: "Take a breather and plan your next move.",
    tabSubtitles: {
      home: "Snapshot of your current run.",
      settings: "Dial in the experience without missing a beat.",
      stats: "See how your upgrades are stacking up.",
    },
    summaryHeading: "Run overview",
    summaryDescription: "Key stats from this session.",
    quickActionsHeading: "Quick actions",
    quickActionsHint: "Ready when you are to jump back in.",
    summary: {
      wave: "Wave",
      level: "Level",
      score: "Score",
      time: "Time",
      kills: "Kills",
    },
    audio: "Audio",
    musicVolume: "Music volume",
    music: {
      label: "Music",
      on: "On",
      off: "Muted",
    },
    sfx: {
      label: "SFX",
      on: "On",
      off: "Muted",
    },
    language: "Language",
    languages: {
      es: "Spanish",
      en: "English",
    },
    statsHighlights: "Key boosts",
    statsDetails: {
      damageMultiplier: "Damage multiplier",
      speedMultiplier: "Speed multiplier",
      rangeMultiplier: "Range multiplier",
      fireRateMultiplier: "Fire rate multiplier",
      bounces: "Bounces",
      multishot: "Extra projectiles",
      vampire: "Vampirism",
      regen: "Regeneration",
      magnet: "Magnetism",
      xpBonus: "XP bonus",
      damageReduction: "Damage reduction",
    },
  },
  chestUI: {
    title: "Treasure Chest",
    description: "A radiant trove hums with power.",
    keep: "Keep",
    banish: "Banish",
    skip: "Skip",
    interactHint: "Press {key} to open the chest",
  },
};

export const translations: Record<Language, Translations> = {
  es: translationsES,
  en: translationsEN,
};

export const weaponTexts: Record<Language, Record<string, WeaponLocalization>> = {
  es: {
    pistol: { name: "Pistola" },
    shotgun: { name: "Escopeta" },
    smg: { name: "SMG" },
    rocket: { name: "Lanzacohetes" },
    laser: { name: "Láser" },
    railgun: { name: "Railgun" },
    minigun: { name: "Minigun" },
    flamethrower: { name: "Lanzallamas" },
    frostbow: { name: "Arco Congelante" },
    homing: { name: "Misil Teledirigido" },
  },
  en: {
    pistol: { name: "Pistol" },
    shotgun: { name: "Shotgun" },
    smg: { name: "SMG" },
    rocket: { name: "Rocket Launcher" },
    laser: { name: "Laser" },
    railgun: { name: "Railgun" },
    minigun: { name: "Minigun" },
    flamethrower: { name: "Flamethrower" },
    frostbow: { name: "Frost Bow" },
    homing: { name: "Homing Missile" },
  },
};

export const tomeTexts: Record<Language, Record<string, TomeLocalization>> = {
  es: {
    power: { name: "Libro de Poder" },
    speed: { name: "Libro de Velocidad" },
    bounce: { name: "Libro de Rebote" },
    range: { name: "Libro de Alcance" },
    precision: { name: "Libro de Precisión" },
    multi: { name: "Libro Múltiple" },
    regen: { name: "Libro de Regeneración" },
    magnet: { name: "Libro de Magnetismo" },
    fire: { name: "Libro de Cadencia" },
  },
  en: {
    power: { name: "Power Book" },
    speed: { name: "Speed Book" },
    bounce: { name: "Bounce Book" },
    range: { name: "Range Book" },
    precision: { name: "Precision Book" },
    multi: { name: "Multishot Book" },
    regen: { name: "Regeneration Book" },
    magnet: { name: "Magnetism Book" },
    fire: { name: "Fire Rate Book" },
  },
};

const RARITY_COLOR_MAP: Record<Rarity, string> = {
  common: "#6e6e6e",
  uncommon: "#5dbb63",
  rare: "#2e86c1",
  epic: "#8e44ad",
  legendary: "#ffc300",
};

type ItemDefinition = Omit<Item, "color"> & {
  color?: string;
  translations: Record<Language, ItemLocalization>;
};

const COMMON_ITEMS: ItemDefinition[] = [
  {
    id: "streetboots",
    effect: "stat-mult:speedMultiplier:1.04",
    rarity: "common",
    translations: {
      es: { name: "Botas Callejeras", description: "+4% velocidad" },
      en: { name: "Street Boots", description: "+4% speed" },
    },
  },
  {
    id: "urbantrackers",
    effect: "stat-mult:speedMultiplier:1.04",
    rarity: "common",
    translations: {
      es: { name: "Rastreadores Urbanos", description: "+4% velocidad" },
      en: { name: "Urban Trackers", description: "+4% speed" },
    },
  },
  {
    id: "overclockedgloves",
    effect: "stat-mult:fireRateMultiplier:1.04",
    rarity: "common",
    translations: {
      es: { name: "Guantes Sobreacelerados", description: "+4% cadencia" },
      en: { name: "Overclocked Gloves", description: "+4% fire rate" },
    },
  },
  {
    id: "triggerkit",
    effect: "stat-mult:fireRateMultiplier:1.04",
    rarity: "common",
    translations: {
      es: { name: "Kit de Gatillo", description: "+4% cadencia" },
      en: { name: "Trigger Kit", description: "+4% fire rate" },
    },
  },
  {
    id: "lightmeshvest",
    effect: "maxhp-flat:10",
    rarity: "common",
    translations: {
      es: { name: "Chaleco de Malla Ligera", description: "+10 HP máximo" },
      en: { name: "Light Mesh Vest", description: "+10 max HP" },
    },
  },
  {
    id: "medpatch",
    effect: "maxhp-flat:12",
    rarity: "common",
    translations: {
      es: { name: "Parche Médico", description: "+12 HP máximo" },
      en: { name: "Medical Patch", description: "+12 max HP" },
    },
  },
  {
    id: "signalbeacon",
    effect: "stat-mult:magnetMultiplier:1.08",
    rarity: "common",
    translations: {
      es: { name: "Baliza de Señal", description: "+8% magnetismo" },
      en: { name: "Signal Beacon", description: "+8% magnetism" },
    },
  },
  {
    id: "supplysatchel",
    effect: "stat-mult:magnetMultiplier:1.08",
    rarity: "common",
    translations: {
      es: { name: "Morral de Suministros", description: "+8% magnetismo" },
      en: { name: "Supply Satchel", description: "+8% magnetism" },
    },
  },
  {
    id: "trainingband",
    effect: "stat-add:xpBonus:4",
    rarity: "common",
    translations: {
      es: { name: "Pulsera de Entrenamiento", description: "+4 XP por baja" },
      en: { name: "Training Band", description: "+4 XP per kill" },
    },
  },
  {
    id: "fieldnotes",
    effect: "stat-add:xpBonus:5",
    rarity: "common",
    translations: {
      es: { name: "Notas de Campo", description: "+5 XP por baja" },
      en: { name: "Field Notes", description: "+5 XP per kill" },
    },
  },
  {
    id: "focusvisor",
    effect: "stat-add:precision:6",
    rarity: "common",
    translations: {
      es: { name: "Visor de Enfoque", description: "+6 precisión" },
      en: { name: "Focus Visor", description: "+6 accuracy" },
    },
  },
  {
    id: "stabilitybrace",
    effect: "stat-add:precision:6",
    rarity: "common",
    translations: {
      es: { name: "Férula Estabilizadora", description: "+6 precisión" },
      en: { name: "Stability Brace", description: "+6 accuracy" },
    },
  },
  {
    id: "shockabsorbers",
    effect: "sprint-efficiency:0.95",
    rarity: "common",
    translations: {
      es: { name: "Amortiguadores", description: "-5% consumo de stamina al sprintar" },
      en: { name: "Shock Absorbers", description: "-5% sprint stamina cost" },
    },
  },
  {
    id: "hydrationkit",
    effect: "sprint-recovery:1.1",
    rarity: "common",
    translations: {
      es: { name: "Kit de Hidratación", description: "+10% recuperación de stamina" },
      en: { name: "Hydration Kit", description: "+10% stamina recovery" },
    },
  },
  {
    id: "auxbattery",
    effect: "stamina-max:5",
    rarity: "common",
    translations: {
      es: { name: "Batería Auxiliar", description: "+5 stamina máxima" },
      en: { name: "Aux Battery", description: "+5 max stamina" },
    },
  },
  {
    id: "chronocharms",
    effect: "stat-mult:powerupDuration:1.05",
    rarity: "common",
    translations: {
      es: { name: "Amuletos Crono", description: "+5% duración de powerups" },
      en: { name: "Chrono Charms", description: "+5% power-up duration" },
    },
  },
  {
    id: "visorcalibration",
    effect: "stat-mult:rangeMultiplier:1.05",
    rarity: "common",
    translations: {
      es: { name: "Calibración de Visor", description: "+5% alcance" },
      en: { name: "Visor Calibration", description: "+5% range" },
    },
  },
  {
    id: "carbonedge",
    effect: "stat-mult:damageMultiplier:1.04",
    rarity: "common",
    translations: {
      es: { name: "Filo de Carbono", description: "+4% daño" },
      en: { name: "Carbon Edge", description: "+4% damage" },
    },
  },
  {
    id: "fieldstabilizers",
    effect: "stat-add:damageReduction:0.03",
    rarity: "common",
    translations: {
      es: { name: "Estabilizadores de Campo", description: "-3% daño recibido" },
      en: { name: "Field Stabilizers", description: "-3% damage taken" },
    },
  },
  {
    id: "simchip",
    effect: "stat-mult:xpMultiplier:1.08",
    rarity: "common",
    translations: {
      es: { name: "Chip Simulador", description: "+8% XP global" },
      en: { name: "Sim Chip", description: "+8% global XP" },
    },
  },
];

const UNCOMMON_ITEMS: ItemDefinition[] = [
  {
    id: "kineticboots",
    effect: "stat-mult:speedMultiplier:1.08",
    rarity: "uncommon",
    translations: {
      es: { name: "Botas Cinéticas", description: "+8% velocidad" },
      en: { name: "Kinetic Boots", description: "+8% speed" },
    },
  },
  {
    id: "tempestboots",
    effect: "stat-mult:speedMultiplier:1.08",
    rarity: "uncommon",
    translations: {
      es: { name: "Botas Tempestad", description: "+8% velocidad" },
      en: { name: "Tempest Boots", description: "+8% speed" },
    },
  },
  {
    id: "rapidgloves",
    effect: "stat-mult:fireRateMultiplier:1.08",
    rarity: "uncommon",
    translations: {
      es: { name: "Guantes Ráfaga", description: "+8% cadencia" },
      en: { name: "Rapid Gloves", description: "+8% fire rate" },
    },
  },
  {
    id: "cyclerig",
    effect: "stat-mult:fireRateMultiplier:1.08",
    rarity: "uncommon",
    translations: {
      es: { name: "Arnés Cíclico", description: "+8% cadencia" },
      en: { name: "Cycle Rig", description: "+8% fire rate" },
    },
  },
  {
    id: "guardianvest",
    effect: "maxhp-percent:0.1",
    rarity: "uncommon",
    translations: {
      es: { name: "Chaleco Guardián", description: "+10% HP máximo" },
      en: { name: "Guardian Vest", description: "+10% max HP" },
    },
  },
  {
    id: "platedweave",
    effect: "maxhp-flat:20",
    rarity: "uncommon",
    translations: {
      es: { name: "Tejido Placado", description: "+20 HP máximo" },
      en: { name: "Plated Weave", description: "+20 max HP" },
    },
  },
  {
    id: "fluxbeacon",
    effect: "stat-mult:magnetMultiplier:1.15",
    rarity: "uncommon",
    translations: {
      es: { name: "Baliza de Flujo", description: "+15% magnetismo" },
      en: { name: "Flux Beacon", description: "+15% magnetism" },
    },
  },
  {
    id: "pulsecollector",
    effect: "stat-mult:magnetMultiplier:1.15",
    rarity: "uncommon",
    translations: {
      es: { name: "Colector de Pulsos", description: "+15% magnetismo" },
      en: { name: "Pulse Collector", description: "+15% magnetism" },
    },
  },
  {
    id: "mentorpatch",
    effect: "stat-add:xpBonus:8",
    rarity: "uncommon",
    translations: {
      es: { name: "Parche Mentor", description: "+8 XP por baja" },
      en: { name: "Mentor Patch", description: "+8 XP per kill" },
    },
  },
  {
    id: "simulatorchip",
    effect: "stat-mult:xpMultiplier:1.15",
    rarity: "uncommon",
    translations: {
      es: { name: "Chip de Simulación", description: "+15% XP global" },
      en: { name: "Simulator Chip", description: "+15% global XP" },
    },
  },
  {
    id: "focusmatrix",
    effect: "stat-add:precision:12",
    rarity: "uncommon",
    translations: {
      es: { name: "Matriz de Enfoque", description: "+12 precisión" },
      en: { name: "Focus Matrix", description: "+12 accuracy" },
    },
  },
  {
    id: "reboundmod",
    effect: "stat-add:bounces:1",
    rarity: "uncommon",
    translations: {
      es: { name: "Módulo de Rebote", description: "+1 rebote" },
      en: { name: "Rebound Mod", description: "+1 bounce" },
    },
  },
  {
    id: "splitcartridge",
    effect: "stat-add:multishot:1",
    rarity: "uncommon",
    translations: {
      es: { name: "Cartucho Dividido", description: "+1 proyectil adicional" },
      en: { name: "Split Cartridge", description: "+1 extra projectile" },
    },
  },
  {
    id: "stasisbrace",
    effect: "stat-mult:rangeMultiplier:1.1",
    rarity: "uncommon",
    translations: {
      es: { name: "Férula de Estasis", description: "+10% alcance" },
      en: { name: "Stasis Brace", description: "+10% range" },
    },
  },
  {
    id: "stabilizerbar",
    effect: "stat-mult:damageMultiplier:1.08",
    rarity: "uncommon",
    translations: {
      es: { name: "Barra Estabilizadora", description: "+8% daño" },
      en: { name: "Stabilizer Bar", description: "+8% damage" },
    },
  },
  {
    id: "tacticalvisor",
    effect: "stat-add:damageReduction:0.05",
    rarity: "uncommon",
    translations: {
      es: { name: "Visor Táctico", description: "-5% daño recibido" },
      en: { name: "Tactical Visor", description: "-5% damage taken" },
    },
  },
  {
    id: "endurancebooster",
    effect: "stamina-max:10",
    rarity: "uncommon",
    translations: {
      es: { name: "Impulsor de Resistencia", description: "+10 stamina máxima" },
      en: { name: "Endurance Booster", description: "+10 max stamina" },
    },
  },
  {
    id: "lungmod",
    effect: "sprint-efficiency:0.85",
    rarity: "uncommon",
    translations: {
      es: { name: "Mod Pulmonar", description: "-15% consumo de stamina al sprintar" },
      en: { name: "Lung Mod", description: "-15% sprint stamina cost" },
    },
  },
  {
    id: "rehydrationpack",
    effect: "sprint-recovery:1.25",
    rarity: "uncommon",
    translations: {
      es: { name: "Paquete de Rehidratación", description: "+25% recuperación de stamina" },
      en: { name: "Rehydration Pack", description: "+25% stamina recovery" },
    },
  },
  {
    id: "chronoaccelerator",
    effect: "stat-mult:powerupDuration:1.1",
    rarity: "uncommon",
    translations: {
      es: { name: "Acelerador Crono", description: "+10% duración de powerups" },
      en: { name: "Chrono Accelerator", description: "+10% power-up duration" },
    },
  },
];

const RARE_ITEMS: ItemDefinition[] = [
  {
    id: "combatglasses",
    effect: "stat-add:precision:15",
    rarity: "rare",
    translations: {
      es: { name: "Gafas de Combate", description: "+15 precisión" },
      en: { name: "Combat Glasses", description: "+15 accuracy" },
    },
  },
  {
    id: "reinforcedpants",
    effect: "stat-add:damageReduction:0.07",
    rarity: "rare",
    translations: {
      es: { name: "Pantalones Reforzados", description: "-7% daño recibido" },
      en: { name: "Reinforced Pants", description: "-7% damage taken" },
    },
  },
  {
    id: "bouncegloves",
    effect: "stat-add:bounces:1",
    rarity: "rare",
    translations: {
      es: { name: "Guantes de Rebote", description: "+1 rebote" },
      en: { name: "Bounce Gloves", description: "+1 bounce" },
    },
  },
  {
    id: "energyclock",
    effect: "stat-mult:fireRateMultiplier:1.12",
    rarity: "rare",
    translations: {
      es: { name: "Reloj de Energía", description: "+12% cadencia" },
      en: { name: "Energy Clock", description: "+12% fire rate" },
    },
  },
  {
    id: "ballistichelmet",
    effect: "firsthitimmune",
    rarity: "rare",
    maxStacks: 1,
    translations: {
      es: { name: "Casco Balístico", description: "Bloquea el primer golpe de cada oleada" },
      en: { name: "Ballistic Helmet", description: "Blocks the first hit each wave" },
    },
  },
  {
    id: "heavyvest",
    effect: "heavyarmor",
    rarity: "rare",
    translations: {
      es: { name: "Chaleco Pesado", description: "-10% velocidad, +25% reducción de daño" },
      en: { name: "Heavy Vest", description: "-10% speed, +25% damage reduction" },
    },
  },
  {
    id: "plasmafragment",
    effect: "plasmafrag",
    rarity: "rare",
    translations: {
      es: { name: "Fragmento de Plasma", description: "+1 rebote y +15% alcance" },
      en: { name: "Plasma Fragment", description: "+1 bounce and +15% range" },
    },
  },
  {
    id: "adrenalineinjector",
    effect: "adrenaline:0.08:0.12:0.45",
    rarity: "rare",
    translations: {
      es: { name: "Inyector de Adrenalina", description: "+8% velocidad y +12% daño bajo 45% HP" },
      en: { name: "Adrenaline Injector", description: "+8% speed and +12% damage under 45% HP" },
    },
  },
  {
    id: "stimsynth",
    effect: "adrenaline:0.05:0.08:0.5",
    rarity: "rare",
    translations: {
      es: { name: "Sintetizador de Estímulos", description: "+5% velocidad y +8% daño bajo 50% HP" },
      en: { name: "Stim Synth", description: "+5% speed and +8% damage under 50% HP" },
    },
  },
  {
    id: "nanodrones",
    effect: "drone:attack:1",
    rarity: "rare",
    translations: {
      es: { name: "Nanodrones", description: "Despliega un dron atacante" },
      en: { name: "Nano Drones", description: "Deploys an attacking drone" },
    },
  },
  {
    id: "shieldedcore",
    effect: "stat-add:damageReduction:0.08",
    rarity: "rare",
    translations: {
      es: { name: "Núcleo Blindado", description: "-8% daño recibido" },
      en: { name: "Shielded Core", description: "-8% damage taken" },
    },
  },
  {
    id: "hyperlens",
    effect: "stat-mult:rangeMultiplier:1.15",
    rarity: "rare",
    translations: {
      es: { name: "Hiper Lente", description: "+15% alcance" },
      en: { name: "Hyper Lens", description: "+15% range" },
    },
  },
  {
    id: "thrusterpack",
    effect: "sprint-efficiency:0.75",
    rarity: "rare",
    translations: {
      es: { name: "Mochila Impulsora", description: "-25% consumo de stamina al sprintar" },
      en: { name: "Thruster Pack", description: "-25% sprint stamina cost" },
    },
  },
  {
    id: "xpamplifier",
    effect: "stat-mult:xpMultiplier:1.2",
    rarity: "rare",
    translations: {
      es: { name: "Amplificador de XP", description: "+20% XP global" },
      en: { name: "XP Amplifier", description: "+20% global XP" },
    },
  },
  {
    id: "magnetarray",
    effect: "stat-mult:magnetMultiplier:1.25",
    rarity: "rare",
    translations: {
      es: { name: "Matriz Magnética", description: "+25% magnetismo" },
      en: { name: "Magnet Array", description: "+25% magnetism" },
    },
  },
];

const EPIC_ITEMS: ItemDefinition[] = [
  {
    id: "jetboots",
    effect: "jetspeed",
    rarity: "epic",
    translations: {
      es: { name: "Botas Jet", description: "+15% velocidad base" },
      en: { name: "Jet Boots", description: "+15% base speed" },
    },
  },
  {
    id: "reactiveshield",
    effect: "reactiveshield",
    rarity: "epic",
    translations: {
      es: { name: "Escudo Reactivo", description: "Activa un pulso defensivo" },
      en: { name: "Reactive Shield", description: "Activates a defensive pulse" },
    },
  },
  {
    id: "horizonscanner",
    effect: "horizonscanner",
    rarity: "epic",
    maxStacks: 2,
    translations: {
      es: {
        name: "Escáner Horizonte",
        description: "Nv1: -30% zoom, Nv2: minimapa activado",
      },
      en: {
        name: "Horizon Scanner",
        description: "Lvl1: -30% zoom, Lvl2: minimap enabled",
      },
    },
  },
  {
    id: "chaosamuleto",
    effect: "chaosdamage",
    rarity: "epic",
    translations: {
      es: { name: "Amuleto del Caos", description: "Daño fluctuante +10% a +50%" },
      en: { name: "Chaos Amulet", description: "Damage fluctuates +10% to +50%" },
    },
  },
  {
    id: "ironmedal",
    effect: "maxhp15",
    rarity: "epic",
    translations: {
      es: { name: "Medalla de Hierro", description: "+15% HP máximo" },
      en: { name: "Iron Medal", description: "+15% max HP" },
    },
  },
  {
    id: "commandnode",
    effect: "drone:attack:2",
    rarity: "epic",
    translations: {
      es: { name: "Nodo de Comando", description: "Convoca drones ofensivos avanzados" },
      en: { name: "Command Node", description: "Deploys advanced attack drones" },
    },
  },
  {
    id: "supportgrid",
    effect: "drone:support:1",
    rarity: "epic",
    translations: {
      es: { name: "Red de Soporte", description: "Dron médico que repara al escuadrón" },
      en: { name: "Support Grid", description: "Support drone that patches the squad" },
    },
  },
  {
    id: "shieldarray",
    effect: "drone:shield:1",
    rarity: "epic",
    translations: {
      es: { name: "Matriz de Escudos", description: "Dron que regenera cargas defensivas" },
      en: { name: "Shield Array", description: "Drone that restores shield charges" },
    },
  },
  {
    id: "infernalengine",
    effect: "infernalengine",
    rarity: "epic",
    translations: {
      es: { name: "Motor Infernal", description: "+25% velocidad, +20% daño, +10% daño recibido" },
      en: {
        name: "Infernal Engine",
        description: "+25% speed, +20% damage, +10% damage taken",
      },
    },
  },
  {
    id: "artificialheart",
    effect: "artificialheart",
    rarity: "epic",
    translations: {
      es: { name: "Corazón Artificial", description: "+50 HP permanente" },
      en: { name: "Artificial Heart", description: "+50 permanent HP" },
    },
  },
];

const LEGENDARY_ITEMS: ItemDefinition[] = [
  {
    id: "voidcore",
    effect: "doublexp",
    rarity: "legendary",
    translations: {
      es: { name: "Núcleo del Vacío", description: "Duplica toda la XP obtenida" },
      en: { name: "Void Core", description: "Doubles all XP gained" },
    },
  },
  {
    id: "solargauntlet",
    effect: "solargauntlet",
    rarity: "legendary",
    translations: {
      es: { name: "Guantelete Solar", description: "Lanza un proyectil cada 10 bajas" },
      en: { name: "Solar Gauntlet", description: "Fires a projectile every 10 kills" },
    },
  },
  {
    id: "bloodstone",
    effect: "bloodstone",
    rarity: "legendary",
    translations: {
      es: { name: "Piedra de Sangre", description: "Recupera 5 HP cada 30 bajas" },
      en: { name: "Blood Stone", description: "Restore 5 HP every 30 kills" },
    },
  },
  {
    id: "hordetotem",
    effect: "hordetotem",
    rarity: "legendary",
    translations: {
      es: { name: "Tótem de la Horda", description: "+1 enemigo generado y +2 XP por baja" },
      en: { name: "Horde Totem", description: "+1 spawn enemy and +2 XP per kill" },
    },
  },
  {
    id: "infinitylens",
    effect: "infinitylens",
    rarity: "legendary",
    translations: {
      es: { name: "Lente del Infinito", description: "+10% a todos los multiplicadores" },
      en: { name: "Infinity Lens", description: "+10% to all multipliers" },
    },
  },
];

const ITEM_DEFINITIONS: ItemDefinition[] = [
  ...COMMON_ITEMS,
  ...UNCOMMON_ITEMS,
  ...RARE_ITEMS,
  ...EPIC_ITEMS,
  ...LEGENDARY_ITEMS,
];

export const ITEMS: Item[] = ITEM_DEFINITIONS.map(({ translations, color, ...item }) => ({
  ...item,
  color: color ?? RARITY_COLOR_MAP[item.rarity],
}));

const itemTextMap: Record<Language, Record<string, ItemLocalization>> = {
  es: {},
  en: {},
};

for (const definition of ITEM_DEFINITIONS) {
  itemTextMap.es[definition.id] = definition.translations.es;
  itemTextMap.en[definition.id] = definition.translations.en;
}

itemTextMap.es.horizonvisor = {
  name: "Visor Horizonte",
  description: "Reduce el zoom y prepara el minimapa",
};
itemTextMap.en.horizonvisor = {
  name: "Horizon Visor",
  description: "Zooms out and readies the minimap",
};

export const itemTexts = itemTextMap;

export const upgradeDescriptionTexts: Record<Language, Record<string, string>> = {
  es: {
    "weapon.damage": "+30% Daño",
    "weapon.fireRate": "+25% Cadencia",
    "weapon.range": "+20% Alcance",
    "weapon.spread": "+1 Pellet adicional",
    "weapon.aoe": "+50% Radio de explosión",
    "weapon.pierce": "+2 Perforaciones",
    "tome.damage.effect": "+20% Daño",
    "tome.damage.special": "+15% Daño crítico",
    "tome.speed.effect": "+15% Velocidad",
    "tome.speed.special": "+10% Esquiva",
    "tome.range.effect": "+20% Alcance",
    "tome.range.special": "+15% Velocidad de proyectil",
    "tome.fireRate.effect": "+20% Cadencia",
    "tome.fireRate.special": "Recarga instantánea ocasional",
    "tome.bounce.effect": "+1 Rebote",
    "tome.bounce.special": "Rebotes explosivos",
    "tome.multishot.effect": "+1 Proyectil",
    "tome.multishot.special": "Patrón circular",
    "tome.magnet.effect": "+15% radio imán",
    "tome.magnet.special": "Atrae powerups lejanos",
    "tome.regen.effect": "Duplica velocidad de regen",
    "tome.regen.special": "Escudo temporal al regenerar",
    "tome.precision.effect": "+15% Precisión",
    "tome.precision.special": "+20% Chance crítico",
    "tome.xp.effect": "+25% XP",
    "tome.xp.special": "Doble XP de jefes",
  },
  en: {
    "weapon.damage": "+30% Damage",
    "weapon.fireRate": "+25% Fire rate",
    "weapon.range": "+20% Range",
    "weapon.spread": "+1 Additional pellet",
    "weapon.aoe": "+50% Explosion radius",
    "weapon.pierce": "+2 Pierces",
    "tome.damage.effect": "+20% Damage",
    "tome.damage.special": "+15% Critical damage",
    "tome.speed.effect": "+15% Speed",
    "tome.speed.special": "+10% Dodge chance",
    "tome.range.effect": "+20% Range",
    "tome.range.special": "+15% Projectile speed",
    "tome.fireRate.effect": "+20% Fire rate",
    "tome.fireRate.special": "Occasional instant reload",
    "tome.bounce.effect": "+1 Bounce",
    "tome.bounce.special": "Explosive bounces",
    "tome.multishot.effect": "+1 Projectile",
    "tome.multishot.special": "Circular pattern",
    "tome.magnet.effect": "+15% Magnet radius",
    "tome.magnet.special": "Pulls distant power-ups",
    "tome.regen.effect": "Doubles regen speed",
    "tome.regen.special": "Temporary shield on regen",
    "tome.precision.effect": "+15% Accuracy",
    "tome.precision.special": "+20% Critical chance",
    "tome.xp.effect": "+25% XP",
    "tome.xp.special": "Double boss XP",
  },
};

export const getUpgradeDescriptionText = (
  key: string | undefined,
  language: Language,
): string | undefined => {
  if (!key) return undefined;
  return upgradeDescriptionTexts[language][key] ?? upgradeDescriptionTexts.en[key];
};

export type TomeDescriptionTemplate = {
  damage: (value: number) => string;
  speed: (value: number) => string;
  bounce: (value: number) => string;
  range: (value: number) => string;
  precision: (value: number) => string;
  multishot: (value: number) => string;
  regen: (params: { rate: number; interval: number }) => string;
  magnet: (value: number) => string;
  fire: (value: number) => string;
};

export const tomeDescriptionTemplates: Record<Language, TomeDescriptionTemplate> = {
  es: {
    damage: (value) => `+${value}% Daño`,
    speed: (value) => `+${value}% Velocidad`,
    bounce: (value) => `${value} Rebotes (Enemigos)`,
    range: (value) => `+${value}% Alcance`,
    precision: (value) => `+${value}% Precisión`,
    multishot: (value) => `+${value} Proyectiles`,
    regen: ({ rate, interval }) => `Regenera ${rate} HP cada ${interval}s`,
    magnet: (value) => `+${value}% Rango imán`,
    fire: (value) => `+${value}% Cadencia`,
  },
  en: {
    damage: (value) => `+${value}% Damage`,
    speed: (value) => `+${value}% Speed`,
    bounce: (value) => `${value} Bounces (Enemies)`,
    range: (value) => `+${value}% Range`,
    precision: (value) => `+${value}% Accuracy`,
    multishot: (value) => `+${value} Projectiles`,
    regen: ({ rate, interval }) => `Regenerates ${rate} HP every ${interval}s`,
    magnet: (value) => `+${value}% Magnet range`,
    fire: (value) => `+${value}% Fire rate`,
  },
};

const getWeaponId = (weapon: Weapon | string): string =>
  typeof weapon === "string" ? weapon : weapon.id;

const getTomeId = (tome: Tome | string): string => (typeof tome === "string" ? tome : tome.id);

const getItemId = (item: Item | string): string => (typeof item === "string" ? item : item.id);

export const getWeaponName = (weapon: Weapon | string, language: Language): string => {
  const id = getWeaponId(weapon);
  const localized = weaponTexts[language][id] ?? weaponTexts.en[id];
  return localized ? localized.name : id;
};

export const getTomeName = (tome: Tome | string, language: Language): string => {
  const id = getTomeId(tome);
  const localized = tomeTexts[language][id] ?? tomeTexts.en[id];
  return localized ? localized.name : id;
};

export const getItemText = (item: Item | string, language: Language): ItemLocalization => {
  const id = getItemId(item);
  const localized = itemTexts[language][id] ?? itemTexts.en[id];
  if (localized) {
    return localized;
  }
  return { name: id, description: "" };
};

export const getTomeDescription = (
  tome: Tome,
  language: Language,
  stats?: PlayerStats,
): string => {
  const fallbackTemplates = tomeDescriptionTemplates.en;
  const templates = tomeDescriptionTemplates[language] ?? fallbackTemplates;

  switch (tome.effect) {
    case "damage": {
      const bonus = Math.round(tome.level * 10);
      return (templates?.damage ?? fallbackTemplates.damage)(bonus);
    }
    case "speed": {
      const bonus = Math.round(Math.min(tome.level, 5) * 5);
      return (templates?.speed ?? fallbackTemplates.speed)(bonus);
    }
    case "bounce": {
      const bonus = Math.max(1, Math.round(tome.level));
      return (templates?.bounce ?? fallbackTemplates.bounce)(bonus);
    }
    case "range": {
      const bonus = Math.round(tome.level * 15);
      return (templates?.range ?? fallbackTemplates.range)(bonus);
    }
    case "precision": {
      const bonus = Math.round(tome.level * 10);
      return (templates?.precision ?? fallbackTemplates.precision)(bonus);
    }
    case "multishot": {
      const bonus = Math.max(1, Math.round(tome.level));
      return (templates?.multishot ?? fallbackTemplates.multishot)(bonus);
    }
    case "regen": {
      const rate = Math.round(2 + tome.level * 2);
      const interval = Math.max(1, 5 - tome.level);
      return (templates?.regen ?? fallbackTemplates.regen)({ rate, interval });
    }
    case "magnet": {
      const bonus = Math.round(tome.level * 20);
      return (templates?.magnet ?? fallbackTemplates.magnet)(bonus);
    }
    case "fireRate": {
      const bonus = Math.round(tome.level * 12);
      return (templates?.fire ?? fallbackTemplates.fire)(bonus);
    }
    default: {
      if (!stats) return tome.effect;

      const { auraRadius, vampire, regenRate, regenInterval } = stats;
      if (tome.effect === "aura" && auraRadius) {
        return `${Math.round(auraRadius)} Aura`;
      }
      if (tome.effect === "vampire" && vampire) {
        return `${vampire}% Lifesteal`;
      }
      if (tome.effect === "regen" && regenRate && regenInterval) {
        return `${regenRate} HP / ${regenInterval}s`;
      }
      return tome.effect;
    }
  }
};

export const HORIZON_VISOR_ITEM: Item = {
  id: "horizonvisor",
  effect: "horizonvisor",
  rarity: "epic",
  color: RARITY_COLOR_MAP.epic,
  maxStacks: 1,
};

export const rarityColors: Record<Rarity, string> = RARITY_COLOR_MAP;
