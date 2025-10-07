import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// Types
type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
type Language = "en" | "es";

type Translations = {
  [key: string]: {
    [key in Language]: string;
  };
};

type Weapon = {
  id: string;
  name: { en: string; es: string };
  description: { en: string; es: string };
  rarity: Rarity;
  level: number;
  maxLevel: number;
  damage: number;
  fireRate: number;
  projectileSpeed: number;
  piercing: number;
};

type Tome = {
  id: string;
  name: { en: string; es: string };
  description: { en: string; es: string };
  rarity: Rarity;
  level: number;
  maxLevel: number;
  effect: string;
  value: number;
};

type Item = {
  id: string;
  name: { en: string; es: string };
  description: { en: string; es: string };
  rarity: Rarity;
  effect: string;
  value: number;
};

type Upgrade = Weapon | Tome | Item;

// Translations
const translations: Translations = {
  level: { en: "Level", es: "Nivel" },
  wave: { en: "Wave", es: "Oleada" },
  score: { en: "Score", es: "Puntuación" },
  gameOver: { en: "Game Over", es: "Juego Terminado" },
  finalScore: { en: "Final Score", es: "Puntuación Final" },
  restart: { en: "Restart", es: "Reiniciar" },
  chooseUpgrade: { en: "Choose an Upgrade", es: "Elige una Mejora" },
  maxLevel: { en: "MAX", es: "MAX" },
  controls: { en: "Controls", es: "Controles" },
  move: { en: "WASD - Move", es: "WASD - Mover" },
  pause: { en: "ESC - Pause", es: "ESC - Pausar" },
  restartKey: { en: "R - Restart", es: "R - Reiniciar" },
  paused: { en: "Paused", es: "Pausado" },
  continue: { en: "Continue", es: "Continuar" },
  stats: { en: "Stats", es: "Estadísticas" },
  hp: { en: "HP", es: "Vida" },
  shield: { en: "Shield", es: "Escudo" },
  weapons: { en: "Weapons", es: "Armas" },
  tomes: { en: "Tomes", es: "Tomos" },
};

// Weapons data
const WEAPONS: Weapon[] = [
  {
    id: "pistol",
    name: { en: "Pistol", es: "Pistola" },
    description: { en: "Basic firearm", es: "Arma básica" },
    rarity: "common",
    level: 1,
    maxLevel: 5,
    damage: 10,
    fireRate: 0.5,
    projectileSpeed: 400,
    piercing: 0,
  },
  {
    id: "shotgun",
    name: { en: "Shotgun", es: "Escopeta" },
    description: { en: "Spread shot", es: "Disparo disperso" },
    rarity: "uncommon",
    level: 1,
    maxLevel: 5,
    damage: 8,
    fireRate: 1,
    projectileSpeed: 350,
    piercing: 0,
  },
  {
    id: "rifle",
    name: { en: "Rifle", es: "Rifle" },
    description: { en: "High damage", es: "Alto daño" },
    rarity: "rare",
    level: 1,
    maxLevel: 5,
    damage: 25,
    fireRate: 0.8,
    projectileSpeed: 600,
    piercing: 1,
  },
];

// Tomes data
const TOMES: Tome[] = [
  {
    id: "fireball",
    name: { en: "Fireball", es: "Bola de Fuego" },
    description: { en: "Explosive projectile", es: "Proyectil explosivo" },
    rarity: "uncommon",
    level: 1,
    maxLevel: 5,
    effect: "aoe",
    value: 15,
  },
  {
    id: "lightning",
    name: { en: "Lightning", es: "Rayo" },
    description: { en: "Chain lightning", es: "Rayo en cadena" },
    rarity: "rare",
    level: 1,
    maxLevel: 5,
    effect: "chain",
    value: 20,
  },
  {
    id: "frost",
    name: { en: "Frost", es: "Hielo" },
    description: { en: "Slows enemies", es: "Ralentiza enemigos" },
    rarity: "epic",
    level: 1,
    maxLevel: 5,
    effect: "slow",
    value: 12,
  },
];

// Items data
const ITEMS: Item[] = [
  {
    id: "magnet",
    name: { en: "Magnet", es: "Imán" },
    description: { en: "Increases pickup range", es: "Aumenta rango de recolección" },
    rarity: "common",
    effect: "magnetRange",
    value: 50,
  },
  {
    id: "regen",
    name: { en: "Regeneration", es: "Regeneración" },
    description: { en: "Heal over time", es: "Curación con el tiempo" },
    rarity: "uncommon",
    effect: "regen",
    value: 1,
  },
  {
    id: "armor",
    name: { en: "Shield", es: "Escudo" },
    description: { en: "Permanent shield", es: "Escudo permanente" },
    rarity: "rare",
    effect: "shield",
    value: 1,
  },
];

