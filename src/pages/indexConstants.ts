import type { Language } from "./gameData";

export const LANGUAGE_ORDER: Language[] = ["es", "en"];

export type PauseMenuTab = "home" | "settings" | "stats";

export const PAUSE_MENU_TABS: PauseMenuTab[] = ["home", "settings", "stats"];

export const CHEST_DROP_RATE = 0.025;
export const ENTITY_SCALE = 0.75;
export const CAMERA_DEADZONE_RADIUS = 80;
export const CAMERA_ZOOM = 1.8;

export const PLAYER_BASE_RADIUS = 16;
export const WEAK_ENEMY_BASE_RADIUS = 16;
export const MEDIUM_ENEMY_BASE_RADIUS = 20;
export const STRONG_ENEMY_BASE_RADIUS = 24;
export const FAST_ENEMY_BASE_RADIUS = 16;
export const EXPLOSIVE_ENEMY_BASE_RADIUS = 18;
export const SUMMONER_ENEMY_BASE_RADIUS = 20;
export const TANK_ENEMY_BASE_RADIUS = 28;

export const WEAK_ENEMY_COLOR = "#5dbb63";
export const WEAK_ELITE_COLOR = "#16a34a";
export const MEDIUM_ENEMY_COLOR = "#8e44ad";
export const MEDIUM_ELITE_COLOR = "#9333ea";
export const STRONG_ENEMY_COLOR = "#f97316";
export const STRONG_ELITE_COLOR = "#ea580c";
export const FAST_ENEMY_COLOR = "#fb923c";
export const BOSS_COLOR = "#c81d3c";

export const ENEMY_SIZE_MULTIPLIER = 1.3;
export const ENEMY_SPEED_MULTIPLIER = 0.7;
export const HOTSPOT_SIZE_MULTIPLIER = 1.3;

export const scaleEntitySize = (value: number) =>
  Math.max(1, Math.round(value * ENTITY_SCALE));

export const scaleEnemyRadius = (value: number) =>
  Math.max(1, Math.round(scaleEntitySize(value) * ENEMY_SIZE_MULTIPLIER));

export const scaleHotspotRadius = (value: number) =>
  Math.max(1, Math.round(scaleEntitySize(value) * HOTSPOT_SIZE_MULTIPLIER));

export const applyEnemySpeedModifier = (value: number) =>
  value * ENEMY_SPEED_MULTIPLIER;

export const BULLET_RADIUS = 4;

