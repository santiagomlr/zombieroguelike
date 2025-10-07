import { useEffect, useRef, useState } from "react";

// Tipos
type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

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
}

interface Tome {
  id: string;
  name: string;
  description: string;
  effect: string;
  value: number;
  rarity: Rarity;
  color: string;
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
}

const WEAPONS: Weapon[] = [
  { id: "pistol", name: "Pistola", damage: 1, fireRate: 2, range: 250, projectileSpeed: 8, rarity: "common", color: "#9ca3af" },
  { id: "shotgun", name: "Escopeta", damage: 3, fireRate: 0.8, range: 180, projectileSpeed: 6, rarity: "uncommon", color: "#22c55e", special: "spread" },
  { id: "smg", name: "SMG", damage: 0.7, fireRate: 6, range: 200, projectileSpeed: 10, rarity: "rare", color: "#3b82f6" },
  { id: "rocket", name: "Lanzacohetes", damage: 8, fireRate: 0.5, range: 350, projectileSpeed: 5, rarity: "epic", color: "#a855f7", special: "aoe" },
  { id: "laser", name: "Láser", damage: 2, fireRate: 4, range: 400, projectileSpeed: 15, rarity: "epic", color: "#06b6d4", special: "pierce" },
  { id: "railgun", name: "Railgun", damage: 12, fireRate: 0.3, range: 500, projectileSpeed: 20, rarity: "legendary", color: "#fbbf24", special: "pierce" },
  { id: "minigun", name: "Minigun", damage: 0.5, fireRate: 10, range: 220, projectileSpeed: 12, rarity: "legendary", color: "#f87171", special: "rapid" },
];

const TOMES: Tome[] = [
  { id: "power", name: "Tomo de Poder", description: "+50% Daño", effect: "damage", value: 1.5, rarity: "rare", color: "#f87171" },
  { id: "speed", name: "Tomo de Velocidad", description: "+30% Velocidad", effect: "speed", value: 1.3, rarity: "uncommon", color: "#22c55e" },
  { id: "range", name: "Tomo de Alcance", description: "+40% Alcance", effect: "range", value: 1.4, rarity: "uncommon", color: "#3b82f6" },
  { id: "fire", name: "Tomo de Cadencia", description: "+50% Cadencia", effect: "fireRate", value: 1.5, rarity: "rare", color: "#fbbf24" },
  { id: "bounce", name: "Tomo de Rebote", description: "+2 Rebotes", effect: "bounce", value: 2, rarity: "epic", color: "#a855f7" },
  { id: "multi", name: "Tomo Múltiple", description: "+1 Proyectil", effect: "multishot", value: 1, rarity: "legendary", color: "#06b6d4" },
];

