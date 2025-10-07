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
    items: "Ítems:",
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
    items: "Items:",
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
  { id: "power", name: "Tomo de Poder", description: "+10% Daño", effect: "damage", value: 1.1, rarity: "rare", color: "#f87171", level: 1 },
  { id: "speed", name: "Tomo de Velocidad", description: "+5% Velocidad", effect: "speed", value: 1.05, rarity: "uncommon", color: "#22c55e", level: 1 },
  { id: "bounce", name: "Tomo de Rebote", description: "+1 Rebote", effect: "bounce", value: 1, rarity: "epic", color: "#a855f7", level: 1 },
  { id: "range", name: "Tomo de Alcance", description: "+10% Alcance", effect: "range", value: 1.1, rarity: "uncommon", color: "#3b82f6", level: 1 },
  { id: "precision", name: "Tomo de Precisión", description: "+10% Precisión", effect: "precision", value: 1.1, rarity: "rare", color: "#8b5cf6", level: 1 },
  { id: "multi", name: "Tomo Múltiple", description: "+1 Proyectil", effect: "multishot", value: 1, rarity: "legendary", color: "#06b6d4", level: 1 },
  { id: "regen", name: "Tomo de Regeneración", description: "Regenera 1 HP cada 5s", effect: "regen", value: 1, rarity: "uncommon", color: "#10b981", level: 1 },
  { id: "magnet", name: "Tomo de Magnetismo", description: "+10% Rango de imán", effect: "magnet", value: 1.1, rarity: "common", color: "#64748b", level: 1 },
  { id: "fire", name: "Tomo de Cadencia", description: "+10% Cadencia", effect: "fireRate", value: 1.1, rarity: "rare", color: "#fbbf24", level: 1 },
];

