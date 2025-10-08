import type { Upgrade } from "./types";

export type GameStage =
  | { stage: "boot"; progress: number }
  | { stage: "start_menu"; canContinue: boolean }
  | { stage: "tutorial"; step: number; steps: TutorialStep[] }
  | {
      stage: "gameplay";
      substate: "running" | "paused" | "gameover";
      stats: GameplayStats;
      wave: WaveState;
      resources: ResourceState;
      countdown: number | null;
      levelUp: LevelUpState | null;
      activeEvent: EnvironmentalEvent | null;
      notifications: DropNotification[];
    }
  | { stage: "results"; summary: RunSummary };

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  tip?: string;
}

export interface GameplayStats {
  time: number;
  score: number;
  kills: number;
  level: number;
  dpsEstimate: number;
}

export interface WaveState {
  index: number;
  progress: number;
  goal: number;
  bossCountdown: number;
}

export interface ResourceState {
  hp: number;
  maxHp: number;
  shield: number;
  xp: number;
  xpGoal: number;
  credits: number;
}

export interface LevelUpState {
  options: Upgrade[];
  pendingSynergy?: string;
}

export interface EnvironmentalEvent {
  id: "storm" | "fog" | "hazard" | "blessing";
  label: string;
  duration: number;
  intensity: number;
}

export interface DropNotification {
  id: string;
  label: string;
  rarity: string;
  ttl: number;
}

export interface RunSummary {
  wave: number;
  time: number;
  kills: number;
  score: number;
  creditsEarned: number;
}

export type GameAction =
  | { type: "BOOT_PROGRESS"; value: number }
  | { type: "BOOT_COMPLETE" }
  | { type: "START_NEW_RUN" }
  | { type: "CONTINUE_RUN" }
  | { type: "ADVANCE_TUTORIAL" }
  | { type: "SKIP_TUTORIAL" }
  | { type: "ENTER_GAMEPLAY" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "SET_COUNTDOWN"; value: number | null }
  | { type: "TICK"; delta: number }
  | { type: "QUEUE_LEVEL_UP"; options: Upgrade[]; pendingSynergy?: string }
  | { type: "RESOLVE_LEVEL_UP"; chosen: Upgrade }
  | { type: "REGISTER_EVENT"; event: EnvironmentalEvent | null }
  | { type: "PUSH_NOTIFICATION"; payload: DropNotification }
  | { type: "TICK_NOTIFICATIONS"; delta: number }
  | { type: "GAME_OVER" }
  | { type: "FINISH_RUN" }
  | { type: "RETURN_TO_MENU" };

export const initialTutorial: TutorialStep[] = [
  {
    id: "movement",
    title: "Movimiento y esquiva",
    description: "Mueve al sobreviviente con WASD o stick izquierdo. Mantén la distancia para generar DPS constante.",
    tip: "El aim asistido inteligente prioriza amenazas según vulnerabilidad y distancia.",
  },
  {
    id: "loot",
    title: "Loot y sinergias",
    description: "Recolecta XP y elige entre tomos e ítems sin duplicados. Combinar etiquetas desbloquea sinergias únicas.",
    tip: "Máximo 3 tomos activos: piensa en rutas ofensivas y defensivas.",
  },
  {
    id: "waves",
    title: "Waves dinámicas",
    description: "Cada ola ajusta velocidad, daño y eventos climáticos. Prepárate para bosses a partir de la wave 10.",
    tip: "Usa la tienda entre waves para invertir esencia y anticipar mutadores.",
  },
];

export const initialGameplayState = (): Extract<GameStage, { stage: "gameplay" }> => ({
  stage: "gameplay",
  substate: "running",
  stats: { time: 0, score: 0, kills: 0, level: 1, dpsEstimate: 1200 },
  wave: { index: 1, progress: 0, goal: 60, bossCountdown: 9 },
  resources: { hp: 120, maxHp: 120, shield: 40, xp: 0, xpGoal: 120, credits: 0 },
  countdown: null,
  levelUp: null,
  activeEvent: null,
  notifications: [],
});

export const initialGameState: GameStage = {
  stage: "boot",
  progress: 0,
};

