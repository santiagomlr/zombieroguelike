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
  movement: string;
  restart: string;
  pause: string;
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
    movement: "WASD - Movimiento",
    restart: "R - Reiniciar",
    pause: "ESC - Pausa",
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
    movement: "WASD - Movement",
    restart: "R - Restart",
    pause: "ESC - Pause",
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
  },
};

interface Weapon {
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

interface Tome {
  id: string;
  name: string;
  description: string;
  effect: string;
  value: number;
  rarity: Rarity;
  color: string;
  level: number;
}

interface Item {
  id: string;
  name: string;
  description: string;
  effect: string;
  rarity: Rarity;
  color: string;
}

interface Upgrade {
  type: "weapon" | "tome" | "item";
  data: Weapon | Tome | Item;
  rarity: Rarity;
  isLevelUp?: boolean;
  targetIndex?: number;
  upgradeType?: "damage" | "fireRate" | "range" | "special" | "effect";
  description?: string;
}

const WEAPONS: Weapon[] = [
  { id: "pistol", name: "Pistola", damage: 1, fireRate: 2, range: 250, projectileSpeed: 8, rarity: "common", color: "#9ca3af", level: 1 },
  { id: "shotgun", name: "Escopeta", damage: 3, fireRate: 0.8, range: 180, projectileSpeed: 6, rarity: "uncommon", color: "#22c55e", special: "spread", level: 1 },
  { id: "smg", name: "SMG", damage: 0.7, fireRate: 6, range: 200, projectileSpeed: 10, rarity: "rare", color: "#3b82f6", level: 1 },
  { id: "rocket", name: "Lanzacohetes", damage: 8, fireRate: 0.5, range: 350, projectileSpeed: 5, rarity: "epic", color: "#a855f7", special: "aoe", level: 1 },
  { id: "laser", name: "Láser", damage: 2, fireRate: 4, range: 400, projectileSpeed: 15, rarity: "epic", color: "#06b6d4", special: "pierce", level: 1 },
  { id: "railgun", name: "Railgun", damage: 12, fireRate: 0.3, range: 500, projectileSpeed: 20, rarity: "legendary", color: "#fbbf24", special: "pierce", level: 1 },
  { id: "minigun", name: "Minigun", damage: 0.5, fireRate: 10, range: 220, projectileSpeed: 12, rarity: "legendary", color: "#f87171", special: "rapid", level: 1 },
];

const TOMES: Tome[] = [
  { id: "power", name: "Tomo de Poder", description: "+50% Daño", effect: "damage", value: 1.5, rarity: "rare", color: "#f87171", level: 1 },
  { id: "speed", name: "Tomo de Velocidad", description: "+30% Velocidad", effect: "speed", value: 1.3, rarity: "uncommon", color: "#22c55e", level: 1 },
  { id: "range", name: "Tomo de Alcance", description: "+40% Alcance", effect: "range", value: 1.4, rarity: "uncommon", color: "#3b82f6", level: 1 },
  { id: "fire", name: "Tomo de Cadencia", description: "+50% Cadencia", effect: "fireRate", value: 1.5, rarity: "rare", color: "#fbbf24", level: 1 },
  { id: "bounce", name: "Tomo de Rebote", description: "+2 Rebotes", effect: "bounce", value: 2, rarity: "epic", color: "#a855f7", level: 1 },
  { id: "multi", name: "Tomo Múltiple", description: "+1 Proyectil", effect: "multishot", value: 1, rarity: "legendary", color: "#06b6d4", level: 1 },
  { id: "xp", name: "Tomo de Experiencia", description: "+50% XP ganado", effect: "xp", value: 1.5, rarity: "rare", color: "#ec4899", level: 1 },
];

const ITEMS: Item[] = [
  { id: "magnet", name: "Imán", description: "+50% Rango de imán", effect: "magnet", rarity: "common", color: "#9ca3af" },
  { id: "regen", name: "Regeneración", description: "+1 HP cada 10s", effect: "regen", rarity: "uncommon", color: "#22c55e" },
  { id: "luck", name: "Suerte", description: "+20% Drop rate", effect: "luck", rarity: "rare", color: "#fbbf24" },
  { id: "shielditem", name: "Escudo Temporal", description: "+1 Escudo (bloquea 1 golpe)", effect: "shield", rarity: "epic", color: "#3b82f6" },
  { id: "maxhp", name: "Corazón", description: "+1 HP máximo", effect: "maxhp", rarity: "epic", color: "#f87171" },
  { id: "aura", name: "Aura de Fuego", description: "Daño en área", effect: "aura", rarity: "epic", color: "#f87171" },
  { id: "vampire", name: "Vampirismo", description: "10% robo de vida", effect: "vampire", rarity: "legendary", color: "#a855f7" },
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
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [language, setLanguage] = useState<Language>("es");
  const gameStateRef = useRef<any>(null);
  
  const t = translations[language];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const gameState = {
      player: {
        x: W / 2,
        y: H / 2,
        vx: 0,
        vy: 0,
        spd: 3.5,
        rad: 16,
        hp: 100,
        maxhp: 100,
        shield: 0,
        ifr: 0,
        ifrDuration: 2,
        magnet: 120,
        rageTimer: 0,
        tempMagnetTimer: 0,
        tempShieldTimer: 0,
        weapons: [WEAPONS[0]],
        tomes: [] as Tome[],
        items: [] as Item[],
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
        },
      },
      bullets: [] as any[],
      enemies: [] as any[],
      drops: [] as any[],
      particles: [] as any[],
      hotspots: [] as any[],
      score: 0,
      level: 1,
      xp: 0,
      nextXP: 25,
      time: 0,
      wave: 1,
      waveTimer: 0,
      lastSpawn: 0,
      lastBossSpawn: 0,
      lastMiniBossSpawn: 0,
      weaponCooldowns: {} as Record<string, number>,
      audioContext: null as AudioContext | null,
      keys: {} as Record<string, boolean>,
      paused: false,
      showPauseMenu: false,
      showUpgradeUI: false,
      upgradeOptions: [] as Upgrade[],
      regenTimer: 0,
      auraTimer: 0,
      hotspotTimer: 0,
      levelUpAnimation: 0,
      upgradeAnimation: 0,
      restartTimer: 0,
      restartHoldTime: 5,
      sounds: {
        shoot: new Audio(),
        hit: new Audio(),
        levelUp: new Audio(),
        pickup: new Audio(),
        death: new Audio(),
      },
      music: new Audio(),
    };

