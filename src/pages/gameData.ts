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
  bossEvent: {
    prePortalTimerLabel: string;
    portalReady: string;
    activatePrompt: string;
    activateHold: string;
    activating: string;
    spawnWarning: string;
    objective: string;
    bossName: string;
    exitPortalReady: string;
    exitPrompt: string;
    stayNotice: string;
    timerLabel: string;
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
  icon: string;
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
  difficultyHint: "",
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
  bossEvent: {
    prePortalTimerLabel: "Inestabilidad dimensional",
    portalReady: "¡Un portal dimensional ha aparecido!",
    activatePrompt: "Mantén {key} para activar el portal",
    activateHold: "Mantén presionado para canalizar la energía",
    activating: "Activando portal...",
    spawnWarning: "¡El jefe está cruzando la grieta!",
    objective: "Derrota al jefe para abrir el portal",
    bossName: "Avatar del Vacío",
    exitPortalReady: "El portal brilla: decide tu destino.",
    exitPrompt: "Mantén {key} para cruzar el portal",
    stayNotice: "Quédate fuera para desafiar la ascensión y ganar mejores recompensas.",
    timerLabel: "Supervivencia Post-Jefe",
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
  difficultyHint: "",
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
  bossEvent: {
    prePortalTimerLabel: "Dimensional instability",
    portalReady: "An ominous portal tears open!",
    activatePrompt: "Hold {key} to activate the portal",
    activateHold: "Keep holding to channel energy",
    activating: "Stabilising portal...",
    spawnWarning: "The boss is forcing its way through!",
    objective: "Defeat the boss to reopen the portal",
    bossName: "Void Herald",
    exitPortalReady: "The portal hums open—choose your fate.",
    exitPrompt: "Hold {key} to step through",
    stayNotice: "Stay outside to push your luck and chase a new high score.",
    timerLabel: "Post-Boss Survival",
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

type WeaponDefinition = Omit<Weapon, "color"> & { color?: string };

const WEAPON_DEFINITIONS: WeaponDefinition[] = [
  {
    id: "pistol",
    damage: 15,
    fireRate: 1.2,
    range: 500,
    projectileSpeed: 750,
    rarity: "common",
    level: 1,
    icon: "/images/icons/weapon_pistol.svg",
  },
  {
    id: "shotgun",
    damage: 40,
    fireRate: 0.8,
    range: 320,
    projectileSpeed: 500,
    rarity: "common",
    special: "spread",
    level: 1,
    icon: "/images/icons/weapon_shotgun.svg",
  },
  {
    id: "smg",
    damage: 12,
    fireRate: 1.8,
    range: 420,
    projectileSpeed: 700,
    rarity: "uncommon",
    level: 1,
    icon: "/images/icons/weapon_smg.svg",
  },
  {
    id: "rocket",
    damage: 120,
    fireRate: 0.6,
    range: 520,
    projectileSpeed: 600,
    rarity: "rare",
    special: "aoe",
    level: 1,
    icon: "/images/icons/weapon_rocket.svg",
  },
  {
    id: "laser",
    damage: 28,
    fireRate: 1,
    range: 650,
    projectileSpeed: 900,
    rarity: "rare",
    special: "pierce",
    level: 1,
    icon: "/images/icons/weapon_laser.svg",
  },
  {
    id: "railgun",
    damage: 160,
    fireRate: 0.45,
    range: 700,
    projectileSpeed: 1000,
    rarity: "epic",
    special: "pierce",
    level: 1,
    icon: "/images/icons/weapon_railgun.svg",
  },
  {
    id: "minigun",
    damage: 18,
    fireRate: 2.2,
    range: 480,
    projectileSpeed: 750,
    rarity: "epic",
    level: 1,
    icon: "/images/icons/weapon_minigun.svg",
  },
  {
    id: "flamethrower",
    damage: 22,
    fireRate: 1.6,
    range: 280,
    projectileSpeed: 400,
    rarity: "rare",
    special: "aoe",
    level: 1,
    icon: "/images/icons/weapon_flamethrower.svg",
  },
  {
    id: "frostbow",
    damage: 30,
    fireRate: 1,
    range: 600,
    projectileSpeed: 650,
    rarity: "uncommon",
    level: 1,
    icon: "/images/icons/weapon_frostbow.svg",
  },
  {
    id: "homing",
    damage: 55,
    fireRate: 1,
    range: 540,
    projectileSpeed: 550,
    rarity: "rare",
    level: 1,
    icon: "/images/icons/weapon_homing.svg",
  },
];

export const WEAPONS: Weapon[] = WEAPON_DEFINITIONS.map(({ color, ...weapon }) => ({
  ...weapon,
  color: color ?? RARITY_COLOR_MAP[weapon.rarity],
}));

type TomeDefinition = Omit<Tome, "color"> & { color?: string };

const TOME_DEFINITIONS: TomeDefinition[] = [
  {
    id: "power",
    effect: "damage",
    value: 1.25,
    rarity: "rare",
    level: 1,
  },
  {
    id: "speed",
    effect: "speed",
    value: 1.15,
    rarity: "uncommon",
    level: 1,
  },
  {
    id: "bounce",
    effect: "bounce",
    value: 1,
    rarity: "epic",
    level: 1,
  },
  {
    id: "range",
    effect: "range",
    value: 1.25,
    rarity: "uncommon",
    level: 1,
  },
  {
    id: "precision",
    effect: "precision",
    value: 0,
    rarity: "rare",
    level: 1,
  },
  {
    id: "multi",
    effect: "multishot",
    value: 1,
    rarity: "legendary",
    level: 1,
  },
  {
    id: "regen",
    effect: "regen",
    value: 0,
    rarity: "rare",
    level: 1,
  },
  {
    id: "magnet",
    effect: "magnet",
    value: 1.2,
    rarity: "uncommon",
    level: 1,
  },
  {
    id: "fire",
    effect: "fireRate",
    value: 1.2,
    rarity: "rare",
    level: 1,
  },
];

export const TOMES: Tome[] = TOME_DEFINITIONS.map(({ color, ...tome }) => ({
  ...tome,
  color: color ?? RARITY_COLOR_MAP[tome.rarity],
}));

type ItemDefinition = Omit<Item, "color"> & {
  color?: string;
  translations: Record<Language, ItemLocalization>;
};

const COMMON_ITEMS: ItemDefinition[] = [
  {
    id: "adrenalineShot",
    effect: "adrenalineShot",
    rarity: "common",
    translations: {
      es: {
        name: "Inyección de Adrenalina",
        description: "Obtén 10% de velocidad de ataque por 5 segundos tras matar a un enemigo.",
      },
      en: {
        name: "Adrenaline Shot",
        description: "Gain 10% attack speed for 5s after killing an enemy.",
      },
    },
  },
  {
    id: "kevlarVest",
    effect: "kevlarVest",
    rarity: "common",
    translations: {
      es: {
        name: "Chaleco de Kevlar",
        description: "Reduce el daño recibido en 5%.",
      },
      en: {
        name: "Kevlar Vest",
        description: "Reduces incoming damage by 5%.",
      },
    },
  },
  {
    id: "combatBoots",
    effect: "combatBoots",
    rarity: "common",
    translations: {
      es: {
        name: "Botas de Combate",
        description: "Aumenta la velocidad de movimiento en 7%.",
      },
      en: {
        name: "Combat Boots",
        description: "Increases movement speed by 7%.",
      },
    },
  },
  {
    id: "morphineInjector",
    effect: "morphineInjector",
    rarity: "common",
    translations: {
      es: {
        name: "Inyector de Morfina",
        description: "Restaura 5 HP cada 10 segundos fuera de combate.",
      },
      en: {
        name: "Morphine Injector",
        description: "Restores 5 HP every 10 seconds outside combat.",
      },
    },
  },
  {
    id: "tacticalGloves",
    effect: "tacticalGloves",
    rarity: "common",
    translations: {
      es: {
        name: "Guantes Tácticos",
        description: "Aumenta la velocidad de recarga en 15%.",
      },
      en: {
        name: "Tactical Gloves",
        description: "Reload speed increased by 15%.",
      },
    },
  },
  {
    id: "fieldManualFragment",
    effect: "fieldManualFragment",
    rarity: "common",
    translations: {
      es: {
        name: "Fragmento de Manual de Campo",
        description: "Obtén 5% más de experiencia al eliminar enemigos.",
      },
      en: {
        name: "Field Manual Fragment",
        description: "Gain 5% more experience from kills.",
      },
    },
  },
  {
    id: "rustyCompass",
    effect: "rustyCompass",
    rarity: "common",
    translations: {
      es: {
        name: "Brújula Oxidada",
        description: "Expande ligeramente el rango del minimapa.",
      },
      en: {
        name: "Rusty Compass",
        description: "Expands minimap range slightly.",
      },
    },
  },
  {
    id: "caffeinePills",
    effect: "caffeinePills",
    rarity: "common",
    translations: {
      es: {
        name: "Píldoras de Cafeína",
        description: "Incrementa la cadencia de fuego en 5%.",
      },
      en: {
        name: "Caffeine Pills",
        description: "Fire rate increased by 5%.",
      },
    },
  },
  {
    id: "stunGrenadeShard",
    effect: "stunGrenadeShard",
    rarity: "common",
    translations: {
      es: {
        name: "Fragmento de Granada Aturdidora",
        description: "10% de probabilidad de aturdir al golpear.",
      },
      en: {
        name: "Stun Grenade Shard",
        description: "10% chance to stun enemies on hit.",
      },
    },
  },
  {
    id: "luckyCigarStub",
    effect: "luckyCigarStub",
    rarity: "common",
    translations: {
      es: {
        name: "Colilla Afortunada",
        description: "2% de probabilidad de sobrevivir con 1 HP al recibir daño letal.",
      },
      en: {
        name: "Lucky Cigar Stub",
        description: "2% chance to survive lethal damage with 1 HP.",
      },
    },
  },
  {
    id: "dogTagOfValor",
    effect: "dogTagOfValor",
    rarity: "common",
    translations: {
      es: {
        name: "Placa del Valor",
        description: "+5% de daño cuando tu HP está por debajo del 50%.",
      },
      en: {
        name: "Dog Tag of Valor",
        description: "+5% damage when below 50% HP.",
      },
    },
  },
  {
    id: "firstAidTape",
    effect: "firstAidTape",
    rarity: "common",
    translations: {
      es: {
        name: "Cinta de Primeros Auxilios",
        description: "Las curaciones son 10% más efectivas.",
      },
      en: {
        name: "First Aid Tape",
        description: "Healing items are 10% more effective.",
      },
    },
  },
  {
    id: "brokenDogTags",
    effect: "brokenDogTags",
    rarity: "common",
    translations: {
      es: {
        name: "Placas Rotas",
        description: "Aumenta ligeramente la probabilidad de obtener loot.",
      },
      en: {
        name: "Broken Dog Tags",
        description: "Slightly increases loot drop chance.",
      },
    },
  },
  {
    id: "improvisedScope",
    effect: "improvisedScope",
    rarity: "common",
    translations: {
      es: {
        name: "Mira Improvisada",
        description: "Incrementa la precisión en 5%.",
      },
      en: {
        name: "Improvised Scope",
        description: "Increases accuracy by 5%.",
      },
    },
  },
  {
    id: "tornPatch",
    effect: "tornPatch",
    rarity: "common",
    translations: {
      es: {
        name: "Parche Roto",
        description: "Regenera 1 HP por segundo mientras estás quieto.",
      },
      en: {
        name: "Torn Patch",
        description: "Regenerates 1 HP per second while stationary.",
      },
    },
  },
  {
    id: "leadBulletCharm",
    effect: "leadBulletCharm",
    rarity: "common",
    translations: {
      es: {
        name: "Amuleto de Bala de Plomo",
        description: "Aumenta el daño crítico en 10%.",
      },
      en: {
        name: "Lead Bullet Charm",
        description: "Critical hit damage increased by 10%.",
      },
    },
  },
  {
    id: "combatRation",
    effect: "combatRation",
    rarity: "common",
    translations: {
      es: {
        name: "Ración de Combate",
        description: "Restaura 15 HP al completar una oleada.",
      },
      en: {
        name: "Combat Ration",
        description: "Restores 15 HP after clearing a wave.",
      },
    },
  },
  {
    id: "oldRadio",
    effect: "oldRadio",
    rarity: "common",
    translations: {
      es: {
        name: "Radio Vieja",
        description: "Detecta enemigos ocultos cercanos.",
      },
      en: {
        name: "Old Radio",
        description: "Detects hidden enemies nearby.",
      },
    },
  },
  {
    id: "bootKnifeHolster",
    effect: "bootKnifeHolster",
    rarity: "common",
    translations: {
      es: {
        name: "Funda de Bota",
        description: "Cambia de arma un 5% más rápido.",
      },
      en: {
        name: "Boot Knife Holster",
        description: "5% faster weapon swap speed.",
      },
    },
  },
  {
    id: "fieldBattery",
    effect: "fieldBattery",
    rarity: "common",
    translations: {
      es: {
        name: "Batería de Campo",
        description: "Regenera una pequeña cantidad de energía con el tiempo.",
      },
      en: {
        name: "Field Battery",
        description: "Small passive energy regeneration.",
      },
    },
  },
];

const UNCOMMON_ITEMS: ItemDefinition[] = [
  {
    id: "reinforcedExosuit",
    effect: "reinforcedExosuit",
    rarity: "uncommon",
    translations: {
      es: {
        name: "Exotraje Reforzado",
        description: "Reduce el retroceso y otorga +5 de armadura.",
      },
      en: {
        name: "Reinforced Exosuit",
        description: "Reduces knockback and grants +5 armor.",
      },
    },
  },
  {
    id: "medDroneChip",
    effect: "medDroneChip",
    rarity: "uncommon",
    translations: {
      es: {
        name: "Chip de Dron Médico",
        description: "Despliega un pequeño dron que cura 10 HP cada 20 segundos.",
      },
      en: {
        name: "Med Drone Chip",
        description: "Deploys a small drone that heals 10 HP every 20 seconds.",
      },
    },
  },
  {
    id: "tacticalRelay",
    effect: "tacticalRelay",
    rarity: "uncommon",
    translations: {
      es: {
        name: "Relé Táctico",
        description: "Reduce los enfriamientos de habilidades en 10%.",
      },
      en: {
        name: "Tactical Relay",
        description: "Reduces skill cooldowns by 10%.",
      },
    },
  },
  {
    id: "corrodedAmmoBelt",
    effect: "corrodedAmmoBelt",
    rarity: "uncommon",
    translations: {
      es: {
        name: "Cinturón de Munición Corroído",
        description: "Las balas atraviesan un enemigo adicional.",
      },
      en: {
        name: "Corroded Ammo Belt",
        description: "Bullets pierce one additional enemy.",
      },
    },
  },
  {
    id: "smokeEmitter",
    effect: "smokeEmitter",
    rarity: "uncommon",
    translations: {
      es: {
        name: "Emisor de Humo",
        description: "Libera una nube de humo al recibir daño crítico.",
      },
      en: {
        name: "Smoke Emitter",
        description: "Release a smoke cloud when taking critical damage.",
      },
    },
  },
  {
    id: "overclockedProcessor",
    effect: "overclockedProcessor",
    rarity: "uncommon",
    translations: {
      es: {
        name: "Procesador Sobreacelerado",
        description: "Aumenta toda la velocidad en 10% cuando tu HP está bajo 30%.",
      },
      en: {
        name: "Overclocked Processor",
        description: "Increases all speed by 10% under 30% HP.",
      },
    },
  },
  {
    id: "specterChip",
    effect: "specterChip",
    rarity: "uncommon",
    translations: {
      es: {
        name: "Chip Espectral",
        description: "10% de probabilidad de volverte invisible 2 segundos tras matar.",
      },
      en: {
        name: "Specter Chip",
        description: "10% chance to turn invisible for 2s after a kill.",
      },
    },
  },
  {
    id: "venomFilter",
    effect: "venomFilter",
    rarity: "uncommon",
    translations: {
      es: {
        name: "Filtro de Veneno",
        description: "Otorga inmunidad al veneno y toxinas.",
      },
      en: {
        name: "Venom Filter",
        description: "Grants immunity to poison and toxin effects.",
      },
    },
  },
  {
    id: "bloodInjector",
    effect: "bloodInjector",
    rarity: "uncommon",
    translations: {
      es: {
        name: "Inyector de Sangre",
        description: "Curarte otorga +20% de daño por 5 segundos.",
      },
      en: {
        name: "Blood Injector",
        description: "Healing grants +20% damage for 5s.",
      },
    },
  },
  {
    id: "thermalVisionLens",
    effect: "thermalVisionLens",
    rarity: "uncommon",
    translations: {
      es: {
        name: "Lente de Visión Térmica",
        description: "Revela enemigos demoníacos ocultos tras paredes.",
      },
      en: {
        name: "Thermal Vision Lens",
        description: "Reveals hidden demonic enemies through walls.",
      },
    },
  },
  {
    id: "pulseGrenadeModule",
    effect: "pulseGrenadeModule",
    rarity: "uncommon",
    translations: {
      es: {
        name: "Módulo de Pulso",
        description: "Emite una onda expansiva al recargar.",
      },
      en: {
        name: "Pulse Grenade Module",
        description: "Releases a shockwave when reloading.",
      },
    },
  },
  {
    id: "demonToothPendant",
    effect: "demonToothPendant",
    rarity: "uncommon",
    translations: {
      es: {
        name: "Colgante de Diente Demoníaco",
        description: "Inflige 10% más de daño contra demonios.",
      },
      en: {
        name: "Demon Tooth Pendant",
        description: "Deal 10% more damage against demons.",
      },
    },
  },
  {
    id: "reactorCore",
    effect: "reactorCore",
    rarity: "uncommon",
    translations: {
      es: {
        name: "Núcleo de Reactor",
        description: "Emite chispas de energía cada 3 segundos.",
      },
      en: {
        name: "Reactor Core",
        description: "Emits energy sparks every 3 seconds.",
      },
    },
  },
  {
    id: "nanoInsulationWeave",
    effect: "nanoInsulationWeave",
    rarity: "uncommon",
    translations: {
      es: {
        name: "Fibra Nano-Aislante",
        description: "Reduce el daño de fuego y electricidad en 15%.",
      },
      en: {
        name: "Nano-Insulation Weave",
        description: "Reduces fire and electric damage by 15%.",
      },
    },
  },
  {
    id: "adaptivePlating",
    effect: "adaptivePlating",
    rarity: "uncommon",
    translations: {
      es: {
        name: "Placa Adaptativa",
        description: "Al recibir daño, obtén 10% de resistencia a ese tipo por 10 segundos.",
      },
      en: {
        name: "Adaptive Plating",
        description: "After taking damage, gain 10% resistance to that type for 10s.",
      },
    },
  },
];

const RARE_ITEMS: ItemDefinition[] = [
  {
    id: "bioArmorPlating",
    effect: "bioArmorPlating",
    rarity: "rare",
    translations: {
      es: {
        name: "Placas Bioarmadas",
        description: "Convierte 10% del daño recibido en curación.",
      },
      en: {
        name: "Bio-Armor Plating",
        description: "Converts 10% of incoming damage into healing.",
      },
    },
  },
  {
    id: "aetherStabilizer",
    effect: "aetherStabilizer",
    rarity: "rare",
    translations: {
      es: {
        name: "Estabilizador Etéreo",
        description: "Reduce la acumulación de corrupción con el tiempo.",
      },
      en: {
        name: "Aether Stabilizer",
        description: "Reduces corruption buildup over time.",
      },
    },
  },
  {
    id: "adrenalSurge",
    effect: "adrenalSurge",
    rarity: "rare",
    translations: {
      es: {
        name: "Oleada Adrenalina",
        description: "Los golpes críticos otorgan +30% de velocidad por 4 segundos.",
      },
      en: {
        name: "Adrenal Surge",
        description: "Critical hits grant +30% speed for 4s.",
      },
    },
  },
  {
    id: "titaniumBones",
    effect: "titaniumBones",
    rarity: "rare",
    translations: {
      es: {
        name: "Huesos de Titanio",
        description: "Reduce todo el daño físico en 15%.",
      },
      en: {
        name: "Titanium Bones",
        description: "Reduce all physical damage by 15%.",
      },
    },
  },
  {
    id: "neuralUplink",
    effect: "neuralUplink",
    rarity: "rare",
    translations: {
      es: {
        name: "Enlace Neural",
        description: "Resalta enemigos élite y jefes en el minimapa.",
      },
      en: {
        name: "Neural Uplink",
        description: "Highlights elite enemies and bosses on minimap.",
      },
    },
  },
  {
    id: "ghostSerum",
    effect: "ghostSerum",
    rarity: "rare",
    translations: {
      es: {
        name: "Suero Fantasma",
        description: "Al morir, revives como fantasma durante 10 segundos.",
      },
      en: {
        name: "Ghost Serum",
        description: "Upon death, revive as a ghost for 10s.",
      },
    },
  },
  {
    id: "infernalBloodVial",
    effect: "infernalBloodVial",
    rarity: "rare",
    translations: {
      es: {
        name: "Frasco de Sangre Infernal",
        description: "+25% daño pero pierdes 1% de HP cada 3 segundos.",
      },
      en: {
        name: "Infernal Blood Vial",
        description: "+25% damage but lose 1% HP every 3s.",
      },
    },
  },
  {
    id: "orbitalBeacon",
    effect: "orbitalBeacon",
    rarity: "rare",
    translations: {
      es: {
        name: "Baliza Orbital",
        description: "Llama un ataque orbital cada 3 minutos.",
      },
      en: {
        name: "Orbital Beacon",
        description: "Calls down an orbital strike every 3 minutes.",
      },
    },
  },
  {
    id: "plagueVector",
    effect: "plagueVector",
    rarity: "rare",
    translations: {
      es: {
        name: "Vector de Plaga",
        description: "Los proyectiles propagan infecciones a enemigos cercanos.",
      },
      en: {
        name: "Plague Vector",
        description: "Projectiles spread infections to nearby enemies.",
      },
    },
  },
];

const EPIC_ITEMS: ItemDefinition[] = [
  {
    id: "cryoCore",
    effect: "cryoCore",
    rarity: "epic",
    translations: {
      es: {
        name: "Núcleo Criogénico",
        description: "Las explosiones congelan a los enemigos cercanos.",
      },
      en: {
        name: "Cryo Core",
        description: "Explosions freeze nearby enemies.",
      },
    },
  },
  {
    id: "nanoParasiteArmor",
    effect: "nanoParasiteArmor",
    rarity: "epic",
    translations: {
      es: {
        name: "Armadura de Nanoparásitos",
        description: "Cura 20% del HP al eliminar jefes.",
      },
      en: {
        name: "Nano-Parasite Armor",
        description: "Heal 20% HP after killing bosses.",
      },
    },
  },
  {
    id: "overlordsCrown",
    effect: "overlordsCrown",
    rarity: "epic",
    translations: {
      es: {
        name: "Corona del Señor Oscuro",
        description: "+50% de daño contra enemigos con más del 70% de HP.",
      },
      en: {
        name: "Overlord’s Crown",
        description: "+50% damage against enemies above 70% HP.",
      },
    },
  },
  {
    id: "grimCodex",
    effect: "grimCodex",
    rarity: "epic",
    translations: {
      es: {
        name: "Códice Funesto",
        description: "Aumenta el daño mágico y causa miedo al golpear.",
      },
      en: {
        name: "Grim Codex",
        description: "Increases magic damage and inflicts fear on hit.",
      },
    },
  },
  {
    id: "cursedMedallion",
    effect: "cursedMedallion",
    rarity: "epic",
    translations: {
      es: {
        name: "Medallón Maldito",
        description: "Duplica tu daño, pero también el daño que recibes.",
      },
      en: {
        name: "Cursed Medallion",
        description: "Double your damage, double the damage you take.",
      },
    },
  },
  {
    id: "etherealAmmoBelt",
    effect: "etherealAmmoBelt",
    rarity: "epic",
    translations: {
      es: {
        name: "Cinturón de Munición Etérea",
        description: "Munición infinita durante 4 segundos cada 60 segundos.",
      },
      en: {
        name: "Ethereal Ammo Belt",
        description: "Gain infinite ammo for 4s every 60s.",
      },
    },
  },
  {
    id: "houndmasterTotem",
    effect: "houndmasterTotem",
    rarity: "epic",
    translations: {
      es: {
        name: "Tótem del Amo de Bestias",
        description: "Invoca un sabueso espectral que ataca a enemigos cercanos.",
      },
      en: {
        name: "Houndmaster Totem",
        description: "Summons a spectral hound that attacks nearby enemies.",
      },
    },
  },
  {
    id: "hellfireReactor",
    effect: "hellfireReactor",
    rarity: "epic",
    translations: {
      es: {
        name: "Reactor de Fuego Infernal",
        description: "Las balas explotan al impactar, causando daño en área.",
      },
      en: {
        name: "Hellfire Reactor",
        description: "Bullets explode on impact, dealing AoE damage.",
      },
    },
  },
  {
    id: "voidRations",
    effect: "voidRations",
    rarity: "epic",
    translations: {
      es: {
        name: "Raciones del Vacío",
        description: "Abrir cofres restaura instantáneamente 50 HP.",
      },
      en: {
        name: "Void Rations",
        description: "Open chests instantly restores 50 HP.",
      },
    },
  },
];

const LEGENDARY_ITEMS: ItemDefinition[] = [
  {
    id: "demonheartReactor",
    effect: "demonheartReactor",
    rarity: "legendary",
    translations: {
      es: {
        name: "Reactor del Corazón Demoníaco",
        description: "Al tener 1 HP, te vuelves invulnerable por 3 segundos y liberas una explosión infernal.",
      },
      en: {
        name: "Demonheart Reactor",
        description: "At 1 HP, become invulnerable for 3s and release an infernal blast.",
      },
    },
  },
  {
    id: "revenantCore",
    effect: "revenantCore",
    rarity: "legendary",
    translations: {
      es: {
        name: "Núcleo del Revenant",
        description: "Revive con toda la salud una vez por partida.",
      },
      en: {
        name: "Revenant Core",
        description: "Revive with full HP once per run.",
      },
    },
  },
  {
    id: "apocalypseTrigger",
    effect: "apocalypseTrigger",
    rarity: "legendary",
    translations: {
      es: {
        name: "Disparador del Apocalipsis",
        description: "Multiplica tu daño x4 por 10 segundos, pero consume todo tu HP al terminar.",
      },
      en: {
        name: "Apocalypse Trigger",
        description: "Multiply your damage by 4 for 10s but consume all HP afterward.",
      },
    },
  },
  {
    id: "celestialCore",
    effect: "celestialCore",
    rarity: "legendary",
    translations: {
      es: {
        name: "Núcleo Celestial",
        description: "Tus ataques infligen daño verdadero e ignoran armadura.",
      },
      en: {
        name: "Celestial Core",
        description: "Your attacks deal true damage and ignore armor.",
      },
    },
  },
  {
    id: "markOfTheForgottenSoldier",
    effect: "markOfTheForgottenSoldier",
    rarity: "legendary",
    translations: {
      es: {
        name: "Marca del Soldado Olvidado",
        description: "Duplica todas tus estadísticas base pero reduce los drops en 80%.",
      },
      en: {
        name: "Mark of the Forgotten Soldier",
        description: "Doubles all base stats but reduces item drop chance by 80%.",
      },
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

itemTextMap.es.nvg = {
  name: "Gafas NVG",
  description: "Activa visión nocturna y prepara el minimapa",
};
itemTextMap.en.nvg = {
  name: "NVG",
  description: "Activates night vision and readies the minimap",
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
  id: "nvg",
  effect: "horizonvisor",
  rarity: "epic",
  color: RARITY_COLOR_MAP.epic,
  maxStacks: 1,
};

export const rarityColors: Record<Rarity, string> = RARITY_COLOR_MAP;