const ITEMS: Item[] = [
  // Común
  { id: "windboots", name: "Botas de Viento", description: "+5% velocidad", effect: "speedboost", rarity: "common", color: "#9ca3af" },
  { id: "fastgloves", name: "Guantes Rápidos", description: "+5% cadencia", effect: "firerateitem", rarity: "common", color: "#9ca3af" },
  { id: "lightvest", name: "Chaleco Ligero", description: "+10 HP máximo", effect: "maxhp10", rarity: "common", color: "#9ca3af" },
  { id: "tacticalbelt", name: "Cinturón Táctico", description: "+10% magnetismo", effect: "magnetitem", rarity: "common", color: "#9ca3af" },
  { id: "oldclock", name: "Reloj Antiguo", description: "+5% duración powerups", effect: "powerupduration", rarity: "common", color: "#9ca3af" },
  { id: "rustyring", name: "Anillo Oxidado", description: "+10 XP por kill", effect: "xpbonus", rarity: "common", color: "#9ca3af" },
  
  // Raro
  { id: "combatglasses", name: "Gafas de Combate", description: "+10% precisión", effect: "precisionitem", rarity: "rare", color: "#3b82f6" },
  { id: "reinforcedpants", name: "Pantalones Reforzados", description: "-5% daño recibido", effect: "damagereduction", rarity: "rare", color: "#3b82f6" },
  { id: "bouncegloves", name: "Guantes de Rebote", description: "+1 rebote", effect: "bounceitem", rarity: "rare", color: "#3b82f6" },
  { id: "extrabag", name: "Mochila Extra", description: "+capacidad drops", effect: "dropcapacity", rarity: "rare", color: "#3b82f6" },
  { id: "energyclock", name: "Reloj de Energía", description: "+10% cadencia global", effect: "globalfirerate", rarity: "rare", color: "#3b82f6" },
  { id: "ballistichelmet", name: "Casco Balístico", description: "Inmunidad 1er golpe/wave", effect: "firsthitimmune", rarity: "rare", color: "#3b82f6" },
  
  // Épico
  { id: "jetboots", name: "Botas Jet", description: "+15% velocidad", effect: "jetspeed", rarity: "epic", color: "#a855f7" },
  { id: "reactiveshield", name: "Escudo Reactivo", description: "Onda empuja enemigos", effect: "reactiveshield", rarity: "epic", color: "#a855f7" },
  { id: "chaosamuleto", name: "Amuleto del Caos", description: "Daño +10% a +50%", effect: "chaosdamage", rarity: "epic", color: "#a855f7" },
  { id: "ironmedal", name: "Medalla de Hierro", description: "+15% HP máximo", effect: "maxhp15", rarity: "epic", color: "#a855f7" },
  { id: "heavyvest", name: "Chaleco Pesado", description: "-10% velocidad, -25% daño", effect: "heavyarmor", rarity: "epic", color: "#a855f7" },
  { id: "plasmafragment", name: "Fragmento de Plasma", description: "+1 rebote +15% alcance", effect: "plasmafrag", rarity: "epic", color: "#a855f7" },
  
  // Legendario
  { id: "voidcore", name: "Núcleo del Vacío", description: "XP Doble", effect: "doublexp", rarity: "legendary", color: "#fbbf24" },
  { id: "solargauntlet", name: "Guantelete Solar", description: "Proyectil cada 10 kills", effect: "solargauntlet", rarity: "legendary", color: "#fbbf24" },
  { id: "infernalengine", name: "Motor Infernal", description: "+25% velocidad +20% daño, +10% daño recibido", effect: "infernalengine", rarity: "legendary", color: "#fbbf24" },
  { id: "bloodstone", name: "Piedra de Sangre", description: "5 HP cada 30 kills", effect: "bloodstone", rarity: "legendary", color: "#fbbf24" },
  { id: "hordetotem", name: "Tótem de la Horda", description: "+1 enemigo spawn, +2 XP/kill", effect: "hordetotem", rarity: "legendary", color: "#fbbf24" },
  { id: "artificialheart", name: "Corazón Artificial", description: "+50 HP permanente", effect: "artificialheart", rarity: "legendary", color: "#fbbf24" },
  { id: "infinitylens", name: "Lente del Infinito", description: "+10% todos los stats", effect: "infinitylens", rarity: "legendary", color: "#fbbf24" },
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
  const [language, setLanguage] = useState<Language>("es");
  const gameStateRef = useRef<any>(null);
  const resetGameRef = useRef<(() => void) | null>(null);
  const prerenderedLogosRef = useRef<{[key: string]: HTMLCanvasElement}>({});
  
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
      maxParticles: 200,
      score: 0,
      level: 1,
      xp: 0,
      nextXP: 25,
      time: 0,
      wave: 1,
      waveKills: 0,
      waveEnemiesTotal: 15,
      waveEnemiesSpawned: 0,
      maxConcurrentEnemies: 8,
      lastSpawn: 0,
      lastBossSpawn: 0,
      lastMiniBossSpawn: 0,
      weaponCooldowns: {} as Record<string, number>,
      audioContext: null as AudioContext | null,
      keys: {} as Record<string, boolean>,
      showUpgradeUI: false,
      upgradeOptions: [] as Upgrade[],
      regenTimer: 0,
      auraTimer: 0,
      hotspotTimer: 0,
      levelUpAnimation: 0,
      upgradeAnimation: 0,
      upgradeUIAnimation: 0,
      xpBarRainbow: false,
      waveNotification: 0,
      restartTimer: 0,
      restartHoldTime: 5,
      gameOverTimer: 0,
      sounds: {
        shoot: new Audio(),
        hit: new Audio(),
        levelUp: new Audio(),
        pickup: new Audio(),
        death: new Audio(),
      },
      musicTracks: [
        { name: "Electronic Dreams", path: "/audio/Electronic_Dreams.mp3" },
        { name: "That Song", path: "/audio/Fobee_-_That_Song.mp3" },
        { name: "Upbeat Sports Bass", path: "/audio/MGM_-_Upbeat_Sports_Bass.mp3" },
        { name: "Track Full", path: "/audio/Track_Full.mp3" },
        { name: "Cool Funky Jazz Loop", path: "/audio/Cool_Funky_Jazz_Loop.mp3" },
      ],
      currentMusicIndex: 0,
      music: null as HTMLAudioElement | null,
      musicNotification: "",
      musicNotificationTimer: 0,
      musicMuted: false,
      sfxMuted: false,
      enemyLogo: null as HTMLImageElement | null,
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
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      gameState.audioContext = audioCtx;
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
    
    // Initialize music system
    function initMusic() {
      if (!gameState.music) {
        const audio = new Audio();
        audio.volume = 0.3;
        audio.loop = false;
        
        audio.addEventListener('ended', () => {
          // Pasar a la siguiente canción
          gameState.currentMusicIndex = (gameState.currentMusicIndex + 1) % gameState.musicTracks.length;
          playNextTrack();
        });
        
        gameState.music = audio;
        playNextTrack();
      }
    }
    
    function playNextTrack() {
      if (!gameState.music) return;
      
      const track = gameState.musicTracks[gameState.currentMusicIndex];
      gameState.music.src = track.path;
      
      if (!gameState.musicMuted) {
        gameState.music.play().catch(e => console.warn("Audio play failed:", e));
      }
      
      // Mostrar notificación
      gameState.musicNotification = track.name;
      gameState.musicNotificationTimer = 3; // 3 segundos
    }
    
    // Intentar iniciar música automáticamente
    initMusic();
    
    // Sound effect functions
    const playSound = (frequency: number, duration: number, type: OscillatorType = "sine", volume: number = 0.3) => {
      if (!gameState.audioContext || gameState.sfxMuted) return;
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
    
    // Game state management
    function endGame() {
      if (gameState.state === 'gameover') return; // Ya está en game over
      
      gameState.state = 'gameover';
      gameState.player.hp = 0;
      gameState.gameOverTimer = 1.0; // 1 segundo para auto-reinicio
      
      playDeathSound();
      console.log('Game Over: auto-restart in 1s');
    }
    
    function resetGame() {
      // Limpiar arrays
      gameState.bullets.length = 0;
      gameState.enemies.length = 0;
      gameState.drops.length = 0;
      gameState.particles.length = 0;
      gameState.hotspots.length = 0;
      
      // Resetear jugador
      gameState.player.x = W / 2;
      gameState.player.y = H / 2;
      gameState.player.hp = 100;
      gameState.player.maxhp = 100;
      gameState.player.shield = 0;
      gameState.player.ifr = 0;
      gameState.player.magnet = 120;
      gameState.player.rageTimer = 0;
      gameState.player.tempMagnetTimer = 0;
      gameState.player.tempShieldTimer = 0;
      gameState.player.weapons = [{ ...WEAPONS[0] }];
      gameState.player.tomes = [];
      gameState.player.items = [];
      gameState.player.itemFlags = {};
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
        bounceOnEnemies: false,
        damageReduction: 0,
        powerupDuration: 1,
        xpBonus: 0,
        firstHitImmuneUsed: false,
        chaosDamage: false,
        solarGauntletKills: 0,
        bloodstoneKills: 0,
        reactiveShieldActive: false,
      };
      
      // Resetear juego
      gameState.score = 0;
      gameState.level = 1;
      gameState.xp = 0;
      gameState.nextXP = 25;
      gameState.time = 0;
      gameState.wave = 1;
      gameState.waveKills = 0;
      gameState.waveEnemiesTotal = 15;
      gameState.waveEnemiesSpawned = 0;
      gameState.maxConcurrentEnemies = 8;
      gameState.lastSpawn = 0;
      gameState.lastMiniBossSpawn = 0;
      gameState.weaponCooldowns = {};
      gameState.regenTimer = 0;
      gameState.auraTimer = 0;
      gameState.hotspotTimer = 0;
      gameState.levelUpAnimation = 0;
      gameState.upgradeAnimation = 0;
      gameState.xpBarRainbow = false;
      gameState.waveNotification = 0;
      gameState.musicNotificationTimer = 0;
      gameState.musicMuted = false;
      gameState.sfxMuted = false;
      gameState.restartTimer = 0;
      gameState.showUpgradeUI = false;
      gameState.upgradeOptions = [];
      
      // Actualizar React state
      setScore(0);
      setLevel(1);
      
      // Reset timers/flags
      gameState.gameOverTimer = 0;
      
      // Cambiar a running
      gameState.state = 'running';
    }
    
    // Exponer resetGame al ref para usarlo desde el JSX
    resetGameRef.current = resetGame;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      gameState.keys[e.key.toLowerCase()] = true;
      
      // Game Over: R o Enter para reiniciar
      if (gameState.state === 'gameover' && (e.key.toLowerCase() === 'r' || e.key === 'Enter')) {
        resetGame();
        return;
      }
      
      // Escape para pausar/reanudar (solo en running o paused)
      if (e.key === "Escape" && gameState.state !== 'gameover') {
        if (gameState.state === 'running') {
          gameState.state = 'paused';
        } else if (gameState.state === 'paused') {
          gameState.state = 'running';
        }
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
      let enemyType: "strong" | "medium" | "weak";
      let color: string;
      let damage: number;
      let baseHp: number;
      let rad: number;
      let spd: number;
      let isElite = false;
      
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
      
      // Escalado de dificultad para wave 8+: +5% velocidad y daño por wave
      if (gameState.wave >= 8) {
        const difficultyScale = 1 + (gameState.wave - 7) * 0.05;
        spd *= difficultyScale;
        damage = Math.floor(damage * difficultyScale);
      }
      
      // HP scaling base por wave (+15% por wave)
      const waveMultiplier = 1 + (gameState.wave - 1) * 0.15;
      const scaledHp = Math.floor(baseHp * waveMultiplier);
      
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
        color,
      });
      }
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
        damage: Math.floor(25 * (1 + (gameState.wave - 1) * 0.05)),
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
      let baseDamage = weapon.damage * gameState.player.stats.damageMultiplier;
      
      // Amuleto del Caos: daño aleatorio +10% a +50%
      if (gameState.player.stats.chaosDamage) {
        const chaosBonus = 1 + (Math.random() * 0.4 + 0.1); // 1.1x a 1.5x
        baseDamage *= chaosBonus;
      }
      
      const damage = baseDamage;
      const dir = Math.atan2(target.y - gameState.player.y, target.x - gameState.player.x);
      
      const isPierce = weapon.special === "pierce";
      const isAoe = weapon.special === "aoe";
      const isSpread = weapon.special === "spread";
      
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
      
      // Aplicar bonus de duración de powerups
      duration *= gameState.player.stats.powerupDuration;
      
      playPowerupSound();
      
      if (type === "magnet") {
        gameState.player.tempMagnetTimer = duration;
      } else if (type === "shield") {
        gameState.player.tempShieldTimer = duration;
        gameState.player.shield = Math.min(3, gameState.player.shield + 1);
      } else if (type === "rage") {
        gameState.player.rageTimer = duration;
      }
      
      // Partículas de powerup con límite
      if (gameState.particles.length < gameState.maxParticles - 20) {
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
            existingTome.description = `+${existingTome.level * 10}% Daño`;
          } else if (existingTome.effect === "speed") {
            // +5% velocidad por nivel (max 5 = 25%)
            if (currentLevel < 5) {
              gameState.player.stats.speedMultiplier *= 1.05;
              existingTome.description = `+${existingTome.level * 5}% Velocidad`;
            }
          } else if (existingTome.effect === "bounce") {
            // +1 rebote por nivel (max 5 rebotes)
            if (currentLevel < 5) {
              gameState.player.stats.bounces += 1;
              existingTome.description = `${gameState.player.stats.bounces} Rebotes`;
              // Nivel 5: rebotan en enemigos también
              if (existingTome.level >= 5) {
                gameState.player.stats.bounceOnEnemies = true;
                existingTome.description = `${gameState.player.stats.bounces} Rebotes + Enemigos`;
              }
            }
          } else if (existingTome.effect === "range") {
            // Niveles específicos: +10%, +25%, +40%, +60%, +80% (max 5)
            if (currentLevel < 5) {
              const rangeBonuses = [1.1, 1.25, 1.4, 1.6, 1.8]; // Multiplicadores acumulativos totales
              const prevBonus = currentLevel > 0 ? rangeBonuses[currentLevel - 1] : 1;
              const newBonus = rangeBonuses[currentLevel];
              gameState.player.stats.rangeMultiplier = (gameState.player.stats.rangeMultiplier / prevBonus) * newBonus;
              const percentages = [10, 25, 40, 60, 80];
              existingTome.description = `+${percentages[currentLevel]}% Alcance`;
            }
          } else if (existingTome.effect === "precision") {
            // +10% precisión por nivel, -10% dispersión por nivel (max 5 = 50%)
            if (currentLevel < 5) {
              gameState.player.stats.precision += 10;
              existingTome.description = `+${gameState.player.stats.precision}% Precisión`;
            }
          } else if (existingTome.effect === "multishot") {
            // +1 proyectil por nivel (sin límite)
            gameState.player.stats.multishot += 1;
            existingTome.description = `+${gameState.player.stats.multishot + 1} Proyectiles`;
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
              existingTome.description = `Regen ${config.rate} HP cada ${config.interval}s`;
            } else {
              // Más allá del nivel 5, continuar mejorando
              const extraLevels = currentLevel - 4;
              gameState.player.stats.regenRate = 3 + extraLevels;
              existingTome.description = `Regen ${gameState.player.stats.regenRate} HP cada 4s`;
            }
          } else if (existingTome.effect === "magnet") {
            // +10% por nivel hasta nivel 5 (80%)
            if (currentLevel < 5) {
              gameState.player.stats.magnetMultiplier *= 1.1;
              const totalBonus = Math.round((gameState.player.stats.magnetMultiplier - 1) * 100);
              existingTome.description = `+${totalBonus}% Rango imán`;
            }
          } else if (existingTome.effect === "fireRate") {
            // +10% cadencia por nivel (sin límite)
            gameState.player.stats.fireRateMultiplier *= 1.1;
            const totalBonus = Math.round((gameState.player.stats.fireRateMultiplier - 1) * 100);
            existingTome.description = `+${totalBonus}% Cadencia`;
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
            case "dropcapacity":
              // Efecto pasivo, no modifica stats directamente
              break;
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
      if (gameState.state === 'running') {
        const musicBtnW = 160;
        const musicBtnH = 45;
        const musicBtnX = W - musicBtnW - 20;
        const musicBtnY = H - musicBtnH - 70;
        
        if (mx >= musicBtnX && mx <= musicBtnX + musicBtnW && 
            my >= musicBtnY && my <= musicBtnY + musicBtnH) {
          // Cambiar a la siguiente canción
          gameState.currentMusicIndex = (gameState.currentMusicIndex + 1) % gameState.musicTracks.length;
          playNextTrack();
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
      } else if (gameState.state === 'paused' && !gameState.showUpgradeUI) {
        // Pause menu click handler
        const menuW = 600;
        const menuH = 700;
        const menuX = W / 2 - menuW / 2;
        const menuY = H / 2 - menuH / 2;
        
        // Audio toggle buttons
        const toggleBtnW = 160;
        const toggleBtnH = 45;
        const toggleX1 = menuX + (menuW / 2) - toggleBtnW - 10;
        const toggleX2 = menuX + (menuW / 2) + 10;
        const toggleY = menuY + menuH - 180;
        
        // Music button
        if (mx >= toggleX1 && mx <= toggleX1 + toggleBtnW && my >= toggleY && my <= toggleY + toggleBtnH) {
          gameState.musicMuted = !gameState.musicMuted;
          if (gameState.music) {
            if (gameState.musicMuted) {
              gameState.music.pause();
            } else {
              gameState.music.play().catch(e => console.warn("Audio play failed:", e));
            }
          }
        }
        
        // SFX button
        if (mx >= toggleX2 && mx <= toggleX2 + toggleBtnW && my >= toggleY && my <= toggleY + toggleBtnH) {
          gameState.sfxMuted = !gameState.sfxMuted;
        }
        
        // Action buttons
        const btnW = 200;
        const btnH = 55;
        const btnGap = 30;
        const continueX = menuX + (menuW / 2) - btnW - btnGap / 2;
        const restartX = menuX + (menuW / 2) + btnGap / 2;
        const btnY = menuY + menuH - 80;
        
        // Continue button
        if (mx >= continueX && mx <= continueX + btnW && my >= btnY && my <= btnY + btnH) {
          gameState.state = 'running';
        }
        
        // Restart button
        if (mx >= restartX && mx <= restartX + btnW && my >= btnY && my <= btnY + btnH) {
          resetGame();
        }
      }
    });

    function update(dt: number) {
      // Actualizar tiempo siempre (necesario para animaciones)
      gameState.time += dt;

      // Animations que deben correr siempre
      if (gameState.levelUpAnimation > 0) gameState.levelUpAnimation = Math.max(0, gameState.levelUpAnimation - dt * 2);
      if (gameState.upgradeAnimation > 0) gameState.upgradeAnimation = Math.max(0, gameState.upgradeAnimation - dt);
      if (gameState.upgradeUIAnimation < 1 && gameState.showUpgradeUI) gameState.upgradeUIAnimation = Math.min(1, gameState.upgradeUIAnimation + dt * 3);
      
      // Music notification timer
      if (gameState.musicNotificationTimer > 0) {
        gameState.musicNotificationTimer = Math.max(0, gameState.musicNotificationTimer - dt);
      }

      // Game Over auto-restart timer
      if (gameState.state === 'gameover') {
        gameState.gameOverTimer = Math.max(0, gameState.gameOverTimer - dt);
        if (gameState.gameOverTimer === 0) {
          resetGame();
        }
        return;
      }
      
      // Solo actualizar lógica del juego si está corriendo
      if (gameState.state !== 'running') return;

      // Wave system basado en conteo de enemigos eliminados
      if (gameState.waveKills >= gameState.waveEnemiesTotal) {
        // Wave completada!
        gameState.wave++;
        gameState.waveKills = 0;
        gameState.waveEnemiesSpawned = 0;
        
        // Reset first hit immune para la nueva wave
        gameState.player.stats.firstHitImmuneUsed = false;
        
        // Configurar targets y caps específicos por wave
        let waveTarget: number;
        let maxConcurrent: number;
        
        switch(gameState.wave) {
          case 1:
            waveTarget = 15;
            maxConcurrent = 8;
            break;
          case 2:
            waveTarget = 12; // +1 boss = 13 total
            maxConcurrent = 9;
            break;
          case 3:
            waveTarget = 18;
            maxConcurrent = 11;
            break;
          case 4:
            waveTarget = 20;
            maxConcurrent = 12;
            break;
          case 5:
            waveTarget = 22;
            maxConcurrent = 14;
            break;
          case 6:
            waveTarget = 24;
            maxConcurrent = 15;
            break;
          case 7:
            waveTarget = 26;
            maxConcurrent = 16;
            break;
          default:
            // Wave 8+: Escalado progresivo
            waveTarget = 26 + (gameState.wave - 7) * 3;
            maxConcurrent = Math.min(25, 16 + (gameState.wave - 7));
            break;
        }
        
        gameState.waveEnemiesTotal = waveTarget;
        gameState.maxConcurrentEnemies = maxConcurrent;
        
        // Animación de transición entre waves
        gameState.waveNotification = 2;
        
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
      }
      
      // Reducir timer de notificación de wave
      if (gameState.waveNotification > 0) {
        gameState.waveNotification = Math.max(0, gameState.waveNotification - dt);
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
      
      // Movimiento tentativo
      let newX = gameState.player.x + vx * spd;
      let newY = gameState.player.y + vy * spd;
      
      // Clamp a los límites del mapa
      newX = Math.max(gameState.player.rad, Math.min(W - gameState.player.rad, newX));
      newY = Math.max(gameState.player.rad, Math.min(H - gameState.player.rad, newY));
      
      gameState.player.x = newX;
      gameState.player.y = newY;

      // Spawn enemigos por lotes (burst controlado)
      gameState.lastSpawn += dt;
      
      // Solo spawnear si no hemos alcanzado el total de enemigos para esta wave
      // Y si no excedemos el cap de enemigos concurrentes
      const canSpawn = gameState.waveEnemiesSpawned < gameState.waveEnemiesTotal && 
                      gameState.enemies.length < gameState.maxConcurrentEnemies;
      
      if (canSpawn) {
        // Intervalos de spawn específicos por wave
        let spawnRate: number;
        
        if (gameState.wave === 1) {
          spawnRate = 1.4 + Math.random() * 0.2; // 1.4-1.6s
        } else if (gameState.wave === 2) {
          spawnRate = 1.3 + Math.random() * 0.2; // 1.3-1.5s
        } else if (gameState.wave === 3) {
          spawnRate = 1.2 + Math.random() * 0.2; // 1.2-1.4s
        } else if (gameState.wave === 4 || gameState.wave === 5) {
          spawnRate = 1.0 + Math.random() * 0.2; // 1.0-1.2s (bursts de 2-3)
        } else if (gameState.wave === 6 || gameState.wave === 7) {
          spawnRate = 0.9 + Math.random() * 0.2; // 0.9-1.1s
        } else {
          // Wave 8+: Más rápido gradualmente
          const speedup = Math.min(0.3, (gameState.wave - 7) * 0.05);
          spawnRate = Math.max(0.5, 0.8 - speedup + Math.random() * 0.2);
        }
        
        if (gameState.lastSpawn > spawnRate) {
          spawnEnemy();
          gameState.waveEnemiesSpawned++;
          gameState.lastSpawn = 0;
        }
      }
      
      // Mini-boss spawn en waves específicas (2, 5, 8, etc.)
      const shouldSpawnBoss = (gameState.wave === 2 || gameState.wave === 5 || gameState.wave % 3 === 0) && 
                             gameState.waveEnemiesSpawned === gameState.waveEnemiesTotal;
      if (shouldSpawnBoss && gameState.enemies.length < gameState.maxConcurrentEnemies) {
        spawnMiniBoss();
        gameState.waveEnemiesSpawned++;
        gameState.waveEnemiesTotal++;
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
              // Partículas de explosión con límite
              if (gameState.particles.length < gameState.maxParticles - 20) {
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
              
              // Incrementar contador de muertes de la wave
              gameState.waveKills++;
              
              // Puntos y XP según tipo de enemigo
              let points = 10;
              let xpBundles = 1;
              let dropChance = 0;
              
              if (e.isMiniBoss) {
                points = 100;
                xpBundles = Math.floor(Math.random() * 3) + 4; // 4-6 bundles
                dropChance = 0.10; // 10% chance de drop temporal
              } else if (e.isElite) {
                // Élites: Mejor loot
                points = 25;
                xpBundles = 2;
                dropChance = 0.15; // 15% chance
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
                const powerupType = roll < 0.4 ? "magnet" : roll < 0.7 ? "shield" : "rage";
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
          
          // Daño solo si no está en rage mode
          if (gameState.player.rageTimer <= 0 && gameState.player.ifr <= 0) {
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
      
      // Level y Wave info (arriba izquierda, debajo de HP)
      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px system-ui";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(`NIVEL ${gameState.level}`, 20, hpBarY + hpBarH + 30);
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
      ctx.fillText(t.tomes, W - 220, tomeY);
      for (let i = 0; i < gameState.player.tomes.length; i++) {
        const tome = gameState.player.tomes[i];
        ctx.fillStyle = tome.color;
        ctx.fillRect(W - 220, tomeY + 10 + i * 25, 18, 18);
        ctx.fillStyle = "#fff";
        ctx.font = "12px system-ui";
        const tomeText = tome.level > 1 ? `${tome.name} LVL ${tome.level}` : tome.name;
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
          const itemName = item.name.length > 18 ? item.name.substring(0, 16) + "..." : item.name;
          ctx.fillText(itemName, W - 202, itemY + 20 + i * 20);
        }
        
        // Indicador de más ítems
        if (gameState.player.items.length > 10) {
          ctx.fillStyle = "#9ca3af";
          ctx.font = "10px system-ui";
          ctx.fillText(`+${gameState.player.items.length - 10} más`, W - 220, itemY + 10 + maxItemsToShow * 20 + 15);
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
        ctx.fillText("LEVEL UP!", 0, 0);
        ctx.restore();
        ctx.globalAlpha = 1;
      }
      
      // Wave notification
      if (gameState.waveNotification > 0) {
        const alpha = Math.min(1, gameState.waveNotification);
        const fadeOut = gameState.waveNotification < 1 ? gameState.waveNotification : 1;
        ctx.globalAlpha = fadeOut;
        
        // Fondo semitransparente
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, H / 2 - 60, W, 120);
        
        // Texto principal con glow
        const pulse = Math.sin(gameState.time * 8) * 0.2 + 0.8;
        ctx.fillStyle = "#a855f7";
        ctx.shadowColor = "#a855f7";
        ctx.shadowBlur = 30 * pulse;
        ctx.font = "bold 64px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(`WAVE ${gameState.wave}`, W / 2, H / 2 + 10);
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
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
      
      // Background del botón
      const musicBtnGradient = ctx.createLinearGradient(musicBtnX, musicBtnY, musicBtnX, musicBtnY + musicBtnH);
      musicBtnGradient.addColorStop(0, "rgba(168, 85, 247, 0.9)");
      musicBtnGradient.addColorStop(1, "rgba(124, 58, 237, 0.9)");
      ctx.fillStyle = musicBtnGradient;
      ctx.beginPath();
      ctx.roundRect(musicBtnX, musicBtnY, musicBtnW, musicBtnH, 8);
      ctx.fill();
      
      // Border
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Texto del botón
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px system-ui";
      ctx.textAlign = "center";
      const currentTrack = gameState.musicTracks[gameState.currentMusicIndex];
      ctx.fillText(`♫ ${currentTrack.name.slice(0, 12)}...`, musicBtnX + musicBtnW / 2, musicBtnY + musicBtnH / 2 + 6);
      
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
      ctx.fillText("¡SUBISTE DE NIVEL!", 0, 0);
      
      // Segundo glow para más intensidad
      ctx.shadowBlur = 60 * pulse * animProgress;
      ctx.fillText("¡SUBISTE DE NIVEL!", 0, 0);
      ctx.shadowBlur = 0;
      
      ctx.restore();
      
      // Subtítulo con fade
      ctx.font = "28px system-ui";
      ctx.fillStyle = `rgba(156, 163, 175, ${animProgress})`;
      ctx.textAlign = "center";
      ctx.fillText("Elige una mejora:", W / 2, H / 2 - 100);
      
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
        const typeText = option.type === "weapon" ? "⚔️ ARMA" : option.type === "tome" ? "📖 TOMO" : "✨ ÍTEM";
        
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
        const nameText = option.isLevelUp ? `${data.name} ★${data.level + 1}` : data.name;
        
        // Wrap text if too long
        const maxWidth = cardW - 30;
        ctx.fillText(nameText, x + cardW / 2, yOffset + 75, maxWidth);
        ctx.shadowBlur = 0;
        
        // Descripción con mejor formato
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "15px system-ui";
        
        if (option.type === "weapon") {
          const w = data as Weapon;
          if (option.isLevelUp && option.description) {
            // Wrap description text
            wrapText(ctx, option.description, x + cardW / 2, yOffset + 110, maxWidth, 20);
          } else {
            ctx.textAlign = "left";
            const statsX = x + 20;
            ctx.fillText(`💥 Daño: ${w.damage.toFixed(1)}`, statsX, yOffset + 110);
            ctx.fillText(`⚡ Cadencia: ${w.fireRate.toFixed(1)}/s`, statsX, yOffset + 135);
            ctx.fillText(`🎯 Alcance: ${w.range}`, statsX, yOffset + 160);
            ctx.textAlign = "center";
          }
        } else if (option.type === "tome") {
          const t = data as Tome;
          const desc = option.isLevelUp && option.description ? option.description : t.description;
          wrapText(ctx, desc, x + cardW / 2, yOffset + 110, maxWidth, 20);
        } else {
          wrapText(ctx, data.description, x + cardW / 2, yOffset + 110, maxWidth, 20);
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
      ctx.fillText("Click para seleccionar", W / 2, H - 60);
      
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
        
        // Si tenemos el logo cargado, dibujarlo con el color del enemigo
        if (gameState.enemyLogo && gameState.enemyLogo.complete) {
          ctx.translate(e.x, e.y);
          
          // Aplicar sombra con el color del enemigo
          ctx.shadowColor = e.color;
          ctx.shadowBlur = e.isMiniBoss ? 25 : 15;
          
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
          ctx.shadowColor = e.color;
          ctx.shadowBlur = e.isMiniBoss ? 25 : 15;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.restore();
        }
        
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
      
      // Game Over overlay fade
      if (gameState.state === 'gameover') {
        const alpha = Math.min(0.85, 1 - Math.max(0, gameState.gameOverTimer));
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      
      // Pause menu
      if (gameState.state === 'paused' && !gameState.showUpgradeUI) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, W, H);
        
        // Menu container
        const menuW = 600;
        const menuH = 700;
        const menuX = W / 2 - menuW / 2;
        const menuY = H / 2 - menuH / 2;
        
        // Background with gradient
        const bgGradient = ctx.createLinearGradient(menuX, menuY, menuX, menuY + menuH);
        bgGradient.addColorStop(0, "rgba(15, 20, 30, 0.98)");
        bgGradient.addColorStop(1, "rgba(25, 30, 40, 0.98)");
        ctx.fillStyle = bgGradient;
        ctx.fillRect(menuX, menuY, menuW, menuH);
        
        // Border with glow
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 20;
        ctx.strokeRect(menuX, menuY, menuW, menuH);
        ctx.shadowBlur = 0;
        
        // Title
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 48px system-ui";
        ctx.textAlign = "center";
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 10;
        ctx.fillText(t.paused, W / 2, menuY + 60);
        ctx.shadowBlur = 0;
        
        // Content area
        let contentY = menuY + 100;
        const leftCol = menuX + 40;
        const rightCol = menuX + menuW / 2 + 20;
        const lineHeight = 32;
        
        // === BASIC STATS SECTION ===
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px system-ui";
        ctx.textAlign = "left";
        ctx.fillText("📊 ESTADÍSTICAS", leftCol, contentY);
        contentY += 35;
        
        ctx.font = "16px system-ui";
        ctx.fillStyle = "#9ca3af";
        
        // HP with bar
        ctx.fillText(`HP:`, leftCol, contentY);
        const hpBarX = leftCol + 70;
        const hpBarW = 180;
        const hpBarH = 18;
        const hpPercent = Math.max(0, Math.min(1, (Number(gameState.player.hp) || 0) / (Number(gameState.player.maxhp) || 1)));
        
        ctx.fillStyle = "rgba(50, 50, 50, 0.8)";
        ctx.fillRect(hpBarX, contentY - 12, hpBarW, hpBarH);
        
        const hpGradient = ctx.createLinearGradient(hpBarX, 0, hpBarX + hpBarW * hpPercent, 0);
        hpGradient.addColorStop(0, "#ef4444");
        hpGradient.addColorStop(1, "#f87171");
        ctx.fillStyle = hpGradient;
        ctx.fillRect(hpBarX, contentY - 12, hpBarW * hpPercent, hpBarH);
        
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(`${gameState.player.hp} / ${gameState.player.maxhp}`, hpBarX + hpBarW / 2, contentY + 1);
        
        contentY += lineHeight;
        ctx.font = "16px system-ui";
        ctx.textAlign = "left";
        ctx.fillStyle = "#9ca3af";
        ctx.fillText(`${t.level}: ${gameState.level}`, leftCol, contentY);
        ctx.fillText(`Score: ${gameState.score}`, rightCol, contentY);
        contentY += lineHeight;
        ctx.fillText(`${t.wave}: ${gameState.wave}`, leftCol, contentY);
        
        const time = Math.floor(gameState.time);
        const mm = String(Math.floor(time / 60)).padStart(2, '0');
        const ss = String(time % 60).padStart(2, '0');
        ctx.fillText(`Tiempo: ${mm}:${ss}`, rightCol, contentY);
        contentY += lineHeight + 20;
        
        // === COMBAT STATS SECTION ===
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px system-ui";
        ctx.fillText("⚔️ COMBATE", leftCol, contentY);
        contentY += 35;
        
        ctx.font = "16px system-ui";
        ctx.fillStyle = "#f87171";
        const dmgMult = ((gameState.player.stats.damageMultiplier - 1) * 100).toFixed(0);
        ctx.fillText(`💥 Daño: +${dmgMult}%`, leftCol, contentY);
        
        ctx.fillStyle = "#22c55e";
        const spdMult = ((gameState.player.stats.speedMultiplier - 1) * 100).toFixed(0);
        ctx.fillText(`⚡ Velocidad: +${spdMult}%`, rightCol, contentY);
        contentY += lineHeight;
        
        ctx.fillStyle = "#3b82f6";
        const rangeMult = ((gameState.player.stats.rangeMultiplier - 1) * 100).toFixed(0);
        ctx.fillText(`🎯 Alcance: +${rangeMult}%`, leftCol, contentY);
        
        ctx.fillStyle = "#fbbf24";
        const fireMult = ((gameState.player.stats.fireRateMultiplier - 1) * 100).toFixed(0);
        ctx.fillText(`🔫 Cadencia: +${fireMult}%`, rightCol, contentY);
        contentY += lineHeight;
        
        if (gameState.player.stats.bounces > 0) {
          ctx.fillStyle = "#a855f7";
          ctx.fillText(`🔄 Rebotes: ${gameState.player.stats.bounces}`, leftCol, contentY);
          contentY += lineHeight;
        }
        
        if (gameState.player.stats.multishot > 0) {
          ctx.fillStyle = "#06b6d4";
          ctx.fillText(`📌 Proyectiles: +${gameState.player.stats.multishot}`, leftCol, contentY);
          contentY += lineHeight;
        }
        
        if (gameState.player.stats.vampire > 0) {
          ctx.fillStyle = "#ec4899";
          ctx.fillText(`🩸 Vampirismo: ${(gameState.player.stats.vampire * 100).toFixed(0)}%`, leftCol, contentY);
          contentY += lineHeight;
        }
        
        if (gameState.player.stats.auraRadius > 0) {
          ctx.fillStyle = "#f87171";
          ctx.fillText(`🔥 Aura de Fuego: ${gameState.player.stats.auraRadius}px`, leftCol, contentY);
          contentY += lineHeight;
        }
        
        const xpMult = ((gameState.player.stats.xpMultiplier - 1) * 100).toFixed(0);
        if (gameState.player.stats.xpMultiplier > 1) {
          ctx.fillStyle = "#ec4899";
          ctx.fillText(`✨ Exp: +${xpMult}%`, rightCol, contentY - lineHeight * 2);
        }
        
        contentY += 10;
        
        // === INVENTORY SECTION ===
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px system-ui";
        ctx.fillText("🎒 INVENTARIO", leftCol, contentY);
        contentY += 35;
        
        ctx.font = "15px system-ui";
        ctx.fillStyle = "#9ca3af";
        ctx.fillText(`${t.weapons} ${gameState.player.weapons.length}/3`, leftCol, contentY);
        ctx.fillText(`${t.tomes} ${gameState.player.tomes.length}/3`, rightCol, contentY);
        contentY += 25;
        
        // Weapons list
        gameState.player.weapons.forEach((w: Weapon, i: number) => {
          ctx.fillStyle = w.color;
          ctx.fillText(`• ${w.name} (Lv.${w.level})`, leftCol + 10, contentY + i * 22);
        });
        
        // Tomes list
        gameState.player.tomes.forEach((tome: Tome, i: number) => {
          ctx.fillStyle = tome.color;
          ctx.fillText(`• ${tome.name} (Lv.${tome.level})`, rightCol + 10, contentY + i * 22);
        });
        
        contentY = menuY + menuH - 180;
        
        // === AUDIO CONTROLS ===
        const toggleBtnW = 160;
        const toggleBtnH = 45;
        const toggleX1 = menuX + (menuW / 2) - toggleBtnW - 10;
        const toggleX2 = menuX + (menuW / 2) + 10;
        const toggleY = contentY;
        
        // Music button
        ctx.fillStyle = gameState.musicMuted ? "#ef4444" : "#22c55e";
        ctx.fillRect(toggleX1, toggleY, toggleBtnW, toggleBtnH);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(toggleX1, toggleY, toggleBtnW, toggleBtnH);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(gameState.musicMuted ? "🔇 Música" : "🎵 Música", toggleX1 + toggleBtnW / 2, toggleY + toggleBtnH / 2 + 5);
        
        // SFX button
        ctx.fillStyle = gameState.sfxMuted ? "#ef4444" : "#22c55e";
        ctx.fillRect(toggleX2, toggleY, toggleBtnW, toggleBtnH);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(toggleX2, toggleY, toggleBtnW, toggleBtnH);
        ctx.fillStyle = "#fff";
        ctx.fillText(gameState.sfxMuted ? "🔇 SFX" : "🔊 SFX", toggleX2 + toggleBtnW / 2, toggleY + toggleBtnH / 2 + 5);
        
        // === ACTION BUTTONS ===
        const btnW = 200;
        const btnH = 55;
        const btnGap = 30;
        const continueX = menuX + (menuW / 2) - btnW - btnGap / 2;
        const restartX = menuX + (menuW / 2) + btnGap / 2;
        const btnY = menuY + menuH - 80;
        
        // Continue button (green)
        const continueGradient = ctx.createLinearGradient(continueX, btnY, continueX, btnY + btnH);
        continueGradient.addColorStop(0, "#22c55e");
        continueGradient.addColorStop(1, "#16a34a");
        ctx.fillStyle = continueGradient;
        ctx.fillRect(continueX, btnY, btnW, btnH);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#22c55e";
        ctx.shadowBlur = 15;
        ctx.strokeRect(continueX, btnY, btnW, btnH);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.font = "bold 22px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("▶ " + t.continue, continueX + btnW / 2, btnY + btnH / 2 + 8);
        
        // Restart button (red)
        const restartGradient = ctx.createLinearGradient(restartX, btnY, restartX, btnY + btnH);
        restartGradient.addColorStop(0, "#ef4444");
        restartGradient.addColorStop(1, "#dc2626");
        ctx.fillStyle = restartGradient;
        ctx.fillRect(restartX, btnY, btnW, btnH);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 15;
        ctx.strokeRect(restartX, btnY, btnW, btnH);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.fillText("🔄 " + t.restart, restartX + btnW / 2, btnY + btnH / 2 + 8);
        
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
    </div>
  );
};

export default Index;