    gameStateRef.current = gameState;
    
    // Initialize Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      gameState.audioContext = audioCtx;
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
    
    // Sound effect functions
    const playSound = (frequency: number, duration: number, type: OscillatorType = "sine", volume: number = 0.3) => {
      if (!gameState.audioContext) return;
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
    
    const playShootSound = () => playSound(200, 0.1, "square", 0.1);
    const playHitSound = () => playSound(100, 0.15, "sawtooth", 0.2);
    const playLevelUpSound = () => {
      playSound(300, 0.1, "sine", 0.3);
      setTimeout(() => playSound(400, 0.1, "sine", 0.3), 100);
      setTimeout(() => playSound(600, 0.2, "sine", 0.3), 200);
    };
    const playDeathSound = () => {
      playSound(400, 0.2, "sawtooth", 0.4);
      setTimeout(() => playSound(200, 0.3, "sawtooth", 0.4), 100);
    };
    const playPowerupSound = () => {
      playSound(400, 0.1, "sine", 0.25);
      setTimeout(() => playSound(500, 0.1, "sine", 0.25), 50);
      setTimeout(() => playSound(600, 0.15, "sine", 0.25), 100);
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      gameState.keys[e.key.toLowerCase()] = true;
      if (e.key === "Escape") {
        gameState.paused = !gameState.paused;
        gameState.showPauseMenu = !gameState.showPauseMenu;
      }
      // R key start timer, no instant reload
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.keys[e.key.toLowerCase()] = false;
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
      
      // Multiplicador de HP por wave: +15% por cada wave
      const waveMultiplier = 1 + (gameState.wave - 1) * 0.15;
      
      // Sistema de tipos de enemigos por color
      const roll = Math.random();
      let enemyType: "strong" | "medium" | "weak";
      let color: string;
      let damage: number;
      let baseHp: number;
      let rad: number;
      let spd: number;
      
      if (roll < 0.2) {
        // 20% Amarillo - Fuerte
        enemyType = "strong";
        color = "#fbbf24";
        damage = 20;
        baseHp = 8;
        rad = 18;
        spd = 0.9;
      } else if (roll < 0.5) {
        // 30% Morado - Medio
        enemyType = "medium";
        color = "#a855f7";
        damage = 10;
        baseHp = 5;
        rad = 15;
        spd = 1.1;
      } else {
        // 50% Verde - Débil
        enemyType = "weak";
        color = "#22c55e";
        damage = 5;
        baseHp = 3;
        rad = 12;
        spd = 1.3;
      }
      
      const scaledHp = Math.floor(baseHp * waveMultiplier);
      
      gameState.enemies.push({
        x, y,
        rad,
        hp: scaledHp,
        maxhp: scaledHp,
        spd,
        enemyType,
        damage,
        isElite: false,
        isMiniBoss: false,
        color,
      });
    }
    
    function spawnMiniBoss() {
      const side = Math.floor(Math.random() * 4);
      let x, y;
      if (side === 0) { x = Math.random() * W; y = -40; }
      else if (side === 1) { x = W + 40; y = Math.random() * H; }
      else if (side === 2) { x = Math.random() * W; y = H + 40; }
      else { x = -40; y = Math.random() * H; }
      
      // Multiplicador de HP por wave: +15% por cada wave
      const waveMultiplier = 1 + (gameState.wave - 1) * 0.15;
      const baseHp = 25;
      const scaledHp = Math.floor(baseHp * waveMultiplier);
      
      gameState.enemies.push({
        x, y,
        rad: 28,
        hp: scaledHp,
        maxhp: scaledHp,
        spd: 1.0,
        isElite: false,
        isMiniBoss: true,
        color: "#fbbf24",
      });
    }

    function nearestEnemy() {
      let best = null;
      let bestDist = 1e9;
      for (const e of gameState.enemies) {
        const onScreen = e.x >= -50 && e.x <= W + 50 && e.y >= -50 && e.y <= H + 50;
        if (!onScreen) continue;
        const d = Math.hypot(e.x - gameState.player.x, e.y - gameState.player.y);
        if (d < bestDist) {
          bestDist = d;
          best = e;
        }
      }
      return best;
    }

    function shootWeapon(weapon: Weapon, target: any) {
      const range = weapon.range * gameState.player.stats.rangeMultiplier;
      const damage = weapon.damage * gameState.player.stats.damageMultiplier;
      const dir = Math.atan2(target.y - gameState.player.y, target.x - gameState.player.x);
      
      const isPierce = weapon.special === "pierce";
      const isAoe = weapon.special === "aoe";
      const isSpread = weapon.special === "spread";
      
      const shots = 1 + gameState.player.stats.multishot;
      for (let i = 0; i < shots; i++) {
        const spreadAngle = (i - (shots - 1) / 2) * 0.15;
        const finalDir = dir + spreadAngle;
        
        if (isSpread) {
          for (let j = -1; j <= 1; j++) {
            gameState.bullets.push({
              x: gameState.player.x,
              y: gameState.player.y,
              dir: finalDir + j * 0.3,
              spd: weapon.projectileSpeed,
              life: range / weapon.projectileSpeed / 60,
              damage,
              color: weapon.color,
              bounces: gameState.player.stats.bounces,
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
            pierce: isPierce,
            aoe: isAoe,
          });
        }
      }
      
      // Partículas de disparo
      for (let i = 0; i < 3; i++) {
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
      gameState.drops.push({ x, y, rad: 8, type: "xp", val, color: "#06b6d4" });
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
    
    function dropPowerup(x: number, y: number, type: "magnet" | "shield" | "rage") {
      const powerupData = {
        magnet: { color: "#10b981", rarity: "uncommon" as Rarity, duration: 10 },
        shield: { color: "#3b82f6", rarity: "rare" as Rarity, duration: 15 },
        rage: { color: "#ef4444", rarity: "epic" as Rarity, duration: 8 },
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
      const xpGained = v * gameState.player.stats.xpMultiplier;
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
        playLevelUpSound();
        showUpgradeScreen();
      }
    }
    
    function collectPowerup(drop: any) {
      const type = drop.powerupType;
      const duration = drop.duration;
      
      playPowerupSound();
      
      if (type === "magnet") {
        gameState.player.tempMagnetTimer = duration;
      } else if (type === "shield") {
        gameState.player.tempShieldTimer = duration;
        gameState.player.shield = Math.min(3, gameState.player.shield + 1);
      } else if (type === "rage") {
        gameState.player.rageTimer = duration;
      }
      
      // Partículas de powerup
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
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

    function spawnHotspot() {
      const x = Math.random() * (W - 200) + 100;
      const y = Math.random() * (H - 200) + 100;
      gameState.hotspots.push({
        x,
        y,
        rad: 60,
        progress: 0,
        required: 10, // 10 segundos para recompensa cuando está dentro
        expirationTimer: 0, // Timer de caducación (45s)
        maxExpiration: 45, // Se elimina si no llegas en 45s
        active: false,
      });
    }

    function showUpgradeScreen() {
      gameState.paused = true;
      gameState.showUpgradeUI = true;
      
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
            description: string;
            rarity: Rarity;
          }> = [
            {
              upgradeType: "damage",
              description: "+30% Daño",
              rarity: "uncommon",
            },
            {
              upgradeType: "fireRate",
              description: "+25% Cadencia",
              rarity: "rare",
            },
            {
              upgradeType: "range",
              description: "+20% Alcance",
              rarity: "uncommon",
            },
          ];
          
          // Agregar variante especial según el tipo de arma
          if (w.special === "spread") {
            upgradeVariants.push({
              upgradeType: "special" as const,
              description: "+1 Pellet adicional",
              rarity: "rare" as Rarity,
            });
          } else if (w.special === "aoe") {
            upgradeVariants.push({
              upgradeType: "special" as const,
              description: "+50% Radio de explosión",
              rarity: "epic" as Rarity,
            });
          } else if (w.special === "pierce") {
            upgradeVariants.push({
              upgradeType: "special" as const,
              description: "+2 Perforaciones",
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
              description: variant.description,
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
            description: string;
            rarity: Rarity;
          };
          const upgradeVariants: UpgradeVariant[] = [];
          
          if (t.effect === "damage") {
            upgradeVariants.push(
              { upgradeType: "effect", description: "+20% Daño", rarity: "rare" },
              { upgradeType: "special", description: "+15% Daño crítico", rarity: "epic" }
            );
          } else if (t.effect === "speed") {
            upgradeVariants.push(
              { upgradeType: "effect", description: "+15% Velocidad", rarity: "uncommon" },
              { upgradeType: "special", description: "+10% Esquiva", rarity: "rare" }
            );
          } else if (t.effect === "range") {
            upgradeVariants.push(
              { upgradeType: "effect", description: "+20% Alcance", rarity: "uncommon" },
              { upgradeType: "special", description: "+15% Velocidad de proyectil", rarity: "rare" }
            );
          } else if (t.effect === "fireRate") {
            upgradeVariants.push(
              { upgradeType: "effect", description: "+20% Cadencia", rarity: "rare" },
              { upgradeType: "special", description: "Recarga instantánea ocasional", rarity: "epic" }
            );
          } else if (t.effect === "bounce") {
            upgradeVariants.push(
              { upgradeType: "effect", description: "+1 Rebote", rarity: "epic" },
              { upgradeType: "special", description: "Rebotes explosivos", rarity: "legendary" }
            );
          } else if (t.effect === "multishot") {
            upgradeVariants.push(
              { upgradeType: "effect", description: "+1 Proyectil", rarity: "legendary" },
              { upgradeType: "special", description: "Patrón circular", rarity: "epic" }
            );
          } else if (t.effect === "xp") {
            upgradeVariants.push(
              { upgradeType: "effect", description: "+25% XP", rarity: "rare" },
              { upgradeType: "special", description: "Doble XP de jefes", rarity: "epic" }
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
              description: variant.description,
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
      
      // Items siempre disponibles
      for (const item of ITEMS) {
        availableUpgrades.push({ 
          type: "item", 
          data: item, 
          rarity: item.rarity 
        });
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
          existingTome.level++;
          
          // Aplicar bonificación según el efecto del tomo
          if (existingTome.effect === "damage") {
            gameState.player.stats.damageMultiplier *= 1.15; // +15% daño adicional
          } else if (existingTome.effect === "speed") {
            gameState.player.stats.speedMultiplier *= 1.10; // +10% velocidad adicional
          } else if (existingTome.effect === "range") {
            gameState.player.stats.rangeMultiplier *= 1.15; // +15% alcance adicional
          } else if (existingTome.effect === "fireRate") {
            gameState.player.stats.fireRateMultiplier *= 1.15; // +15% cadencia adicional
          } else if (existingTome.effect === "bounce") {
            gameState.player.stats.bounces += 1; // +1 rebote
          } else if (existingTome.effect === "multishot") {
            gameState.player.stats.multishot += 1; // +1 proyectil
          } else if (existingTome.effect === "xp") {
            gameState.player.stats.xpMultiplier *= 1.15; // +15% XP adicional
          }
        } else {
          // Nuevo tomo
          if (gameState.player.tomes.length < 3) {
            gameState.player.tomes.push(tome);
            
            // Aplicar efecto inicial
            if (tome.effect === "damage") gameState.player.stats.damageMultiplier *= tome.value;
            if (tome.effect === "speed") gameState.player.stats.speedMultiplier *= tome.value;
            if (tome.effect === "range") gameState.player.stats.rangeMultiplier *= tome.value;
            if (tome.effect === "fireRate") gameState.player.stats.fireRateMultiplier *= tome.value;
            if (tome.effect === "bounce") gameState.player.stats.bounces += tome.value;
            if (tome.effect === "multishot") gameState.player.stats.multishot += tome.value;
            if (tome.effect === "xp") gameState.player.stats.xpMultiplier *= tome.value;
          }
        }
      } else if (option.type === "item") {
        const item = option.data as Item;
        gameState.player.items.push(item);
        
        if (item.effect === "magnet") gameState.player.magnet *= 1.5;
        if (item.effect === "shield") gameState.player.shield = Math.min(3, gameState.player.shield + 1);
        if (item.effect === "maxhp") {
          gameState.player.maxhp = Math.min(150, gameState.player.maxhp + 20);
          gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + 20);
        }
        if (item.effect === "aura") gameState.player.stats.auraRadius = 80;
        if (item.effect === "vampire") gameState.player.stats.vampire = 0.1;
      }

      gameState.showUpgradeUI = false;
      gameState.paused = false;
      gameState.upgradeOptions = [];
    }

    // Click handler para upgrades y pause menu
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
      if (gameState.showUpgradeUI) {
        const cardW = 250;
        const cardH = 180;
        const gap = 30;
        const startX = W / 2 - (cardW * 1.5 + gap);
        const startY = H / 2 - cardH / 2;
        
        for (let i = 0; i < 3; i++) {
          const cx = startX + i * (cardW + gap);
          if (mx >= cx && mx <= cx + cardW && my >= startY && my <= startY + cardH) {
            selectUpgrade(i);
            break;
          }
        }
      } else if (gameState.showPauseMenu) {
        const btnW = 180;
        const btnH = 50;
        const btnGap = 20;
        const continueX = W / 2 - btnW - btnGap / 2;
        const restartX = W / 2 + btnGap / 2;
        const btnY = H / 2 + 220;
        
        // Continue button
        if (mx >= continueX && mx <= continueX + btnW && my >= btnY && my <= btnY + btnH) {
          gameState.paused = false;
          gameState.showPauseMenu = false;
        }
        
        // Restart button
        if (mx >= restartX && mx <= restartX + btnW && my >= btnY && my <= btnY + btnH) {
          window.location.reload();
        }
      }
    });

    function update(dt: number) {
      // Restart timer (works even when paused)
      if (gameState.keys["r"]) {
        gameState.restartTimer = Math.min(gameState.restartHoldTime, gameState.restartTimer + dt);
        if (gameState.restartTimer >= gameState.restartHoldTime) {
          // Force immediate reload
          setTimeout(() => window.location.reload(), 0);
          return; // Stop updating
        }
      } else {
        gameState.restartTimer = 0;
      }

      if (gameState.paused) return;
      gameState.time += dt;

      // Animations
      if (gameState.levelUpAnimation > 0) gameState.levelUpAnimation = Math.max(0, gameState.levelUpAnimation - dt * 2);
      if (gameState.upgradeAnimation > 0) gameState.upgradeAnimation = Math.max(0, gameState.upgradeAnimation - dt);

      // Wave system
      gameState.waveTimer += dt;
      if (gameState.waveTimer >= 60) {
        gameState.waveTimer = 0;
        gameState.wave++;
      }

      // Hotspot spawning
      gameState.hotspotTimer += dt;
      if (gameState.hotspotTimer >= 30 && gameState.hotspots.length < 2) {
        gameState.hotspotTimer = 0;
        spawnHotspot();
      }

      // Hotspot logic - Timer de caducación (45s) vs Timer de recompensa (10s)
      for (let i = gameState.hotspots.length - 1; i >= 0; i--) {
        const h = gameState.hotspots[i];
        const d = Math.hypot(h.x - gameState.player.x, h.y - gameState.player.y);
        
        if (d < h.rad) {
          // Jugador DENTRO: cuenta para recompensa (10s)
          h.active = true;
          h.progress += dt;
          // NO incrementa timer de caducación
          
          if (h.progress >= h.required) {
            // ¡Recompensa!
            collectXP(100);
            gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + 2);
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
                color: "#fbbf24",
                size: 4,
              });
            }
          }
        } else {
          // Jugador FUERA: cuenta timer de caducación (45s)
          h.active = false;
          h.expirationTimer += dt;
          
          // Si pasa el tiempo de caducación, eliminar sin recompensa
          if (h.expirationTimer >= h.maxExpiration) {
            gameState.hotspots.splice(i, 1);
          }
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

      // Regeneración
      if (gameState.player.items.find((it: Item) => it.id === "regen")) {
        gameState.regenTimer += dt;
        if (gameState.regenTimer >= 10) {
          gameState.regenTimer = 0;
          gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + 5);
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
      gameState.player.x = Math.max(gameState.player.rad, Math.min(W - gameState.player.rad, gameState.player.x + vx * spd));
      gameState.player.y = Math.max(gameState.player.rad, Math.min(H - gameState.player.rad, gameState.player.y + vy * spd));

      // Spawn enemigos con dificultad de wave
      gameState.lastSpawn += dt;
      const waveDifficulty = 1 + (gameState.wave - 1) * 0.2;
      const spawnRate = Math.max(0.2, 1.2 - gameState.level * 0.05) / waveDifficulty;
      if (gameState.lastSpawn > spawnRate) {
        spawnEnemy();
        gameState.lastSpawn = 0;
      }
      
      // Spawn mini-boss cada 30 segundos
      gameState.lastMiniBossSpawn += dt;
      if (gameState.lastMiniBossSpawn >= 30) {
        gameState.lastMiniBossSpawn = 0;
        spawnMiniBoss();
      }

      // Mover enemigos
      for (const e of gameState.enemies) {
        const dx = gameState.player.x - e.x;
        const dy = gameState.player.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        e.x += (dx / d) * e.spd;
        e.y += (dy / d) * e.spd;
      }

      // Disparo automático
      autoShoot(dt);

      // Actualizar balas
      for (const b of gameState.bullets) {
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
          if (Math.hypot(e.x - b.x, e.y - b.y) < e.rad + 4) {
            e.hp -= b.damage;
            
            // Explosión AOE
            if (b.aoe) {
              for (const e2 of gameState.enemies) {
                if (Math.hypot(e2.x - b.x, e2.y - b.y) < 60) {
                  e2.hp -= b.damage * 0.5;
                }
              }
              // Partículas de explosión
              for (let j = 0; j < 20; j++) {
                const angle = (Math.PI * 2 * j) / 20;
                gameState.particles.push({
                  x: b.x,
                  y: b.y,
                  vx: Math.cos(angle) * 5,
                  vy: Math.sin(angle) * 5,
                  life: 0.6,
                  color: "#a855f7",
                  size: 3,
                });
              }
            }

            if (!b.pierce) b.life = 0;

            if (e.hp <= 0) {
              gameState.enemies.splice(i, 1);
              
              // Puntos y XP según tipo de enemigo
              let points = 10;
              let xpBundles = 1;
              let dropChance = 0;
              
              if (e.isMiniBoss) {
                points = 100;
                xpBundles = Math.floor(Math.random() * 3) + 4; // 4-6 bundles
                dropChance = 0.10; // 10% chance de drop temporal
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
                dropXP(e.x + offsetX, e.y + offsetY, e.isMiniBoss ? 30 : (e.enemyType === "strong" ? 5 : e.enemyType === "medium" ? 3 : 2));
              }
              
              // Drop de curación (15% de probabilidad)
              const healRoll = Math.random();
              const luckMultiplier = gameState.player.items.find((it: Item) => it.id === "luck") ? 1.5 : 1;
              
              if (healRoll < 0.15 * luckMultiplier) {
                dropHeal(e.x, e.y);
              }
              
              // Drop temporal con probabilidad
              if (Math.random() < dropChance) {
                const roll = Math.random();
                const powerupType = roll < 0.4 ? "magnet" : roll < 0.7 ? "shield" : "rage";
                dropPowerup(e.x, e.y, powerupType);
              }

              // Vampirismo
              if (gameState.player.stats.vampire > 0) {
                const healAmount = Math.floor(b.damage * gameState.player.stats.vampire * 10);
                gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + healAmount);
              }
              
              playHitSound();

              // Partículas de muerte
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
              break;
            }
          }
        }
      }

      // Recoger drops
      for (let i = gameState.drops.length - 1; i >= 0; i--) {
        const g = gameState.drops[i];
        const dx = gameState.player.x - g.x;
        const dy = gameState.player.y - g.y;
        const d = Math.hypot(dx, dy) || 1;
        
        // Magnet temporal aumenta el rango
        const magnetRange = gameState.player.tempMagnetTimer > 0 
          ? gameState.player.magnet * 2 
          : gameState.player.magnet;
        
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
            // Partículas de curación
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
          } else if (g.type === "powerup") {
            collectPowerup(g);
          }
          gameState.drops.splice(i, 1);
        }
      }