export function gameReducer(state: GameStage, action: GameAction): GameStage {
  switch (state.stage) {
    case "boot":
      if (action.type === "BOOT_PROGRESS") {
        return { stage: "boot", progress: Math.min(1, action.value) };
      }
      if (action.type === "BOOT_COMPLETE") {
        return { stage: "start_menu", canContinue: false };
      }
      return state;
    case "start_menu":
      if (action.type === "START_NEW_RUN") {
        return { stage: "tutorial", step: 0, steps: initialTutorial };
      }
      if (action.type === "CONTINUE_RUN") {
        return initialGameplayState();
      }
      return state;
    case "tutorial":
      if (action.type === "ADVANCE_TUTORIAL") {
        const next = state.step + 1;
        if (next >= state.steps.length) {
          return initialGameplayState();
        }
        return { ...state, step: next };
      }
      if (action.type === "SKIP_TUTORIAL") {
        return initialGameplayState();
      }
      return state;
    case "gameplay": {
      switch (action.type) {
        case "PAUSE":
          return { ...state, substate: "paused" };
        case "RESUME":
          return { ...state, substate: "running", countdown: null };
        case "SET_COUNTDOWN":
          return { ...state, countdown: action.value };
        case "REGISTER_EVENT":
          return { ...state, activeEvent: action.event };
        case "QUEUE_LEVEL_UP":
          return { ...state, substate: "paused", levelUp: { options: action.options, pendingSynergy: action.pendingSynergy } };
        case "RESOLVE_LEVEL_UP": {
          const nextLevel = state.stats.level + 1;
          return {
            ...state,
            substate: "running",
            stats: { ...state.stats, level: nextLevel },
            resources: { ...state.resources, xp: 0, xpGoal: Math.round(state.resources.xpGoal * 1.35) },
            levelUp: null,
            notifications: [
              ...state.notifications,
              {
                id: `level-${nextLevel}`,
                label: `Nivel ${nextLevel} desbloqueado`,
                rarity: action.chosen.rarity,
                ttl: 3,
              },
            ],
          };
        }
        case "PUSH_NOTIFICATION":
          return { ...state, notifications: [...state.notifications, action.payload] };
        case "TICK_NOTIFICATIONS":
          return {
            ...state,
            notifications: state.notifications
              .map((n) => ({ ...n, ttl: n.ttl - action.delta }))
              .filter((n) => n.ttl > 0),
          };
        case "TICK": {
          if (state.substate !== "running") return state;
          const delta = action.delta;
          const time = state.stats.time + delta;
          const xpGain = Math.max(5, Math.round(18 - state.wave.index));
          const xp = state.resources.xp + xpGain;
          const score = state.stats.score + 25;
          const kills = state.stats.kills + Math.round(1 + state.wave.index * 0.3);
          const waveProgressIncrement = Math.min(1, state.wave.progress + delta / state.wave.goal);
          let wave = { ...state.wave, progress: waveProgressIncrement };
          let resources = { ...state.resources, xp, credits: state.resources.credits + 2, xpGoal: state.resources.xpGoal };
          let levelUp = state.levelUp;
          let notifications = state.notifications;
          let activeEvent = state.activeEvent;
          let substate = state.substate;

          if (wave.progress >= 1) {
            const nextIndex = state.wave.index + 1;
            wave = {
              index: nextIndex,
              progress: 0,
              goal: Math.round(state.wave.goal * 1.2),
              bossCountdown: Math.max(0, state.wave.bossCountdown - 1),
            };
            notifications = [
              ...notifications,
              {
                id: `wave-${nextIndex}`,
                label: `Wave ${nextIndex} alcanzada`,
                rarity: nextIndex % 5 === 0 ? "epic" : "rare",
                ttl: 4,
              },
            ];
            if (!activeEvent || activeEvent.duration <= 0) {
              activeEvent = maybeSpawnEvent(nextIndex);
            }
          }

          if (activeEvent) {
            activeEvent = { ...activeEvent, duration: activeEvent.duration - delta };
            if (activeEvent.duration <= 0) {
              activeEvent = null;
            }
          }

          const eventPressure = activeEvent ? 1.35 : 1;
          const incomingDamage = Math.max(0, Math.round(delta * (0.4 + state.wave.index * 0.15) * eventPressure));
          const passiveRegen = activeEvent?.id === "blessing" ? 3 : 1;
          let shield = resources.shield;
          let hp = resources.hp;
          if (incomingDamage > 0) {
            const absorbed = Math.min(shield, incomingDamage);
            shield -= absorbed;
            hp = Math.max(0, hp - (incomingDamage - absorbed));
          }
          if (hp > 0) {
            hp = Math.min(resources.maxHp, hp + passiveRegen);
          }
          resources = { ...resources, hp, shield };

          if (!levelUp && xp >= resources.xpGoal) {
            levelUp = {
              options: [],
            };
            substate = "paused";
          }

          if (resources.hp <= 0) {
            return { ...state, resources: { ...resources, hp: 0, shield }, substate: "gameover" };
          }

          return {
            ...state,
            substate,
            stats: { ...state.stats, time, score, kills },
            wave,
            resources: { ...resources, xp: levelUp ? resources.xpGoal : xp % resources.xpGoal },
            levelUp,
            notifications,
            activeEvent,
          };
        }
        case "GAME_OVER":
          return { ...state, substate: "gameover" };
        case "FINISH_RUN":
          return {
            stage: "results",
            summary: {
              wave: state.wave.index,
              time: state.stats.time,
              kills: state.stats.kills,
              score: state.stats.score,
              creditsEarned: state.resources.credits,
            },
          };
        case "RETURN_TO_MENU":
          return { stage: "start_menu", canContinue: true };
        default:
          return state;
      }
    }
    case "results":
      if (action.type === "RETURN_TO_MENU") {
        return { stage: "start_menu", canContinue: true };
      }
      return state;
    default:
      return state;
  }
}

function maybeSpawnEvent(waveIndex: number): EnvironmentalEvent | null {
  if (waveIndex < 3) return null;
  const roll = (waveIndex * 13) % 100;
  if (roll % 3 === 0) {
    return {
      id: "storm",
      label: "Tormenta de plasma",
      duration: 25,
      intensity: 0.7,
    };
  }
  if (roll % 5 === 0) {
    return {
      id: "fog",
      label: "Niebla tóxica",
      duration: 30,
      intensity: 0.5,
    };
  }
  if (roll % 7 === 0) {
    return {
      id: "hazard",
      label: "Zona peligrosa",
      duration: 20,
      intensity: 0.6,
    };
  }
  if (roll % 11 === 0) {
    return {
      id: "blessing",
      label: "Nodo de esencia",
      duration: 18,
      intensity: 0.8,
    };
  }
  return null;
}
