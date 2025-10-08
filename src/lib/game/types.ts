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
  tutorial: {
    move: string;
  };
}

export interface Weapon {
  id: string;
  name: string;
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
  name: string;
  description: string;
  effect: string;
  value: number;
  rarity: Rarity;
  color: string;
  level: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  effect: string;
  rarity: Rarity;
  color: string;
}

export interface Upgrade {
  type: "weapon" | "tome" | "item";
  data: Weapon | Tome | Item;
  rarity: Rarity;
  isLevelUp?: boolean;
  targetIndex?: number;
  upgradeType?: "damage" | "fireRate" | "range" | "special" | "effect";
  description?: string;
}
