import { useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import { Play, ArrowRight, BookOpen, Settings as SettingsIcon, Sparkles, Pause, Zap, Shield, Heart, Timer, Trophy, Skull, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";

import {
  gameReducer,
  initialGameState,
  type GameStage,
  type EnvironmentalEvent,
} from "@/lib/game/stateMachine";
import { ITEMS, TOMES, WEAPONS, translations } from "@/lib/game/data";
import { ENEMY_ARCHETYPES } from "@/lib/game/blueprint";
import type { Upgrade, Item, Weapon, Tome, Rarity } from "@/lib/game/types";
import {
  velaTheme,
  settingsSections,
  defaultSettings,
  type SettingsValueMap,
} from "@/lib/theme/velaTheme";

const rarityLabels: Record<Rarity, string> = {
  common: "Común",
  uncommon: "Infrecuente",
  rare: "Raro",
  epic: "Épico",
  legendary: "Legendario",
};

const synergyCombos = [
  {
    id: "electricBurst",
    label: "Ráfaga eléctrica",
    predicate: (options: Upgrade[]) =>
      options.some((option) => option.type === "weapon" && (option.data as Weapon).special === "chain") &&
      options.some((option) => option.type === "tome" && (option.data as Tome).effect === "fireRate"),
  },
  {
    id: "piercingStorm",
    label: "Tormenta perforante",
    predicate: (options: Upgrade[]) =>
      options.some((option) => option.type === "weapon" && (option.data as Weapon).special === "pierce") &&
      options.some((option) => option.type === "item" && (option.data as Item).effect === "precisionitem"),
  },
  {
    id: "infernalRush",
    label: "Impulso infernal",
    predicate: (options: Upgrade[]) =>
      options.some((option) => option.type === "weapon" && (option.data as Weapon).special === "fire") &&
      options.some((option) => option.type === "tome" && (option.data as Tome).effect === "speed"),
  },
];

const Index = () => {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [pendingSettings, setPendingSettings] = useState<SettingsValueMap>(defaultSettings);
  const [appliedSettings, setAppliedSettings] = useState<SettingsValueMap>(defaultSettings);

  const settingsDirty = useMemo(
    () => Object.keys(pendingSettings).some((key) => pendingSettings[key] !== appliedSettings[key]),
    [pendingSettings, appliedSettings],
  );

  useEffect(() => {
    if (state.stage !== "boot") return;
    let progress = 0;
    const id = window.setInterval(() => {
      progress = Math.min(1, progress + 0.12);
      dispatch({ type: "BOOT_PROGRESS", value: progress });
      if (progress >= 1) {
        window.clearInterval(id);
        window.setTimeout(() => dispatch({ type: "BOOT_COMPLETE" }), 420);
      }
    }, 260);
    return () => window.clearInterval(id);
  }, [state.stage, dispatch]);

  useEffect(() => {
    if (state.stage !== "gameplay" || state.substate !== "running") return;
    const tick = window.setInterval(() => dispatch({ type: "TICK", delta: 1 }), 1000);
    return () => window.clearInterval(tick);
  }, [state.stage, state.substate, dispatch]);

  const notificationCount = state.stage === "gameplay" ? state.notifications.length : 0;
  useEffect(() => {
    if (state.stage !== "gameplay" || notificationCount === 0) return;
    const id = window.setInterval(() => dispatch({ type: "TICK_NOTIFICATIONS", delta: 0.5 }), 500);
    return () => window.clearInterval(id);
  }, [state.stage, notificationCount, dispatch]);

  useEffect(() => {
    if (state.stage !== "gameplay") return;
    if (state.countdown == null) return;
    if (state.countdown <= 0) {
      dispatch({ type: "RESUME" });
      return;
    }
    const timeout = window.setTimeout(() => dispatch({ type: "SET_COUNTDOWN", value: state.countdown! - 1 }), 1000);
    return () => window.clearTimeout(timeout);
  }, [state.stage, state.countdown, dispatch]);

  const levelUpOptionCount = state.stage === "gameplay" && state.levelUp ? state.levelUp.options.length : undefined;
  useEffect(() => {
    if (state.stage !== "gameplay" || !state.levelUp || state.levelUp.options.length > 0) return;
    const options = generateUpgradeOptions();
    const synergy = detectSynergy(options);
    dispatch({ type: "QUEUE_LEVEL_UP", options, pendingSynergy: synergy });
  }, [state.stage, levelUpOptionCount, dispatch]);

  const handleSettingChange = (key: string, value: SettingsValueMap[string]) => {
    setPendingSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplySettings = () => {
    setAppliedSettings(pendingSettings);
    toast({ description: velaTheme.statesAndMicrocopy.toasts.saved });
  };

  const handleRevertSettings = () => {
    setPendingSettings(appliedSettings);
    toast({ description: "Ajustes revertidos" });
  };

  const handleOpenWikiHint = () => {
    toast({ description: "Abre la wiki desde el menú de pausa durante la run." });
  };

  const handleAccessibilityHint = () => {
    toast({ description: "Configura accesibilidad desde Pausa → Ajustes → Accesibilidad." });
  };

  const t = translations.es;

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
      <NeonBackdrop />

      {state.stage === "boot" && <BootScreen progress={state.progress} />}

      {state.stage === "start_menu" && (
        <StartMenu
          onStart={() => dispatch({ type: "START_NEW_RUN" })}
          onContinue={() => dispatch({ type: "CONTINUE_RUN" })}
          onOpenWiki={handleOpenWikiHint}
          onOpenAccessibility={handleAccessibilityHint}
          canContinue={state.canContinue}
        />
      )}

      {state.stage === "tutorial" && (
        <TutorialOverlay
          step={state.step}
          steps={state.steps}
          onAdvance={() => dispatch({ type: "ADVANCE_TUTORIAL" })}
          onSkip={() => dispatch({ type: "SKIP_TUTORIAL" })}
        />
      )}

      {state.stage === "gameplay" && (
        <>
          <GameSurface
            state={state}
            onPause={() => dispatch({ type: "PAUSE" })}
            onForceGameOver={() => dispatch({ type: "GAME_OVER" })}
          />
          <GameHud
            t={t}
            state={state}
            onPause={() => dispatch({ type: "PAUSE" })}
          />
          {state.substate === "paused" && (
            <PauseOverlay
              countdown={state.countdown}
              pendingSettings={pendingSettings}
              settingsDirty={settingsDirty}
              onSettingChange={handleSettingChange}
              onApply={handleApplySettings}
              onRevert={handleRevertSettings}
              onResume={() => dispatch({ type: "SET_COUNTDOWN", value: 3 })}
            />
          )}
          {state.levelUp && state.levelUp.options.length > 0 && (
            <LevelUpModal
              options={state.levelUp.options}
              pendingSynergy={state.levelUp.pendingSynergy}
              onSelect={(choice) => dispatch({ type: "RESOLVE_LEVEL_UP", chosen: choice })}
            />
          )}
          {state.substate === "gameover" && (
            <GameOverOverlay onContinue={() => dispatch({ type: "FINISH_RUN" })} />
          )}
        </>
      )}

      {state.stage === "results" && (
        <ResultsScreen
          summary={state.summary}
          onReplay={() => dispatch({ type: "START_NEW_RUN" })}
          onMenu={() => dispatch({ type: "RETURN_TO_MENU" })}
        />
      )}

      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-transparent via-transparent to-[#3700ff1a]" />
    </div>
  );
};

const BootScreen = ({ progress }: { progress: number }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/60 backdrop-blur-xl">
    <div className="text-center">
      <p className="text-sm uppercase tracking-[0.4em] text-foreground/70">Vela Digital Systems</p>
      <h1 className="mt-3 text-4xl font-semibold text-foreground">Inicializando Núcleo</h1>
    </div>
    <div className="w-[320px] max-w-[80vw]">
      <Progress value={progress * 100} className="h-3 overflow-visible bg-foreground/10">
        <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-[#3700ff80] via-[#6f00ff70] to-[#00d14080] blur-xl" />
      </Progress>
      <p className="mt-3 text-xs uppercase tracking-[0.3em] text-foreground/70">{Math.round(progress * 100)}% sincronizado</p>
    </div>
  </div>
);

interface StartMenuProps {
  onStart: () => void;
  onContinue: () => void;
  onOpenWiki: () => void;
  onOpenAccessibility: () => void;
  canContinue: boolean;
}

const StartMenu = ({ onStart, onContinue, onOpenWiki, onOpenAccessibility, canContinue }: StartMenuProps) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 text-left">
      <header className="flex flex-col gap-6 text-foreground">
        <div className="inline-flex items-center gap-2 rounded-full border border-foreground/20 bg-foreground/5 px-4 py-2 text-xs uppercase tracking-[0.4em]">
          <Sparkles className="h-4 w-4 text-primary" />
          Neon Tech Survivors
        </div>
        <h1 className="text-5xl font-semibold leading-tight sm:text-6xl">
          Vela Digital Survivors
        </h1>
        <p className="max-w-3xl text-lg text-foreground/80">
          Shooter roguelike estilo arcade con progresión data-driven, meta profunda y herramientas de balance integradas.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border border-foreground/10 bg-black/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-xl font-semibold text-foreground">
              Comienza tu run
              <Badge className="bg-primary/10 text-xs font-semibold uppercase text-primary">120 FPS target</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button className="h-14 text-lg" onClick={onStart}>
              <Play className="mr-2 h-5 w-5" /> Iniciar Nueva Run
            </Button>
            <Button
              className="h-14 text-lg"
              variant={canContinue ? "secondary" : "ghost"}
              disabled={!canContinue}
              onClick={onContinue}
            >
              <ArrowRight className="mr-2 h-5 w-5" /> Continuar Progresión
            </Button>
            <div className="mt-2 grid gap-3 text-sm text-foreground/80">
              <div className="flex items-center gap-3 rounded-lg border border-foreground/10 bg-foreground/5 p-3">
                <Zap className="h-5 w-5 text-primary" />
                Sistema modular de armas con aim inteligente configurable en runtime.
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-foreground/10 bg-foreground/5 p-3">
                <Shield className="h-5 w-5 text-[#00d140]" />
                Eventos climáticos, bosses y mutadores ligados a waves.
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-foreground/10 bg-foreground/5 p-3">
                <BookOpen className="h-5 w-5 text-[#6f00ff]" />
                Wiki integrada y herramientas de balance para el equipo de diseño.
              </div>
            </div>
          </CardContent>
        </Card>

        <aside className="flex flex-col gap-4">
          <Card className="border border-foreground/10 bg-black/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-foreground">Experiencia Vela</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-foreground/80">
              <p>
                · Meta progresión con árbol de talentos y tienda entre waves.
              </p>
              <p>
                · Dashboard de balance con DPS, TTK y heatmaps en tiempo real.
              </p>
              <p>
                · Telemetría y pruebas automáticas listas para CI/CD.
              </p>
            </CardContent>
          </Card>
          <Button variant="ghost" className="justify-start gap-2 text-sm uppercase tracking-[0.3em]" onClick={onOpenWiki}>
            <BookOpen className="h-4 w-4" /> Abrir Wiki de diseño
          </Button>
          <Button
            variant="ghost"
            className="justify-start gap-2 text-sm uppercase tracking-[0.3em]"
            onClick={onOpenAccessibility}
          >
            <SettingsIcon className="h-4 w-4" /> Ajustes de accesibilidad
          </Button>
        </aside>
      </div>
    </div>
  </div>
);

interface TutorialOverlayProps {
  step: number;
  steps: typeof initialTutorial;
  onAdvance: () => void;
  onSkip: () => void;
}

const TutorialOverlay = ({ step, steps, onAdvance, onSkip }: TutorialOverlayProps) => {
  const current = steps[step];
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xl">
      <Card className="w-full max-w-3xl border border-foreground/20 bg-neutral-900/90 text-left text-foreground">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Tutorial — Paso {step + 1} / {steps.length}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="text-lg font-semibold text-primary">{current.title}</p>
            <p className="mt-2 text-foreground/80">{current.description}</p>
            {current.tip && <p className="mt-3 text-sm text-[#00d140]">Tip: {current.tip}</p>}
          </div>
          <div className="flex items-center justify-between pt-4">
            <Button variant="ghost" onClick={onSkip}>
              Omitir tutorial
            </Button>
            <Button onClick={onAdvance}>
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface GameSurfaceProps {
  state: Extract<GameStage, { stage: "gameplay" }>;
  onPause: () => void;
  onForceGameOver: () => void;
}

const GameSurface = ({ state, onPause, onForceGameOver }: GameSurfaceProps) => (
  <div className="relative flex flex-1 flex-col">
    <div className="pointer-events-none absolute inset-0 z-0 opacity-80">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(55,0,255,0.12),_transparent_60%)]" />
      <div className="absolute inset-10 rounded-3xl border border-foreground/10 bg-black/30 backdrop-blur-lg" />
      <div className="absolute inset-10 rounded-3xl border border-foreground/5" />
      <div className="absolute inset-10 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px] opacity-30" />
      </div>
    </div>

    <div className="relative z-10 flex flex-1 items-end justify-end p-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={onPause}>
          <Pause className="mr-2 h-4 w-4" /> Pausa
        </Button>
        <Button variant="ghost" className="text-xs uppercase tracking-[0.3em]" onClick={onForceGameOver}>
          Forzar Game Over
        </Button>
      </div>
    </div>

    {state.activeEvent && <EventBadge event={state.activeEvent} />}
  </div>
);

const EventBadge = ({ event }: { event: EnvironmentalEvent }) => {
  const palette = {
    storm: "hsl(var(--rarity-rare))",
    fog: "hsl(var(--rarity-epic))",
    hazard: "hsl(var(--rarity-legendary))",
    blessing: "hsl(var(--rarity-uncommon))",
  } as Record<EnvironmentalEvent["id"], string>;
  return (
    <div className="pointer-events-none absolute top-24 left-1/2 z-20 -translate-x-1/2">
      <div
        className="rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.4em]"
        style={{
          borderColor: palette[event.id],
          color: palette[event.id],
          backgroundColor: "rgba(0, 0, 0, 0.35)",
          boxShadow: `0 0 24px ${palette[event.id]}33`,
        }}
      >
        {event.label}
      </div>
    </div>
  );
};

interface GameHudProps {
  t: typeof translations["es"];
  state: Extract<GameStage, { stage: "gameplay" }>;
  onPause: () => void;
}

const GameHud = ({ t, state, onPause }: GameHudProps) => (
  <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
    <div className="flex items-start justify-between px-8 pt-8">
      <div className="flex flex-col gap-3">
        <HudBar
          label="HP"
          value={state.resources.hp}
          max={state.resources.maxHp}
          gradient="linear-gradient(90deg, hsl(var(--color-pixel)), hsl(var(--color-royal)))"
          icon={<Heart className="h-4 w-4 text-[#00d140]" />}
        />
        <HudBar
          label="Shield"
          value={state.resources.shield}
          max={60}
          gradient="linear-gradient(90deg, hsl(var(--damage-shield)), hsl(var(--color-sapphire)))"
          icon={<Shield className="h-4 w-4 text-[#ffd867]" />}
        />
      </div>
      <div className="flex flex-col items-center gap-3">
        <HudBar
          label={t.level}
          value={state.stats.level}
          max={Math.max(1, state.stats.level)}
          gradient="linear-gradient(90deg, hsl(var(--damage-xp)), hsl(var(--color-royal)))"
          icon={<Star className="h-4 w-4 text-[#6a5cff]" />}
          isDiscrete
        />
        <HudBar
          label="XP"
          value={state.resources.xp}
          max={state.resources.xpGoal}
          gradient="linear-gradient(90deg, hsl(var(--damage-xp)), hsl(var(--color-sapphire)))"
          icon={<Sparkles className="h-4 w-4 text-[#6a5cff]" />}
        />
      </div>
      <div className="flex flex-col items-end gap-2 text-right">
        <div className="flex items-center gap-3 rounded-full border border-foreground/20 bg-black/40 px-4 py-2 text-sm font-semibold uppercase tracking-[0.4em] text-foreground/80">
          <Timer className="h-4 w-4 text-primary" />
          {formatTime(state.stats.time)}
        </div>
        <div className="flex gap-3 text-sm text-foreground/80">
          <div className="rounded-lg border border-foreground/15 bg-black/40 px-3 py-2">
            Wave {state.wave.index} · {Math.round(state.wave.progress * 100)}%
          </div>
          <div className="rounded-lg border border-foreground/15 bg-black/40 px-3 py-2">
            Score {state.stats.score.toLocaleString()}
          </div>
        </div>
      </div>
    </div>

    <div className="mt-auto flex items-end justify-between px-8 pb-10">
      <div className="pointer-events-auto flex flex-col gap-3">
        <div className="rounded-2xl border border-foreground/10 bg-black/40 p-4 text-sm text-foreground/80">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground/50">Armas activas</p>
          <div className="mt-2 flex gap-3">
            {WEAPONS.slice(0, 3).map((weapon) => (
              <div
                key={weapon.id}
                className="rounded-xl border border-foreground/20 bg-black/30 px-3 py-2"
                style={{ boxShadow: `0 0 0 1px hsl(var(--rarity-${weapon.rarity}) / 0.2)` }}
              >
                <p className="text-sm font-semibold" style={{ color: `hsl(var(--rarity-${weapon.rarity}))` }}>
                  {weapon.name}
                </p>
                <p className="text-xs text-foreground/60">Daño {weapon.damage} · Cadencia {weapon.fireRate}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 text-xs uppercase tracking-[0.3em] text-foreground/50">
          <span>Tomos activos: 3 máx</span>
          <span>Ítems únicos sin duplicados</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-3">
        <div className="pointer-events-auto flex gap-2">
          <Button variant="secondary" onClick={onPause}>
            <Pause className="mr-2 h-4 w-4" /> Pausa
          </Button>
        </div>
        <div className="flex gap-3 text-sm text-foreground/70">
          <div className="rounded-lg border border-foreground/15 bg-black/40 px-3 py-2">
            Eliminaciones: {state.stats.kills}
          </div>
          <div className="rounded-lg border border-foreground/15 bg-black/40 px-3 py-2">
            DPS estimado: {state.stats.dpsEstimate}
          </div>
        </div>
        <div className="relative h-32 w-32 overflow-hidden rounded-2xl border border-foreground/10 bg-black/50 p-3 text-xs text-foreground/50">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground/40">Minimapa</p>
          <div className="absolute inset-3 rounded-xl border border-foreground/10">
            <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00d140] shadow-[0_0_8px_2px_rgba(0,209,64,0.4)]" />
            <span className="absolute left-1/3 top-1/4 h-2 w-2 rounded-full bg-[#6a5cff] shadow-[0_0_8px_2px_rgba(106,92,255,0.4)]" />
            <span className="absolute right-1/4 bottom-1/3 h-2 w-2 rounded-full bg-[#ffd867] shadow-[0_0_8px_2px_rgba(255,216,103,0.4)]" />
          </div>
        </div>
      </div>
    </div>

    <div className="pointer-events-none absolute bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
      {state.notifications.map((notification) => (
        <div
          key={notification.id}
          className="rounded-full border px-4 py-1 text-sm font-semibold uppercase tracking-[0.3em]"
          style={{
            borderColor: `hsl(var(--rarity-${notification.rarity}))`,
            color: `hsl(var(--rarity-${notification.rarity}))`,
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
        >
          {notification.label}
        </div>
      ))}
    </div>

    {state.countdown != null && (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10rem] font-bold text-foreground/30">
        {state.countdown || 3}
      </div>
    )}
  </div>
);

interface PauseOverlayProps {
  countdown: number | null;
  pendingSettings: SettingsValueMap;
  settingsDirty: boolean;
  onSettingChange: (key: string, value: SettingsValueMap[string]) => void;
  onApply: () => void;
  onRevert: () => void;
  onResume: () => void;
}

const PauseOverlay = ({ countdown, pendingSettings, settingsDirty, onSettingChange, onApply, onRevert, onResume }: PauseOverlayProps) => (
  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-xl">
    <Card className="w-full max-w-5xl border border-foreground/20 bg-neutral-900/90 text-foreground">
      <CardHeader className="flex flex-col gap-2">
        <CardTitle className="flex items-center justify-between text-2xl font-semibold">
          Menú de Pausa
          {countdown != null && <span className="text-sm font-normal text-foreground/60">Resumiendo en {countdown}</span>}
        </CardTitle>
        <p className="text-sm text-foreground/60">Ajusta gráficos, audio, gameplay y accesibilidad sin salir de la run.</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="settings" className="mt-2">
          <TabsList className="mb-4 bg-foreground/10">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="wiki">Wiki</TabsTrigger>
            <TabsTrigger value="credits">Créditos</TabsTrigger>
          </TabsList>
          <TabsContent value="settings" className="space-y-6">
            {settingsSections.map((section) => (
              <div key={section.label} className="rounded-2xl border border-foreground/10 bg-black/30 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm uppercase tracking-[0.4em] text-foreground/60">{section.label}</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {section.controls.map((control) => (
                    <div key={control.key} className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-foreground/80">{control.key}</label>
                      {renderControl(control, pendingSettings, onSettingChange)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-2xl border border-foreground/10 bg-black/40 px-4 py-3">
              <div className="text-sm text-foreground/70">
                {settingsDirty ? "Cambios sin aplicar" : "Configuración aplicada"}
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" disabled={!settingsDirty} onClick={onRevert}>
                  Revertir
                </Button>
                <Button disabled={!settingsDirty} onClick={onApply}>
                  Aplicar
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="wiki">
            <WikiPanel />
          </TabsContent>
          <TabsContent value="credits">
            <CreditsPanel />
          </TabsContent>
        </Tabs>
        <div className="mt-6 flex justify-end">
          <Button onClick={onResume}>
            Reanudar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const WikiPanel = () => (
  <div className="grid gap-6">
    <section>
      <h3 className="mb-2 text-sm uppercase tracking-[0.4em] text-foreground/60">Armas</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {WEAPONS.slice(0, 4).map((weapon) => (
          <WikiCard
            key={weapon.id}
            title={weapon.name}
            subtitle={`${weapon.damage} dmg · ${weapon.fireRate} cadencia`}
            rarity={weapon.rarity}
            description={`Especial: ${weapon.special ?? "N/A"}`}
          />
        ))}
      </div>
    </section>
    <section>
      <h3 className="mb-2 text-sm uppercase tracking-[0.4em] text-foreground/60">Tomos</h3>
      <div className="grid gap-3 md:grid-cols-3">
        {TOMES.slice(0, 6).map((tome) => (
          <WikiCard key={tome.id} title={tome.name} subtitle={tome.description} rarity={tome.rarity} />
        ))}
      </div>
    </section>
    <section>
      <h3 className="mb-2 text-sm uppercase tracking-[0.4em] text-foreground/60">Enemigos</h3>
      <div className="grid gap-3 md:grid-cols-3">
        {Object.values(ENEMY_ARCHETYPES).map((enemy) => (
          <WikiCard
            key={enemy.id}
            title={enemy.displayName}
            subtitle={`HP ${enemy.base.hp} · Vel ${enemy.base.speed}`}
            rarity={enemy.legacyType === "strong" ? "epic" : enemy.legacyType === "explosive" ? "rare" : "common"}
          />
        ))}
      </div>
    </section>
  </div>
);

const CreditsPanel = () => (
  <div className="space-y-4 text-sm text-foreground/70">
    <p>
      Proyecto: <strong>{velaTheme.project}</strong>
    </p>
    <p>
      Meta: {velaTheme.goal}
    </p>
    <Separator className="border-foreground/10" />
    <p>
      Tokenización de colores, tipografía y componentes definida en <code>src/lib/theme/velaTheme.ts</code>. Ajustes en runtime garantizan consistencia visual.
    </p>
    <p>
      Game State Machine: boot → start_menu → tutorial → gameplay (running | paused | gameover) → results.
    </p>
    <p className="text-xs text-foreground/50">UI preparada para gamepad, focus rings y transiciones de 220ms siguiendo guía Vela.</p>
  </div>
);

interface LevelUpModalProps {
  options: Upgrade[];
  pendingSynergy?: string;
  onSelect: (upgrade: Upgrade) => void;
}

const LevelUpModal = ({ options, pendingSynergy, onSelect }: LevelUpModalProps) => (
  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-2xl">
    <Card className="w-full max-w-4xl border border-foreground/20 bg-neutral-900/95 text-foreground">
      <CardHeader>
        <CardTitle className="text-center text-3xl font-semibold uppercase tracking-[0.4em]">{velaTheme.screens.levelUp.title}</CardTitle>
        {pendingSynergy && (
          <p className="mt-2 text-center text-sm text-[#00d140]">Sinergia potencial: {pendingSynergy}</p>
        )}
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {options.map((option) => (
          <button
            key={`${option.type}-${option.data.id}`}
            type="button"
            onClick={() => onSelect(option)}
            className="group relative overflow-hidden rounded-2xl border border-foreground/10 bg-black/40 p-5 text-left transition duration-200 hover:-translate-y-1 hover:border-foreground/30 hover:shadow-[0_0_40px_rgba(111,0,255,0.35)]"
          >
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{ background: "radial-gradient(circle at top, rgba(111,0,255,0.35), transparent 70%)" }}
            />
            <div className="relative flex flex-col gap-3">
              <Badge
                className="border-none text-xs uppercase tracking-[0.3em]"
                style={{ backgroundColor: `hsl(var(--rarity-${option.rarity}))`, color: "#0b0b0b" }}
              >
                {rarityLabels[option.rarity]}
              </Badge>
              <h3 className="text-xl font-semibold">{getUpgradeTitle(option)}</h3>
              <p className="text-sm text-foreground/70">{getUpgradeDescription(option)}</p>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  </div>
);

const GameOverOverlay = ({ onContinue }: { onContinue: () => void }) => (
  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-2xl">
    <Card className="w-full max-w-md border border-foreground/20 bg-neutral-900/95 text-center text-foreground">
      <CardHeader>
        <CardTitle className="text-3xl font-semibold uppercase tracking-[0.4em] text-[#ff3b3b]">Game Over</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground/70">
          El enjambre tomó el control. Analiza el dashboard de balance y ajusta tus builds.
        </p>
        <Button onClick={onContinue} className="w-full">
          Ver resultados
        </Button>
      </CardContent>
    </Card>
  </div>
);

interface ResultsScreenProps {
  summary: { wave: number; time: number; kills: number; score: number; creditsEarned: number };
  onReplay: () => void;
  onMenu: () => void;
}

const ResultsScreen = ({ summary, onReplay, onMenu }: ResultsScreenProps) => (
  <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-2xl">
    <Card className="w-full max-w-4xl border border-foreground/20 bg-neutral-900/95 text-foreground">
      <CardHeader>
        <CardTitle className="text-3xl font-semibold uppercase tracking-[0.4em]">Resultados de la Run</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm text-foreground/70">
            <StatBlock icon={<Skull className="h-5 w-5 text-primary" />} label="Kills" value={summary.kills.toLocaleString()} />
            <StatBlock icon={<Trophy className="h-5 w-5 text-[#ffd867]" />} label="Wave" value={`#${summary.wave}`} />
            <StatBlock icon={<Timer className="h-5 w-5 text-foreground/60" />} label="Tiempo" value={formatTime(summary.time)} />
            <StatBlock icon={<Zap className="h-5 w-5 text-[#00d140]" />} label="Créditos" value={summary.creditsEarned} />
          </div>
          <div className="rounded-2xl border border-foreground/10 bg-black/40 p-4 text-sm text-foreground/70">
            <p>
              Comparte tu build y sincroniza con la telemetría para revisar DPS, TTK y heatmaps desde el dashboard de balance.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Button onClick={onReplay} className="h-14 text-lg">
            Reintentar run
          </Button>
          <Button variant="secondary" onClick={onMenu} className="h-14 text-lg">
            Volver al menú principal
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const WikiCard = ({ title, subtitle, rarity, description }: { title: string; subtitle: string; rarity: Rarity; description?: string }) => (
  <div
    className="rounded-2xl border border-foreground/10 bg-black/30 p-4"
    style={{
      boxShadow: `0 0 24px hsl(var(--rarity-${rarity}) / 0.18)`,
      borderColor: `hsl(var(--rarity-${rarity}))`,
    }}
  >
    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/50">{rarityLabels[rarity]}</p>
    <h4 className="mt-2 text-lg font-semibold">{title}</h4>
    <p className="text-sm text-foreground/70">{subtitle}</p>
    {description && <p className="mt-2 text-xs text-foreground/50">{description}</p>}
  </div>
);

const StatBlock = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-foreground/10 bg-black/40 p-4">
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 bg-black/60">{icon}</div>
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-foreground/50">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  </div>
);

const HudBar = ({
  label,
  value,
  max,
  gradient,
  icon,
  isDiscrete = false,
}: {
  label: string;
  value: number;
  max: number;
  gradient: string;
  icon: React.ReactNode;
  isDiscrete?: boolean;
}) => {
  const percentage = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-[260px] rounded-2xl border border-foreground/10 bg-black/40 p-3">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-foreground/50">
        <span className="flex items-center gap-2 text-foreground/70">
          {icon}
          {label}
        </span>
        <span className="text-foreground/60">{isDiscrete ? value : `${percentage}%`}</span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="absolute inset-0" style={{ background: gradient, width: `${percentage}%` }} />
      </div>
    </div>
  );
};

const NeonBackdrop = () => (
  <div className="pointer-events-none absolute inset-0 -z-10">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(55,0,255,0.35),_transparent_60%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(0,209,64,0.2),_transparent_60%)]" />
  </div>
);

function generateUpgradeOptions(): Upgrade[] {
  const pool: Upgrade[] = [
    ...WEAPONS.map((weapon) => ({ type: "weapon", data: weapon, rarity: weapon.rarity } satisfies Upgrade)),
    ...TOMES.map((tome) => ({ type: "tome", data: tome, rarity: tome.rarity } satisfies Upgrade)),
    ...ITEMS.map((item) => ({ type: "item", data: item, rarity: item.rarity } satisfies Upgrade)),
  ];

  const options: Upgrade[] = [];
  const used = new Set<string>();
  while (options.length < velaTheme.screens.levelUp.choices && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    const [candidate] = pool.splice(index, 1);
    const key = `${candidate.type}-${candidate.data.id}`;
    if (used.has(key)) continue;
    options.push(candidate);
    used.add(key);
  }
  return options;
}

function detectSynergy(options: Upgrade[]): string | undefined {
  const synergy = synergyCombos.find((combo) => combo.predicate(options));
  return synergy?.label;
}

function renderControl(
  control: (typeof settingsSections)[number]["controls"][number],
  values: SettingsValueMap,
  onChange: (key: string, value: SettingsValueMap[string]) => void,
) {
  switch (control.type) {
    case "slider":
      return (
        <div>
          <Slider
            value={[Number(values[control.key]) ?? control.min]}
            min={control.min}
            max={control.max}
            step={control.step}
            onValueChange={(value) => onChange(control.key, value[0])}
          />
          <div className="mt-1 text-xs text-foreground/60">{values[control.key]}</div>
        </div>
      );
    case "toggle":
      return (
        <Switch
          checked={Boolean(values[control.key])}
          onCheckedChange={(checked) => onChange(control.key, checked)}
        />
      );
    case "select":
      return (
        <Select value={String(values[control.key])} onValueChange={(value) => onChange(control.key, value)}>
          <SelectTrigger>
            <SelectValue placeholder={control.options[0]} />
          </SelectTrigger>
          <SelectContent>
            {control.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    default:
      return null;
  }
}

function getUpgradeTitle(upgrade: Upgrade) {
  if (upgrade.type === "weapon") return (upgrade.data as Weapon).name;
  if (upgrade.type === "tome") return (upgrade.data as Tome).name;
  return (upgrade.data as Item).name;
}

function getUpgradeDescription(upgrade: Upgrade) {
  if (upgrade.type === "weapon") {
    const weapon = upgrade.data as Weapon;
    return `Daño ${weapon.damage} · Cadencia ${weapon.fireRate} · Alcance ${weapon.range}`;
  }
  if (upgrade.type === "tome") {
    return (upgrade.data as Tome).description;
  }
  return (upgrade.data as Item).description;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
}

export default Index;