// Rarity colors
const rarityColors: { [key in Rarity]: string } = {
  common: "#9ca3af",
  uncommon: "#10b981",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#f59e0b",
};

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [language, setLanguage] = useState<Language>("es");
  const [showGameOver, setShowGameOver] = useState(false);

  const t = (key: string) => translations[key]?.[language] || key;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas setup
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Audio setup
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playSound = (frequency: number, duration: number, type: OscillatorType = "sine") => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    };

    const sounds = {
      shoot: () => playSound(200, 0.1, "square"),
      hit: () => playSound(100, 0.15, "sawtooth"),
      levelUp: () => {
        playSound(300, 0.1);
        setTimeout(() => playSound(400, 0.1), 100);
        setTimeout(() => playSound(600, 0.2), 200);
      },
      death: () => {
        playSound(400, 0.5, "sawtooth");
      },
      powerup: () => playSound(500, 0.3, "sine"),
    };

    // Game state
    const gameState = {
      player: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 20,
        speed: 200,
        hp: 100,
        maxHp: 100,
        shield: 0,
        xp: 0,
        xpToNextLevel: 100,
        level: 1,
        magnetRange: 150,
        regenRate: 0,
        lastRegenTime: 0,
        velocityX: 0,
        velocityY: 0,
      },
      weapons: [] as Weapon[],
      tomes: [] as Tome[],
      items: [] as Item[],
      enemies: [] as any[],
      bullets: [] as any[],
      drops: [] as any[],
      particles: [] as any[],
      hotspots: [] as any[],
      keys: {} as { [key: string]: boolean },
      lastShot: 0,
      wave: 1,
      score: 0,
      lastSpawn: 0,
      spawnRate: 2,
      gameOver: false,
      paused: false,
      showPauseMenu: false,
      showUpgradeUI: false,
      upgradeOptions: [] as Upgrade[],
      lastMiniBossSpawn: 0,
      tempEffects: {
        magnetBoost: 0,
        shieldBoost: 0,
        rage: 0,
      },
    };

    // Input handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      gameState.keys[e.key.toLowerCase()] = true;
      
      if (e.key === "Escape") {
        if (!gameState.showUpgradeUI) {
          gameState.paused = !gameState.paused;
          gameState.showPauseMenu = gameState.paused;
        }
      }
      
      if (e.key.toLowerCase() === "r") {
        window.location.reload();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Click handler for upgrades and pause menu
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Pause menu buttons
      if (gameState.showPauseMenu) {
        const buttonWidth = 200;
        const buttonHeight = 50;
        const centerX = canvas.width / 2;
        const continueY = canvas.height / 2 + 100;
        const restartY = canvas.height / 2 + 170;

        if (
          x >= centerX - buttonWidth / 2 &&
          x <= centerX + buttonWidth / 2
        ) {
          if (y >= continueY && y <= continueY + buttonHeight) {
            gameState.paused = false;
            gameState.showPauseMenu = false;
          } else if (y >= restartY && y <= restartY + buttonHeight) {
            window.location.reload();
          }
        }
      }

      // Upgrade selection
      if (gameState.showUpgradeUI && gameState.upgradeOptions.length > 0) {
        const cardWidth = 250;
        const cardHeight = 180;
        const spacing = 30;
        const totalWidth = gameState.upgradeOptions.length * cardWidth + (gameState.upgradeOptions.length - 1) * spacing;
        const startX = (canvas.width - totalWidth) / 2;
        const startY = canvas.height / 2 - cardHeight / 2;

        gameState.upgradeOptions.forEach((option, index) => {
          const cardX = startX + index * (cardWidth + spacing);
          const cardY = startY;

          if (
            x >= cardX &&
            x <= cardX + cardWidth &&
            y >= cardY &&
            y <= cardY + cardHeight
          ) {
            selectUpgrade(option);
          }
        });
      }
    });

    // Select upgrade function
    const selectUpgrade = (upgrade: Upgrade) => {
      sounds.levelUp();
      
      if ("damage" in upgrade) {
        const existingWeapon = gameState.weapons.find((w) => w.id === upgrade.id);
        if (existingWeapon) {
          existingWeapon.level = Math.min(existingWeapon.level + 1, existingWeapon.maxLevel);
          existingWeapon.damage *= 1.2;
          existingWeapon.fireRate *= 0.9;
        } else {
          gameState.weapons.push({ ...upgrade });
        }
      } else if ("effect" in upgrade && "maxLevel" in upgrade) {
        const existingTome = gameState.tomes.find((t) => t.id === upgrade.id);
        if (existingTome) {
          existingTome.level = Math.min(existingTome.level + 1, existingTome.maxLevel);
          existingTome.value *= 1.3;
        } else {
          gameState.tomes.push({ ...upgrade });
        }
      } else if ("effect" in upgrade) {
        const existingItem = gameState.items.find((i) => i.id === upgrade.id);
        if (!existingItem) {
          gameState.items.push({ ...upgrade });
          
          if (upgrade.effect === "magnetRange") {
            gameState.player.magnetRange += upgrade.value;
          } else if (upgrade.effect === "regen") {
            gameState.player.regenRate += upgrade.value;
          } else if (upgrade.effect === "shield") {
            gameState.player.shield += upgrade.value;
          }
        }
      }

      gameState.showUpgradeUI = false;
      gameState.paused = false;
    };

    // Show upgrade screen
    const showUpgradeScreen = () => {
      gameState.paused = true;
      gameState.showUpgradeUI = true;

      const weaponsFull = gameState.weapons.length >= 3;
      const tomesFull = gameState.tomes.length >= 3;
      
      const availableUpgrades: Upgrade[] = [];

      // Si ambos están llenos, solo ofrecer upgrades de existentes
      if (weaponsFull && tomesFull) {
        const existingWeapons = gameState.weapons.filter(w => w.level < w.maxLevel);
        const existingTomes = gameState.tomes.filter(t => t.level < t.maxLevel);
        availableUpgrades.push(...existingWeapons, ...existingTomes);
      }
      // Si solo armas están llenas
      else if (weaponsFull && !tomesFull) {
        const existingWeapons = gameState.weapons.filter(w => w.level < w.maxLevel);
        const newTomes = TOMES.filter(t => !gameState.tomes.find(gt => gt.id === t.id));
        availableUpgrades.push(...existingWeapons, ...newTomes);
      }
      // Si solo tomos están llenos
      else if (!weaponsFull && tomesFull) {
        const newWeapons = WEAPONS.filter(w => !gameState.weapons.find(gw => gw.id === w.id));
        const existingTomes = gameState.tomes.filter(t => t.level < t.maxLevel);
        availableUpgrades.push(...newWeapons, ...existingTomes);
      }
      // Ninguno está lleno
      else {
        const newWeapons = WEAPONS.filter(w => !gameState.weapons.find(gw => gw.id === w.id));
        const newTomes = TOMES.filter(t => !gameState.tomes.find(gt => gt.id === t.id));
        const newItems = ITEMS.filter(i => !gameState.items.find(gi => gi.id === i.id));
        const existingWeapons = gameState.weapons.filter(w => w.level < w.maxLevel);
        const existingTomes = gameState.tomes.filter(t => t.level < t.maxLevel);
        
        availableUpgrades.push(...newWeapons, ...newTomes, ...newItems, ...existingWeapons, ...existingTomes);
      }

      // Seleccionar 3 opciones aleatorias
      const shuffled = availableUpgrades.sort(() => Math.random() - 0.5);
      gameState.upgradeOptions = shuffled.slice(0, 3);
    };

    // Spawn enemy
    const spawnEnemy = (isElite = false, isBoss = false, isMiniBoss = false) => {
      const side = Math.floor(Math.random() * 4);
      let x, y;

      switch (side) {
        case 0:
          x = Math.random() * canvas.width;
          y = -30;
          break;
        case 1:
          x = canvas.width + 30;
          y = Math.random() * canvas.height;
          break;
        case 2:
          x = Math.random() * canvas.width;
          y = canvas.height + 30;
          break;
        default:
          x = -30;
          y = Math.random() * canvas.height;
      }

      let enemy;
      if (isBoss) {
        enemy = {
          x,
          y,
          radius: 40,
          speed: 30,
          hp: 200,
          maxHp: 200,
          color: "#ef4444",
          isBoss: true,
          isElite: false,
          isMiniBoss: false,
        };
      } else if (isMiniBoss) {
        enemy = {
          x,
          y,
          radius: 30,
          speed: 60,
          hp: 100,
          maxHp: 100,
          color: "#fbbf24",
          isBoss: false,
          isElite: false,
          isMiniBoss: true,
        };
      } else if (isElite) {
        enemy = {
          x,
          y,
          radius: 25,
          speed: 80,
          hp: 50,
          maxHp: 50,
          color: "#a855f7",
          isBoss: false,
          isElite: true,
          isMiniBoss: false,
        };
      } else {
        enemy = {
          x,
          y,
          radius: 20,
          speed: 100,
          hp: 20,
          maxHp: 20,
          color: "#ef4444",
          isBoss: false,
          isElite: false,
          isMiniBoss: false,
        };
      }

      gameState.enemies.push(enemy);
    };

    // Spawn hotspot
    const spawnHotspot = () => {
      const x = Math.random() * (canvas.width - 200) + 100;
      const y = Math.random() * (canvas.height - 200) + 100;

      gameState.hotspots.push({
        x,
        y,
        radius: 100,
        progress: 45, // 45 seconds
        healing: 2,
      });
    };

    // Drop item
    const dropXP = (x: number, y: number, count = 1) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 30;
        gameState.drops.push({
          x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance,
          type: "xp",
          value: 20,
          radius: 8,
        });
      }
    };

    const dropTempPowerup = (x: number, y: number, type: "magnet" | "shield" | "rage") => {
      let rarity: Rarity;
      let duration: number;
      let color: string;

      if (type === "magnet") {
        rarity = "uncommon";
        duration = 10;
        color = rarityColors.uncommon;
      } else if (type === "shield") {
        rarity = "rare";
        duration = 15;
        color = rarityColors.rare;
      } else {
        rarity = "epic";
        duration = 8;
        color = rarityColors.epic;
      }

      gameState.drops.push({
        x,
        y,
        type,
        duration,
        rarity,
        color,
        radius: 12,
        glowPhase: 0,
      });
    };

    // Shoot weapon
    const shootWeapon = (weapon: Weapon, currentTime: number) => {
      if (currentTime - gameState.lastShot < weapon.fireRate * 1000) return;

      sounds.shoot();
      gameState.lastShot = currentTime;

      if (gameState.enemies.length === 0) return;

      const nearestEnemy = gameState.enemies.reduce((nearest, enemy) => {
        const dist = Math.hypot(
          enemy.x - gameState.player.x,
          enemy.y - gameState.player.y
        );
        const nearestDist = Math.hypot(
          nearest.x - gameState.player.x,
          nearest.y - gameState.player.y
        );
        return dist < nearestDist ? enemy : nearest;
      });

      const angle = Math.atan2(
        nearestEnemy.y - gameState.player.y,
        nearestEnemy.x - gameState.player.x
      );

      if (weapon.id === "shotgun") {
        for (let i = -1; i <= 1; i++) {
          const spreadAngle = angle + i * 0.2;
          gameState.bullets.push({
            x: gameState.player.x,
            y: gameState.player.y,
            vx: Math.cos(spreadAngle) * weapon.projectileSpeed,
            vy: Math.sin(spreadAngle) * weapon.projectileSpeed,
            damage: weapon.damage,
            radius: 5,
            piercing: weapon.piercing,
            color: rarityColors[weapon.rarity],
          });
        }
      } else {
        gameState.bullets.push({
          x: gameState.player.x,
          y: gameState.player.y,
          vx: Math.cos(angle) * weapon.projectileSpeed,
          vy: Math.sin(angle) * weapon.projectileSpeed,
          damage: weapon.damage,
          radius: 6,
          piercing: weapon.piercing,
          color: rarityColors[weapon.rarity],
        });
      }
    };

    // Cast tome
    const castTome = (tome: Tome) => {
      if (gameState.enemies.length === 0) return;

      const nearestEnemy = gameState.enemies.reduce((nearest, enemy) => {
        const dist = Math.hypot(
          enemy.x - gameState.player.x,
          enemy.y - gameState.player.y
        );
        const nearestDist = Math.hypot(
          nearest.x - gameState.player.x,
          nearest.y - gameState.player.y
        );
        return dist < nearestDist ? enemy : nearest;
      });

      if (tome.effect === "aoe") {
        gameState.particles.push({
          x: nearestEnemy.x,
          y: nearestEnemy.y,
          radius: 60,
          color: rarityColors[tome.rarity],
          lifetime: 0.5,
          damage: tome.value,
        });
      } else if (tome.effect === "chain") {
        let currentEnemy = nearestEnemy;
        for (let i = 0; i < 3; i++) {
          currentEnemy.hp -= tome.value;
          if (currentEnemy.hp <= 0) break;

          const nextEnemy = gameState.enemies.find(
            (e) =>
              e !== currentEnemy &&
              Math.hypot(e.x - currentEnemy.x, e.y - currentEnemy.y) < 200
          );
          if (!nextEnemy) break;
          currentEnemy = nextEnemy;
        }
      } else if (tome.effect === "slow") {
        nearestEnemy.hp -= tome.value;
        nearestEnemy.speed *= 0.5;
      }
    };

    // Update game
    const update = (dt: number) => {
      if (gameState.paused || gameState.gameOver) return;

      const currentTime = performance.now();

      // Player movement
      let dx = 0;
      let dy = 0;

      if (gameState.keys["w"] || gameState.keys["arrowup"]) dy -= 1;
      if (gameState.keys["s"] || gameState.keys["arrowdown"]) dy += 1;
      if (gameState.keys["a"] || gameState.keys["arrowleft"]) dx -= 1;
      if (gameState.keys["d"] || gameState.keys["arrowright"]) dx += 1;

      if (dx !== 0 || dy !== 0) {
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        dx /= magnitude;
        dy /= magnitude;

        const speedMultiplier = gameState.tempEffects.rage > 0 ? 1.5 : 1;
        gameState.player.x += dx * gameState.player.speed * speedMultiplier * dt;
        gameState.player.y += dy * gameState.player.speed * speedMultiplier * dt;

        gameState.player.x = Math.max(
          gameState.player.radius,
          Math.min(canvas.width - gameState.player.radius, gameState.player.x)
        );
        gameState.player.y = Math.max(
          gameState.player.radius,
          Math.min(canvas.height - gameState.player.radius, gameState.player.y)
        );
      }

      // Regeneration
      if (gameState.player.regenRate > 0 && currentTime - gameState.player.lastRegenTime > 1000) {
        gameState.player.hp = Math.min(
          gameState.player.maxHp,
          gameState.player.hp + gameState.player.regenRate
        );
        gameState.player.lastRegenTime = currentTime;
      }

      // Temporary effects countdown
      if (gameState.tempEffects.magnetBoost > 0) {
        gameState.tempEffects.magnetBoost -= dt;
      }
      if (gameState.tempEffects.shieldBoost > 0) {
        gameState.tempEffects.shieldBoost -= dt;
        if (gameState.tempEffects.shieldBoost <= 0) {
          gameState.player.shield = Math.max(0, gameState.player.shield - 1);
        }
      }
      if (gameState.tempEffects.rage > 0) {
        gameState.tempEffects.rage -= dt;
      }

      // Shoot weapons
      gameState.weapons.forEach((weapon) => {
        const fireRateMultiplier = gameState.tempEffects.rage > 0 ? 0.5 : 1;
        const adjustedWeapon = { ...weapon, fireRate: weapon.fireRate * fireRateMultiplier };
        shootWeapon(adjustedWeapon, currentTime);
      });

      // Cast tomes
      gameState.tomes.forEach((tome) => {
        if (Math.random() < 0.02) {
          castTome(tome);
        }
      });

      // Update bullets
      gameState.bullets = gameState.bullets.filter((bullet) => {
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;

        return (
          bullet.x > -50 &&
          bullet.x < canvas.width + 50 &&
          bullet.y > -50 &&
          bullet.y < canvas.height + 50 &&
          bullet.piercing >= 0
        );
      });

      // Spawn enemies
      if (currentTime - gameState.lastSpawn > gameState.spawnRate * 1000) {
        const isBoss = gameState.enemies.length % 20 === 19;
        const isElite = !isBoss && Math.random() < 0.15;
        spawnEnemy(isElite, isBoss, false);
        gameState.lastSpawn = currentTime;
      }

      // Spawn mini-boss every 30 seconds
      if (currentTime - gameState.lastMiniBossSpawn > 30000) {
        spawnEnemy(false, false, true);
        gameState.lastMiniBossSpawn = currentTime;
      }

      // Update enemies
      gameState.enemies.forEach((enemy) => {
        const dx = gameState.player.x - enemy.x;
        const dy = gameState.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          enemy.x += (dx / distance) * enemy.speed * dt;
          enemy.y += (dy / distance) * enemy.speed * dt;
        }

        // Collision with player
        if (distance < gameState.player.radius + enemy.radius) {
          if (gameState.tempEffects.rage <= 0) {
            if (gameState.player.shield > 0) {
              gameState.player.shield--;
            } else {
              gameState.player.hp -= 10 * dt;
            }
          }
        }
      });

      // Bullet-enemy collision
      gameState.bullets.forEach((bullet) => {
        gameState.enemies.forEach((enemy) => {
          const distance = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
          if (distance < bullet.radius + enemy.radius) {
            sounds.hit();
            enemy.hp -= bullet.damage;
            bullet.piercing--;

            if (enemy.hp <= 0) {
              gameState.score += enemy.isBoss ? 100 : enemy.isMiniBoss ? 50 : enemy.isElite ? 25 : 10;
              setScore(gameState.score);

              // XP drops based on enemy type
              if (enemy.isBoss) {
                dropXP(enemy.x, enemy.y, 5 + Math.floor(Math.random() * 4));
                if (Math.random() < 0.2) {
                  const powerups = ["magnet", "shield", "rage"] as const;
                  dropTempPowerup(enemy.x, enemy.y, powerups[Math.floor(Math.random() * 3)]);
                }
              } else if (enemy.isMiniBoss) {
                dropXP(enemy.x, enemy.y, 4 + Math.floor(Math.random() * 3));
                if (Math.random() < 0.1) {
                  const powerups = ["magnet", "shield", "rage"] as const;
                  dropTempPowerup(enemy.x, enemy.y, powerups[Math.floor(Math.random() * 3)]);
                }
              } else if (enemy.isElite) {
                dropXP(enemy.x, enemy.y, 3 + Math.floor(Math.random() * 3));
                if (Math.random() < 0.05) {
                  const powerups = ["magnet", "shield", "rage"] as const;
                  dropTempPowerup(enemy.x, enemy.y, powerups[Math.floor(Math.random() * 3)]);
                }
              } else {
                dropXP(enemy.x, enemy.y, 1 + Math.floor(Math.random() * 2));
              }

              gameState.enemies = gameState.enemies.filter((e) => e !== enemy);
            }
          }
        });
      });

      // Update drops
      const magnetRange = gameState.player.magnetRange + (gameState.tempEffects.magnetBoost > 0 ? 200 : 0);
      
      gameState.drops.forEach((drop) => {
        const dx = gameState.player.x - drop.x;
        const dy = gameState.player.y - drop.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < magnetRange) {
          drop.x += (dx / distance) * 300 * dt;
          drop.y += (dy / distance) * 300 * dt;
        }

        if (distance < gameState.player.radius + drop.radius) {
          if (drop.type === "xp") {
            gameState.player.xp += drop.value;
            if (gameState.player.xp >= gameState.player.xpToNextLevel) {
              gameState.player.xp -= gameState.player.xpToNextLevel;
              gameState.player.level++;
              gameState.player.xpToNextLevel = Math.floor(gameState.player.xpToNextLevel * 1.5);
              setLevel(gameState.player.level);
              showUpgradeScreen();
            }
          } else if (drop.type === "magnet") {
            sounds.powerup();
            gameState.tempEffects.magnetBoost = drop.duration;
          } else if (drop.type === "shield") {
            sounds.powerup();
            gameState.player.shield++;
            gameState.tempEffects.shieldBoost = drop.duration;
          } else if (drop.type === "rage") {
            sounds.powerup();
            gameState.tempEffects.rage = drop.duration;
          }
          gameState.drops = gameState.drops.filter((d) => d !== drop);
        }

        if (drop.glowPhase !== undefined) {
          drop.glowPhase += dt * 3;
        }
      });

      // Update hotspots
      gameState.hotspots.forEach((hotspot, index) => {
        const dx = gameState.player.x - hotspot.x;
        const dy = gameState.player.y - hotspot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < hotspot.radius) {
          // Player inside, heal
          gameState.player.hp = Math.min(
            gameState.player.maxHp,
            gameState.player.hp + hotspot.healing * dt
          );
        } else {
          // Player outside, decrease timer
          hotspot.progress -= dt;
        }

        if (hotspot.progress <= 0) {
          gameState.hotspots.splice(index, 1);
        }
      });

      // Spawn hotspots
      if (gameState.hotspots.length === 0 && Math.random() < 0.001) {
        spawnHotspot();
      }

      // Update particles
      gameState.particles = gameState.particles.filter((particle) => {
        particle.lifetime -= dt;

        gameState.enemies.forEach((enemy) => {
          const distance = Math.hypot(particle.x - enemy.x, particle.y - enemy.y);
          if (distance < particle.radius) {
            enemy.hp -= particle.damage * dt;
          }
        });

        return particle.lifetime > 0;
      });

      // Check game over
      if (gameState.player.hp <= 0) {
        sounds.death();
        gameState.gameOver = true;
        setShowGameOver(true);
      }

      // Update wave
      if (gameState.enemies.length === 0 && currentTime - gameState.lastSpawn > 5000) {
        gameState.wave++;
        gameState.spawnRate = Math.max(0.5, gameState.spawnRate * 0.95);
      }
    };

    // Draw game
    const draw = () => {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw hotspots
      gameState.hotspots.forEach((hotspot) => {
        ctx.fillStyle = "rgba(34, 197, 94, 0.2)";
        ctx.beginPath();
        ctx.arc(hotspot.x, hotspot.y, hotspot.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hotspot.x, hotspot.y, hotspot.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.ceil(hotspot.progress)}s`, hotspot.x, hotspot.y);
      });

      // Draw drops
      gameState.drops.forEach((drop) => {
        if (drop.type === "xp") {
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Temp powerups with glow
          const glowSize = Math.sin(drop.glowPhase) * 5 + 10;
          const gradient = ctx.createRadialGradient(drop.x, drop.y, drop.radius, drop.x, drop.y, drop.radius + glowSize);
          gradient.addColorStop(0, drop.color);
          gradient.addColorStop(1, "transparent");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(drop.x, drop.y, drop.radius + glowSize, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = drop.color;
          ctx.beginPath();
          ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw particles
      gameState.particles.forEach((particle) => {
        ctx.fillStyle = particle.color + "80";
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw enemies
      gameState.enemies.forEach((enemy) => {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        const barWidth = enemy.radius * 2;
        const barHeight = 4;
        const barX = enemy.x - barWidth / 2;
        const barY = enemy.y - enemy.radius - 10;

        ctx.fillStyle = "#1e293b";
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = "#22c55e";
        ctx.fillRect(barX, barY, (enemy.hp / enemy.maxHp) * barWidth, barHeight);
      });

      // Draw bullets
      gameState.bullets.forEach((bullet) => {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw player
      if (gameState.tempEffects.rage > 0) {
        const gradient = ctx.createRadialGradient(
          gameState.player.x, gameState.player.y, gameState.player.radius,
          gameState.player.x, gameState.player.y, gameState.player.radius + 15
        );
        gradient.addColorStop(0, "#ef4444");
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(gameState.player.x, gameState.player.y, gameState.player.radius + 15, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(gameState.player.x, gameState.player.y, gameState.player.radius, 0, Math.PI * 2);
      ctx.fill();

      // Magnet range indicator
      if (gameState.tempEffects.magnetBoost > 0) {
        ctx.strokeStyle = "rgba(16, 185, 129, 0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gameState.player.x, gameState.player.y, gameState.player.magnetRange + 200, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw HUD
      drawHUD();

      // Draw pause menu
      if (gameState.showPauseMenu) {
        drawPauseMenu();
      }

      // Draw upgrade UI
      if (gameState.showUpgradeUI) {
        drawUpgradeUI();
      }
    };

    const drawHUD = () => {
      // HP bar
      const hpBarWidth = 300;
      const hpBarHeight = 30;
      const hpBarX = 20;
      const hpBarY = 20;

      ctx.fillStyle = "#1e293b";
      ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

      ctx.fillStyle = "#22c55e";
      ctx.fillRect(hpBarX, hpBarY, (gameState.player.hp / gameState.player.maxHp) * hpBarWidth, hpBarHeight);

      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

      ctx.fillStyle = "#fff";
      ctx.font = "16px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`${t("hp")}: ${Math.ceil(gameState.player.hp)}/${gameState.player.maxHp}`, hpBarX + 10, hpBarY + 20);

      // Shield
      if (gameState.player.shield > 0) {
        ctx.fillStyle = "#3b82f6";
        ctx.font = "20px Arial";
        ctx.fillText(`🛡️ ${gameState.player.shield}`, hpBarX + hpBarWidth + 20, hpBarY + 20);
      }

      // XP bar
      const xpBarY = hpBarY + hpBarHeight + 10;
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(hpBarX, xpBarY, hpBarWidth, 20);

      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(hpBarX, xpBarY, (gameState.player.xp / gameState.player.xpToNextLevel) * hpBarWidth, 20);

      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.strokeRect(hpBarX, xpBarY, hpBarWidth, 20);

      // Level, Wave, Score
      ctx.fillStyle = "#fff";
      ctx.font = "20px Arial";
      ctx.textAlign = "right";
      ctx.fillText(`${t("level")}: ${gameState.player.level}`, canvas.width - 20, 30);
      ctx.fillText(`${t("wave")}: ${gameState.wave}`, canvas.width - 20, 60);
      ctx.fillText(`${t("score")}: ${gameState.score}`, canvas.width - 20, 90);

      // Temp effects indicators
      let effectY = 120;
      if (gameState.tempEffects.magnetBoost > 0) {
        ctx.fillStyle = rarityColors.uncommon;
        ctx.fillText(`🧲 ${Math.ceil(gameState.tempEffects.magnetBoost)}s`, canvas.width - 20, effectY);
        effectY += 30;
      }
      if (gameState.tempEffects.shieldBoost > 0) {
        ctx.fillStyle = rarityColors.rare;
        ctx.fillText(`🛡️ ${Math.ceil(gameState.tempEffects.shieldBoost)}s`, canvas.width - 20, effectY);
        effectY += 30;
      }
      if (gameState.tempEffects.rage > 0) {
        ctx.fillStyle = rarityColors.epic;
        ctx.fillText(`⚡ ${Math.ceil(gameState.tempEffects.rage)}s`, canvas.width - 20, effectY);
      }

      // Weapons and Tomes
      const hudStartY = canvas.height - 120;
      ctx.fillStyle = "#fff";
      ctx.font = "16px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`${t("weapons")}:`, 20, hudStartY);

      gameState.weapons.forEach((weapon, index) => {
        const y = hudStartY + 25 + index * 25;
        ctx.fillStyle = rarityColors[weapon.rarity];
        ctx.fillText(`${weapon.name[language]} Lv.${weapon.level}`, 20, y);
      });

      ctx.fillStyle = "#fff";
      ctx.fillText(`${t("tomes")}:`, 200, hudStartY);

      gameState.tomes.forEach((tome, index) => {
        const y = hudStartY + 25 + index * 25;
        ctx.fillStyle = rarityColors[tome.rarity];
        ctx.fillText(`${tome.name[language]} Lv.${tome.level}`, 200, y);
      });
    };

    const drawPauseMenu = () => {
      // Overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title
      ctx.fillStyle = "#fff";
      ctx.font = "48px Arial";
      ctx.textAlign = "center";
      ctx.fillText(t("paused"), canvas.width / 2, canvas.height / 2 - 150);

      // Stats box
      const boxWidth = 400;
      const boxHeight = 250;
      const boxX = canvas.width / 2 - boxWidth / 2;
      const boxY = canvas.height / 2 - 100;

      ctx.fillStyle = "#1e293b";
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

      // Stats
      ctx.fillStyle = "#fff";
      ctx.font = "20px Arial";
      ctx.textAlign = "left";
      let statY = boxY + 40;
      ctx.fillText(`${t("hp")}: ${Math.ceil(gameState.player.hp)}/${gameState.player.maxHp}`, boxX + 20, statY);
      statY += 30;
      ctx.fillText(`${t("shield")}: ${gameState.player.shield}`, boxX + 20, statY);
      statY += 30;
      ctx.fillText(`${t("level")}: ${gameState.player.level}`, boxX + 20, statY);
      statY += 30;
      ctx.fillText(`${t("wave")}: ${gameState.wave}`, boxX + 20, statY);
      statY += 30;
      ctx.fillText(`${t("score")}: ${gameState.score}`, boxX + 20, statY);
      statY += 30;
      ctx.fillText(`${t("weapons")}: ${gameState.weapons.length}/3`, boxX + 20, statY);
      statY += 30;
      ctx.fillText(`${t("tomes")}: ${gameState.tomes.length}/3`, boxX + 20, statY);

      // Buttons
      const buttonWidth = 200;
      const buttonHeight = 50;
      const centerX = canvas.width / 2;
      const continueY = canvas.height / 2 + 100;
      const restartY = canvas.height / 2 + 170;

      // Continue button
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(centerX - buttonWidth / 2, continueY, buttonWidth, buttonHeight);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(centerX - buttonWidth / 2, continueY, buttonWidth, buttonHeight);
      ctx.fillStyle = "#fff";
      ctx.font = "24px Arial";
      ctx.textAlign = "center";
      ctx.fillText(t("continue"), centerX, continueY + 32);

      // Restart button
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(centerX - buttonWidth / 2, restartY, buttonWidth, buttonHeight);
      ctx.strokeRect(centerX - buttonWidth / 2, restartY, buttonWidth, buttonHeight);
      ctx.fillText(t("restart"), centerX, restartY + 32);
    };

    const drawUpgradeUI = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#fff";
      ctx.font = "36px Arial";
      ctx.textAlign = "center";
      ctx.fillText(t("chooseUpgrade"), canvas.width / 2, 100);

      const cardWidth = 250;
      const cardHeight = 180;
      const spacing = 30;
      const totalWidth = gameState.upgradeOptions.length * cardWidth + (gameState.upgradeOptions.length - 1) * spacing;
      const startX = (canvas.width - totalWidth) / 2;
      const startY = canvas.height / 2 - cardHeight / 2;

      gameState.upgradeOptions.forEach((option, index) => {
        const x = startX + index * (cardWidth + spacing);
        const y = startY;

        ctx.fillStyle = "#1e293b";
        ctx.fillRect(x, y, cardWidth, cardHeight);

        ctx.strokeStyle = rarityColors[option.rarity];
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, cardWidth, cardHeight);

        ctx.fillStyle = "#fff";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(option.name[language], x + cardWidth / 2, y + 30);

        ctx.font = "14px Arial";
        ctx.fillStyle = rarityColors[option.rarity];
        ctx.fillText(option.rarity.toUpperCase(), x + cardWidth / 2, y + 55);

        ctx.fillStyle = "#cbd5e1";
        ctx.font = "14px Arial";
        const descLines = wrapText(ctx, option.description[language], cardWidth - 20);
        descLines.forEach((line, i) => {
          ctx.fillText(line, x + cardWidth / 2, y + 80 + i * 18);
        });

        if ("level" in option && "maxLevel" in option) {
          const existingItem = gameState.weapons.find((w) => w.id === option.id) || gameState.tomes.find((t) => t.id === option.id);
          if (existingItem) {
            ctx.fillStyle = "#fbbf24";
            ctx.font = "16px Arial";
            ctx.fillText(`Lv.${existingItem.level} → ${Math.min(existingItem.level + 1, option.maxLevel)}`, x + cardWidth / 2, y + cardHeight - 15);
          }
        }
      });
    };

    const wrapText = (context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      words.forEach((word) => {
        const testLine = currentLine + (currentLine ? " " : "") + word;
        const metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines;
    };

    // Game loop
    let lastTime = performance.now();
    const gameLoop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      update(dt);
      draw();

      requestAnimationFrame(gameLoop);
    };

    requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [language]);

  return (
    <div className="w-full h-screen relative">
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLanguage(language === "en" ? "es" : "en")}
          className="bg-background/80 backdrop-blur"
        >
          {language === "en" ? "ES" : "EN"}
        </Button>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 text-white bg-black/50 backdrop-blur p-4 rounded-lg">
        <div className="text-sm font-semibold mb-2">{t("controls")}</div>
        <div className="text-xs space-y-1">
          <div>{t("move")}</div>
          <div>{t("pause")}</div>
          <div>{t("restartKey")}</div>
        </div>
      </div>

      {/* Game Over Screen */}
      {showGameOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur flex items-center justify-center">
          <div className="text-center text-white space-y-6">
            <h1 className="text-6xl font-bold">{t("gameOver")}</h1>
            <p className="text-2xl">
              {t("finalScore")}: {score}
            </p>
            <p className="text-xl">
              {t("level")}: {level}
            </p>
            <Button size="lg" onClick={() => window.location.reload()}>
              {t("restart")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
