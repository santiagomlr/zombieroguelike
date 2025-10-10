import { useEffect, useRef, useState } from "react";

// Tipos
type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
type Language = "es" | "en";

interface Translations {
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
}

const translations: Record<Language, Translations> = {
  es: {
    levelUp: "¡SUBISTE DE NIVEL!",
    chooseUpgrade: "Elige una mejora:",
    weapon: "ARMA",
    tome: "TOMO",
    item: "ÍTEM",
    damage: "Daño",
    fireRate: "Cadencia",
    range: "Alcance",
    level: "Nivel",
    wave: "Wave",
    weapons: "Armas:",
    tomes: "Tomos:",
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
    startMusicButton: "🎵 Iniciar música",
    shufflePlaylistReady: "Reproducción aleatoria lista",
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
  },
  en: {
    levelUp: "LEVEL UP!",
    chooseUpgrade: "Choose an upgrade:",
    weapon: "WEAPON",
    tome: "TOME",
    item: "ITEM",
    damage: "Damage",
    fireRate: "Fire Rate",
    range: "Range",
    level: "Level",
    wave: "Wave",
    weapons: "Weapons:",
    tomes: "Tomes:",
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
    startMusicButton: "🎵 Start Music",
    shufflePlaylistReady: "Shuffle playlist ready",
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
  },
};

interface WeaponLocalization {
  name: string;
}

interface TomeLocalization {
  name: string;
}

interface ItemLocalization {
  name: string;
  description: string;
}

const weaponTexts: Record<Language, Record<string, WeaponLocalization>> = {
  es: {
    pistol: { name: "Pistola" },
    shotgun: { name: "Escopeta" },
    smg: { name: "SMG" },
    rocket: { name: "Lanzacohetes" },
    laser: { name: "Láser" },
    railgun: { name: "Railgun" },
    minigun: { name: "Minigun" },
    electric: { name: "Arma Eléctrica" },
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
    electric: { name: "Electric Blaster" },
    flamethrower: { name: "Flamethrower" },
    frostbow: { name: "Frost Bow" },
    homing: { name: "Homing Missile" },
  },
};

const tomeTexts: Record<Language, Record<string, TomeLocalization>> = {
  es: {
    power: { name: "Tomo de Poder" },
    speed: { name: "Tomo de Velocidad" },
    bounce: { name: "Tomo de Rebote" },
    range: { name: "Tomo de Alcance" },
    precision: { name: "Tomo de Precisión" },
    multi: { name: "Tomo Múltiple" },
    regen: { name: "Tomo de Regeneración" },
    magnet: { name: "Tomo de Magnetismo" },
    fire: { name: "Tomo de Cadencia" },
  },
  en: {
    power: { name: "Power Tome" },
    speed: { name: "Speed Tome" },
    bounce: { name: "Bounce Tome" },
    range: { name: "Range Tome" },
    precision: { name: "Precision Tome" },
    multi: { name: "Multishot Tome" },
    regen: { name: "Regeneration Tome" },
    magnet: { name: "Magnetism Tome" },
    fire: { name: "Fire Rate Tome" },
  },
};

