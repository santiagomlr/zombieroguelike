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
  finalWave: string;
  playAgain: string;
  leaderboard: string;
  stats: string;
  continue: string;
  paused: string;
  startMusicButton: string;
  shufflePlaylistReady: string;
  musicControls: {
    previous: string;
    pause: string;
    resume: string;
    next: string;
    nowPlaying: string;
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
  finalWave: "Wave alcanzado",
  playAgain: "Jugar de nuevo",
  leaderboard: "TOP 10",
  stats: "Estadísticas",
  continue: "Continuar",
  paused: "PAUSA",
  startMusicButton: "Iniciar música",
  shufflePlaylistReady: "Reproducción aleatoria lista",
  musicControls: {
    previous: "Canción anterior",
    pause: "Pausar",
    resume: "Reanudar",
    next: "Siguiente canción",
    nowPlaying: "Reproduciendo ahora",
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
    description:
      "Elige qué hacer con este botín. Consérvalo para equiparlo, destiérralo para vetarlo de futuros cofres o sáltalo para decidir después.",
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
  finalWave: "Wave Reached",
  playAgain: "Play Again",
  leaderboard: "TOP 10",
  stats: "Stats",
  continue: "Continue",
  paused: "PAUSED",
  startMusicButton: "Start Music",
  shufflePlaylistReady: "Shuffle playlist ready",
  musicControls: {
    previous: "Previous song",
    pause: "Pause",
    resume: "Resume",
    next: "Next song",
    nowPlaying: "Now playing",
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
    description:
      "Choose how to handle this loot. Keep to claim it, banish to blacklist future drops, or skip to decide later.",
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

export const itemTexts: Record<Language, Record<string, ItemLocalization>> = {
  es: {
    windboots: { name: "Botas de Viento", description: "+5% velocidad" },
    fastgloves: { name: "Guantes Rápidos", description: "+5% cadencia" },
    lightvest: { name: "Chaleco Ligero", description: "+10 HP máximo" },
    tacticalbelt: { name: "Cinturón Táctico", description: "+10% magnetismo" },
    oldclock: { name: "Reloj Antiguo", description: "+5% duración powerups" },
    rustyring: { name: "Anillo Oxidado", description: "+10 XP por kill" },
    combatglasses: { name: "Gafas de Combate", description: "+10% precisión" },
    reinforcedpants: { name: "Pantalones Reforzados", description: "-5% daño recibido" },
    bouncegloves: { name: "Guantes de Rebote", description: "+1 rebote" },
    energyclock: { name: "Reloj de Energía", description: "+10% cadencia global" },
    ballistichelmet: { name: "Casco Balístico", description: "Inmunidad 1er golpe/wave" },
    jetboots: { name: "Botas Jet", description: "+15% velocidad" },
    reactiveshield: { name: "Escudo Reactivo", description: "Onda empuja enemigos" },
    horizonscanner: {
      name: "Escáner Horizonte",
      description: "Nv1: -30% zoom, Nv2: minimapa activado",
    },
    chaosamuleto: { name: "Amuleto del Caos", description: "Daño +10% a +50%" },
    ironmedal: { name: "Medalla de Hierro", description: "+15% HP máximo" },
    heavyvest: { name: "Chaleco Pesado", description: "-10% velocidad, -25% daño" },
    plasmafragment: { name: "Fragmento de Plasma", description: "+1 rebote +15% alcance" },
    voidcore: { name: "Núcleo del Vacío", description: "XP Doble" },
    solargauntlet: { name: "Guantelete Solar", description: "Proyectil cada 10 kills" },
    infernalengine: { name: "Motor Infernal", description: "+25% velocidad +20% daño, +10% daño recibido" },
    bloodstone: { name: "Piedra de Sangre", description: "5 HP cada 30 kills" },
    hordetotem: { name: "Tótem de la Horda", description: "+1 enemigo spawn, +2 XP/kill" },
    artificialheart: { name: "Corazón Artificial", description: "+50 HP permanente" },
    infinitylens: { name: "Lente del Infinito", description: "+10% todos los stats" },
  },
  en: {
    windboots: { name: "Wind Boots", description: "+5% speed" },
    fastgloves: { name: "Fast Gloves", description: "+5% fire rate" },
    lightvest: { name: "Light Vest", description: "+10 max HP" },
    tacticalbelt: { name: "Tactical Belt", description: "+10% magnetism" },
    oldclock: { name: "Old Clock", description: "+5% power-up duration" },
    rustyring: { name: "Rusty Ring", description: "+10 XP per kill" },
    combatglasses: { name: "Combat Glasses", description: "+10% accuracy" },
    reinforcedpants: { name: "Reinforced Pants", description: "-5% damage taken" },
    bouncegloves: { name: "Bounce Gloves", description: "+1 bounce" },
    energyclock: { name: "Energy Clock", description: "+10% global fire rate" },
    ballistichelmet: { name: "Ballistic Helmet", description: "Immune first hit/wave" },
    jetboots: { name: "Jet Boots", description: "+15% speed" },
    reactiveshield: { name: "Reactive Shield", description: "Wave pushes enemies" },
    horizonscanner: { name: "Horizon Scanner", description: "Lvl1: -30% zoom, Lvl2: minimap on" },
    chaosamuleto: { name: "Chaos Amulet", description: "Damage +10% to +50%" },
    ironmedal: { name: "Iron Medal", description: "+15% max HP" },
    heavyvest: { name: "Heavy Vest", description: "-10% speed, -25% damage" },
    plasmafragment: { name: "Plasma Fragment", description: "+1 bounce +15% range" },
    voidcore: { name: "Void Core", description: "Double XP" },
    solargauntlet: { name: "Solar Gauntlet", description: "Projectile every 10 kills" },
    infernalengine: { name: "Infernal Engine", description: "+25% speed +20% damage, +10% damage taken" },
    bloodstone: { name: "Bloodstone", description: "5 HP every 30 kills" },
    hordetotem: { name: "Horde Totem", description: "+1 enemy spawn, +2 XP/kill" },
    artificialheart: { name: "Artificial Heart", description: "+50 permanent HP" },
    infinitylens: { name: "Infinity Lens", description: "+10% all stats" },
  },
};

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
    damage: value => `+${value}% Daño`,
    speed: value => `+${value}% Velocidad`,
    bounce: value => `${value} Rebotes (Enemigos)`,
    range: value => `+${value}% Alcance`,
    precision: value => `+${value}% Precisión`,
    multishot: value => `+${value} Proyectiles`,
    regen: ({ rate, interval }) => `Regenera ${rate} HP cada ${interval}s`,
    magnet: value => `+${value}% Rango imán`,
    fire: value => `+${value}% Cadencia`,
  },
  en: {
    damage: value => `+${value}% Damage`,
    speed: value => `+${value}% Speed`,
    bounce: value => `${value} Bounces (Enemies)`,
    range: value => `+${value}% Range`,
    precision: value => `+${value}% Accuracy`,
    multishot: value => `+${value} Projectiles`,
    regen: ({ rate, interval }) => `Regenerates ${rate} HP every ${interval}s`,
    magnet: value => `+${value}% Magnet range`,
    fire: value => `+${value}% Fire rate`,
  },
};

export const getWeaponName = (id: string, language: Language): string => {
  const localized = weaponTexts[language][id] ?? weaponTexts.en[id];
  return localized ? localized.name : id;
};

export const getTomeName = (id: string, language: Language): string => {
  const localized = tomeTexts[language][id] ?? tomeTexts.en[id];
  return localized ? localized.name : id;
};

export const getItemText = (item: Item, language: Language): ItemLocalization => {
  const localized = itemTexts[language][item.id] ?? itemTexts.en[item.id];
  if (localized) {
    return localized;
  }
  return { name: item.id, description: "" };
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

export const WEAPONS: Weapon[] = [
  { id: "pistol", damage: 1, fireRate: 2, range: 250, projectileSpeed: 8, rarity: "common", color: "#6e6e6e", level: 1 },
  { id: "shotgun", damage: 3, fireRate: 0.8, range: 180, projectileSpeed: 6, rarity: "uncommon", color: "#5dbb63", special: "spread", level: 1 },
  { id: "smg", damage: 0.7, fireRate: 6, range: 200, projectileSpeed: 10, rarity: "rare", color: "#2e86c1", level: 1 },
  { id: "rocket", damage: 8, fireRate: 0.5, range: 350, projectileSpeed: 5, rarity: "epic", color: "#8e44ad", special: "aoe", level: 1 },
  { id: "laser", damage: 2, fireRate: 4, range: 400, projectileSpeed: 15, rarity: "uncommon", color: "#2e86c1", special: "pierce", level: 1 },
  { id: "railgun", damage: 12, fireRate: 0.3, range: 500, projectileSpeed: 20, rarity: "legendary", color: "#ffc300", special: "pierce", level: 1 },
  { id: "minigun", damage: 0.5, fireRate: 10, range: 220, projectileSpeed: 12, rarity: "legendary", color: "#ff3b3b", special: "rapid", level: 1 },
  { id: "flamethrower", damage: 0.8, fireRate: 8, range: 150, projectileSpeed: 6, rarity: "rare", color: "#ff7a2a", special: "fire", level: 1 },
  { id: "frostbow", damage: 1.2, fireRate: 2, range: 350, projectileSpeed: 9, rarity: "epic", color: "#2e86c1", special: "freeze", level: 1 },
  { id: "homing", damage: 4, fireRate: 0.4, range: 400, projectileSpeed: 7, rarity: "rare", color: "#8e44ad", special: "homing", level: 1 },
];

export const TOMES: Tome[] = [
  { id: "power", effect: "damage", value: 1.1, rarity: "rare", color: "#ff3b3b", level: 1 },
  { id: "speed", effect: "speed", value: 1.05, rarity: "uncommon", color: "#5dbb63", level: 1 },
  { id: "bounce", effect: "bounce", value: 1, rarity: "epic", color: "#8e44ad", level: 1 },
  { id: "range", effect: "range", value: 1.1, rarity: "uncommon", color: "#2e86c1", level: 1 },
  { id: "precision", effect: "precision", value: 1.1, rarity: "rare", color: "#8e44ad", level: 1 },
  { id: "multi", effect: "multishot", value: 1, rarity: "legendary", color: "#2e86c1", level: 1 },
  { id: "regen", effect: "regen", value: 1, rarity: "uncommon", color: "#5dbb63", level: 1 },
  { id: "magnet", effect: "magnet", value: 1.1, rarity: "common", color: "#6e6e6e", level: 1 },
  { id: "fire", effect: "fireRate", value: 1.1, rarity: "rare", color: "#ffc300", level: 1 },
];

export const ITEMS: Item[] = [
  { id: "windboots", effect: "speedboost", rarity: "common", color: "#6e6e6e" },
  { id: "fastgloves", effect: "firerateitem", rarity: "common", color: "#6e6e6e" },
  { id: "lightvest", effect: "maxhp10", rarity: "common", color: "#6e6e6e" },
  { id: "tacticalbelt", effect: "magnetitem", rarity: "common", color: "#6e6e6e" },
  { id: "oldclock", effect: "powerupduration", rarity: "common", color: "#6e6e6e" },
  { id: "rustyring", effect: "xpbonus", rarity: "common", color: "#6e6e6e" },
  { id: "combatglasses", effect: "precisionitem", rarity: "rare", color: "#2e86c1" },
  { id: "reinforcedpants", effect: "damagereduction", rarity: "rare", color: "#2e86c1" },
  { id: "bouncegloves", effect: "bounceitem", rarity: "rare", color: "#2e86c1" },
  { id: "energyclock", effect: "globalfirerate", rarity: "rare", color: "#2e86c1" },
  { id: "ballistichelmet", effect: "firsthitimmune", rarity: "rare", color: "#2e86c1" },
  { id: "jetboots", effect: "jetspeed", rarity: "epic", color: "#8e44ad" },
  { id: "reactiveshield", effect: "reactiveshield", rarity: "epic", color: "#8e44ad" },
  {
    id: "horizonscanner",
    effect: "horizonscanner",
    rarity: "epic",
    color: "#8e44ad",
    maxStacks: 2,
  },
  { id: "chaosamuleto", effect: "chaosdamage", rarity: "epic", color: "#8e44ad" },
  { id: "ironmedal", effect: "maxhp15", rarity: "epic", color: "#8e44ad" },
  { id: "heavyvest", effect: "heavyarmor", rarity: "epic", color: "#8e44ad" },
  { id: "plasmafragment", effect: "plasmafrag", rarity: "epic", color: "#8e44ad" },
  { id: "voidcore", effect: "doublexp", rarity: "legendary", color: "#ffc300" },
  { id: "solargauntlet", effect: "solargauntlet", rarity: "legendary", color: "#ffc300" },
  { id: "infernalengine", effect: "infernalengine", rarity: "legendary", color: "#ffc300" },
  { id: "bloodstone", effect: "bloodstone", rarity: "legendary", color: "#ffc300" },
  { id: "hordetotem", effect: "hordetotem", rarity: "legendary", color: "#ffc300" },
  { id: "artificialheart", effect: "artificialheart", rarity: "legendary", color: "#ffc300" },
  { id: "infinitylens", effect: "infinitylens", rarity: "legendary", color: "#ffc300" },
];

export const rarityColors: Record<Rarity, string> = {
  common: "#6e6e6e",
  uncommon: "#5dbb63",
  rare: "#2e86c1",
  epic: "#8e44ad",
  legendary: "#ffc300",
};