const ITEMS: Item[] = [
  { id: "magnet", name: "Imán", description: "+50% Rango de imán", effect: "magnet", rarity: "common", color: "#9ca3af" },
  { id: "regen", name: "Regeneración", description: "+1 HP cada 10s", effect: "regen", rarity: "uncommon", color: "#22c55e" },
  { id: "luck", name: "Suerte", description: "+20% Drop rate", effect: "luck", rarity: "rare", color: "#fbbf24" },
  { id: "shield", name: "Escudo", description: "+2 HP máximo", effect: "maxhp", rarity: "epic", color: "#3b82f6" },
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
  const gameStateRef = useRef<any>(null);

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
        hp: 6,
        maxhp: 6,
        ifr: 0,
        magnet: 120,
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
        },
      },
      bullets: [] as any[],
      enemies: [] as any[],
      drops: [] as any[],
      particles: [] as any[],
      score: 0,
      level: 1,
      xp: 0,
      nextXP: 50,
      time: 0,
      lastSpawn: 0,
      weaponCooldowns: {} as Record<string, number>,
      keys: {} as Record<string, boolean>,
      paused: false,
      showUpgradeUI: false,
      upgradeOptions: [] as Upgrade[],
      regenTimer: 0,
      auraTimer: 0,
    };

    gameStateRef.current = gameState;

    // Event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      gameState.keys[e.key.toLowerCase()] = true;
      if (e.key === "Escape") gameState.paused = !gameState.paused;
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
      
      const isElite = Math.random() < 0.1;
      gameState.enemies.push({
        x, y,
        rad: isElite ? 20 : 14,
        hp: isElite ? 8 : 3,
        maxhp: isElite ? 8 : 3,
        spd: isElite ? 0.8 : 1.2,
        isElite,
        color: isElite ? "#a855f7" : "#34d399",
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

    function collectXP(v: number) {
      gameState.xp += v;
      while (gameState.xp >= gameState.nextXP) {
        gameState.xp -= gameState.nextXP;
        gameState.level++;
        setLevel(gameState.level);
        gameState.nextXP = Math.floor(gameState.nextXP * 1.3 + 30);
        showUpgradeScreen();
      }
    }

    function showUpgradeScreen() {
      gameState.paused = true;
      gameState.showUpgradeUI = true;
      
      const options: Upgrade[] = [];
      const rarityRoll = Math.random();
      
      for (let i = 0; i < 3; i++) {
        let rarity: Rarity = "common";
        const roll = Math.random();
        if (rarityRoll < 0.05) rarity = "legendary";
        else if (rarityRoll < 0.15) rarity = "epic";
        else if (rarityRoll < 0.35) rarity = "rare";
        else if (rarityRoll < 0.60) rarity = "uncommon";
        
        const type = roll < 0.4 ? "weapon" : roll < 0.7 ? "tome" : "item";
        
        if (type === "weapon") {
          const available = WEAPONS.filter(w => 
            (rarity === w.rarity || Math.random() < 0.3) && 
            !gameState.player.weapons.find((pw: Weapon) => pw.id === w.id)
          );
          if (available.length > 0) {
            const weapon = available[Math.floor(Math.random() * available.length)];
            options.push({ type: "weapon", data: weapon, rarity: weapon.rarity });
          }
        } else if (type === "tome") {
          const available = TOMES.filter(t => 
            (rarity === t.rarity || Math.random() < 0.3) &&
            gameState.player.tomes.filter((pt: Tome) => pt.id === t.id).length < 3
          );
          if (available.length > 0) {
            const tome = available[Math.floor(Math.random() * available.length)];
            options.push({ type: "tome", data: tome, rarity: tome.rarity });
          }
        } else {
          const available = ITEMS.filter(it => rarity === it.rarity || Math.random() < 0.3);
          if (available.length > 0) {
            const item = available[Math.floor(Math.random() * available.length)];
            options.push({ type: "item", data: item, rarity: item.rarity });
          }
        }
      }
      
      gameState.upgradeOptions = options;
    }

    function selectUpgrade(index: number) {
      const option = gameState.upgradeOptions[index];
      if (!option) return;

      if (option.type === "weapon") {
        const weapon = option.data as Weapon;
        if (gameState.player.weapons.length < 3) {
          gameState.player.weapons.push(weapon);
        } else {
          gameState.player.weapons[0] = weapon;
        }
      } else if (option.type === "tome") {
        const tome = option.data as Tome;
        gameState.player.tomes.push(tome);
        
        if (tome.effect === "damage") gameState.player.stats.damageMultiplier *= tome.value;
        if (tome.effect === "speed") gameState.player.stats.speedMultiplier *= tome.value;
        if (tome.effect === "range") gameState.player.stats.rangeMultiplier *= tome.value;
        if (tome.effect === "fireRate") gameState.player.stats.fireRateMultiplier *= tome.value;
        if (tome.effect === "bounce") gameState.player.stats.bounces += tome.value;
        if (tome.effect === "multishot") gameState.player.stats.multishot += tome.value;
      } else if (option.type === "item") {
        const item = option.data as Item;
        gameState.player.items.push(item);
        
        if (item.effect === "magnet") gameState.player.magnet *= 1.5;
        if (item.effect === "maxhp") {
          gameState.player.maxhp += 2;
          gameState.player.hp += 2;
        }
        if (item.effect === "aura") gameState.player.stats.auraRadius = 80;
        if (item.effect === "vampire") gameState.player.stats.vampire = 0.1;
      }

      gameState.showUpgradeUI = false;
      gameState.paused = false;
      gameState.upgradeOptions = [];
    }

    // Click handler para upgrades
    canvas.addEventListener("click", (e) => {
      if (!gameState.showUpgradeUI) return;
      
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
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
    });

    function update(dt: number) {
      if (gameState.paused) return;
      gameState.time += dt;

      // Regeneración
      if (gameState.player.items.find((it: Item) => it.id === "regen")) {
        gameState.regenTimer += dt;
        if (gameState.regenTimer >= 10) {
          gameState.regenTimer = 0;
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

      // Movimiento
      let vx = (gameState.keys["d"] ? 1 : 0) - (gameState.keys["a"] ? 1 : 0);
      let vy = (gameState.keys["s"] ? 1 : 0) - (gameState.keys["w"] ? 1 : 0);
      const len = Math.hypot(vx, vy) || 1;
      vx /= len;
      vy /= len;
      
      const spd = gameState.player.spd * gameState.player.stats.speedMultiplier;
      gameState.player.x = Math.max(gameState.player.rad, Math.min(W - gameState.player.rad, gameState.player.x + vx * spd));
      gameState.player.y = Math.max(gameState.player.rad, Math.min(H - gameState.player.rad, gameState.player.y + vy * spd));

      // Spawn enemigos
      gameState.lastSpawn += dt;
      const spawnRate = Math.max(0.3, 1.2 - gameState.level * 0.05);
      if (gameState.lastSpawn > spawnRate) {
        spawnEnemy();
        gameState.lastSpawn = 0;
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
              const points = e.isElite ? 50 : 10;
              gameState.score += points;
              setScore(gameState.score);
              dropXP(e.x, e.y, e.isElite ? 25 : 10);

              // Vampirismo
              if (gameState.player.stats.vampire > 0) {
                gameState.player.hp = Math.min(gameState.player.maxhp, gameState.player.hp + b.damage * gameState.player.stats.vampire);
              }

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
        
        if (d < gameState.player.magnet) {
          g.x += (dx / d) * 5;
          g.y += (dy / d) * 5;
        }
        
        if (d < gameState.player.rad + g.rad) {
          if (g.type === "xp") collectXP(g.val);
          gameState.drops.splice(i, 1);
        }
      }

      // Colisión jugador-enemigo
      for (const e of gameState.enemies) {
        if (Math.hypot(e.x - gameState.player.x, e.y - gameState.player.y) < e.rad + gameState.player.rad) {
          if (gameState.player.ifr <= 0) {
            gameState.player.hp--;
            gameState.player.ifr = 1.5;
            
            if (gameState.player.hp <= 0) {
              setGameOver(true);
              gameState.paused = true;
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
      
      // HP
      const hpX = 20;
      const hpY = 20;
      const hpW = 24;
      const hpH = 24;
      const hpGap = 8;
      
      for (let i = 0; i < gameState.player.maxhp; i++) {
        const x = hpX + i * (hpW + hpGap);
        ctx.fillStyle = "rgba(20, 25, 35, 0.9)";
        ctx.fillRect(x, hpY, hpW, hpH);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, hpY, hpW, hpH);
        
        if (i < gameState.player.hp) {
          ctx.fillStyle = "#f87171";
          ctx.fillRect(x + 3, hpY + 3, hpW - 6, hpH - 6);
        }
      }
      
      // XP Bar
      const xpBarW = 300;
      const xpBarH = 12;
      const xpBarX = 20;
      const xpBarY = hpY + hpH + 12;
      
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
      
      // Score
      ctx.textAlign = "right";
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 24px system-ui";
      ctx.fillText(`${gameState.score}`, W - 20, 40);
      
      // Mini mapa
      const miniSize = 150;
      const miniX = W - miniSize - 20;
      const miniY = H - miniSize - 20;
      
      ctx.fillStyle = "rgba(10, 15, 25, 0.8)";
      ctx.fillRect(miniX, miniY, miniSize, miniSize);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.strokeRect(miniX, miniY, miniSize, miniSize);
      
      // Jugador en minimapa
      const miniPlayerX = miniX + (gameState.player.x / W) * miniSize;
      const miniPlayerY = miniY + (gameState.player.y / H) * miniSize;
      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.arc(miniPlayerX, miniPlayerY, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Enemigos en minimapa
      ctx.fillStyle = "#34d399";
      for (const e of gameState.enemies) {
        const ex = miniX + (e.x / W) * miniSize;
        const ey = miniY + (e.y / H) * miniSize;
        ctx.beginPath();
        ctx.arc(ex, ey, e.isElite ? 2.5 : 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }

    function drawUpgradeUI() {
      if (!gameState.showUpgradeUI) return;

      ctx.save();
      
      // Overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, W, H);
      
      // Título
      ctx.fillStyle = "#fff";
      ctx.font = "bold 48px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("¡SUBISTE DE NIVEL!", W / 2, H / 2 - 180);
      
      ctx.font = "24px system-ui";
      ctx.fillStyle = "#9ca3af";
      ctx.fillText("Elige una mejora:", W / 2, H / 2 - 130);
      
      // Cards
      const cardW = 250;
      const cardH = 180;
      const gap = 30;
      const startX = W / 2 - (cardW * 1.5 + gap);
      const startY = H / 2 - cardH / 2;
      
      for (let i = 0; i < gameState.upgradeOptions.length; i++) {
        const option = gameState.upgradeOptions[i];
        const x = startX + i * (cardW + gap);
        const y = startY;
        
        // Card background
        const rarityColor = rarityColors[option.rarity];
        ctx.fillStyle = "rgba(20, 25, 35, 0.95)";
        ctx.fillRect(x, y, cardW, cardH);
        
        // Borde de rareza
        ctx.strokeStyle = rarityColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, cardW, cardH);
        
        // Glow effect
        ctx.shadowColor = rarityColor;
        ctx.shadowBlur = 20;
        ctx.strokeRect(x, y, cardW, cardH);
        ctx.shadowBlur = 0;
        
        // Tipo
        ctx.fillStyle = rarityColor;
        ctx.font = "bold 14px system-ui";
        ctx.textAlign = "center";
        const typeText = option.type === "weapon" ? "ARMA" : option.type === "tome" ? "TOMO" : "ÍTEM";
        ctx.fillText(typeText, x + cardW / 2, y + 25);
        
        // Nombre
        const data = option.data as any;
        ctx.fillStyle = "#fff";
        ctx.font = "bold 18px system-ui";
        ctx.fillText(data.name, x + cardW / 2, y + 60);
        
        // Descripción
        ctx.fillStyle = "#9ca3af";
        ctx.font = "14px system-ui";
        if (option.type === "weapon") {
          const w = data as Weapon;
          ctx.fillText(`Daño: ${w.damage}`, x + cardW / 2, y + 90);
          ctx.fillText(`Cadencia: ${w.fireRate.toFixed(1)}/s`, x + cardW / 2, y + 110);
          ctx.fillText(`Alcance: ${w.range}`, x + cardW / 2, y + 130);
        } else {
          ctx.fillText(data.description, x + cardW / 2, y + 100);
        }
        
        // Rareza
        ctx.fillStyle = rarityColor;
        ctx.font = "bold 12px system-ui";
        ctx.fillText(option.rarity.toUpperCase(), x + cardW / 2, y + cardH - 15);
        
        // Hover effect (simplificado)
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.fillRect(x, y, cardW, cardH);
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
      
      // Drops
      for (const d of gameState.drops) {
        ctx.fillStyle = d.color;
        ctx.shadowColor = d.color;
        ctx.shadowBlur = 10;
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
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // HP bar para élites
        if (e.isElite) {
          const barW = e.rad * 2;
          const barH = 4;
          const barX = e.x - barW / 2;
          const barY = e.y - e.rad - 8;
          
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(barX, barY, barW, barH);
          
          ctx.fillStyle = "#f87171";
          ctx.fillRect(barX, barY, barW * (e.hp / e.maxhp), barH);
        }
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
      
      // Jugador
      const blink = gameState.player.ifr > 0 && Math.floor(gameState.time * 12) % 2 === 0;
      ctx.save();
      if (blink) ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#60a5fa";
      ctx.shadowColor = "#60a5fa";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(gameState.player.x, gameState.player.y, gameState.player.rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
      
      drawHUD();
      drawUpgradeUI();
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
          <div className="text-center space-y-6 p-8">
            <h1 className="text-6xl font-bold text-red-500">GAME OVER</h1>
            <p className="text-3xl text-foreground">Puntuación: {score}</p>
            <p className="text-2xl text-muted-foreground">Nivel alcanzado: {level}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-8 px-8 py-4 bg-primary text-primary-foreground rounded-lg text-xl font-bold hover:opacity-90 transition-opacity"
            >
              Jugar de nuevo
            </button>
          </div>
        </div>
      )}
      
      <div className="absolute top-4 left-4 text-xs text-muted-foreground space-y-1 pointer-events-none">
        <p>WASD - Movimiento</p>
        <p>ESC - Pausa</p>
        <p>Disparo automático</p>
      </div>
    </div>
  );
};

export default Index;