      // Colisión jugador-enemigo - Rage mode invulnerable
      if (gameState.player.rageTimer <= 0) {
        for (const e of gameState.enemies) {
          if (Math.hypot(e.x - gameState.player.x, e.y - gameState.player.y) < e.rad + gameState.player.rad) {
            if (gameState.player.ifr <= 0) {
              if (gameState.player.shield > 0) {
                gameState.player.shield--;
                gameState.player.ifr = gameState.player.ifrDuration;
                // Shield break particles
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
              } else {
                gameState.player.hp = Math.max(0, gameState.player.hp - e.damage);
                gameState.player.ifr = gameState.player.ifrDuration;
                
                // Hit particles
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
              
              if (gameState.player.hp <= 0) {
                // Save score to leaderboard
                const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
                leaderboard.push({ score: gameState.score, level: gameState.level, wave: gameState.wave, date: new Date().toISOString() });
                leaderboard.sort((a: any, b: any) => b.score - a.score);
                localStorage.setItem("leaderboard", JSON.stringify(leaderboard.slice(0, 10)));
                
                playDeathSound();
                setGameOver(true);
                gameState.paused = true;
              }
              
              playHitSound();
            }
          }
        }
      }

      // Colisión entre enemigos
      for (let i = 0; i < gameState.enemies.length; i++) {
        for (let j = i + 1; j < gameState.enemies.length; j++) {
          const a = gameState.enemies[i];
          const b = gameState.enemies[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          const minDist = a.rad + b.rad;
          
          if (d < minDist && d > 0) {
            const overlap = minDist - d;
            const nx = dx / d;
            const ny = dy / d;
            a.x -= nx * overlap / 2;
            a.y -= ny * overlap / 2;
            b.x += nx * overlap / 2;
            b.y += ny * overlap / 2;
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
      ctx.save();
      
      // HP Bar - Barra horizontal con valor numérico
      const hpBarX = 20;
      const hpBarY = 20;
      const hpBarW = 300;
      const hpBarH = 32;
      
      // Fondo de la barra de HP
      ctx.fillStyle = "rgba(20, 25, 35, 0.9)";
      ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 3;
      ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);
      
      // Barra de HP actual (roja)
      const hpPercent = gameState.player.hp / gameState.player.maxhp;
      const currentHpBarW = hpBarW * hpPercent;
      
      // Gradiente para la barra de HP
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
      
      // XP Bar
      const xpBarW = 300;
      const xpBarH = 12;
      const xpBarX = 20;
      const xpBarY = hpBarY + hpBarH + 12;
      
      ctx.fillStyle = "rgba(20, 25, 35, 0.9)";
      ctx.fillRect(xpBarX, xpBarY, xpBarW, xpBarH);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.strokeRect(xpBarX, xpBarY, xpBarW, xpBarH);
      
      const xpProgress = gameState.xp / gameState.nextXP;
      ctx.fillStyle = "#06b6d4";
      ctx.fillRect(xpBarX, xpBarY, xpBarW * xpProgress, xpBarH);
      
      // Level
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px system-ui";
      ctx.textAlign = "left";
      ctx.fillText(`Nivel ${gameState.level}`, xpBarX + xpBarW + 12, xpBarY + xpBarH - 2);
      
      // Wave
      ctx.fillStyle = "#a855f7";
      ctx.font = "bold 16px system-ui";
      ctx.fillText(`Wave ${gameState.wave}`, xpBarX, xpBarY + xpBarH + 20);
      
      // Score
      ctx.textAlign = "right";
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 24px system-ui";
      ctx.fillText(`${gameState.score}`, W - 20, 40);

      // Weapons display
      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px system-ui";
      ctx.fillText("Armas:", W - 220, 70);
      for (let i = 0; i < gameState.player.weapons.length; i++) {
        const w = gameState.player.weapons[i];
        ctx.fillStyle = w.color;
        ctx.fillRect(W - 220, 80 + i * 25, 18, 18);
        ctx.fillStyle = "#fff";
        ctx.font = "12px system-ui";
        const weaponText = w.level > 1 ? `${w.name} LVL ${w.level}` : w.name;
        ctx.fillText(weaponText, W - 195, 93 + i * 25);
      }

      // Tomes display
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px system-ui";
      const tomeY = 80 + gameState.player.weapons.length * 25 + 10;
      ctx.fillText("Tomos:", W - 220, tomeY);
      for (let i = 0; i < gameState.player.tomes.length; i++) {
        const t = gameState.player.tomes[i];
        ctx.fillStyle = t.color;
        ctx.fillRect(W - 220, tomeY + 10 + i * 25, 18, 18);
        ctx.fillStyle = "#fff";
        ctx.font = "12px system-ui";
        const tomeText = t.level > 1 ? `${t.name} LVL ${t.level}` : t.name;
        ctx.fillText(tomeText, W - 195, tomeY + 23 + i * 25);
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
        ctx.fillText("LEVEL UP!", 0, 0);
        ctx.restore();
        ctx.globalAlpha = 1;
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
      if (!gameState.showUpgradeUI) return;

      ctx.save();
      
      // Animated overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, W, H);
      
      const pulse = Math.sin(gameState.time * 3) * 0.1 + 0.9;
      
      // Título con animación
      ctx.fillStyle = "#fbbf24";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 20 * pulse;
      ctx.font = "bold 48px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("¡SUBISTE DE NIVEL!", W / 2, H / 2 - 180);
      ctx.shadowBlur = 0;
      
      ctx.font = "24px system-ui";
      ctx.fillStyle = "#9ca3af";
      ctx.fillText("Elige una mejora:", W / 2, H / 2 - 130);
      
      // Cards con animación
      const cardW = 250;
      const cardH = 180;
      const gap = 30;
      const startX = W / 2 - (cardW * 1.5 + gap);
      const startY = H / 2 - cardH / 2;
      
      for (let i = 0; i < gameState.upgradeOptions.length; i++) {
        const option = gameState.upgradeOptions[i];
        const x = startX + i * (cardW + gap);
        const y = startY;
        
        const hover = Math.sin(gameState.time * 4 + i * 1.2) * 5;
        
        // Card background
        const rarityColor = rarityColors[option.rarity];
        ctx.fillStyle = "rgba(20, 25, 35, 0.95)";
        ctx.fillRect(x, y + hover, cardW, cardH);
        
        // Borde de rareza con animación
        ctx.strokeStyle = rarityColor;
        ctx.lineWidth = 3 + Math.sin(gameState.time * 5 + i) * 1;
        ctx.strokeRect(x, y + hover, cardW, cardH);
        
        // Glow effect pulsante
        ctx.shadowColor = rarityColor;
        ctx.shadowBlur = 30 * pulse;
        ctx.strokeRect(x, y + hover, cardW, cardH);
        ctx.shadowBlur = 0;
        
        // Tipo
        ctx.fillStyle = rarityColor;
        ctx.font = "bold 14px system-ui";
        ctx.textAlign = "center";
        const typeText = option.type === "weapon" ? "ARMA" : option.type === "tome" ? "TOMO" : "ÍTEM";
        ctx.fillText(typeText, x + cardW / 2, y + hover + 25);
        
        // Nombre con nivel
        const data = option.data as any;
        ctx.fillStyle = "#fff";
        ctx.font = "bold 18px system-ui";
        const nameText = option.isLevelUp ? `${data.name} LVL ${data.level + 1}` : data.name;
        ctx.fillText(nameText, x + cardW / 2, y + hover + 60);
        
        // Descripción
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px system-ui";
        if (option.type === "weapon") {
          const w = data as Weapon;
        if (option.isLevelUp && option.description) {
            ctx.fillText(option.description, x + cardW / 2, y + hover + 100);
          } else {
            ctx.fillText(`Daño: ${w.damage.toFixed(1)}`, x + cardW / 2, y + hover + 90);
            ctx.fillText(`Cadencia: ${w.fireRate.toFixed(1)}/s`, x + cardW / 2, y + hover + 110);
            ctx.fillText(`Alcance: ${w.range}`, x + cardW / 2, y + hover + 130);
          }
        } else if (option.type === "tome") {
          const t = data as Tome;
          if (option.isLevelUp && option.description) {
            ctx.fillText(option.description, x + cardW / 2, y + hover + 100);
          } else {
            ctx.fillText(t.description, x + cardW / 2, y + hover + 100);
          }
        } else {
          ctx.fillText(data.description, x + cardW / 2, y + hover + 100);
        }
        
        // Rareza
        ctx.fillStyle = rarityColor;
        ctx.font = "bold 12px system-ui";
        ctx.fillText(option.rarity.toUpperCase(), x + cardW / 2, y + hover + cardH - 15);
        
        // Partículas de rareza
        for (let j = 0; j < 2; j++) {
          const px = x + Math.random() * cardW;
          const py = y + hover + Math.random() * cardH;
          ctx.fillStyle = rarityColor;
          ctx.globalAlpha = 0.3 + Math.random() * 0.3;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      
      // Fondo
      const gradient = ctx.createRadialGradient(W / 2, H / 3, 0, W / 2, H / 3, Math.max(W, H));
      gradient.addColorStop(0, "#0f1729");
      gradient.addColorStop(0.5, "#0a0f1a");
      gradient.addColorStop(1, "#060a10");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      
      // Hotspots
      for (const h of gameState.hotspots) {
        const pulse = Math.sin(gameState.time * 3) * 0.1 + 0.9;
        
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
          // Mostrar tiempo para completar (10s)
          ctx.fillStyle = "#22c55e";
          ctx.font = "bold 20px system-ui";
          ctx.textAlign = "center";
          ctx.fillText(`${Math.ceil(h.required - h.progress)}s`, h.x, h.y + 5);
        } else {
          // Mostrar tiempo de caducación (45s)
          const remaining = h.maxExpiration - h.expirationTimer;
          ctx.fillStyle = "#ef4444";
          ctx.font = "bold 18px system-ui";
          ctx.textAlign = "center";
          ctx.fillText(`${Math.ceil(remaining)}s`, h.x, h.y + 5);
        }
      }

      // Drops con glow de rareza para powerups
      for (const d of gameState.drops) {
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
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = e.isMiniBoss ? 25 : 15;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // HP bar para todos los enemigos
        const barW = e.rad * 2;
        const barH = e.isMiniBoss ? 6 : e.isElite ? 5 : 3;
        const barX = e.x - barW / 2;
        const barY = e.y - e.rad - 10;
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(barX, barY, barW, barH);
        
        ctx.fillStyle = e.isMiniBoss ? "#fbbf24" : e.isElite ? "#f87171" : "#34d399";
        ctx.fillRect(barX, barY, barW * (e.hp / e.maxhp), barH);
      }
      
      // Balas
      for (const b of gameState.bullets) {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.aoe ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
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
      
      // Pause menu
      if (gameState.showPauseMenu) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, W, H);
        
        // Title
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 64px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(t.paused, W / 2, H / 2 - 200);
        
        // Stats box
        const boxW = 400;
        const boxH = 300;
        const boxX = W / 2 - boxW / 2;
        const boxY = H / 2 - 100;
        
        ctx.fillStyle = "rgba(20, 25, 35, 0.95)";
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxW, boxH);
        
        // Stats text
        ctx.fillStyle = "#fff";
        ctx.font = "bold 24px system-ui";
        ctx.textAlign = "left";
        const statX = boxX + 30;
        let statY = boxY + 50;
        
        ctx.fillText(`${t.stats}:`, statX, statY);
        statY += 40;
        ctx.font = "18px system-ui";
        ctx.fillStyle = "#9ca3af";
        ctx.fillText(`HP: ${gameState.player.hp} / ${gameState.player.maxhp}`, statX, statY);
        statY += 30;
        ctx.fillText(`${t.level}: ${gameState.level}`, statX, statY);
        statY += 30;
        ctx.fillText(`${t.wave}: ${gameState.wave}`, statX, statY);
        statY += 30;
        ctx.fillText(`Score: ${gameState.score}`, statX, statY);
        statY += 30;
        ctx.fillText(`${t.weapons} ${gameState.player.weapons.length}/3`, statX, statY);
        statY += 30;
        ctx.fillText(`${t.tomes} ${gameState.player.tomes.length}/3`, statX, statY);
        
        // Buttons
        const btnW = 180;
        const btnH = 50;
        const btnGap = 20;
        const continueX = W / 2 - btnW - btnGap / 2;
        const restartX = W / 2 + btnGap / 2;
        const btnY = H / 2 + 220;
        
        // Continue button
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(continueX, btnY, btnW, btnH);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(continueX, btnY, btnW, btnH);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(t.continue, continueX + btnW / 2, btnY + btnH / 2 + 7);
        
        // Restart button
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(restartX, btnY, btnW, btnH);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(restartX, btnY, btnW, btnH);
        ctx.fillStyle = "#fff";
        ctx.fillText(t.restart, restartX + btnW / 2, btnY + btnH / 2 + 7);
        
        ctx.restore();
      }
    }

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

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: "crosshair" }}
      />
      
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div className="text-center space-y-6 p-8 max-w-2xl">
            <h1 className="text-6xl font-bold text-red-500 animate-pulse">GAME OVER</h1>
            <p className="text-3xl text-foreground">Puntuación: {score}</p>
            <p className="text-2xl text-muted-foreground">Nivel alcanzado: {level}</p>
            <p className="text-xl text-muted-foreground">Wave {gameStateRef.current?.wave || 1}</p>
            
            <div className="mt-8 p-4 bg-background/50 rounded-lg">
              <h2 className="text-2xl font-bold text-foreground mb-4">🏆 Leaderboard</h2>
              <div className="space-y-2">
                {(() => {
                  const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
                  return leaderboard.slice(0, 5).map((entry: any, i: number) => (
                    <div key={i} className="flex justify-between text-lg">
                      <span className="text-muted-foreground">#{i + 1}</span>
                      <span className="text-foreground font-semibold">{entry.score}</span>
                      <span className="text-muted-foreground">Nivel {entry.level}</span>
                      <span className="text-muted-foreground">Wave {entry.wave}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="mt-8 px-8 py-4 bg-primary text-primary-foreground rounded-lg text-xl font-bold hover:opacity-90 transition-opacity"
            >
              Jugar de nuevo
            </button>
          </div>
        </div>
      )}
      
      {/* Language selector */}
      <button
        onClick={() => setLanguage(language === "es" ? "en" : "es")}
        className="absolute top-4 right-4 px-4 py-2 bg-primary/80 hover:bg-primary text-primary-foreground rounded-lg font-bold transition-colors z-10"
      >
        {language.toUpperCase()}
      </button>
      
      {/* Controls - Repositioned to bottom-left */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground space-y-1 pointer-events-none">
        <p>{t.movement}</p>
        <p>{t.restart}</p>
        <p>{t.pause}</p>
        <p>{t.autoShoot}</p>
      </div>
    </div>
  );
};

export default Index;