export const MAX_ENEMY_RADIUS = Math.max(
  scaleEnemyRadius(WEAK_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(MEDIUM_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(STRONG_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(FAST_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(EXPLOSIVE_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(SUMMONER_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(TANK_ENEMY_BASE_RADIUS),
  scaleEnemyRadius(40),
);

export const MAX_CHAIN_RADIUS = 150;
export const MAX_BOUNCE_RADIUS = 200;

export const SPATIAL_HASH_CELL_SIZE = Math.max(
  1,
  Math.round((MAX_ENEMY_RADIUS + BULLET_RADIUS) * 2),
);

export const BULLET_QUERY_RADIUS = Math.max(
  MAX_ENEMY_RADIUS + BULLET_RADIUS,
  MAX_BOUNCE_RADIUS,
);

export const UI_COLORS = {
  textPrimary: "#e6f1ff",
  textSecondary: "rgba(230, 241, 255, 0.65)",
  accent: "#00d9ff",
  accentGlow: "rgba(0, 217, 255, 0.45)",
  rageAccent: "#ff375e",
  rageGlow: "rgba(255, 55, 94, 0.45)",
  panelBg: "rgba(26, 26, 26, 0.94)",
  panelBorder: "rgba(90, 90, 90, 0.6)",
  overlay: "rgba(10, 10, 10, 0.72)",
  healthLow: "#7a1124",
  healthHigh: "#ff375e",
  shield: "#2fb3a3",
  ammo: "#00d9ff",
  xp: "#ff7b2f",
  minimap: "#3bc9db",
  backgroundGradient: ["#1a1a1a", "#2e2e2e", "#1a1a1a"],
} as const;

export type PortalType = "boss" | "exit";

export const PORTAL_COLORS: Record<PortalType, string> = {
  boss: "#ff375e",
  exit: "#00d9ff",
};

export const PORTAL_GLOW_COLORS: Record<PortalType, string> = {
  boss: "#ff5f7c",
  exit: "#4de3ff",
};

export const DIFFICULTY_THERMOMETER = {
  id: "world_aggression",
  version: "1.0",
  range: { min: 0, max: 100 },
  initial_value: 0,
  tick_rate_hz: 10,
  variables: {
    time_minutes: 0,
    waves_cleared: 0,
    player_level: 1,
    active_objectives: 0,
    challenge_modifiers: 0,
    heat_stacks: 0,
    no_kill_seconds: 0,
  },
  formula: {
    expression:
      "(time_minutes * a) + (waves_cleared * b) + (player_level * c) + (active_objectives * d) + (challenge_modifiers * e) + (heat_stacks * f)",
    coefficients: { a: 0.7, b: 3, c: 0.5, d: 2, e: 4, f: 1.25 },
    clamp_to_range: true,
  },
  cooling_rules: {
    enabled: true,
    start_after_seconds_without_kill: 30,
    decay_per_second: 2,
    floor: 50,
    pauses_during_boss: true,
  },
  event_deltas: {
    on_enemy_kill: { value_delta: 0.05 },
    on_elite_kill: { value_delta: 0.2 },
    on_player_damage_taken: { value_delta: 0.02, max_per_second: 0.5 },
    on_player_death: { value_delta: 5 },
    on_objective_start: { value_delta: 2 },
    on_objective_complete: { value_delta: -3 },
    on_shrine_challenge: { value_delta: 8 },
    on_item_pickup_cursed: { value_delta: 3 },
    on_item_pickup_defensive: { value_delta: -1 },
  },
  states: [
    {
      id: "calm",
      label_en: "Calm",
      label_es: "Calma",
      range: { min: 0, max: 20 },
      enemy_scaling: { health_mult: 1, damage_mult: 1, speed_mult: 1 },
      spawn_rules: {
        density: 0.8,
        elite_chance: 0,
        mini_boss_chance: 0,
        boss_chance: 0,
      },
      loot_bias_weights: { common: 70, uncommon: 25, rare: 5, epic: 0, legendary: 0 },
      environment: { corruption_level: 0, ambient_fx: ["clear_sky"] },
      ui: { color_hex: "#2BB1FF", vignette_intensity: 0 },
      audio: { music_layer: 0, heartbeat: false, whispers: false },
    },
    {
      id: "alert",
      label_en: "Alert",
      label_es: "Alerta",
      range: { min: 20, max: 40 },
      enemy_scaling: { health_mult: 1.05, damage_mult: 1.05, speed_mult: 1.05 },
      spawn_rules: {
        density: 1,
        elite_chance: 0.05,
        mini_boss_chance: 0,
        boss_chance: 0,
      },
      loot_bias_weights: { common: 55, uncommon: 35, rare: 8, epic: 2, legendary: 0 },
      environment: { corruption_level: 1, ambient_fx: ["heat_haze"] },
      ui: { color_hex: "#FFA62B", vignette_intensity: 0.05 },
      audio: { music_layer: 1, heartbeat: false, whispers: false },
    },
    {
      id: "dangerous",
      label_en: "Dangerous",
      label_es: "Peligroso",
      range: { min: 40, max: 60 },
      enemy_scaling: { health_mult: 1.15, damage_mult: 1.15, speed_mult: 1.1 },
      spawn_rules: {
        density: 1.25,
        elite_chance: 0.12,
        mini_boss_chance: 0.06,
        boss_chance: 0,
      },
      loot_bias_weights: { common: 45, uncommon: 35, rare: 15, epic: 4, legendary: 1 },
      environment: { corruption_level: 2, ambient_fx: ["red_sky", "ash_particles"] },
      ui: { color_hex: "#FF5E2B", vignette_intensity: 0.12, screen_pulse: 0.02 },
      audio: { music_layer: 2, heartbeat: true, whispers: false },
    },
    {
      id: "chaos",
      label_en: "Chaos",
      label_es: "Caos",
      range: { min: 60, max: 80 },
      enemy_scaling: { health_mult: 1.3, damage_mult: 1.25, speed_mult: 1.15 },
      spawn_rules: {
        density: 1.5,
        elite_chance: 0.2,
        mini_boss_chance: 0.15,
        boss_chance: 0.05,
      },
      loot_bias_weights: { common: 30, uncommon: 35, rare: 22, epic: 10, legendary: 3 },
      environment: {
        corruption_level: 3,
        ambient_fx: ["crimson_clouds", "ground_cracks_glow"],
      },
      ui: {
        color_hex: "#D31339",
        vignette_intensity: 0.2,
        screen_pulse: 0.05,
        chromatic_aberration: 0.03,
      },
      audio: { music_layer: 3, heartbeat: true, whispers: true },
    },
    {
      id: "apocalypse",
      label_en: "Apocalypse",
      label_es: "Apocalipsis",
      range: { min: 80, max: 100 },
      enemy_scaling: { health_mult: 1.55, damage_mult: 1.4, speed_mult: 1.2 },
      spawn_rules: {
        density: 1.8,
        elite_chance: 0.3,
        mini_boss_chance: 0.25,
        boss_chance: 0.12,
      },
      loot_bias_weights: { common: 15, uncommon: 30, rare: 30, epic: 18, legendary: 7 },
      environment: {
        corruption_level: 4,
        ambient_fx: ["blood_moon", "hell_rift_tears", "ashstorm"],
      },
      ui: {
        color_hex: "#8B0000",
        vignette_intensity: 0.35,
        screen_pulse: 0.1,
        chromatic_aberration: 0.06,
        scanline_glitch: 0.05,
      },
      audio: { music_layer: 4, heartbeat: true, whispers: true, demonic_choir: true },
    },
  ],
  enemy_stat_formulas: {
    health_multiplier_expr: "1 + (value / 100) * 0.55",
    damage_multiplier_expr: "1 + (value / 100) * 0.40",
    speed_multiplier_expr: "1 + (value / 100) * 0.20",
  },
  loot_system: {
    rarities: ["common", "uncommon", "rare", "epic", "legendary"],
    bias_by_state_uses_weights: true,
    pity_timer: {
      enabled: true,
      rolls_without_rare_for_bonus: 8,
      bonus_rare_weight: 10,
    },
  },
  modifiers_pool: [
    {
      id: "blood_moon",
      label_en: "Blood Moon",
      label_es: "Luna de Sangre",
      unlock_at_state: "chaos",
      weight_multiplier_at_state: { dangerous: 0.5, chaos: 1, apocalypse: 1.4 },
      effects: { elite_chance_add: 0.1, healing_received_mult: 0.8 },
    },
    {
      id: "void_storm",
      label_en: "Void Storm",
      label_es: "Tormenta del Vacío",
      unlock_at_state: "apocalypse",
      weight_multiplier_at_state: { chaos: 0.6, apocalypse: 1.5 },
      effects: { spawn_density_mult: 1.15, random_teleport_chance: 0.01 },
    },
  ],
  item_interactions: [
    { item: "Aether Stabilizer", effect: "rate_multiplier", value: 0.8 },
    { item: "Cryo Core", effect: "freeze_seconds_on_use", value: 10 },
    { item: "Infernal Blood Vial", effect: "instant_value_add", value: 5 },
    { item: "Reactor Core", effect: "rate_multiplier_when_active", value: 1.25 },
    { item: "Void Rations", effect: "instant_value_sub_on_chest_open", value: 2 },
    {
      item: "Overclocked Processor",
      effect: "rate_multiplier_below_hp_pct",
      hp_pct: 0.3,
      value: 1.15,
    },
    { item: "Cursed Medallion", effect: "max_state_floor", value: "dangerous" },
  ],
  ui: {
    style: "vertical_thermometer",
    position: { anchor: "right_center", offset_x: -36, offset_y: 0 },
    segments: [
      { state: "calm", color_hex: "#2BB1FF" },
      { state: "alert", color_hex: "#FFA62B" },
      { state: "dangerous", color_hex: "#FF5E2B" },
      { state: "chaos", color_hex: "#D31339" },
      { state: "apocalypse", color_hex: "#8B0000" },
    ],
    threshold_markers: true,
    label_localization: { en: true, es: true },
  },
  audio: {
    rtpc: { name: "WorldAggression", range: { min: 0, max: 100 } },
    cues_on_state_enter: {
      alert: "stinger_alert",
      dangerous: "stinger_danger",
      chaos: "stinger_chaos",
      apocalypse: "stinger_apocalypse",
    },
  },
  api: {
    methods: [
      { name: "getValue", args: [], returns: "number" },
      { name: "addValue", args: ["delta:number"], returns: "number" },
      { name: "setValue", args: ["value:number"], returns: "number" },
      { name: "applyEvent", args: ["eventId:string"], returns: "number" },
      { name: "freeze", args: ["seconds:number"], returns: "void" },
    ],
    events: [
      "OnThermometerChanged(value:number)",
      "OnStateEnter(stateId:string)",
      "OnStateExit(stateId:string)",
    ],
  },
  telemetry: {
    log_to_console: false,
    emit_metrics: true,
    sample_rate_seconds: 10,
  },
  defaults_for_testing: {
    time_minutes: 3,
    waves_cleared: 4,
    player_level: 5,
    active_objectives: 1,
    challenge_modifiers: 0,
  },
} as const;

export const DIFFICULTY_RANGE = DIFFICULTY_THERMOMETER.range;
export const DIFFICULTY_INITIAL_VALUE = DIFFICULTY_THERMOMETER.initial_value;
export const DIFFICULTY_COOLING_RULES = DIFFICULTY_THERMOMETER.cooling_rules;
export const DIFFICULTY_EVENT_DELTAS = DIFFICULTY_THERMOMETER.event_deltas;

export type DifficultyEventId = keyof typeof DIFFICULTY_EVENT_DELTAS;

export type DifficultyVariables = {
  time_minutes: number;
  waves_cleared: number;
  player_level: number;
  active_objectives: number;
  challenge_modifiers: number;
  heat_stacks: number;
  no_kill_seconds: number;
};

export const createDifficultyVariables = (): DifficultyVariables => ({
  time_minutes: 0,
  waves_cleared: 0,
  player_level: 1,
  active_objectives: 0,
  challenge_modifiers: 0,
  heat_stacks: 0,
  no_kill_seconds: 0,
});

export const clampDifficultyValue = (value: number) =>
  Math.min(DIFFICULTY_RANGE.max, Math.max(DIFFICULTY_RANGE.min, value));

export const evaluateDifficultyValue = (variables: DifficultyVariables) => {
  const { a, b, c, d, e, f } = DIFFICULTY_THERMOMETER.formula.coefficients;
  const value =
    variables.time_minutes * a +
    variables.waves_cleared * b +
    variables.player_level * c +
    variables.active_objectives * d +
    variables.challenge_modifiers * e +
    variables.heat_stacks * f;
  return DIFFICULTY_THERMOMETER.formula.clamp_to_range
    ? clampDifficultyValue(value)
    : value;
};

export const getDifficultyIntensity = (value: number) => value / 5;

export const getDifficultyLevel = (value: number) =>
  Math.max(1, Math.floor(value / 5) + 1);

export const DIFFICULTY_TIERS = DIFFICULTY_THERMOMETER.states.map((state) => ({
  id: state.id,
  label: state.label_en,
  labels: { en: state.label_en, es: state.label_es },
  threshold: state.range.min,
  color: state.ui?.color_hex ?? "#ffffff",
  range: state.range,
})) as const;

export type DifficultyTier = (typeof DIFFICULTY_TIERS)[number];

export const getDifficultyTierIndex = (value: number) => {
  const clampedValue = clampDifficultyValue(value);
  let tierIndex = 0;
  for (let i = 0; i < DIFFICULTY_TIERS.length; i++) {
    const tier = DIFFICULTY_TIERS[i];
    const isLast = i === DIFFICULTY_TIERS.length - 1;
    const min = tier.range.min;
    const max = tier.range.max;
    if (
      clampedValue >= min &&
      (clampedValue < max || (isLast && clampedValue <= max))
    ) {
      tierIndex = i;
      break;
    }
  }
  return tierIndex;
};

export const getTierProgress = (
  value: number,
  tier: DifficultyTier,
  nextTier: DifficultyTier | undefined,
) => {
  if (!nextTier) {
    const span = Math.max(1, tier.range.max - tier.range.min);
    return Math.min(1, Math.max(0, (value - tier.range.min) / span));
  }
  const end = nextTier.range.min;
  const span = Math.max(1, end - tier.range.min);
  return Math.min(1, Math.max(0, (value - tier.range.min) / span));
};

export const hexToRgba = (hex: string, alpha: number) => {
  if (!hex.startsWith("#")) {
    return hex;
  }

  const normalized = hex.slice(1);

  if (normalized.length !== 6 && normalized.length !== 3) {
    return hex;
  }

  const expand = (value: string) => (value.length === 1 ? value + value : value);
  const r = parseInt(
    expand(normalized.slice(0, normalized.length === 3 ? 1 : 2)),
    16,
  );
  const g = parseInt(
    expand(
      normalized.slice(
        normalized.length === 3 ? 1 : 2,
        normalized.length === 3 ? 2 : 4,
      ),
    ),
    16,
  );
  const b = parseInt(expand(normalized.slice(normalized.length === 3 ? 2 : 4)), 16);

  if ([r, g, b].some((component) => Number.isNaN(component))) {
    return hex;
  }

  const clampedAlpha = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
};

export type Bounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type BossPortalStatus =
  | "awaitingActivation"
  | "activating"
  | "spawningBoss"
  | "sealed"
  | "open";

export type GamePortal = {
  x: number;
  y: number;
  rad: number;
  type: PortalType;
  active: boolean;
  activated?: boolean;
  spawnTime: number;
  status?: BossPortalStatus;
  activationProgress?: number;
  activationHoldSeconds?: number;
  bossSpawnAt?: number | null;
  interactable?: boolean;
};