const itemTexts: Record<Language, Record<string, ItemLocalization>> = {
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

const upgradeDescriptionTexts: Record<Language, Record<string, string>> = {
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

const ENABLE_AUDIO = false;
const ENABLE_MUSIC = false;
const ENABLE_ENVIRONMENTAL_EVENTS = false;
const ENABLE_HOTSPOTS = false;
const MAX_PARTICLES = 80;

const getUpgradeDescriptionText = (key: string | undefined, language: Language): string | undefined => {
  if (!key) return undefined;
  const localized = upgradeDescriptionTexts[language][key] ?? upgradeDescriptionTexts.en[key];
  return localized;
};

type TomeDescriptionTemplate = {
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

const tomeDescriptionTemplates: Record<Language, TomeDescriptionTemplate> = {
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

const getWeaponName = (id: string, language: Language): string => {
  const localized = weaponTexts[language][id] ?? weaponTexts.en[id];
  return localized ? localized.name : id;
};

const getTomeName = (id: string, language: Language): string => {
  const localized = tomeTexts[language][id] ?? tomeTexts.en[id];
  return localized ? localized.name : id;
};

const getTomeDescription = (tome: Tome, language: Language, stats?: PlayerStats): string => {
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
      const value = stats ? Math.max(1, stats.bounces) : Math.min(tome.level, 5);
      return (templates?.bounce ?? fallbackTemplates.bounce)(value);
    }
    case "range": {
      const percentages = [10, 25, 40, 60, 80];
      const index = Math.min(tome.level, percentages.length) - 1;
      const bonus = percentages[Math.max(0, index)] ?? percentages[percentages.length - 1];
      return (templates?.range ?? fallbackTemplates.range)(bonus);
    }
    case "precision": {
      const bonus = Math.min(tome.level, 5) * 10;
      return (templates?.precision ?? fallbackTemplates.precision)(bonus);
    }
    case "multishot": {
      const base = stats ? stats.multishot : tome.level;
      const value = Math.max(1, base + (stats ? 1 : 0));
      return (templates?.multishot ?? fallbackTemplates.multishot)(value);
    }
    case "regen": {
      const regenLevels = [
        { rate: 1, interval: 5 },
        { rate: 1, interval: 4 },
        { rate: 2, interval: 5 },
        { rate: 2, interval: 4 },
        { rate: 3, interval: 4 },
      ];
      let rate = stats?.regenRate ?? 1;
      let interval = stats?.regenInterval ?? 5;
      if (!stats) {
        const index = Math.min(tome.level, regenLevels.length) - 1;
        if (index >= 0) {
          rate = regenLevels[index].rate;
          interval = regenLevels[index].interval;
        } else {
          rate = 1;
          interval = 5;
        }
        if (tome.level > regenLevels.length) {
          const extra = tome.level - regenLevels.length;
          rate = regenLevels[regenLevels.length - 1].rate + extra;
          interval = 4;
        }
      }
      return (templates?.regen ?? fallbackTemplates.regen)({ rate, interval });
    }
    case "magnet": {
      const bonus = stats
        ? Math.round((stats.magnetMultiplier - 1) * 100)
        : Math.round((Math.pow(1.1, Math.min(tome.level, 5)) - 1) * 100);
      return (templates?.magnet ?? fallbackTemplates.magnet)(bonus);
    }
    case "fireRate": {
      const bonus = stats
        ? Math.round((stats.fireRateMultiplier - 1) * 100)
        : Math.round((Math.pow(1.1, tome.level) - 1) * 100);
      return (templates?.fire ?? fallbackTemplates.fire)(bonus);
    }
    default:
      return "";
  }
};

const getItemText = (item: Item, language: Language) => {
  const localized = itemTexts[language][item.id] ?? itemTexts.en[item.id];
  if (localized) {
    return localized;
  }
  return { name: item.id, description: "" };
};

const LANGUAGE_ORDER: Language[] = ["es", "en"];

type PauseMenuTab = "home" | "settings" | "stats";

const PAUSE_MENU_TABS: PauseMenuTab[] = ["home", "settings", "stats"];

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

const getPauseMenuContentMetrics = (
  layout: ReturnType<typeof getPauseMenuLayout>
) => {
  return {
    scale: layout.scale,
  };
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

interface Weapon {
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

interface Tome {
  id: string;
  effect: string;
  value: number;
  rarity: Rarity;
  color: string;
  level: number;
}

interface Item {
  id: string;
  effect: string;
  rarity: Rarity;
  color: string;
}

interface PlayerStats {
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
  bounceOnEnemies: boolean;
  damageReduction: number;
  powerupDuration: number;
  xpBonus: number;
  firstHitImmuneUsed: boolean;
  chaosDamage: boolean;
  solarGauntletKills: number;
  bloodstoneKills: number;
  reactiveShieldActive: boolean;
}

interface Upgrade {
  type: "weapon" | "tome" | "item";
  data: Weapon | Tome | Item;
  rarity: Rarity;
  isLevelUp?: boolean;
  targetIndex?: number;
  upgradeType?: "damage" | "fireRate" | "range" | "special" | "effect";
  descriptionKey?: string;
}

const WEAPONS: Weapon[] = [
  { id: "pistol", damage: 1, fireRate: 2, range: 250, projectileSpeed: 8, rarity: "common", color: "#9ca3af", level: 1 },
  { id: "shotgun", damage: 3, fireRate: 0.8, range: 180, projectileSpeed: 6, rarity: "uncommon", color: "#22c55e", special: "spread", level: 1 },
  { id: "smg", damage: 0.7, fireRate: 6, range: 200, projectileSpeed: 10, rarity: "rare", color: "#3b82f6", level: 1 },
  { id: "rocket", damage: 8, fireRate: 0.5, range: 350, projectileSpeed: 5, rarity: "epic", color: "#a855f7", special: "aoe", level: 1 },
  { id: "laser", damage: 2, fireRate: 4, range: 400, projectileSpeed: 15, rarity: "epic", color: "#06b6d4", special: "pierce", level: 1 },
  { id: "railgun", damage: 12, fireRate: 0.3, range: 500, projectileSpeed: 20, rarity: "legendary", color: "#fbbf24", special: "pierce", level: 1 },
  { id: "minigun", damage: 0.5, fireRate: 10, range: 220, projectileSpeed: 12, rarity: "legendary", color: "#f87171", special: "rapid", level: 1 },
  // Nuevas armas elementales
  { id: "electric", damage: 1.5, fireRate: 3, range: 300, projectileSpeed: 10, rarity: "epic", color: "#60a5fa", special: "chain", level: 1 },
  { id: "flamethrower", damage: 0.8, fireRate: 8, range: 150, projectileSpeed: 6, rarity: "rare", color: "#fb923c", special: "fire", level: 1 },
  { id: "frostbow", damage: 1.2, fireRate: 2, range: 350, projectileSpeed: 9, rarity: "epic", color: "#38bdf8", special: "freeze", level: 1 },
  { id: "homing", damage: 4, fireRate: 1, range: 400, projectileSpeed: 7, rarity: "legendary", color: "#f472b6", special: "homing", level: 1 },
];

const TOMES: Tome[] = [
  { id: "power", effect: "damage", value: 1.1, rarity: "rare", color: "#f87171", level: 1 },
  { id: "speed", effect: "speed", value: 1.05, rarity: "uncommon", color: "#22c55e", level: 1 },
  { id: "bounce", effect: "bounce", value: 1, rarity: "epic", color: "#a855f7", level: 1 },
  { id: "range", effect: "range", value: 1.1, rarity: "uncommon", color: "#3b82f6", level: 1 },
  { id: "precision", effect: "precision", value: 1.1, rarity: "rare", color: "#8b5cf6", level: 1 },
  { id: "multi", effect: "multishot", value: 1, rarity: "legendary", color: "#06b6d4", level: 1 },
  { id: "regen", effect: "regen", value: 1, rarity: "uncommon", color: "#10b981", level: 1 },
  { id: "magnet", effect: "magnet", value: 1.1, rarity: "common", color: "#64748b", level: 1 },
  { id: "fire", effect: "fireRate", value: 1.1, rarity: "rare", color: "#fbbf24", level: 1 },
];

const ITEMS: Item[] = [
  // Común
  { id: "windboots", effect: "speedboost", rarity: "common", color: "#9ca3af" },
  { id: "fastgloves", effect: "firerateitem", rarity: "common", color: "#9ca3af" },
  { id: "lightvest", effect: "maxhp10", rarity: "common", color: "#9ca3af" },
  { id: "tacticalbelt", effect: "magnetitem", rarity: "common", color: "#9ca3af" },
  { id: "oldclock", effect: "powerupduration", rarity: "common", color: "#9ca3af" },
  { id: "rustyring", effect: "xpbonus", rarity: "common", color: "#9ca3af" },

  // Raro
  { id: "combatglasses", effect: "precisionitem", rarity: "rare", color: "#3b82f6" },
  { id: "reinforcedpants", effect: "damagereduction", rarity: "rare", color: "#3b82f6" },
  { id: "bouncegloves", effect: "bounceitem", rarity: "rare", color: "#3b82f6" },
  // ELIMINADO: extrabag (dropcapacity no implementado)
  { id: "energyclock", effect: "globalfirerate", rarity: "rare", color: "#3b82f6" },
  { id: "ballistichelmet", effect: "firsthitimmune", rarity: "rare", color: "#3b82f6" },

  // Épico
  { id: "jetboots", effect: "jetspeed", rarity: "epic", color: "#a855f7" },
  { id: "reactiveshield", effect: "reactiveshield", rarity: "epic", color: "#a855f7" },
  { id: "chaosamuleto", effect: "chaosdamage", rarity: "epic", color: "#a855f7" },
  { id: "ironmedal", effect: "maxhp15", rarity: "epic", color: "#a855f7" },
  { id: "heavyvest", effect: "heavyarmor", rarity: "epic", color: "#a855f7" },
  { id: "plasmafragment", effect: "plasmafrag", rarity: "epic", color: "#a855f7" },

  // Legendario
  { id: "voidcore", effect: "doublexp", rarity: "legendary", color: "#fbbf24" },
  { id: "solargauntlet", effect: "solargauntlet", rarity: "legendary", color: "#fbbf24" },
  { id: "infernalengine", effect: "infernalengine", rarity: "legendary", color: "#fbbf24" },
  { id: "bloodstone", effect: "bloodstone", rarity: "legendary", color: "#fbbf24" },
  { id: "hordetotem", effect: "hordetotem", rarity: "legendary", color: "#fbbf24" },
  { id: "artificialheart", effect: "artificialheart", rarity: "legendary", color: "#fbbf24" },
  { id: "infinitylens", effect: "infinitylens", rarity: "legendary", color: "#fbbf24" },
];

const rarityColors = {
  common: "#9ca3af",
  uncommon: "#22c55e",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#fbbf24",
};

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const prerenderedLogosRef = useRef<{[key: string]: HTMLCanvasElement}>({});
  
  const t = translations[language];

  useEffect(() => {
    if (gameStateRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const gameState = {
      state: 'running' as 'running' | 'paused' | 'gameover',
      player: {
        x: W / 2,
        y: H / 2,
        vx: 0,
        vy: 0,
        spd: 3.5,
        rad: 16,
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
        weapons: [WEAPONS[0]],
        tomes: [] as Tome[],
        items: [] as Item[],
        itemFlags: {} as Record<string, boolean>,
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
          bounceOnEnemies: false,
          damageReduction: 0,
          powerupDuration: 1,
          xpBonus: 0,
          firstHitImmuneUsed: false,
          chaosDamage: false,
          solarGauntletKills: 0,
          bloodstoneKills: 0,
          reactiveShieldActive: false,
        },
      },
      bullets: [] as any[],
      enemies: [] as any[],
      drops: [] as any[],
      particles: [] as any[],
      hotspots: [] as any[],
      maxParticles: MAX_PARTICLES,
      bosses: [] as any[],
      score: 0,
      level: 1,
      xp: 0,
      nextXP: 25,
      time: 0,
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
      audioContext: null as AudioContext | null,
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
      sounds: {
        shoot: new Audio(),
        hit: new Audio(),
        levelUp: new Audio(),
        pickup: new Audio(),
        death: new Audio(),
      },
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
      musicMuted: false,
      musicVolume: 0.3, // Volumen de la música (0 a 1)
      targetMusicVolume: 0.3, // Volumen objetivo para animación suave
      musicStarted: false, // Flag para saber si el usuario ya inició la música
      sfxMuted: false,
      enemyLogo: null as HTMLImageElement | null,
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

    gameStateRef.current = gameState;
    
    // Load enemy logo
    const enemyLogoImg = new Image();
    enemyLogoImg.src = '/images/enemy-logo.png';
    enemyLogoImg.onload = () => {
      gameState.enemyLogo = enemyLogoImg;
      console.log('Enemy logo loaded successfully');
      
      // Pre-render colored enemy logos for performance
      const colors = ['#22c55e', '#a855f7', '#fbbf24', '#16a34a', '#9333ea', '#f59e0b'];
      colors.forEach(color => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 60;
        tempCanvas.height = 60;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.drawImage(enemyLogoImg, 0, 0, 60, 60);
        tempCtx.globalCompositeOperation = 'source-in';
        tempCtx.fillStyle = color;
        tempCtx.fillRect(0, 0, 60, 60);
        prerenderedLogosRef.current[color] = tempCanvas;
      });
    };
    enemyLogoImg.onerror = () => {
      console.error('Failed to load enemy logo');
    };
    
    // Initialize Web Audio API
    if (ENABLE_AUDIO) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        gameState.audioContext = audioCtx;
      } catch (e) {
        console.warn("Web Audio API not supported");
      }
    }
    
    // Initialize music system
    function initMusic() {
      if (!ENABLE_MUSIC) return;
      if (!gameState.music) {
        const audio = new Audio();
        audio.volume = gameState.musicVolume;
        audio.loop = false;
        
        audio.addEventListener('ended', () => {
          // Pasar a la siguiente canción
          gameState.currentMusicIndex = (gameState.currentMusicIndex + 1) % gameState.musicTracks.length;
          playNextTrack();
        });
        
        gameState.music = audio;
        // No auto-play, esperar a que el usuario haga click
      }
    }
    
    function playNextTrack() {
      if (!ENABLE_MUSIC || !gameState.music || !gameState.musicStarted) return;
      
      const track = gameState.musicTracks[gameState.currentMusicIndex];
      gameState.music.src = track.path;
      gameState.music.volume = gameState.musicMuted ? 0 : gameState.musicVolume;
      
      if (!gameState.musicMuted) {
        gameState.music.play().catch(e => console.warn("Audio play failed:", e));
      }
      
      // Mostrar notificación
      gameState.musicNotification = track.name;
      gameState.musicNotificationTimer = 3; // 3 segundos
    }
    
    // Inicializar música pero sin auto-play
    if (ENABLE_MUSIC) {
      initMusic();
    }
    
    // Sound effect functions
    const playSound = (frequency: number, duration: number, type: OscillatorType = "sine", volume: number = 0.3) => {
      if (!ENABLE_AUDIO || gameState.sfxMuted || !gameState.audioContext) return;
      const oscillator = gameState.audioContext.createOscillator();
      const gainNode = gameState.audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, gameState.audioContext.currentTime);

      gainNode.gain.setValueAtTime(volume, gameState.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, gameState.audioContext.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(gameState.audioContext.destination);

      oscillator.start();
      oscillator.stop(gameState.audioContext.currentTime + duration);
    };

    const playShootSound = () => {
      if (!ENABLE_AUDIO) return;
      playSound(200, 0.1, "square", 0.2);
    };

    const playHitSound = () => {
      if (!ENABLE_AUDIO) return;
      playSound(100, 0.15, "sawtooth", 0.2);
    };

    const playLevelUpSound = () => {
      if (!ENABLE_AUDIO) return;
      playSound(300, 0.1, "sine", 0.3);
      setTimeout(() => playSound(400, 0.1, "sine", 0.3), 100);
      setTimeout(() => playSound(600, 0.2, "sine", 0.3), 200);
    };

    const playDeathSound = () => {
      if (!ENABLE_AUDIO) return;
      playSound(400, 0.2, "sawtooth", 0.4);
      setTimeout(() => playSound(200, 0.3, "sawtooth", 0.4), 100);
    };

    const playPowerupSound = () => {
      if (!ENABLE_AUDIO) return;
      playSound(400, 0.1, "sine", 0.25);
      setTimeout(() => playSound(500, 0.1, "sine", 0.25), 50);
      setTimeout(() => playSound(600, 0.15, "sine", 0.25), 100);
    };

    const handleResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
      if (gameState.player) {
        gameState.player.x = Math.min(gameState.player.x, W - 50);
        gameState.player.y = Math.min(gameState.player.y, H - 50);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", handleResize);

    // Funciones del juego
    function spawnEnemy() {
      const side = Math.floor(Math.random() * 4);
      let x, y;
      if (side === 0) { x = Math.random() * W; y = -30; }
      else if (side === 1) { x = W + 30; y = Math.random() * H; }
      else if (side === 2) { x = Math.random() * W; y = H + 30; }
      else { x = -30; y = Math.random() * H; }
      
      // Horde Totem: +1 enemigo adicional spawn
      const spawnCount = gameState.player.itemFlags.hordetotem ? 2 : 1;
      
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
          rad = 12;
          spd = 1.8; // Más rápido para ser más peligroso
        } else if (specialRoll < 0.5) {
          specialType = "fast";
          enemyType = "fast";
          color = "#fbbf24";
          damage = 3;
          baseHp = 1;
          rad = 10;
          spd = 2.5;
        } else if (specialRoll < 0.75) {
          specialType = "tank";
          enemyType = "tank";
          color = "#78716c";
          damage = 20;
          baseHp = 15;
          rad = 20;
          spd = 0.6;
        } else {
          specialType = "summoner";
          enemyType = "summoner";
          color = "#a855f7";
          damage = 5;
          baseHp = 8;
          rad = 14;
          spd = 0.9;
        }
      } else {
        // Enemigos normales
        specialType = null;
      
      // Progresión detallada por wave
      if (gameState.wave === 1) {
        // Wave 1: Solo verdes 🟢
        enemyType = "weak";
        color = "#22c55e";
        damage = 5;
        baseHp = 3;
        rad = 12;
        spd = 1.3;
      } else if (gameState.wave === 2) {
        // Wave 2: Mayoría verdes, algunos morados (≤10%)
        if (roll < 0.9) {
          enemyType = "weak";
          color = "#22c55e";
          damage = 5;
          baseHp = 3;
          rad = 12;
          spd = 1.3;
        } else {
          enemyType = "medium";
          color = "#a855f7";
          damage = 10;
          baseHp = 5;
          rad = 15;
          spd = 1.1;
        }
      } else if (gameState.wave === 3) {
        // Wave 3: Mezcla verde/morado (20-30% morado)
        if (roll < 0.75) {
          enemyType = "weak";
          color = "#22c55e";
          damage = 5;
          baseHp = 3;
          rad = 12;
          spd = 1.3;
        } else {
          enemyType = "medium";
          color = "#a855f7";
          damage = 10;
          baseHp = 5;
          rad = 15;
          spd = 1.1;
        }
      } else if (gameState.wave === 4) {
        // Wave 4: Más morado (30-40%)
        if (roll < 0.65) {
          enemyType = "weak";
          color = "#22c55e";
          damage = 5;
          baseHp = 3;
          rad = 12;
          spd = 1.3;
        } else {
          enemyType = "medium";
          color = "#a855f7";
          damage = 10;
          baseHp = 5;
          rad = 15;
          spd = 1.1;
        }
      } else if (gameState.wave === 5) {
        // Wave 5: Introducir amarillo (3-5%)
        if (roll < 0.04) {
          enemyType = "strong";
          color = "#fbbf24";
          damage = 20;
          baseHp = 8;
          rad = 18;
          spd = 0.9;
        } else if (roll < 0.6) {
          enemyType = "medium";
          color = "#a855f7";
          damage = 10;
          baseHp = 5;
          rad = 15;
          spd = 1.1;
        } else {
          enemyType = "weak";
          color = "#22c55e";
          damage = 5;
          baseHp = 3;
          rad = 12;
          spd = 1.3;
        }
      } else if (gameState.wave === 6) {
        // Wave 6: Mezcla estable 50/40/10%
        if (roll < 0.1) {
          enemyType = "strong";
          color = "#fbbf24";
          damage = 20;
          baseHp = 8;
          rad = 18;
          spd = 0.9;
        } else if (roll < 0.5) {
          enemyType = "medium";
          color = "#a855f7";
          damage = 10;
          baseHp = 5;
          rad = 15;
          spd = 1.1;
        } else {
          enemyType = "weak";
          color = "#22c55e";
          damage = 5;
          baseHp = 3;
          rad = 12;
          spd = 1.3;
        }
      } else if (gameState.wave === 7) {
        // Wave 7: Amarillos hasta 12-15%
        if (roll < 0.13) {
          enemyType = "strong";
          color = "#fbbf24";
          damage = 20;
          baseHp = 8;
          rad = 18;
          spd = 0.9;
        } else if (roll < 0.6) {
          enemyType = "medium";
          color = "#a855f7";
          damage = 10;
          baseHp = 5;
          rad = 15;
          spd = 1.1;
        } else {
          enemyType = "weak";
          color = "#22c55e";
          damage = 5;
          baseHp = 3;
          rad = 12;
          spd = 1.3;
        }
      } else {
        // Wave 8+: Escalado progresivo (amarillos hasta 25-30%)
        const yellowChance = Math.min(0.30, 0.15 + (gameState.wave - 8) * 0.02);
        
        if (roll < yellowChance) {
          enemyType = "strong";
          color = "#fbbf24";
          damage = 20;
          baseHp = 8;
          rad = 18;
          spd = 0.9;
        } else if (roll < yellowChance + 0.45) {
          enemyType = "medium";
          color = "#a855f7";
          damage = 10;
          baseHp = 5;
          rad = 15;
          spd = 1.1;
        } else {
          enemyType = "weak";
          color = "#22c55e";
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
      
      gameState.enemies.push({
        x, y,
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
      });
      }
    }
    
    function spawnBoss() {
      const x = W / 2;
      const y = -100;
      
      // Boss HP escalado agresivo estilo COD Zombies
      const baseHp = 150;
      const bossHpMultiplier = 1 + (gameState.wave - 1) * 3; // Mucho más tanque
      const scaledHp = Math.floor(baseHp * bossHpMultiplier);
      
      gameState.enemies.push({
        x, y,
        rad: 40,
        hp: scaledHp,
        maxhp: scaledHp,
        spd: 0.8,
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
      const side = Math.floor(Math.random() * 4);
      let x, y;
      if (side === 0) { x = Math.random() * W; y = -40; }
      else if (side === 1) { x = W + 40; y = Math.random() * H; }
      else if (side === 2) { x = Math.random() * W; y = H + 40; }
      else { x = -40; y = Math.random() * H; }
      
      // Mini-boss HP escalado estilo COD Zombies
      const baseHp = 25;
      const miniBossHpMultiplier = 1 + (gameState.wave - 1) * 2; // Más tanque que antes
      const scaledHp = Math.floor(baseHp * miniBossHpMultiplier);
      
      gameState.enemies.push({
        x, y,
        rad: 28,
        hp: scaledHp,
        maxhp: scaledHp,
        spd: 1.0,
        isElite: false,
        isMiniBoss: true,
        color: "#fbbf24",
        damage: Math.floor(25 * (1 + (gameState.wave - 1) * 0.05)),
      });
    }

    function nearestEnemy() {
      const onScreenEnemies = gameState.enemies.filter((e: any) =>
        e.x >= -50 && e.x <= W + 50 && e.y >= -50 && e.y <= H + 50
      );

      if (onScreenEnemies.length === 0) return null;

      let bestScore = -Infinity;
      let bestEnemy = onScreenEnemies[0];

      for (const enemy of onScreenEnemies) {
        const dist = Math.hypot(enemy.x - gameState.player.x, enemy.y - gameState.player.y);
        const normalizedDistance = Math.max(0, 1 - dist / 600);

        const speed = enemy.spd || 0;
        const approachScore = Math.min(1, speed / 2.5);
        const timeToImpact = speed > 0 ? dist / (speed * 60) : Infinity;
        const imminentImpactScore = timeToImpact < 5 ? Math.max(0, 1 - timeToImpact / 5) : 0;

        let typeScore = 0.3;
        if (enemy.isBoss) typeScore = 1.2;
        else if (enemy.isMiniBoss) typeScore = 1.0;
        else if (enemy.specialType === "explosive") typeScore = 1.1;
        else if (enemy.isElite) typeScore = 0.9;
        else if (enemy.specialType) typeScore = 0.8;
        else if (enemy.enemyType === "strong") typeScore = 0.7;
        else if (enemy.enemyType === "medium") typeScore = 0.5;

        const damageScore = Math.min(1, (enemy.damage || 0) / 40);

        let explosiveUrgency = 0;
        if (enemy.specialType === "explosive") {
          const timer = typeof enemy.explosionTimer === "number" ? enemy.explosionTimer : null;
          if (timer !== null && timer >= 0) {
            explosiveUrgency = Math.max(0, 1 - Math.min(timer, 2) / 2);
          } else {
            explosiveUrgency = 0.4;
          }
        }

        const healthRatio = enemy.maxhp ? enemy.hp / enemy.maxhp : 1;
        const finishingScore = (1 - healthRatio) * 0.3;

        const totalScore =
          typeScore * 0.35 +
          damageScore * 0.15 +
          normalizedDistance * 0.25 +
          approachScore * 0.1 +
          Math.max(imminentImpactScore, explosiveUrgency) * 0.1 +
          finishingScore * 0.05;

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestEnemy = enemy;
        }
      }

      return bestEnemy;
    }

    function shootWeapon(weapon: Weapon, target: any) {
      // Incrementar contador de disparos para el tutorial
      gameState.player.shotsFired = (gameState.player.shotsFired || 0) + 1;
      
      const range = weapon.range * gameState.player.stats.rangeMultiplier;
      let baseDamage = weapon.damage * gameState.player.stats.damageMultiplier;
      
      // Amuleto del Caos: daño aleatorio +10% a +50%
      if (gameState.player.stats.chaosDamage) {
        const chaosBonus = 1 + (Math.random() * 0.4 + 0.1); // 1.1x a 1.5x
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
      const actualSpread = baseSpread * spreadReduction;
      
      const shots = 1 + gameState.player.stats.multishot;
      for (let i = 0; i < shots; i++) {
        const spreadAngle = (i - (shots - 1) / 2) * actualSpread;
        const finalDir = dir + spreadAngle;
        
        if (isSpread) {
          const spreadVariance = 0.3 * spreadReduction;
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
      
      playShootSound();
    }

    function autoShoot(dt: number) {
      const target = nearestEnemy();
      if (!target) return;

      const dist = Math.hypot(target.x - gameState.player.x, target.y - gameState.player.y);

      for (const weapon of gameState.player.weapons) {
        const range = weapon.range * gameState.player.stats.rangeMultiplier;
        if (dist > range) continue;

        const cooldownKey = weapon.id;
        if (!gameState.weaponCooldowns[cooldownKey]) gameState.weaponCooldowns[cooldownKey] = 0;
        
        gameState.weaponCooldowns[cooldownKey] += dt;
        const interval = 1 / (weapon.fireRate * gameState.player.stats.fireRateMultiplier);
        
        if (gameState.weaponCooldowns[cooldownKey] >= interval) {
          gameState.weaponCooldowns[cooldownKey] = 0;
          shootWeapon(weapon, target);
        }
      }
    }

    function dropXP(x: number, y: number, val: number) {
      gameState.drops.push({ x, y, rad: 8, type: "xp", val, color: "#06b6d4", lifetime: 10 });
    }
    
    function dropHeal(x: number, y: number) {
      const healAmount = Math.random() < 0.5 ? 15 : 25; // Curación pequeña o mediana
      gameState.drops.push({ 
        x, y, 
        rad: 10, 
        type: "heal", 
        val: healAmount, 
        color: "#ef4444" 
      });
    }
    
    function dropPowerup(x: number, y: number, type: "magnet" | "shield" | "rage" | "speed") {
      const powerupData = {
        magnet: { color: "#10b981", rarity: "uncommon" as Rarity, duration: 10 },
        shield: { color: "#3b82f6", rarity: "rare" as Rarity, duration: 15 },
        rage: { color: "#ef4444", rarity: "epic" as Rarity, duration: 8 },
        speed: { color: "#fbbf24", rarity: "common" as Rarity, duration: 0 }, // duration 0 porque es permanente
      };
      
      const data = powerupData[type];
      gameState.drops.push({
        x, y, rad: 12,
        type: "powerup",
        powerupType: type,
        duration: data.duration,
        color: data.color,
        rarity: data.rarity,
      });
    }

    function collectXP(v: number) {
      // Aplicar multiplicador y bonus de XP
      const xpGained = (v + gameState.player.stats.xpBonus) * gameState.player.stats.xpMultiplier;
      gameState.xp += xpGained;
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
      
      // Partículas de powerup con límite
      if (gameState.particles.length < gameState.maxParticles - 5) {
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount;
          gameState.particles.push({
            x: drop.x,
            y: drop.y,
            vx: Math.cos(angle) * 6,
            vy: Math.sin(angle) * 6,
            life: 0.8,
            color: drop.color,
            size: 4,
          });
        }
      }
    }

    function spawnHotspot(isNegative = false) {
      if (!ENABLE_HOTSPOTS) return;
      const x = Math.random() * (W - 200) + 100;
      const y = Math.random() * (H - 200) + 100;
      gameState.hotspots.push({
        x,
        y,
        rad: isNegative ? 80 : 60, // Hotspots negativos son más grandes
        progress: 0,
        required: isNegative ? 10 : 3, // Positivos: 3s para completar, Negativos: no aplica
        expirationTimer: 0,
        maxExpiration: isNegative ? 6 : 5, // Positivos: 5s, Negativos: 6s (estilo COD Zombies)
        active: false,
        isNegative, // true = zona de peligro, false = zona positiva
      });
    }

    function showUpgradeScreen() {
      gameState.state = 'paused';
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
        const available = WEAPONS.filter(w => 
          !gameState.player.weapons.find((pw: Weapon) => pw.id === w.id)
        );
        for (const weapon of available) {
          availableUpgrades.push({ 
            type: "weapon", 
            data: { ...weapon }, 
            rarity: weapon.rarity 
          });
        }
      }
      
      // Tome upgrades
      if (tomesFull) {
        // Ofrecer mejoras variadas para tomos existentes
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
              { upgradeType: "special", descriptionKey: "tome.damage.special", rarity: "epic" }
            );
          } else if (t.effect === "speed") {
            upgradeVariants.push(
              { upgradeType: "effect", descriptionKey: "tome.speed.effect", rarity: "uncommon" },
              { upgradeType: "special", descriptionKey: "tome.speed.special", rarity: "rare" }
            );
          } else if (t.effect === "range") {
            upgradeVariants.push(
              { upgradeType: "effect", descriptionKey: "tome.range.effect", rarity: "uncommon" },
              { upgradeType: "special", descriptionKey: "tome.range.special", rarity: "rare" }
            );
          } else if (t.effect === "fireRate") {
            upgradeVariants.push(
              { upgradeType: "effect", descriptionKey: "tome.fireRate.effect", rarity: "rare" },
              { upgradeType: "special", descriptionKey: "tome.fireRate.special", rarity: "epic" }
            );
          } else if (t.effect === "bounce") {
            upgradeVariants.push(
              { upgradeType: "effect", descriptionKey: "tome.bounce.effect", rarity: "epic" },
              { upgradeType: "special", descriptionKey: "tome.bounce.special", rarity: "legendary" }
            );
          } else if (t.effect === "multishot") {
            upgradeVariants.push(
              { upgradeType: "effect", descriptionKey: "tome.multishot.effect", rarity: "legendary" },
              { upgradeType: "special", descriptionKey: "tome.multishot.special", rarity: "epic" }
            );
          } else if (t.effect === "xp") {
            upgradeVariants.push(
              { upgradeType: "effect", descriptionKey: "tome.xp.effect", rarity: "rare" },
              { upgradeType: "special", descriptionKey: "tome.xp.special", rarity: "epic" }
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
        // Tomos nuevos disponibles
        const available = TOMES.filter(t => 
          !gameState.player.tomes.find((pt: Tome) => pt.id === t.id)
        );
        for (const tome of available) {
          availableUpgrades.push({ 
            type: "tome", 
            data: { ...tome }, 
            rarity: tome.rarity 
          });
        }
      }
      
      // Items siempre disponibles (pero filtrar los que ya tiene)
      for (const item of ITEMS) {
        // No agregar si ya lo tiene
        if (!gameState.player.items.find((it: Item) => it.id === item.id)) {
          // Control de legendarios: máximo uno cada 3 waves
          if (item.rarity === "legendary") {
            // Solo permitir legendarios en waves múltiplos de 3
            if (gameState.wave % 3 === 0) {
              availableUpgrades.push({ 
                type: "item", 
                data: item, 
                rarity: item.rarity 
              });
            }
          } else {
            availableUpgrades.push({ 
              type: "item", 
              data: item, 
              rarity: item.rarity 
            });
          }
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

    function selectUpgrade(index: number) {
      const option = gameState.upgradeOptions[index];
      if (!option) return;

      gameState.upgradeAnimation = 1.5;
      gameState.state = 'running';

      if (option.type === "weapon") {
        const weapon = option.data as Weapon;
        
        if (option.isLevelUp && option.targetIndex !== undefined) {
          // Mejora de nivel de arma existente
          const existingWeapon = gameState.player.weapons[option.targetIndex];
          existingWeapon.level++;
          
          // Aplicar mejora según el tipo
          if (option.upgradeType === "damage") {
            existingWeapon.damage *= 1.30;
          } else if (option.upgradeType === "fireRate") {
            existingWeapon.fireRate *= 1.25;
          } else if (option.upgradeType === "range") {
            existingWeapon.range *= 1.20;
          } else if (option.upgradeType === "special") {
            // Mejoras especiales según tipo de arma
            if (existingWeapon.special === "spread") {
              existingWeapon.damage *= 1.15; // Más pellets = más daño total
            } else if (existingWeapon.special === "aoe") {
              existingWeapon.damage *= 1.50; // Mayor radio
            } else if (existingWeapon.special === "pierce") {
              existingWeapon.damage *= 1.20; // Más perforaciones
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
          // Mejora de nivel de tomo existente
          const existingTome = gameState.player.tomes[option.targetIndex];
          const currentLevel = existingTome.level;
          existingTome.level++;
          
          // Aplicar bonificación según el efecto del tomo y su nivel específico
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
              { rate: 1, interval: 5 },   // LVL 1: 1 HP cada 5s
              { rate: 1, interval: 4 },   // LVL 2: 1 HP cada 4s
              { rate: 2, interval: 5 },   // LVL 3: 2 HP cada 5s
              { rate: 2, interval: 4 },   // LVL 4: 2 HP cada 4s
              { rate: 3, interval: 4 },   // LVL 5: 3 HP cada 4s
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
          // Nuevo tomo
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
        
        // Verificar que no esté duplicado
        if (!gameState.player.itemFlags[item.id]) {
          gameState.player.items.push(item);
          gameState.player.itemFlags[item.id] = true;
          
          // Aplicar efectos de ítems
          switch(item.effect) {
            case "speedboost":
              gameState.player.stats.speedMultiplier *= 1.05;
              break;
            case "firerateitem":
              gameState.player.stats.fireRateMultiplier *= 1.05;
              break;
            case "maxhp10":
              gameState.player.maxhp += 10;
              gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + 10);
              break;
            case "magnetitem":
              gameState.player.stats.magnetMultiplier *= 1.1;
              break;
            case "powerupduration":
              gameState.player.stats.powerupDuration *= 1.05;
              break;
            case "xpbonus":
              gameState.player.stats.xpBonus += 10;
              break;
            case "precisionitem":
              gameState.player.stats.precision += 10;
              break;
            case "damagereduction":
              gameState.player.stats.damageReduction += 0.05;
              break;
            case "bounceitem":
              gameState.player.stats.bounces += 1;
              break;
            // dropcapacity eliminado - no estaba implementado
            case "globalfirerate":
              gameState.player.stats.fireRateMultiplier *= 1.1;
              break;
            case "firsthitimmune":
              // Se maneja en la colisión
              break;
            case "jetspeed":
              gameState.player.stats.speedMultiplier *= 1.15;
              break;
            case "reactiveshield":
              gameState.player.stats.reactiveShieldActive = true;
              break;
            case "chaosdamage":
              gameState.player.stats.chaosDamage = true;
              break;
            case "maxhp15":
              const bonus15 = Math.floor(gameState.player.maxhp * 0.15);
              gameState.player.maxhp += bonus15;
              gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + bonus15);
              break;
            case "heavyarmor":
              gameState.player.stats.speedMultiplier *= 0.9;
              gameState.player.stats.damageReduction += 0.25;
              break;
            case "plasmafrag":
              gameState.player.stats.bounces += 1;
              gameState.player.stats.rangeMultiplier *= 1.15;
              break;
            case "doublexp":
              gameState.player.stats.xpMultiplier *= 2;
              break;
            case "solargauntlet":
              gameState.player.stats.solarGauntletKills = 0;
              break;
            case "infernalengine":
              gameState.player.stats.speedMultiplier *= 1.25;
              gameState.player.stats.damageMultiplier *= 1.2;
              gameState.player.stats.damageReduction -= 0.1; // Recibe +10% daño
              break;
            case "bloodstone":
              gameState.player.stats.bloodstoneKills = 0;
              break;
            case "hordetotem":
              // Se maneja en spawn de enemigos y XP
              break;
            case "artificialheart":
              gameState.player.maxhp += 50;
              gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + 50);
              break;
            case "infinitylens":
              gameState.player.stats.speedMultiplier *= 1.1;
              gameState.player.stats.damageMultiplier *= 1.1;
              gameState.player.stats.rangeMultiplier *= 1.1;
              gameState.player.stats.xpMultiplier *= 1.1;
              break;
          }
        }
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
      
      // Botón de cambiar canción (solo cuando el juego está corriendo)
      if (ENABLE_MUSIC && gameState.state === 'running') {
        const musicBtnW = 160;
        const musicBtnH = 45;
        const musicBtnX = W - musicBtnW - 20;
        const musicBtnY = H - musicBtnH - 70;
        
        if (mx >= musicBtnX && mx <= musicBtnX + musicBtnW && 
            my >= musicBtnY && my <= musicBtnY + musicBtnH) {
          
          // Si la música no ha iniciado, iniciarla
          if (!gameState.musicStarted) {
            gameState.musicStarted = true;
            playNextTrack();
          } else {
            // Cambiar a la siguiente canción
            gameState.currentMusicIndex = (gameState.currentMusicIndex + 1) % gameState.musicTracks.length;
            playNextTrack();
          }
          return;
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
      } else if (gameState.state === 'paused' && !gameState.showUpgradeUI && gameState.countdownTimer <= 0) {
        const layout = getPauseMenuLayout(W, H);
        const { menuX, menuY, menuW, menuH, padding, scale } = layout;
        
        const buttonH = 56 * scale;
        const buttonGap = 14 * scale;
        const buttonCount = 4;
        const audioPanelHeight = 200 * scale;
        const audioPanelMargin = 24 * scale;
        const baseButtonsY =
          menuY +
          menuH -
          padding -
          buttonH * buttonCount -
          buttonGap * (buttonCount - 1) -
          16 * scale;
        const buttonsY = baseButtonsY - (gameState.pauseMenuAudioOpen ? audioPanelHeight + audioPanelMargin : 0);

        const continueBtn = { x: menuX + padding, y: buttonsY, w: menuW - padding * 2, h: buttonH };
        const audioBtn = {
          x: menuX + padding,
          y: buttonsY + buttonH + buttonGap,
          w: menuW - padding * 2,
          h: buttonH,
        };
        const languageBtn = {
          x: menuX + padding,
          y: audioBtn.y + buttonH + buttonGap,
          w: menuW - padding * 2,
          h: buttonH,
        };
        const restartBtn = {
          x: menuX + padding,
          y: languageBtn.y + buttonH + buttonGap,
          w: menuW - padding * 2,
          h: buttonH,
        };

        if (mx >= continueBtn.x && mx <= continueBtn.x + continueBtn.w && my >= continueBtn.y && my <= continueBtn.y + continueBtn.h) {
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

        if (mx >= restartBtn.x && mx <= restartBtn.x + restartBtn.w && my >= restartBtn.y && my <= restartBtn.y + restartBtn.h) {
          resetGame();
          return;
        }

        if (gameState.pauseMenuAudioOpen) {
          const panelX = menuX + padding;
          const panelW = menuW - padding * 2;
          const panelY = buttonsY - audioPanelMargin - audioPanelHeight;

          const sliderX = panelX + 28 * scale;
          const sliderW = panelW - 56 * scale;
          const sliderY = panelY + 70 * scale;
          const sliderHitY = sliderY - 14 * scale;
          const sliderHitH = 10 * scale + 28 * scale;

          if (mx >= sliderX && mx <= sliderX + sliderW && my >= sliderHitY && my <= sliderHitY + sliderHitH) {
            const relative = clamp((mx - sliderX) / sliderW, 0, 1);
            gameState.targetMusicVolume = relative;
            if (!gameState.musicMuted) {
              gameState.musicVolume = relative;
              if (gameState.music) {
                gameState.music.volume = relative;
              }
            }
            return;
          }

          const toggleGap = 18 * scale;
          const toggleHeight = 56 * scale;
          const toggleWidth = (panelW - toggleGap - 40 * scale) / 2;
          const toggleY = sliderY + 10 * scale + 36 * scale;
          const musicToggle = {
            x: panelX + 20 * scale,
            y: toggleY,
            w: toggleWidth,
            h: toggleHeight,
          };
          const sfxToggle = {
            x: musicToggle.x + toggleWidth + toggleGap,
            y: toggleY,
            w: toggleWidth,
            h: toggleHeight,
          };

          if (mx >= musicToggle.x && mx <= musicToggle.x + musicToggle.w && my >= musicToggle.y && my <= musicToggle.y + musicToggle.h) {
            gameState.musicMuted = !gameState.musicMuted;
            if (gameState.music) {
              if (gameState.musicMuted) {
                gameState.music.pause();
              } else {
                gameState.music.volume = gameState.targetMusicVolume;
                gameState.music.play().catch((err) => console.warn("Audio play failed:", err));
              }
            }
            return;
          }

          if (mx >= sfxToggle.x && mx <= sfxToggle.x + sfxToggle.w && my >= sfxToggle.y && my <= sfxToggle.y + sfxToggle.h) {
            gameState.sfxMuted = !gameState.sfxMuted;
            return;
          }
        }
      } else if (gameState.state === 'gameover') {
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
          if (gameState.gameOverMusic) {
            gameState.gameOverMusic.pause();
            gameState.gameOverMusic.currentTime = 0;
          }
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

      // Animations que deben correr siempre
      if (gameState.levelUpAnimation > 0) gameState.levelUpAnimation = Math.max(0, gameState.levelUpAnimation - dt * 2);
      if (gameState.upgradeAnimation > 0) gameState.upgradeAnimation = Math.max(0, gameState.upgradeAnimation - dt);
      if (gameState.upgradeUIAnimation < 1 && gameState.showUpgradeUI) gameState.upgradeUIAnimation = Math.min(1, gameState.upgradeUIAnimation + dt * 3);
      
      // Music notification timer
      if (ENABLE_MUSIC) {
        if (gameState.musicNotificationTimer > 0) {
          gameState.musicNotificationTimer = Math.max(0, gameState.musicNotificationTimer - dt);
        }
      } else {
        gameState.musicNotificationTimer = 0;
      }
      
      // Smooth volume transition (animación suave del volumen)
      if (Math.abs(gameState.musicVolume - gameState.targetMusicVolume) > 0.001) {
        const volumeSpeed = 2; // Velocidad de transición (más alto = más rápido)
        gameState.musicVolume += (gameState.targetMusicVolume - gameState.musicVolume) * dt * volumeSpeed;
        
        // Aplicar el volumen al audio
        if (gameState.music) {
          gameState.music.volume = gameState.musicVolume;
        }
        
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
      if (gameState.state === 'running' && gameState.keys['r']) {
        gameState.restartTimer += dt;
        if (gameState.restartTimer >= gameState.restartHoldTime) {
          resetGame();
          gameState.restartTimer = 0;
        }
      } else {
        gameState.restartTimer = 0;
      }

      // Game Over - seguir corriendo el tiempo durante la animación
      if (gameState.state === 'gameover') {
        gameState.gameOverAnimationTimer += dt;
        gameState.time += dt; // El tiempo sigue corriendo
        return;
      }
      
      // Countdown timer después de pausa (más rápido: 2x velocidad)
      if (gameState.countdownTimer > 0) {
        gameState.countdownTimer -= dt * 2; // 2x más rápido
        if (gameState.countdownTimer <= 0) {
          gameState.countdownTimer = 0;
          gameState.state = 'running';
        }
        // NO return aquí - seguir actualizando para que se vea el juego
      }
      
      // Solo actualizar lógica del juego si está corriendo (pero no durante countdown)
      if (gameState.state !== 'running' || gameState.countdownTimer > 0) return;

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
        gameState.player.stats.firstHitImmuneUsed = false;
        
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
        const isMiniBossWaveForTarget = gameState.wave === 3 || (gameState.wave > 3 && (gameState.wave - 3) % 5 === 0 && gameState.wave % 5 !== 0);
        if (isMiniBossWaveForTarget) {
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
            x: W / 2,
            y: H / 2,
            vx: Math.cos(angle) * 8,
            vy: Math.sin(angle) * 8,
            life: 1.5,
            color: "#a855f7",
            size: 4,
          });
        }
        
        // Recompensa por completar wave
        collectXP(20 + gameState.wave * 5);
        
        // Eventos ambientales deshabilitados para mejorar rendimiento
        gameState.environmentalEvent = null;
        gameState.eventPhase = "none";
        gameState.eventNotification = 0;
        gameState.eventIntensity = 0;
        gameState.eventActivatedThisWave = false;
        gameState.fogOpacity = 0;
        gameState.fogZones = [];
        gameState.fogWarningZones = [];
        gameState.stormZone = null;

      // Reducir timer de notificación de wave
      if (gameState.waveNotification > 0) {
        gameState.waveNotification = Math.max(0, gameState.waveNotification - dt);
      }
      
      if (!ENABLE_HOTSPOTS) {
        gameState.hotspots.length = 0;
        gameState.inDangerZone = false;
        gameState.dangerZoneTimer = 0;
      }

      if (ENABLE_HOTSPOTS) {
        // Hotspot spawning (positivos)
        gameState.hotspotTimer += dt;
        if (gameState.hotspotTimer >= 30 && gameState.hotspots.filter(h => !h.isNegative).length < 2) {
          gameState.hotspotTimer = 0;
          spawnHotspot(false);
        }

        if (gameState.wave >= 3 && gameState.hotspots.filter(h => h.isNegative).length < (gameState.wave >= 11 ? 2 : 1)) {
          let dangerChance = 0.02;
          if (gameState.wave >= 6 && gameState.wave < 11) {
            dangerChance = 0.025;
          } else if (gameState.wave >= 11) {
            dangerChance = 0.033;
          }

          if (Math.random() < dangerChance * dt) {
            spawnHotspot(true);
          }
        }

        gameState.inDangerZone = false;

        for (let i = gameState.hotspots.length - 1; i >= 0; i--) {
          const h = gameState.hotspots[i];
          const d = Math.hypot(h.x - gameState.player.x, h.y - gameState.player.y);

          if (h.isRadioactive) {
            h.expirationTimer += dt;
            if (h.expirationTimer >= h.maxExpiration) {
              gameState.hotspots.splice(i, 1);
            }
            continue;
          }

          const isDangerZonePermanent = h.isNegative && gameState.wave >= 8;

          if (d < h.rad) {
            h.active = true;

            if (h.isNegative) {
              gameState.inDangerZone = true;
              gameState.dangerZoneTimer += dt;
              gameState.player.hp -= 8 * dt;

              if (gameState.particles.length < gameState.maxParticles && Math.random() < 0.1) {
                gameState.particles.push({
                  x: gameState.player.x + (Math.random() - 0.5) * 24,
                  y: gameState.player.y + (Math.random() - 0.5) * 24,
                  vx: (Math.random() - 0.5) * 1.5,
                  vy: -Math.random() * 2,
                  life: 0.6,
                  color: "#ef4444",
                  size: 3,
                });
              }

              if (gameState.player.hp <= 0) {
                endGame();
              }
            } else {
              h.progress += dt;
              if (h.progress >= h.required) {
                collectXP(60);
                gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + 2);
                gameState.hotspots.splice(i, 1);
              }
            }
          } else {
            h.active = false;
            if (!isDangerZonePermanent) {
              h.expirationTimer += dt;
              if (h.expirationTimer >= h.maxExpiration) {
                gameState.hotspots.splice(i, 1);
              }
            }
          }
        }

        if (!gameState.inDangerZone) {
          gameState.dangerZoneTimer = 0;
        }
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
      const isMoving = gameState.keys["w"] || gameState.keys["a"] || gameState.keys["s"] || gameState.keys["d"] ||
                       gameState.keys["arrowup"] || gameState.keys["arrowleft"] || gameState.keys["arrowdown"] || gameState.keys["arrowright"];
      
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

      // Regeneración del tomo
      if (gameState.player.stats.regenRate > 0 && gameState.player.stats.regenInterval > 0) {
        gameState.regenTimer += dt;
        if (gameState.regenTimer >= gameState.player.stats.regenInterval) {
          gameState.regenTimer = 0;
          gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + gameState.player.stats.regenRate);
        }
      }
      
      // Regeneración del item (si lo tiene)
      if (gameState.player.items.find((it: Item) => it.id === "regen")) {
        // El item de regeneración es adicional al tomo
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
                  color: "#f87171",
                  size: 3,
                });
              }
            }
          }
        }
      }

      if (gameState.player.ifr > 0) gameState.player.ifr = Math.max(0, gameState.player.ifr - dt);

      // Movimiento (WASD o flechas)
      let vx = (gameState.keys["d"] || gameState.keys["arrowright"] ? 1 : 0) - (gameState.keys["a"] || gameState.keys["arrowleft"] ? 1 : 0);
      let vy = (gameState.keys["s"] || gameState.keys["arrowdown"] ? 1 : 0) - (gameState.keys["w"] || gameState.keys["arrowup"] ? 1 : 0);
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
          const isInZone = gameState.player.x >= zone.x && gameState.player.x <= zone.x + zone.width &&
                          gameState.player.y >= zone.y && gameState.player.y <= zone.y + zone.height;
          
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
      newX = Math.max(gameState.player.rad, Math.min(W - gameState.player.rad, newX));
      newY = Math.max(gameState.player.rad, Math.min(H - gameState.player.rad, newY));
      
      gameState.player.x = newX;
      gameState.player.y = newY;

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
      const normalEnemies = gameState.enemies.filter(e => !e.isBoss && !e.isMiniBoss).length;
      const canSpawnNow = !gameState.tutorialActive &&
                          gameState.waveEnemiesSpawned < gameState.waveEnemiesTotal && 
                          normalEnemies < gameState.maxConcurrentEnemies &&
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
            const normalEnemies = gameState.enemies.filter(e => !e.isBoss && !e.isMiniBoss).length;
            if (gameState.waveEnemiesSpawned < gameState.waveEnemiesTotal && 
                normalEnemies < gameState.maxConcurrentEnemies) {
              spawnEnemy();
              gameState.waveEnemiesSpawned++;
            }
          }
          gameState.lastSpawn = 0;
        }
      }
      
      // Boss spawn cada 5 waves (NO durante tutorial, NO cuenta en límite concurrente)
      if (!gameState.tutorialActive && gameState.wave % 5 === 0 && gameState.waveEnemiesSpawned === gameState.waveEnemiesTotal - 1 && gameState.enemies.length === 0) {
        spawnBoss();
        gameState.waveEnemiesSpawned++;
      }
      
      // Mini-boss spawn (wave 3, 7, 12, 17, 22...) (NO durante tutorial, NO cuenta en límite concurrente)
      const isMiniBossWave = gameState.wave === 3 || (gameState.wave > 3 && (gameState.wave - 3) % 5 === 0);
      if (!gameState.tutorialActive && isMiniBossWave && gameState.waveEnemiesSpawned === gameState.waveEnemiesTotal - 1 && gameState.enemies.length === 0) {
        spawnMiniBoss();
        gameState.waveEnemiesSpawned++;
      }

      // Mover enemigos y aplicar efectos elementales
      for (const e of gameState.enemies) {
        // Efectos elementales (DoT)
        if (e.burnTimer > 0) {
          e.burnTimer -= dt;
          e.hp -= 0.5 * dt; // 0.5 daño por segundo
          // Partículas de fuego
          if (Math.random() < 0.1 && gameState.particles.length < gameState.maxParticles) {
            gameState.particles.push({
              x: e.x + (Math.random() - 0.5) * e.rad,
              y: e.y + (Math.random() - 0.5) * e.rad,
              vx: (Math.random() - 0.5),
              vy: -1,
              life: 0.5,
              color: "#fb923c",
              size: 3,
            });
          }
        }
        
        if (e.poisonTimer > 0) {
          e.poisonTimer -= dt;
          e.hp -= 0.3 * dt; // 0.3 daño por segundo (ignora defensa)
          // Partículas de veneno
          if (Math.random() < 0.1 && gameState.particles.length < gameState.maxParticles) {
            gameState.particles.push({
              x: e.x + (Math.random() - 0.5) * e.rad,
              y: e.y + (Math.random() - 0.5) * e.rad,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              life: 0.8,
              color: "#84cc16",
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
          if (Math.random() < warningIntensity && gameState.particles.length < gameState.maxParticles) {
            gameState.particles.push({
              x: e.x + (Math.random() - 0.5) * e.rad * 2,
              y: e.y + (Math.random() - 0.5) * e.rad * 2,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              life: 0.3,
              color: e.explosionTimer < 0.5 ? "#fbbf24" : "#ef4444",
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
                  gameState.player.x = Math.max(gameState.player.rad, Math.min(W - gameState.player.rad, gameState.player.x));
                  gameState.player.y = Math.max(gameState.player.rad, Math.min(H - gameState.player.rad, gameState.player.y));
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
            if (gameState.particles.length < gameState.maxParticles - 50) {
              for (let j = 0; j < 50; j++) {
                const angle = (Math.PI * 2 * j) / 50;
                const speed = 8 + Math.random() * 8;
                gameState.particles.push({
                  x: e.x,
                  y: e.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  life: 1 + Math.random() * 0.5,
                  color: j % 2 === 0 ? "#ef4444" : "#fb923c",
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
            playSound(80, 0.4, "sawtooth", 0.5);
            
            // Eliminar bomber
            e.hp = 0;
          }
        }
        
        if (e.specialType === "summoner" && e.summonCooldown !== undefined) {
          e.summonCooldown -= dt;
          const normalEnemies = gameState.enemies.filter(en => !en.isBoss && !en.isMiniBoss).length;
          if (e.summonCooldown <= 0 && normalEnemies < gameState.maxConcurrentEnemies) {
            // Invocar zombi pequeño (NO cuenta en límite si viene de summoner en wave boss)
            for (let i = 0; i < 2; i++) {
              const angle = Math.random() * Math.PI * 2;
              const dist = 30;
              gameState.enemies.push({
                x: e.x + Math.cos(angle) * dist,
                y: e.y + Math.sin(angle) * dist,
                rad: 8,
                hp: 1,
                maxhp: 1,
                spd: 1.2,
                enemyType: "weak",
                damage: 3,
                isElite: false,
                isMiniBoss: false,
                isBoss: false,
                isSummoned: true, // Marcado como invocado, no cuenta para la wave
                color: "#a855f7",
                specialType: null,
                frozenTimer: 0,
                burnTimer: 0,
                poisonTimer: 0,
              });
            }
            e.summonCooldown = 8; // 8 segundos entre invocaciones
          }
        }
        
        // Movimiento hacia el jugador (excepto bosses con comportamiento especial)
        if (!e.isBoss) {
          const dx = gameState.player.x - e.x;
          const dy = gameState.player.y - e.y;
          const d = Math.hypot(dx, dy) || 1;
          
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
              e.x = Math.random() * (W - 100) + 50;
              e.y = Math.random() * (H - 100) + 50;
              e.jumpCooldown = 4;
              
              // Partículas de salto
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
              e.x = Math.random() * (W - 100) + 50;
              e.y = Math.random() * (H - 100) + 50;
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

      // Disparo automático
      autoShoot(dt);

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
          if (b.x < 0 || b.x > W) {
            b.dir = Math.PI - b.dir;
            b.bounces--;
            b.x = Math.max(0, Math.min(W, b.x));
          }
          if (b.y < 0 || b.y > H) {
            b.dir = -b.dir;
            b.bounces--;
            b.y = Math.max(0, Math.min(H, b.y));
          }
        }
      }

      gameState.bullets = gameState.bullets.filter((b: any) => b.life > 0 && b.x >= -50 && b.x <= W + 50 && b.y >= -50 && b.y <= H + 50);

      // Colisiones bala-enemigo
      for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const e = gameState.enemies[i];
        for (const b of gameState.bullets) {
          // Skip balas de enemigos
          if (b.isEnemyBullet) continue;
          
          if (Math.hypot(e.x - b.x, e.y - b.y) < e.rad + 4) {
            e.hp -= b.damage;
            
            // Aplicar efectos elementales
            if (b.fire) {
              e.burnTimer = 3; // 3 segundos de fuego
            }
            if (b.freeze) {
              e.frozenTimer = 2; // 2 segundos congelado
            }
            
            // Chain lightning
            if (b.chain && b.chainCount > 0) {
              b.chainCount--;
              // Buscar el enemigo más cercano que no haya sido golpeado
              let closestEnemy = null;
              let closestDist = Infinity;
              for (const e2 of gameState.enemies) {
                if (e2 !== e && !e2.chainedThisShot) {
                  const dist = Math.hypot(e2.x - b.x, e2.y - b.y);
                  if (dist < closestDist && dist < 150) {
                    closestDist = dist;
                    closestEnemy = e2;
                  }
                }
              }
              
              if (closestEnemy) {
                closestEnemy.hp -= b.damage * 0.7;
                closestEnemy.chainedThisShot = true;
                // Efecto visual de chain
                if (gameState.particles.length < gameState.maxParticles - 5) {
                  for (let j = 0; j < 5; j++) {
                    const t = j / 5;
                    gameState.particles.push({
                      x: b.x + (closestEnemy.x - b.x) * t,
                      y: b.y + (closestEnemy.y - b.y) * t,
                      vx: (Math.random() - 0.5) * 2,
                      vy: (Math.random() - 0.5) * 2,
                      life: 0.3,
                      color: "#60a5fa",
                      size: 3,
                    });
                  }
                }
                // Continuar la cadena
                b.x = closestEnemy.x;
                b.y = closestEnemy.y;
              } else {
                b.life = 0;
              }
            }
            
            // Limpiar flag de chain
            for (const enemy of gameState.enemies) {
              enemy.chainedThisShot = false;
            }
            
            // 💥 EXPLOSIÓN AOE (Lanzacohetes y armas explosivas)
            // Splash damage en área grande
            if (b.aoe) {
              const explosionRadius = 100; // Radio grande de explosión
              const splashDamage = b.damage * 0.75; // 75% del daño a todos en el área
              
              for (const e2 of gameState.enemies) {
                const distToExplosion = Math.hypot(e2.x - b.x, e2.y - b.y);
                if (distToExplosion < explosionRadius) {
                  // Daño que disminuye con la distancia
                  const damageMultiplier = 1 - (distToExplosion / explosionRadius) * 0.5;
                  e2.hp -= splashDamage * damageMultiplier;
                  
                  // Partículas de impacto en cada enemigo afectado
                  if (gameState.particles.length < gameState.maxParticles - 3) {
                    for (let k = 0; k < 3; k++) {
                      gameState.particles.push({
                        x: e2.x,
                        y: e2.y,
                        vx: (Math.random() - 0.5) * 3,
                        vy: (Math.random() - 0.5) * 3,
                        life: 0.4,
                        color: "#ef4444",
                        size: 4,
                      });
                    }
                  }
                }
              }
              
              // Partículas de explosión central
              if (gameState.particles.length < gameState.maxParticles - 30) {
                for (let j = 0; j < 30; j++) {
                  const angle = (Math.PI * 2 * j) / 30;
                  const speed = 3 + Math.random() * 5;
                  gameState.particles.push({
                    x: b.x,
                    y: b.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.8,
                    color: j % 2 === 0 ? "#a855f7" : "#f97316",
                    size: 4,
                  });
                }
              }
            }

            // Rebote en enemigos (si bounceOnEnemies está activado)
            if (b.bounceOnEnemies && b.bounces > 0) {
              // Buscar el enemigo más cercano que no sea el actual
              let closestEnemy = null;
              let closestDist = Infinity;
              for (const e2 of gameState.enemies) {
                if (e2 !== e) {
                  const dist = Math.hypot(e2.x - b.x, e2.y - b.y);
                  if (dist < closestDist) {
                    closestDist = dist;
                    closestEnemy = e2;
                  }
                }
              }
              
              // Si hay un enemigo cercano, dirigir la bala hacia él
              if (closestEnemy && closestDist < 200) {
                b.dir = Math.atan2(closestEnemy.y - b.y, closestEnemy.x - b.x);
                b.bounces--;
                // Partículas de rebote con límite
                if (gameState.particles.length < gameState.maxParticles - 5) {
                  for (let j = 0; j < 5; j++) {
                    gameState.particles.push({
                      x: b.x,
                      y: b.y,
                      vx: (Math.random() - 0.5) * 3,
                      vy: (Math.random() - 0.5) * 3,
                      life: 0.3,
                      color: b.color,
                      size: 2,
                    });
                  }
                }
              } else if (!b.pierce) {
                b.life = 0;
              }
            } else if (!b.pierce) {
              b.life = 0;
            }

            if (e.hp <= 0) {
              gameState.enemies.splice(i, 1);
              
              // Explosivos: explotan al morir
              if (e.specialType === "explosive") {
                for (const e2 of gameState.enemies) {
                  if (Math.hypot(e2.x - e.x, e2.y - e.y) < 80) {
                    e2.hp -= 10;
                  }
                }
                // Daño al jugador si está cerca
                if (Math.hypot(gameState.player.x - e.x, gameState.player.y - e.y) < 80) {
                  if (gameState.player.ifr <= 0 && gameState.player.shield === 0) {
                    gameState.player.hp -= 10;
                    gameState.player.ifr = gameState.player.ifrDuration;
                  }
                }
                // Partículas de explosión grande
                if (gameState.particles.length < gameState.maxParticles - 30) {
                  for (let j = 0; j < 30; j++) {
                    const angle = (Math.PI * 2 * j) / 30;
                    gameState.particles.push({
                      x: e.x,
                      y: e.y,
                      vx: Math.cos(angle) * 10,
                      vy: Math.sin(angle) * 10,
                      life: 1,
                      color: "#ef4444",
                      size: 5,
                    });
                  }
                }
              }
              
              // Incrementar contador de muertes de la wave (solo si no es invocado)
              if (!e.isSummoned) {
                gameState.waveKills++;
              }
              
              // Puntos y XP según tipo de enemigo
              let points = 10;
              let xpBundles = 1;
              let dropChance = 0;
              
              if (e.isBoss) {
                // Boss muerto: recompensas legendarias
                points = 500;
                xpBundles = 10;
                // Drop garantizado: item legendario
                const legendaryItems = ITEMS.filter(it => it.rarity === "legendary" && !gameState.player.items.find((pi: Item) => pi.id === it.id));
                if (legendaryItems.length > 0) {
                  const randomLegendary = legendaryItems[Math.floor(Math.random() * legendaryItems.length)];
                  gameState.player.items.push(randomLegendary);
                  gameState.player.itemFlags[randomLegendary.id] = true;
                  
                  // Aplicar efecto del item
                  switch(randomLegendary.effect) {
                    case "doublexp": gameState.player.stats.xpMultiplier *= 2; break;
                    case "solargauntlet": gameState.player.stats.solarGauntletKills = 0; break;
                    case "infernalengine":
                      gameState.player.stats.speedMultiplier *= 1.25;
                      gameState.player.stats.damageMultiplier *= 1.20;
                      gameState.player.stats.damageReduction -= 0.10;
                      break;
                    case "bloodstone": gameState.player.stats.bloodstoneKills = 0; break;
                    case "hordetotem": break;
                    case "artificialheart":
                      gameState.player.maxhp += 50;
                      gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + 50);
                      break;
                    case "infinitylens":
                      gameState.player.stats.speedMultiplier *= 1.1;
                      gameState.player.stats.damageMultiplier *= 1.1;
                      gameState.player.stats.rangeMultiplier *= 1.1;
                      gameState.player.stats.xpMultiplier *= 1.1;
                      break;
                  }
                }
                // Curación completa
                gameState.player.hp = gameState.player.maxhp;
              } else if (e.isMiniBoss) {
                points = 100;
                xpBundles = Math.floor(Math.random() * 3) + 4; // 4-6 bundles
                dropChance = 0.10; // 10% chance de drop temporal
              } else if (e.isElite) {
                // Élites: Mejor loot
                points = 25;
                xpBundles = 2;
                dropChance = 0.15; // 15% chance
              } else if (e.specialType) {
                // Enemigos especiales
                points = 15;
                xpBundles = 1;
                dropChance = 0.08;
              } else if (e.enemyType === "strong") {
                points = 10;
                xpBundles = 1;
                dropChance = 0.05;
              } else if (e.enemyType === "medium") {
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
              
              // Drop multiple XP bundles
              for (let k = 0; k < xpBundles; k++) {
                const offsetX = (Math.random() - 0.5) * 40;
                const offsetY = (Math.random() - 0.5) * 40;
                let xpValue = e.isMiniBoss ? 30 : (e.enemyType === "strong" ? 5 : e.enemyType === "medium" ? 3 : 2);
                
                // Horde Totem: +2 XP por kill
                if (gameState.player.itemFlags.hordetotem) {
                  xpValue += 2;
                }
                
                dropXP(e.x + offsetX, e.y + offsetY, xpValue);
              }
              
              // Drop de curación (5% de probabilidad - más raro)
              const healRoll = Math.random();
              const luckMultiplier = gameState.player.itemFlags.luck ? 1.5 : 1;
              
              if (healRoll < 0.05 * luckMultiplier) {
                dropHeal(e.x, e.y);
              }
              
              // Drop temporal con probabilidad
              if (Math.random() < dropChance) {
                const roll = Math.random();
                const powerupType = roll < 0.3 ? "magnet" : roll < 0.5 ? "shield" : roll < 0.65 ? "rage" : "speed";
                dropPowerup(e.x, e.y, powerupType);
              }

              // Vampirismo
              if (gameState.player.stats.vampire > 0) {
                const healAmount = Math.floor(b.damage * gameState.player.stats.vampire * 10);
                gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + healAmount);
              }
              
              // Solar Gauntlet: cada 10 kills dispara proyectil masivo
              if (gameState.player.itemFlags.solargauntlet) {
                gameState.player.stats.solarGauntletKills++;
                if (gameState.player.stats.solarGauntletKills >= 10) {
                  gameState.player.stats.solarGauntletKills = 0;
                  // Disparar proyectil masivo en todas direcciones
                  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
                    gameState.bullets.push({
                      x: gameState.player.x,
                      y: gameState.player.y,
                      dir: angle,
                      spd: 15,
                      life: 3,
                      damage: gameState.player.stats.damageMultiplier * 50,
                      color: "#fbbf24",
                      bounces: 0,
                      bounceOnEnemies: false,
                      pierce: true,
                      aoe: false,
                    });
                  }
                  // Efecto visual con límite
                  if (gameState.particles.length < gameState.maxParticles - 30) {
                    for (let j = 0; j < 30; j++) {
                      const angle = (Math.PI * 2 * j) / 30;
                      gameState.particles.push({
                        x: gameState.player.x,
                        y: gameState.player.y,
                        vx: Math.cos(angle) * 10,
                        vy: Math.sin(angle) * 10,
                        life: 1,
                        color: "#fbbf24",
                        size: 5,
                      });
                    }
                  }
                  playPowerupSound();
                }
              }
              
              // Bloodstone: cada 30 kills recupera 5 HP
              if (gameState.player.itemFlags.bloodstone) {
                gameState.player.stats.bloodstoneKills++;
                if (gameState.player.stats.bloodstoneKills >= 30) {
                  gameState.player.stats.bloodstoneKills = 0;
                  gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + 5);
                  // Efecto visual de curación con límite
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
              
              playHitSound();

              // Partículas de muerte con límite
              if (gameState.particles.length < gameState.maxParticles - 8) {
                for (let j = 0; j < 8; j++) {
                  gameState.particles.push({
                    x: e.x,
                    y: e.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 0.8,
                    color: e.color,
                    size: e.rad / 3,
                  });
                }
              }
              break;
            }
          }
        }
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
      for (let i = gameState.drops.length - 1; i >= 0; i--) {
        const g = gameState.drops[i];
        const dx = gameState.player.x - g.x;
        const dy = gameState.player.y - g.y;
        const d = Math.hypot(dx, dy) || 1;
        
        // Magnet: aplicar multiplicadores del tomo y del powerup temporal
        let magnetRange = gameState.player.magnet * gameState.player.stats.magnetMultiplier;
        if (gameState.player.tempMagnetTimer > 0) {
          magnetRange *= 2; // Powerup temporal duplica el rango
        }
        
        if (d < magnetRange) {
          g.x += (dx / d) * 5;
          g.y += (dy / d) * 5;
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
                  color: "#22c55e",
                  size: 4,
                });
              }
            }
          } else if (g.type === "powerup") {
            collectPowerup(g);
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
            gameState.player.x = Math.max(gameState.player.rad, Math.min(W - gameState.player.rad, gameState.player.x));
            gameState.player.y = Math.max(gameState.player.rad, Math.min(H - gameState.player.rad, gameState.player.y));
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
            const hasFirstHitImmune = gameState.player.itemFlags.ballistichelmet;
            if (hasFirstHitImmune && !gameState.player.stats.firstHitImmuneUsed) {
              // Inmunidad al primer golpe
              gameState.player.stats.firstHitImmuneUsed = true;
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
                    color: "#fbbf24",
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
                    color: "#3b82f6",
                    size: 3,
                  });
                }
              }
            } else {
              const safeCurrentHp = Number.isFinite(Number(gameState.player.hp)) ? Number(gameState.player.hp) : Number(gameState.player.maxhp) || 0;
              const rawDmg = (e as any).damage;
              let dmg = Number.isFinite(Number(rawDmg)) ? Number(rawDmg) : 10;
              
              // Aplicar reducción de daño
              dmg *= (1 - gameState.player.stats.damageReduction);
              
              const nextHp = Math.max(0, Math.min(Number(gameState.player.maxhp) || 0, safeCurrentHp - dmg));
              gameState.player.hp = nextHp;
              gameState.player.ifr = gameState.player.ifrDuration;
              
              // Escudo Reactivo: empuja enemigos
              if (gameState.player.stats.reactiveShieldActive) {
                for (const enemy of gameState.enemies) {
                  const dist = Math.hypot(enemy.x - gameState.player.x, enemy.y - gameState.player.y);
                  if (dist < 150) {
                    const pushDir = Math.atan2(enemy.y - gameState.player.y, enemy.x - gameState.player.x);
                    enemy.x += Math.cos(pushDir) * 50;
                    enemy.y += Math.sin(pushDir) * 50;
                    // Daño a enemigos empujados
                    enemy.hp -= gameState.player.stats.damageMultiplier * 5;
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
                      color: "#a855f7",
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
      
      // HP Bar - Barra horizontal con valor numérico
      const hpBarX = 20;
      const hpBarY = 70; // Movido más abajo para no chocar con el anuncio del evento
      const hpBarW = 300;
      const hpBarH = 32;
      
      // Fondo de la barra de HP
      ctx.fillStyle = "rgba(20, 25, 35, 0.9)";
      ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
      ctx.strokeStyle = "#334155";
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
        if (hpPercent > 0.5) {
          hpGradient.addColorStop(0, "#ef4444");
          hpGradient.addColorStop(1, "#dc2626");
        } else if (hpPercent > 0.25) {
          hpGradient.addColorStop(0, "#f97316");
          hpGradient.addColorStop(1, "#ea580c");
        } else {
          hpGradient.addColorStop(0, "#dc2626");
          hpGradient.addColorStop(1, "#991b1b");
        }
        
        ctx.fillStyle = hpGradient;
        ctx.fillRect(hpBarX + 2, hpBarY + 2, currentHpBarW - 4, hpBarH - 4);
      }
      
      // Texto de HP en el centro
      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px system-ui";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(`HP ${Math.floor(gameState.player.hp)} / ${gameState.player.maxhp}`, hpBarX + hpBarW / 2, hpBarY + hpBarH / 2 + 6);
      ctx.shadowBlur = 0;
      
      // Efecto de parpadeo durante invulnerabilidad
      if (gameState.player.ifr > 0) {
        const flashAlpha = Math.sin(gameState.time * 20) * 0.3 + 0.3;
        ctx.globalAlpha = flashAlpha;
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 4;
        ctx.strokeRect(hpBarX - 2, hpBarY - 2, hpBarW + 4, hpBarH + 4);
        ctx.globalAlpha = 1;
      }

      // Shield icons
      if (gameState.player.shield > 0) {
        ctx.textAlign = "left";
        ctx.fillStyle = "#3b82f6";
        ctx.font = "bold 16px system-ui";
        for (let i = 0; i < gameState.player.shield; i++) {
          const shieldX = hpBarX + hpBarW + 15 + i * 30;
          ctx.beginPath();
          ctx.arc(shieldX, hpBarY + hpBarH / 2, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#2563eb";
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
      ctx.fillStyle = "rgba(20, 25, 35, 0.9)";
      ctx.fillRect(staminaBarX, staminaBarY, staminaBarW, staminaBarH);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.strokeRect(staminaBarX, staminaBarY, staminaBarW, staminaBarH);
      
      // Barra de stamina actual (amarilla/verde)
      const staminaPercent = Math.max(0, Math.min(1, gameState.player.stamina / gameState.player.maxStamina));
      const currentStaminaBarW = Math.max(0, staminaBarW * staminaPercent);
      
      if (currentStaminaBarW > 0) {
        const staminaGradient = ctx.createLinearGradient(staminaBarX, staminaBarY, staminaBarX + currentStaminaBarW, staminaBarY);
        staminaGradient.addColorStop(0, "#22c55e");
        staminaGradient.addColorStop(1, "#16a34a");
        ctx.fillStyle = staminaGradient;
        ctx.fillRect(staminaBarX + 1, staminaBarY + 1, currentStaminaBarW - 2, staminaBarH - 2);
      }
      
      // Texto de stamina
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px system-ui";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(`STAMINA ${Math.floor(gameState.player.stamina)}`, staminaBarX + staminaBarW / 2, staminaBarY + staminaBarH / 2 + 4);
      ctx.shadowBlur = 0;
      
      // Indicador de sprint activo
      if (gameState.player.isSprinting) {
        ctx.globalAlpha = 0.6 + Math.sin(gameState.time * 10) * 0.4;
        ctx.strokeStyle = "#22c55e";
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
      ctx.fillStyle = "#a855f7";
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
        const progressGradient = ctx.createLinearGradient(progressBarX, progressBarY, progressBarX + currentProgressW, progressBarY);
        progressGradient.addColorStop(0, "#a855f7");
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
      ctx.fillText(`${gameState.waveKills} / ${gameState.waveEnemiesTotal}`, progressBarX + progressBarW / 2, progressBarY + progressBarH / 2 + 4);
      ctx.shadowBlur = 0;
      
      // Score
      ctx.textAlign = "right";
      ctx.fillStyle = "#fbbf24";
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
      ctx.fillStyle = "rgba(10, 15, 25, 0.85)";
      ctx.beginPath();
      ctx.roundRect(xpBarX, xpBarY, xpBarW, xpBarH, xpBarRadius);
      ctx.fill();
      
      // Borde exterior con glow
      ctx.strokeStyle = "rgba(100, 100, 120, 0.6)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(100, 100, 255, 0.4)";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Progreso de XP
      const xpProgress = Math.min(1, gameState.xp / gameState.nextXP);
      const currentXpBarW = (xpBarW - 8) * xpProgress;
      
      if (currentXpBarW > 0) {
        ctx.save();
        
        // Clip para bordes redondeados
        ctx.beginPath();
        ctx.roundRect(xpBarX + 4, xpBarY + 4, currentXpBarW, xpBarH - 8, xpBarRadius - 4);
        ctx.clip();
        
        // Animación Rainbow cuando sube de nivel
        if (gameState.xpBarRainbow) {
          // Gradiente rainbow animado
          const rainbowOffset = (gameState.time * 2) % 1;
          const gradient = ctx.createLinearGradient(xpBarX, xpBarY, xpBarX + xpBarW, xpBarY);
          
          // Colores rainbow con offset animado
          const colors = [
            { stop: 0, color: "#ef4444" },    // Red
            { stop: 0.17, color: "#f97316" }, // Orange
            { stop: 0.33, color: "#fbbf24" }, // Yellow
            { stop: 0.5, color: "#22c55e" },  // Green
            { stop: 0.67, color: "#06b6d4" }, // Cyan
            { stop: 0.83, color: "#3b82f6" }, // Blue
            { stop: 1, color: "#a855f7" },    // Purple
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
          gradient.addColorStop(0, "#06b6d4");
          gradient.addColorStop(0.5, "#3b82f6");
          gradient.addColorStop(1, "#a855f7");
          ctx.fillStyle = gradient;
          
          // Glow sutil
          ctx.shadowColor = "#06b6d4";
          ctx.shadowBlur = 15;
        }
        
        ctx.fillRect(xpBarX + 4, xpBarY + 4, currentXpBarW, xpBarH - 8);
        ctx.shadowBlur = 0;
        ctx.restore();
      }
      
      // Texto de XP centrado
      ctx.fillStyle = "#fff";
      ctx.font = "bold 20px system-ui";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 6;
      ctx.fillText(
        `XP: ${Math.floor(gameState.xp)} / ${gameState.nextXP}`,
        xpBarX + xpBarW / 2,
        xpBarY + xpBarH / 2 + 7
      );
      ctx.shadowBlur = 0;

      // Weapons display
      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px system-ui";
      ctx.fillText(t.weapons, W - 220, 70);
      for (let i = 0; i < gameState.player.weapons.length; i++) {
        const w = gameState.player.weapons[i];
        ctx.fillStyle = w.color;
        ctx.fillRect(W - 220, 80 + i * 25, 18, 18);
        ctx.fillStyle = "#fff";
        ctx.font = "12px system-ui";
        const weaponName = getWeaponName(w.id, currentLanguage);
        const weaponText = w.level > 1 ? `${weaponName} LVL ${w.level}` : weaponName;
        ctx.fillText(weaponText, W - 195, 93 + i * 25);
      }

      // Tomes display
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px system-ui";
      const tomeY = 80 + gameState.player.weapons.length * 25 + 10;
      ctx.fillText(t.tomes, W - 220, tomeY);
      for (let i = 0; i < gameState.player.tomes.length; i++) {
        const tome = gameState.player.tomes[i];
        ctx.fillStyle = tome.color;
        ctx.fillRect(W - 220, tomeY + 10 + i * 25, 18, 18);
        ctx.fillStyle = "#fff";
        ctx.font = "12px system-ui";
        const tomeName = getTomeName(tome.id, currentLanguage);
        const tomeText = tome.level > 1 ? `${tomeName} LVL ${tome.level}` : tomeName;
        ctx.fillText(tomeText, W - 195, tomeY + 23 + i * 25);
      }

      // Items display
      if (gameState.player.items.length > 0) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px system-ui";
        const itemY = tomeY + gameState.player.tomes.length * 25 + 20;
        ctx.fillText(t.items, W - 220, itemY);
        
        // Mostrar solo primeros 10 ítems (si hay más, scroll)
        const maxItemsToShow = Math.min(10, gameState.player.items.length);
        for (let i = 0; i < maxItemsToShow; i++) {
          const item = gameState.player.items[i];
          ctx.fillStyle = item.color;
          ctx.fillRect(W - 220, itemY + 10 + i * 20, 12, 12);
          ctx.fillStyle = "#fff";
          ctx.font = "10px system-ui";
          // Truncar nombre si es muy largo
          const itemNameFull = getItemText(item, currentLanguage).name;
          const itemName = itemNameFull.length > 18 ? itemNameFull.substring(0, 16) + "..." : itemNameFull;
          ctx.fillText(itemName, W - 202, itemY + 20 + i * 20);
        }

        // Indicador de más ítems
        if (gameState.player.items.length > 10) {
          ctx.fillStyle = "#9ca3af";
          ctx.font = "10px system-ui";
          const remaining = gameState.player.items.length - 10;
          const moreItemsText = currentLanguage === "es" ? `+${remaining} más` : `+${remaining} more`;
          ctx.fillText(moreItemsText, W - 220, itemY + 10 + maxItemsToShow * 20 + 15);
        }
      }

      // Level up animation
        if (gameState.levelUpAnimation > 0) {
          const alpha = gameState.levelUpAnimation;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = "#fbbf24";
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
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, H / 2 - 80, W, 160);
        
        // Icono de wave
        const pulse = Math.sin(gameState.time * 8) * 0.2 + 0.8;
        ctx.fillStyle = "#a855f7";
        ctx.shadowColor = "#a855f7";
        ctx.shadowBlur = 30 * pulse;
        ctx.font = "bold 72px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("⚡", W / 2, H / 2 - 10);
        
        // Texto principal con glow - Wave que viene
        ctx.fillStyle = "#fbbf24";
        ctx.shadowColor = "#fbbf24";
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
        ctx.fillStyle = "rgba(220, 38, 38, 0.95)";
        ctx.fillRect(0, 0, W, 60);
        
        // Borde inferior brillante
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(0, 58, W, 2);
        
        // Icono de alerta
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 32px system-ui";
        ctx.textAlign = "left";
        ctx.fillText("⚠️", 20, 40);
        
        // Texto de noticia con descripción de efectos
        const eventTexts = {
          storm: "⚡ ALERTA: Tormenta eléctrica aproximándose...",
          fog: "🌫️ ALERTA: Niebla tóxica detectada en el área...",
          rain: "☢️ ALERTA: Lluvia radiactiva inminente..."
        };
        
        // Mostrar texto del evento actual
        const eventText = gameState.environmentalEvent ? eventTexts[gameState.environmentalEvent] : "";
        
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px system-ui";
        ctx.textAlign = "left";
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 4;
        ctx.fillText(eventText, 70, 40);
        ctx.shadowBlur = 0;
        
        ctx.globalAlpha = 1;
      }
      
      
      if (ENABLE_MUSIC) {
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
          ctx.fillStyle = "rgba(20, 25, 35, 0.95)";
          ctx.beginPath();
          ctx.roundRect(notifX, notifY, notifW, notifH, 10);
          ctx.fill();
          
          // Border
          ctx.strokeStyle = "#a855f7";
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Text
          ctx.fillStyle = "#fff";
          ctx.fillText(notifText, W / 2, notifY + notifH / 2 + 8);
          
          ctx.globalAlpha = 1;
        }
        
        // Botón de cambiar canción (esquina superior derecha)
        const musicBtnW = 160;
        const musicBtnH = 45;
        const musicBtnX = W - musicBtnW - 20;
        const musicBtnY = H - musicBtnH - 70;
        
        // Background del botón con animación si no ha iniciado
        const musicBtnGradient = ctx.createLinearGradient(musicBtnX, musicBtnY, musicBtnX, musicBtnY + musicBtnH);
        if (!gameState.musicStarted) {
          // Animación pulsante para llamar atención
          const pulse = Math.sin(gameState.time * 3) * 0.2 + 0.8;
          musicBtnGradient.addColorStop(0, `rgba(${168 * pulse}, ${85 * pulse}, 247, 0.95)`);
          musicBtnGradient.addColorStop(1, `rgba(${124 * pulse}, ${58 * pulse}, 237, 0.95)`);
        } else {
          musicBtnGradient.addColorStop(0, "rgba(168, 85, 247, 0.9)");
          musicBtnGradient.addColorStop(1, "rgba(124, 58, 237, 0.9)");
        }
        ctx.fillStyle = musicBtnGradient;
        ctx.beginPath();
        ctx.roundRect(musicBtnX, musicBtnY, musicBtnW, musicBtnH, 8);
        ctx.fill();
        
        // Border con glow si no ha iniciado
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#a855f7";
        ctx.shadowBlur = gameState.musicStarted ? 10 : 20;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Texto del botón
        ctx.textAlign = "center";
        if (!gameState.musicStarted) {
          const musicTextX = musicBtnX + musicBtnW / 2;
          ctx.fillStyle = "#fff";
          ctx.font = "bold 16px system-ui";
          ctx.fillText(t.startMusicButton, musicTextX, musicBtnY + musicBtnH / 2 - 2);

          ctx.font = "12px system-ui";
          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          ctx.fillText(t.shufflePlaylistReady, musicTextX, musicBtnY + musicBtnH - 8);

          ctx.fillStyle = "#fff";
        } else {
          ctx.fillStyle = "#fff";
          ctx.font = "bold 16px system-ui";
          const currentTrack = gameState.musicTracks[gameState.currentMusicIndex];
          ctx.fillText(`♫ ${currentTrack.name.slice(0, 12)}...`, musicBtnX + musicBtnW / 2, musicBtnY + musicBtnH / 2 + 6);
        }
        
      }
      // Overlay de Game Over con fade
      if (gameState.state === 'gameover') {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, W, H);
      }

      // Upgrade animation
      if (gameState.upgradeAnimation > 0) {
        const alpha = Math.min(1, gameState.upgradeAnimation);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 8;
        const radius = gameState.player.rad + 20;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(gameState.player.x, gameState.player.y, radius + i * 10, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      
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
      
      // Particles background effect
      for (let i = 0; i < 30; i++) {
        const px = (W / 2) + Math.sin(gameState.time * 0.5 + i) * (300 + i * 10);
        const py = (H / 2) + Math.cos(gameState.time * 0.7 + i) * (200 + i * 8);
        const size = 2 + Math.sin(gameState.time * 2 + i) * 1;
        ctx.fillStyle = `rgba(251, 191, 36, ${0.1 * animProgress})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      const pulse = Math.sin(gameState.time * 3) * 0.15 + 0.85;
      
      // Título con animación de escala y fade
      ctx.globalAlpha = animProgress;
      const titleScale = 0.8 + (animProgress * 0.2);
      ctx.save();
      ctx.translate(W / 2, H / 2 - 180);
      ctx.scale(titleScale, titleScale);
      
      // Glow effect en el título
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 40 * pulse * animProgress;
      ctx.fillStyle = "#fbbf24";
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
          const desc = option.isLevelUp && descriptionText
            ? descriptionText
            : getTomeDescription(tomeData, currentLanguage);
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
        
        // Partículas flotantes alrededor de la carta
        for (let j = 0; j < 5; j++) {
          const angle = (gameState.time * 2 + j * Math.PI * 2 / 5) % (Math.PI * 2);
          const radius = 30 + Math.sin(gameState.time * 3 + j) * 10;
          const px = x + cardW / 2 + Math.cos(angle) * radius;
          const py = yOffset + cardH / 2 + Math.sin(angle) * radius;
          const size = 2 + Math.sin(gameState.time * 4 + j) * 1;
          
          ctx.fillStyle = rarityColor;
          ctx.globalAlpha = (0.3 + Math.sin(gameState.time * 5 + j) * 0.2) * cardEase;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
        }
        
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
    function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
      const words = text.split(' ');
      let line = '';
      let currentY = y;
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          line = words[n] + ' ';
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
      ctx.clearRect(0, 0, W, H);
      
      // Fondo
      const gradient = ctx.createRadialGradient(W / 2, H / 3, 0, W / 2, H / 3, Math.max(W, H));
      gradient.addColorStop(0, "#0f1729");
      gradient.addColorStop(0.5, "#0a0f1a");
      gradient.addColorStop(1, "#060a10");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      
      // Marcas de explosión en el suelo (quemadura)
      for (const mark of gameState.explosionMarks) {
        const alpha = mark.life / 3; // Fade out gradual
        ctx.save();
        ctx.globalAlpha = alpha * 0.4;
        
        // Círculo quemado oscuro
        const markGradient = ctx.createRadialGradient(mark.x, mark.y, 0, mark.x, mark.y, mark.radius);
        markGradient.addColorStop(0, "rgba(80, 30, 10, 0.8)");
        markGradient.addColorStop(0.5, "rgba(60, 20, 5, 0.5)");
        markGradient.addColorStop(1, "rgba(40, 10, 0, 0)");
        ctx.fillStyle = markGradient;
        ctx.beginPath();
        ctx.arc(mark.x, mark.y, mark.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Borde quemado
        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = "rgba(139, 69, 19, 0.8)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.restore();
      }
      
      // Efectos ambientales deshabilitados para mejorar el rendimiento
      // Hotspots
      for (const h of gameState.hotspots) {
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
            ctx.fillStyle = "#fbbf24";
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
          ctx.shadowColor = "#a855f7";
          ctx.shadowBlur = 20 * radioPulse;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.rad, gameState.time * 2, gameState.time * 2 + Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;
          
          // Icono radiactivo
          ctx.fillStyle = "#a855f7";
          ctx.font = "bold 28px system-ui";
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 8;
          ctx.fillText("☢️", h.x, h.y + 8);
          ctx.shadowBlur = 0;
        } else {
          // HOTSPOT POSITIVO (recompensa)
          // Outer circle
          ctx.strokeStyle = h.active ? "#fbbf24" : "rgba(251, 191, 36, 0.5)";
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 10]);
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.rad, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Progress circle (cuando está activo - progreso de recompensa)
          if (h.active) {
            ctx.strokeStyle = "#22c55e";
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
            ctx.fillStyle = "#22c55e";
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

      // Drops con glow de rareza para powerups
      for (const d of gameState.drops) {
        // Parpadeo para XP que está por expirar
        let alpha = 1;
        if (d.type === "xp" && d.lifetime !== undefined && d.lifetime < 3) {
          // Parpadeo más rápido cuando está cerca de expirar
          const blinkSpeed = d.lifetime < 1 ? 10 : 6;
          alpha = Math.abs(Math.sin(gameState.time * blinkSpeed)) * 0.7 + 0.3;
        }
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = d.color;
        ctx.shadowColor = d.color;
        
        // Powerups tienen glow animado según rareza
        if (d.type === "powerup") {
          const pulse = Math.sin(gameState.time * 5) * 10 + 20;
          ctx.shadowBlur = pulse;
          
          // Anillo exterior de rareza
          ctx.strokeStyle = d.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.rad + 5, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.shadowBlur = 10;
        }
        
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - d.rad);
        ctx.lineTo(d.x + d.rad, d.y);
        ctx.lineTo(d.x, d.y + d.rad);
        ctx.lineTo(d.x - d.rad, d.y);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
      
      // Partículas
      for (const p of gameState.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      
      // Enemigos
      for (const e of gameState.enemies) {
        ctx.save();
        
        // Efectos elementales visuales
        if (e.frozenTimer > 0) {
          // Efecto de congelamiento
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 20;
        } else if (e.burnTimer > 0) {
          // Efecto de fuego
          ctx.shadowColor = "#fb923c";
          ctx.shadowBlur = 25;
        } else if (e.poisonTimer > 0) {
          // Efecto de veneno
          ctx.shadowColor = "#84cc16";
          ctx.shadowBlur = 15;
        }
        
        // Si tenemos el logo cargado, dibujarlo con el color del enemigo
        if (gameState.enemyLogo && gameState.enemyLogo.complete) {
          ctx.translate(e.x, e.y);
          
          // Aplicar sombra con el color del enemigo (o efecto elemental)
          if (!e.frozenTimer && !e.burnTimer && !e.poisonTimer) {
            ctx.shadowColor = e.color;
            ctx.shadowBlur = e.isBoss ? 40 : e.isMiniBoss ? 25 : 15;
          }
          
          // Dibujar el logo escalado al tamaño del enemigo
          const logoSize = e.rad * 2;
          
          // Usar logo pre-renderizado si está disponible, sino crear temporalmente
          const prerenderedLogo = prerenderedLogosRef.current[e.color];
          if (prerenderedLogo) {
            // Usar logo pre-renderizado (mucho más rápido)
            ctx.drawImage(prerenderedLogo, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
          } else {
            // Fallback: crear canvas temporal (para colores personalizados)
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = logoSize;
            tempCanvas.height = logoSize;
            const tempCtx = tempCanvas.getContext('2d');
            
            if (tempCtx) {
              tempCtx.drawImage(gameState.enemyLogo, 0, 0, logoSize, logoSize);
              tempCtx.globalCompositeOperation = 'source-in';
              tempCtx.fillStyle = e.color;
              tempCtx.fillRect(0, 0, logoSize, logoSize);
              ctx.drawImage(tempCanvas, -logoSize / 2, -logoSize / 2);
            }
          }
          
          ctx.shadowBlur = 0;
          ctx.restore();
        } else {
          // Fallback: dibujar círculo si la imagen no está cargada
          ctx.fillStyle = e.color;
          if (!e.frozenTimer && !e.burnTimer && !e.poisonTimer) {
            ctx.shadowColor = e.color;
            ctx.shadowBlur = e.isBoss ? 40 : e.isMiniBoss ? 25 : 15;
          }
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.restore();
        }
        
        // 💣 Anillo de advertencia para bombers a punto de explotar
        if (e.specialType === "explosive" && e.explosionTimer !== undefined && e.explosionTimer >= 0) {
          ctx.save();
          const pulse = Math.sin(gameState.time * 12) * 0.4 + 0.6;
          const warningRadius = e.rad + 8 + pulse * 5;
          
          // Anillo pulsante (más intenso cuando está cerca)
          const intensity = e.explosionTimer < 0.5 ? 1 : 0.6;
          ctx.strokeStyle = e.explosionTimer < 0.5 ? `rgba(251, 191, 36, ${pulse * intensity})` : `rgba(239, 68, 68, ${pulse * intensity})`;
          ctx.lineWidth = e.explosionTimer < 0.5 ? 4 : 3;
          ctx.shadowColor = e.explosionTimer < 0.5 ? "#fbbf24" : "#ef4444";
          ctx.shadowBlur = 20 * pulse;
          ctx.beginPath();
          ctx.arc(e.x, e.y, warningRadius, 0, Math.PI * 2);
          ctx.stroke();
          
          // Radio de explosión (círculo más grande y tenue)
          ctx.globalAlpha = 0.15 * pulse;
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(e.x, e.y, 80, 0, Math.PI * 2); // Radio AOE de explosión
          ctx.stroke();
          ctx.setLineDash([]);
          
          ctx.shadowBlur = 0;
          ctx.restore();
        }
        
        // Indicador de tipo especial
        if (e.specialType) {
          ctx.save();
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 4;
          
          // Bomber con countdown visual
          if (e.specialType === "explosive" && e.explosionTimer !== undefined && e.explosionTimer >= 0) {
            // Countdown timer
            const timeLeft = Math.ceil(e.explosionTimer * 10) / 10; // Redondear a 1 decimal
            ctx.font = "bold 20px system-ui";
            const pulse = Math.sin(gameState.time * 10) * 0.3 + 0.7;
            ctx.fillStyle = timeLeft < 0.5 ? "#fbbf24" : "#ef4444";
            ctx.shadowColor = timeLeft < 0.5 ? "#fbbf24" : "#ef4444";
            ctx.shadowBlur = 20 * pulse;
            ctx.fillText(timeLeft.toFixed(1) + "s", e.x, e.y - e.rad - 35);
            
            // Emoji pulsante
            ctx.font = "bold 24px system-ui";
            ctx.fillText("💣", e.x, e.y - e.rad - 10);
            ctx.shadowBlur = 0;
          } else {
            // Emojis normales para otros tipos
            ctx.font = "bold 16px system-ui";
            let emoji = "";
            if (e.specialType === "explosive") emoji = "💣";
            else if (e.specialType === "fast") emoji = "⚡";
            else if (e.specialType === "tank") emoji = "🛡️";
            else if (e.specialType === "summoner") emoji = "👻";
            ctx.fillText(emoji, e.x, e.y - e.rad - 20);
            ctx.shadowBlur = 0;
          }
          
          ctx.restore();
        }
        
        // Indicador de boss
        if (e.isBoss) {
          ctx.save();
          ctx.textAlign = "center";
          ctx.font = "bold 24px system-ui";
          ctx.fillStyle = "#fbbf24";
          ctx.shadowColor = "#dc2626";
          ctx.shadowBlur = 20;
          ctx.fillText("👑 BOSS 👑", e.x, e.y - e.rad - 25);
          ctx.shadowBlur = 0;
          ctx.restore();
        }
        
        // HP bar para todos los enemigos (FIX: tamaño consistente)
        const barW = e.rad * 2; // Ancho fijo basado en radio
        const barH = e.isBoss ? 8 : e.isMiniBoss ? 6 : e.isElite ? 5 : 3;
        const barX = e.x - barW / 2;
        const barY = e.y - e.rad - (e.isBoss ? 35 : 10);
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(barX, barY, barW, barH);
        
        // Ancho de la barra de HP actual (proporcional al HP)
        const hpBarWidth = barW * Math.max(0, Math.min(1, e.hp / e.maxhp));
        
        ctx.fillStyle = e.isBoss ? "#dc2626" : e.isMiniBoss ? "#fbbf24" : e.isElite ? "#f87171" : "#34d399";
        ctx.fillRect(barX, barY, hpBarWidth, barH);
        
        // Fase del boss
        if (e.isBoss) {
          ctx.save();
          ctx.fillStyle = "#fff";
          ctx.font = "bold 14px system-ui";
          ctx.textAlign = "center";
          ctx.fillText(`FASE ${e.phase}`, e.x, e.y + e.rad + 15);
          ctx.restore();
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
          ctx.shadowColor = "#60a5fa";
        } else if (b.fire) {
          // Efecto de fuego
          glowSize = 12;
          ctx.shadowColor = "#fb923c";
        } else if (b.freeze) {
          // Efecto de hielo
          glowSize = 12;
          ctx.shadowColor = "#38bdf8";
        }
        
        // Balas de enemigos (rojo)
        if (b.isEnemyBullet) {
          ctx.fillStyle = "#ef4444";
          ctx.shadowColor = "#ef4444";
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
      if (isRage) {
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 40;
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(gameState.player.x, gameState.player.y, gameState.player.rad + 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.fillStyle = isRage ? "#ef4444" : "#60a5fa";
      ctx.shadowColor = isRage ? "#ef4444" : "#60a5fa";
      ctx.shadowBlur = isRage ? 30 : 20;
      ctx.beginPath();
      ctx.arc(gameState.player.x, gameState.player.y, gameState.player.rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
      
      // Restart hold indicator
      if (gameState.restartTimer > 0) {
        const progress = Math.min(1, gameState.restartTimer / gameState.restartHoldTime);
        const centerX = W / 2;
        const centerY = H / 2;
        const radius = 60;
        
        // Background circle
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Progress arc
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 8;
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Text
        ctx.fillStyle = "#fff";
        ctx.font = "bold 24px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("R", centerX, centerY + 8);
        
        // Timer text - prevent negative numbers
        const remaining = Math.max(0, Math.ceil(gameState.restartHoldTime - gameState.restartTimer));
        ctx.font = "bold 18px system-ui";
        ctx.fillStyle = "#ef4444";
        ctx.fillText(remaining === 0 ? "0s" : `${remaining}s`, centerX, centerY + 35);
      }

      // Powerup indicators
      let indicatorY = gameState.player.y - gameState.player.rad - 30;
      if (gameState.player.tempMagnetTimer > 0) {
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 12px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(`🧲 ${Math.ceil(gameState.player.tempMagnetTimer)}s`, gameState.player.x, indicatorY);
        indicatorY -= 15;
      }
      if (gameState.player.rageTimer > 0) {
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 12px system-ui";
        ctx.fillText(`⚡ ${Math.ceil(gameState.player.rageTimer)}s`, gameState.player.x, indicatorY);
      }
      
      drawHUD();
      drawUpgradeUI();
      
      // Danger Zone visual effect (pantalla parpadeante roja si está >0.5s en zona de peligro)
      if (gameState.inDangerZone && gameState.dangerZoneTimer > 0.5) {
        const flashIntensity = Math.sin(gameState.time * 8) * 0.2 + 0.3; // Parpadeo rápido
        ctx.save();
        
        // Borde rojo alrededor de toda la pantalla
        ctx.strokeStyle = `rgba(239, 68, 68, ${flashIntensity})`;
        ctx.lineWidth = 15;
        ctx.strokeRect(7.5, 7.5, W - 15, H - 15);
        
        // Overlay rojo sutil en toda la pantalla
        ctx.fillStyle = `rgba(220, 38, 38, ${flashIntensity * 0.15})`;
        ctx.fillRect(0, 0, W, H);
        
        ctx.restore();
      }
      
      // Game Over overlay fade
      // GAME OVER SCREEN
      if (gameState.state === 'gameover') {
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
          ctx.fillStyle = "#ef4444";
          ctx.font = "bold 48px system-ui";
          ctx.textAlign = "center";
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 30 * pulse;
          ctx.fillText("Has caído en la horda...", W / 2, H / 2 - 80);
          ctx.shadowBlur = 0;
          
          // Mostrar tiempo sobrevivido después de 1.5s
          if (gameState.gameOverAnimationTimer > 1.5) {
            const timeAlpha = Math.min(1, (gameState.gameOverAnimationTimer - 1.5) / 1);
            ctx.globalAlpha = timeAlpha;
            const time = Math.floor(gameState.time);
            const mm = String(Math.floor(time / 60)).padStart(2, '0');
            const ss = String(time % 60).padStart(2, '0');
            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 56px system-ui";
            ctx.shadowColor = "#fbbf24";
            ctx.shadowBlur = 20 * pulse;
            ctx.fillText(`Tiempo sobrevivido: ${mm}:${ss}`, W / 2, H / 2 + 20);
            ctx.shadowBlur = 0;
          }
          
          ctx.globalAlpha = 1;
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
        bgGradient.addColorStop(0, "rgba(20, 10, 10, 0.98)");
        bgGradient.addColorStop(1, "rgba(40, 20, 20, 0.98)");
        ctx.fillStyle = bgGradient;
        ctx.fillRect(menuX, menuY, menuW, menuH);
        
        // Border con glow rojo
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 30;
        ctx.strokeRect(menuX, menuY, menuW, menuH);
        ctx.shadowBlur = 0;
        
        // Título GAME OVER
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 64px system-ui";
        ctx.textAlign = "center";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 20;
        ctx.fillText(t.gameOver, W / 2, menuY + 90);
        ctx.shadowBlur = 0;
        
        let contentY = menuY + 160;
        
        // Separador
        ctx.strokeStyle = "rgba(239, 68, 68, 0.3)";
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
        ctx.fillStyle = "#fbbf24";
        ctx.textAlign = "left";
        ctx.fillText("📊 " + t.stats, leftCol, contentY);
        contentY += 60;
        
        ctx.font = "24px system-ui";
        ctx.fillStyle = "#d1d5db";
        
        // Score
        ctx.fillText(t.finalScore + ":", leftCol, contentY);
        ctx.fillStyle = "#a855f7";
        ctx.textAlign = "right";
        ctx.fillText(gameState.score.toString(), rightCol + 180, contentY);
        contentY += 50;
        
        // Level
        ctx.fillStyle = "#d1d5db";
        ctx.textAlign = "left";
        ctx.fillText(t.finalLevel + ":", leftCol, contentY);
        ctx.fillStyle = "#22c55e";
        ctx.textAlign = "right";
        ctx.fillText(gameState.level.toString(), rightCol + 180, contentY);
        contentY += 50;
        
        // Wave
        ctx.fillStyle = "#d1d5db";
        ctx.textAlign = "left";
        ctx.fillText(t.finalWave + ":", leftCol, contentY);
        ctx.fillStyle = "#3b82f6";
        ctx.textAlign = "right";
        ctx.fillText(gameState.wave.toString(), rightCol + 180, contentY);
        contentY += 50;
        
        // Tiempo
        const time = Math.floor(gameState.time);
        const mm = String(Math.floor(time / 60)).padStart(2, '0');
        const ss = String(time % 60).padStart(2, '0');
        ctx.fillStyle = "#d1d5db";
        ctx.textAlign = "left";
        ctx.fillText("Tiempo:", leftCol, contentY);
        ctx.fillStyle = "#fbbf24";
        ctx.textAlign = "right";
        ctx.fillText(`${mm}:${ss}`, rightCol + 180, contentY);
        
        // Botón de reinicio
        const btnW = 400;
        const btnH = 70;
        const btnX = W / 2 - btnW / 2;
        const btnY = menuY + menuH - 120;
        
        const btnGradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
        btnGradient.addColorStop(0, "#ef4444");
        btnGradient.addColorStop(1, "#dc2626");
        ctx.fillStyle = btnGradient;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 15);
        ctx.fill();
        
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = "#fff";
        ctx.font = "bold 32px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("🔄 " + t.playAgain, btnX + btnW / 2, btnY + btnH / 2 + 12);
        
        // Hint de teclas
        ctx.fillStyle = "rgba(156, 163, 175, 0.8)";
        ctx.font = "18px system-ui";
        ctx.fillText("Presiona R o Enter para reiniciar", W / 2, menuY + menuH - 25);
        
        ctx.restore();
      }
      
      // Pause menu - Simplified unified design  
      if (gameState.state === 'paused' && !gameState.showUpgradeUI && gameState.countdownTimer <= 0) {
        ctx.save();
        ctx.fillStyle = "rgba(5, 10, 20, 0.85)";
        ctx.fillRect(0, 0, W, H);

        const currentLanguage = (gameState.language ?? language) as Language;
        const locale = translations[currentLanguage];
        const t = locale;
        const layout = getPauseMenuLayout(W, H);
        const { menuX, menuY, menuW, menuH, padding, scale } = layout;
        
        const scaleValue = (value: number) => value * scale;
        const scaledRadius = (value: number) => Math.max(6, value * scale);
        const getScaledFont = (size: number, weight?: string) => {
          const px = Math.max(12, Math.round(size * scale));
          return `${weight ? `${weight} ` : ""}${px}px system-ui`;
        };

        // Main menu background with neon glow
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(menuX, menuY, menuW, menuH, scaledRadius(20));
        const bgGradient = ctx.createLinearGradient(menuX, menuY, menuX, menuY + menuH);
        bgGradient.addColorStop(0, "rgba(10, 15, 30, 0.98)");
        bgGradient.addColorStop(1, "rgba(15, 20, 35, 0.95)");
        ctx.fillStyle = bgGradient;
        ctx.shadowColor = "rgba(34, 197, 94, 0.3)";
        ctx.shadowBlur = scaleValue(40);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
        ctx.lineWidth = Math.max(2, 2.5 * scale);
        ctx.stroke();
        ctx.restore();

        // Header
        const headerY = menuY + padding;
        ctx.fillStyle = "#22c55e";
        ctx.font = getScaledFont(32, "800");
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(34, 197, 94, 0.8)";
        ctx.shadowBlur = scaleValue(15);
        ctx.fillText("⏸  " + t.paused.toUpperCase(), W / 2, headerY);
        ctx.shadowBlur = 0;

        // Quick stats grid
        const statsY = headerY + 60 * scale;
        const totalSeconds = Math.floor(gameState.time);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
        const seconds = String(totalSeconds % 60).padStart(2, "0");
        
        const stats = [
          { label: t.wave, value: `${gameState.wave}`, color: "#3b82f6" },
          { label: t.level, value: `${gameState.level}`, color: "#fbbf24" },
          { label: "⏱️", value: `${minutes}:${seconds}`, color: "#a855f7" },
        ];

        const statBoxW = (menuW - padding * 2 - 20 * scale) / 3;
        const statBoxH = 70 * scale;

        stats.forEach((stat, i) => {
          const statX = menuX + padding + i * (statBoxW + 10 * scale);
          
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(statX, statsY, statBoxW, statBoxH, scaledRadius(12));
          const statGradient = ctx.createLinearGradient(statX, statsY, statX, statsY + statBoxH);
          statGradient.addColorStop(0, `${stat.color}40`);
          statGradient.addColorStop(1, "rgba(15, 20, 35, 0.6)");
          ctx.fillStyle = statGradient;
          ctx.fill();
          ctx.strokeStyle = `${stat.color}80`;
          ctx.lineWidth = Math.max(1, 1.5 * scale);
          ctx.stroke();
          ctx.restore();

          ctx.textAlign = "center";
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          ctx.font = getScaledFont(13, "500");
          ctx.fillText(stat.label, statX + statBoxW / 2, statsY + 22 * scale);
          
          ctx.fillStyle = "#ffffff";
          ctx.font = getScaledFont(24, "700");
          ctx.fillText(stat.value, statX + statBoxW / 2, statsY + statBoxH - 18 * scale);
        });

        // Buttons
        const buttonH = 56 * scale;
        const buttonGap = 14 * scale;
        const buttonCount = 4;
        const audioPanelHeight = 200 * scale;
        const audioPanelMargin = 24 * scale;
        const baseButtonsY =
          menuY +
          menuH -
          padding -
          buttonH * buttonCount -
          buttonGap * (buttonCount - 1) -
          16 * scale;
        const buttonsY = baseButtonsY - (gameState.pauseMenuAudioOpen ? audioPanelHeight + audioPanelMargin : 0);

        const continueBtn = { x: menuX + padding, y: buttonsY, w: menuW - padding * 2, h: buttonH };
        const audioBtn = {
          x: menuX + padding,
          y: buttonsY + buttonH + buttonGap,
          w: menuW - padding * 2,
          h: buttonH,
        };
        const languageBtn = {
          x: menuX + padding,
          y: audioBtn.y + buttonH + buttonGap,
          w: menuW - padding * 2,
          h: buttonH,
        };
        const restartBtn = {
          x: menuX + padding,
          y: languageBtn.y + buttonH + buttonGap,
          w: menuW - padding * 2,
          h: buttonH,
        };

        gameState.pauseMenuHitAreas.home.resume = continueBtn;
        gameState.pauseMenuHitAreas.home.language = languageBtn;
        gameState.pauseMenuHitAreas.home.restart = restartBtn;
        gameState.pauseMenuAudioHitAreas.button = audioBtn;

        // Audio settings panel
        if (gameState.pauseMenuAudioOpen) {
          const panelX = menuX + padding;
          const panelW = menuW - padding * 2;
          const panelY = buttonsY - audioPanelMargin - audioPanelHeight;

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(panelX, panelY, panelW, audioPanelHeight, scaledRadius(18));
          const panelGradient = ctx.createLinearGradient(panelX, panelY, panelX, panelY + audioPanelHeight);
          panelGradient.addColorStop(0, "rgba(37, 99, 235, 0.45)");
          panelGradient.addColorStop(1, "rgba(15, 23, 42, 0.65)");
          ctx.fillStyle = panelGradient;
          ctx.fill();
          ctx.strokeStyle = "rgba(191, 219, 254, 0.5)";
          ctx.lineWidth = Math.max(1.5, 2 * scale);
          ctx.shadowColor = "rgba(37, 99, 235, 0.45)";
          ctx.shadowBlur = scaleValue(16);
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.restore();

          ctx.fillStyle = "#e0f2fe";
          ctx.font = getScaledFont(18, "700");
          ctx.textAlign = "center";
          ctx.fillText(t.pauseMenu.audio.toUpperCase(), panelX + panelW / 2, panelY + 36 * scale);

          ctx.textAlign = "left";
          ctx.fillStyle = "rgba(226, 232, 240, 0.85)";
          ctx.font = getScaledFont(14, "600");
          ctx.fillText(t.pauseMenu.musicVolume, panelX + 20 * scale, panelY + 56 * scale);

          ctx.textAlign = "right";
          ctx.fillText(`${Math.round(gameState.targetMusicVolume * 100)}%`, panelX + panelW - 20 * scale, panelY + 56 * scale);

          const sliderX = panelX + 28 * scale;
          const sliderW = panelW - 56 * scale;
          const sliderY = panelY + 70 * scale;
          const sliderH = 10 * scale;

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(sliderX, sliderY, sliderW, sliderH, scaledRadius(12));
          ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
          ctx.fill();
          ctx.restore();

          const sliderValue = clamp(gameState.targetMusicVolume, 0, 1);
          const sliderFillW = sliderW * sliderValue;

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(sliderX, sliderY, sliderFillW, sliderH, scaledRadius(12));
          ctx.fillStyle = "rgba(96, 165, 250, 0.75)";
          ctx.fill();
          ctx.restore();

          const handleX = sliderX + sliderFillW;
          const handleRadius = Math.max(8, 12 * scale);
          ctx.beginPath();
          ctx.arc(handleX, sliderY + sliderH / 2, handleRadius, 0, Math.PI * 2);
          ctx.fillStyle = "#60a5fa";
          ctx.fill();
          ctx.strokeStyle = "#bfdbfe";
          ctx.lineWidth = Math.max(1, 1.5 * scale);
          ctx.stroke();

          gameState.pauseMenuAudioHitAreas.slider = {
            x: sliderX,
            y: sliderY - 14 * scale,
            w: sliderW,
            h: sliderH + 28 * scale,
          };

          const toggleGap = 18 * scale;
          const toggleHeight = 56 * scale;
          const toggleWidth = (panelW - toggleGap - 40 * scale) / 2;
          const toggleY = sliderY + sliderH + 36 * scale;
          const musicToggleX = panelX + 20 * scale;
          const sfxToggleX = musicToggleX + toggleWidth + toggleGap;

          const drawToggle = (
            x: number,
            label: string,
            active: boolean,
            onText: string,
            offText: string,
          ) => {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(x, toggleY, toggleWidth, toggleHeight, scaledRadius(14));
            const gradient = ctx.createLinearGradient(x, toggleY, x, toggleY + toggleHeight);
            if (active) {
              gradient.addColorStop(0, "rgba(34, 197, 94, 0.4)");
              gradient.addColorStop(1, "rgba(22, 163, 74, 0.35)");
              ctx.strokeStyle = "rgba(134, 239, 172, 0.8)";
              ctx.shadowColor = "rgba(34, 197, 94, 0.35)";
            } else {
              gradient.addColorStop(0, "rgba(71, 85, 105, 0.45)");
              gradient.addColorStop(1, "rgba(51, 65, 85, 0.35)");
              ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
              ctx.shadowColor = "rgba(30, 41, 59, 0.4)";
            }
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.lineWidth = Math.max(1.5, 1.8 * scale);
            ctx.shadowBlur = scaleValue(active ? 18 : 10);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.restore();

            ctx.textAlign = "left";
            ctx.fillStyle = "#f8fafc";
            ctx.font = getScaledFont(15, "600");
            ctx.fillText(label, x + 18 * scale, toggleY + 24 * scale);

            ctx.textAlign = "right";
            ctx.fillStyle = active ? "#bbf7d0" : "#cbd5f5";
            ctx.font = getScaledFont(14, "500");
            ctx.fillText(active ? onText : offText, x + toggleWidth - 18 * scale, toggleY + toggleHeight - 18 * scale);
          };

          drawToggle(
            musicToggleX,
            t.pauseMenu.music.label,
            !gameState.musicMuted,
            t.pauseMenu.music.on,
            t.pauseMenu.music.off,
          );
          drawToggle(
            sfxToggleX,
            t.pauseMenu.sfx.label,
            !gameState.sfxMuted,
            t.pauseMenu.sfx.on,
            t.pauseMenu.sfx.off,
          );

          gameState.pauseMenuAudioHitAreas.musicToggle = {
            x: musicToggleX,
            y: toggleY,
            w: toggleWidth,
            h: toggleHeight,
          };
          gameState.pauseMenuAudioHitAreas.sfxToggle = {
            x: sfxToggleX,
            y: toggleY,
            w: toggleWidth,
            h: toggleHeight,
          };
        }

        // Continue button
        const continueY = continueBtn.y;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(continueBtn.x, continueBtn.y, continueBtn.w, continueBtn.h, scaledRadius(14));
        const continueBg = ctx.createLinearGradient(0, continueY, 0, continueY + buttonH);
        continueBg.addColorStop(0, "rgba(34, 197, 94, 0.4)");
        continueBg.addColorStop(1, "rgba(34, 197, 94, 0.25)");
        ctx.fillStyle = continueBg;
        ctx.fill();
        ctx.strokeStyle = "rgba(134, 239, 172, 0.8)";
        ctx.lineWidth = Math.max(2, 2 * scale);
        ctx.shadowColor = "rgba(34, 197, 94, 0.5)";
        ctx.shadowBlur = scaleValue(15);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.font = getScaledFont(20, "700");
        ctx.fillText("▶  " + t.continue.toUpperCase(), W / 2, continueY + buttonH / 2 + scaleValue(7));

        // Audio button
        const audioY = audioBtn.y;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(audioBtn.x, audioBtn.y, audioBtn.w, audioBtn.h, scaledRadius(14));
        const audioBg = ctx.createLinearGradient(0, audioY, 0, audioY + buttonH);
        audioBg.addColorStop(0, "rgba(168, 85, 247, 0.35)");
        audioBg.addColorStop(1, "rgba(59, 130, 246, 0.28)");
        ctx.fillStyle = audioBg;
        ctx.fill();
        ctx.strokeStyle = gameState.pauseMenuAudioOpen ? "rgba(192, 132, 252, 0.85)" : "rgba(147, 197, 253, 0.7)";
        ctx.lineWidth = Math.max(1.5, 1.8 * scale);
        ctx.shadowColor = gameState.pauseMenuAudioOpen ? "rgba(192, 132, 252, 0.5)" : "rgba(59, 130, 246, 0.35)";
        ctx.shadowBlur = scaleValue(gameState.pauseMenuAudioOpen ? 18 : 12);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.font = getScaledFont(18, "600");
        ctx.fillText(
          `${gameState.pauseMenuAudioOpen ? "🎚️" : "🎧"}  ${t.pauseMenu.audio}`,
          W / 2,
          audioY + buttonH / 2 + scaleValue(6)
        );

        // Language button
        const languageY = languageBtn.y;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(languageBtn.x, languageBtn.y, languageBtn.w, languageBtn.h, scaledRadius(14));
        const languageBg = ctx.createLinearGradient(0, languageY, 0, languageY + buttonH);
        languageBg.addColorStop(0, "rgba(20, 184, 166, 0.35)");
        languageBg.addColorStop(1, "rgba(45, 212, 191, 0.28)");
        ctx.fillStyle = languageBg;
        ctx.fill();
        ctx.strokeStyle = "rgba(94, 234, 212, 0.7)";
        ctx.lineWidth = Math.max(1.5, 1.8 * scale);
        ctx.shadowColor = "rgba(45, 212, 191, 0.4)";
        ctx.shadowBlur = scaleValue(12);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        const languageLabel = t.pauseMenu.languages[currentLanguage];
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.font = getScaledFont(18, "600");
        ctx.fillText(
          `${t.pauseMenu.language}: ${languageLabel ? languageLabel : currentLanguage.toUpperCase()}`,
          W / 2,
          languageY + buttonH / 2 + scaleValue(6)
        );

        // Restart button
        const restartY = restartBtn.y;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(restartBtn.x, restartBtn.y, restartBtn.w, restartBtn.h, scaledRadius(14));
        const restartBg = ctx.createLinearGradient(0, restartY, 0, restartY + buttonH);
        restartBg.addColorStop(0, "rgba(239, 68, 68, 0.3)");
        restartBg.addColorStop(1, "rgba(239, 68, 68, 0.2)");
        ctx.fillStyle = restartBg;
        ctx.fill();
        ctx.strokeStyle = "rgba(252, 165, 165, 0.6)";
        ctx.lineWidth = Math.max(1.5, 1.5 * scale);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.font = getScaledFont(18, "600");
        ctx.fillText("🔄  " + t.restart, W / 2, restartY + buttonH / 2 + scaleValue(6));

        ctx.textAlign = "left";
        ctx.restore();
      }

      // Countdown después de pausa
      if (gameState.countdownTimer > 0) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, W, H);
        
        const countdownNumber = Math.ceil(gameState.countdownTimer);
        const scale = 1 - (gameState.countdownTimer - Math.floor(gameState.countdownTimer)); // Efecto de escala
        
        // Número del countdown con glow
        ctx.fillStyle = "#fbbf24";
        ctx.font = `bold ${120 * (1 + scale * 0.3)}px system-ui`;
        ctx.textAlign = "center";
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 40;
        ctx.fillText(countdownNumber.toString(), W / 2, H / 2 + 20);
        ctx.shadowBlur = 0;
        
        ctx.restore();
      }
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

    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });

    return () => {
      gameStateRef.current = null;
      resetGameRef.current = null;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("wheel", handlePauseMenuScroll);
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
    };
  });

  useEffect(() => {
    if (gameStateRef.current) {
      gameStateRef.current.language = language;
    }
  }, [language]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: "crosshair" }}
      />
      
      {/* TUTORIAL SIMPLIFICADO */}
      {gameStateRef.current?.tutorialActive && !tutorialCompleted && gameStateRef.current?.wave === 1 && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          {/* Overlay oscuro sutil */}
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
          
          {/* Tutorial card */}
          <div className="relative bg-card/95 backdrop-blur-sm border-2 border-primary/50 rounded-lg p-8 max-w-md mx-4 shadow-2xl animate-scale-in">
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-2xl font-bold text-primary text-center">
                {t.tutorial.move}
              </h3>
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
const KeyButton = ({ keyLabel, isActive, className = "" }: { keyLabel: string; isActive: boolean; className?: string }) => (
  <div 
    className={`
      px-4 py-3 border-2 rounded-md font-bold text-sm transition-all duration-150
      ${isActive 
        ? 'bg-primary text-primary-foreground border-primary scale-95 shadow-lg shadow-primary/50' 
        : 'bg-muted/50 text-foreground border-border scale-100'
      }
      ${className}
    `}
  >
    {keyLabel}
  </div>
);

export default Index;
