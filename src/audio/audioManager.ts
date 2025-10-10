const DEFAULT_SFX_COOLDOWN_MS = 120;

export type SfxKey =
  | "hit"
  | "level_up"
  | "pickup"
  | "death"
  | "weapon_pistol"
  | "weapon_shotgun"
  | "weapon_smg"
  | "weapon_minigun"
  | "weapon_rpg"
  | "weapon_laser_1"
  | "weapon_laser_2"
  | "weapon_laser_3"
  | "weapon_laser_4"
  | "weapon_railgun"
  | "weapon_flamethrower"
  | "weapon_bow"
  | "weapon_homing_missile";

type DuplicateStrategy = "drop" | "attenuate";

type SfxDefinition = {
  url?: string;
  dataUrl?: string;
  cooldownMs?: number;
  duplicateStrategy?: DuplicateStrategy;
  attenuation?: number;
  loop?: boolean;
};

type PlaySfxOptions = {
  volume?: number;
  playbackRate?: number;
};

type MusicChannel = "background" | "gameOver";

type MusicEvent = "ended" | "play" | "pause";

type MusicListener = () => void;

type PooledSource = {
  source: AudioBufferSourceNode;
  gain: GainNode;
};

const SFX_DATA: Partial<Record<SfxKey, string>> = {
  hit:
    "data:audio/wav;base64,UklGRqQCAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YYACAAB/jpyqtb/GyszKxr+1qpyOf3BiVEk/ODQzNDg/SVRi" +
    "cH+OnKq1v8bKzMrGv7WqnI5/cGJUST84NDM0OD9JVGJwf46cqrW/xsrMysa/taqcjn9wYlRJPzg0MzQ4P0lUYnB/jpyqtb/GyszKxr+1qpyOf3BiVEk/ODQzNDg/SVRi" +
    "cH+OnKq1v8bKzMrGv7WqnI5/cGJUST84NDM0OD9JVGJwf46cqrW/xsrMysa/taqcjn9wYlRJPzg0MzQ4P0lUYnB/jpyqtb/GyszKxr+1qpyOf3BiVEk/ODQzNDg/SVRi" +
    "cH+OnKq1v8bKzMrGv7WqnI5/cGJUST84NDM0OD9JVGJwf46cqrW/xsrMysa/taqcjn9wYlRJPzg0MzQ4P0lUYnB/jpyqtb/GyszKxr+1qpyOf3BiVEk/ODQzNDg/SVRi" +
    "cH+OnKq1v8bKzMrGv7WqnI5/cGJUST84NDM0OD9JVGJwf46cqrW/xsrMysa/taqcjn9wYlRJPzg0MzQ4P0lUYnB/jpyqtb/GyszKxr+1qpyOf3BiVEk/ODQzNDg/SVRi" +
    "cH+OnKq1v8bKzMrGv7WqnI5/cGJUST84NDM0OD9JVGJw",
  level_up:
    "data:audio/wav;base64,UklGRtQEAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YbAEAAB/n7jEwrGVdFZBOUFWdJWxwsS4n39fRjo8TWmKqL3FvaiKaU08OkZff5+" +
    "4xMKxlXRWQTlBVnSVscLEuJ9/X0Y6PE1piqi9xb2oimlNPDpGX3+fuMTCsZV0VkE5QVZ0lbHCxLiff19GOjxNaYqovcW9qIppTTw6Rl9/n7jEwrGVdFZBOUFWdJWxwsS" +
    "4n39fRjo8TWmKqL3FvaiKaU08OkZff5+4xMKxlXRWQTlBVnSVscLEuJ9/X0Y6PE1piqi9xb2oimlNPDpGX3+fuMTCsZV0VkE5QVZ0lbHCxLiff19GOjxNaYqovcW9qIp" +
    "pTTw6Rl9/n7jEwrGVdFZBOUFWdJWxwsS4n39fRjo8TWmKqL3FvaiKaU08OkZff5+4xMKxlXRWQTlBVnSVscLEuJ9/X0Y6PE1piqi9xb2oimlNPDpGX3+fuMTCsZV0VkE" +
    "5QVZ0lbHCxLiff19GOjxNaYqovcW9qIppTTw6Rl9/n7jEwrGVdFZBOUFWdJWxwsS4n39fRjo8TWmKqL3FvaiKaU08OkZff5+4xMKxlXRWQTlBVnSVscLEuJ9/X0Y6PE1" +
    "piqi9xb2oimlNPDpGX3+fuMTCsZV0VkE5QVZ0lbHCxLiff19GOjxNaYqovcW9qIppTTw6Rl8=",
  pickup:
    "data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAAB/q7idbUpMcqG4qHpRR2WVtrCIWkZaiLC2lWVHUXqouKFyTEptnbirf1NGYZG0soxdRlaErbeZaUhOdqS4pHZOSGmZt62EVkZdjLK0kWFGU3+ruJ1tSkxyobioelFHZZW2sIhaRlqIsLaVZUdReqi4oXJMSm2duKt/U0ZhkbSyjF1GVoStt5lpSE52pLikdk5IaZm3rYRWRl2MsrSRYUZT",
  death:
    "data:audio/wav;base64,UklGRvQHAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YdAHAAB/i5ahq7W9xMrO0dLRz8vGv7euo5mNgnZqX1VLQzs1MS4sLC4yNz5FTlhjbnqGkZynsbrByM3Q0tLQzcjCu7KonpKHe29kWU9GPjgyLy0sLTA1OkJKVF5pdYCMl6Kttr7Fy8/R0tHPy8W+tq2il4yAdWleVEpCOjUwLSwtLzI4PkZPWWRve4eSnqiyu8LIzdDS0tDNyMG6saeckYZ6bmNYTkU+NzIuLCwuMTU7Q0tVX2p2go2Zo663v8bLz9HS0c7KxL21q6GWi39zaF1TSUE6NDAtLC0vMzg/R1BbZXF8iJSfqbO7w8nN0NLS0MzHwLmwppuQhHhtYldNRD02MS4sLC4xNjxDTFZgbHeDj5qlr7jAxszP0dLRzsnEvLSqoJWJfnJnXFFIQDkzLy0sLS8zOUBIUVxncn6JlaCqtLzEyc7R0tHPzMbAuK+lmo+Dd2xgVkxDPDYxLiwsLjE2PURNV2JteISQm6awucDHzNDS0tDNycO7s6mflIh8cWVbUEc/ODMvLSwtMDQ6QUlTXWhzf4uWoau1vcTKztHS0c/Lxr+3rqOZjYJ2al9VS0M7NTEuLCwuMjc+RU5YY256hpGcp7G6wcjN0NLS0M3IwruyqJ6Sh3tvZFlPRj44Mi8tLC0wNTpCSlReaXWAjJeirba+xcvP0dLRz8vFvratopeMgHVpXlRKQjo1MC0sLS8yOD5GT1lkb3uHkp6osrvCyM3Q0tLQzcjBurGnnJGGem5jWE5FPjcyLiwsLjE1O0NLVV9qdoKNmaOut7/Gy8/R0tHOysS9tauhlot/c2hdU0lBOjQwLSwtLzM4P0dQW2VxfIiUn6mzu8PJzdDS0tDMx8C5sKabkIR4bWJXTUQ9NjEuLCwuMTY8Q0xWYGx3g4+apa+4wMbMz9HS0c7JxLy0qqCViX5yZ1xRSEA5My8tLC0vMzlASFFcZ3J+iZWgqrS8xMnO0dLRz8zGwLivpZqPg3dsYFZMQzw2MS4sLC4xNj1ETVdibXiEkJumsLnAx8zQ0tLQzcnDu7Opn5SIfHFlW1BHPzgzLy0sLTA0OkFJU11ocw==",
};

const SFX_DEFINITIONS: Record<SfxKey, SfxDefinition> = {
  hit: {
    dataUrl: SFX_DATA.hit,
    cooldownMs: 90,
    duplicateStrategy: "drop",
  },
  level_up: {
    dataUrl: SFX_DATA.level_up,
    cooldownMs: 500,
    duplicateStrategy: "drop",
  },
  pickup: {
    dataUrl: SFX_DATA.pickup,
    cooldownMs: 200,
    duplicateStrategy: "attenuate",
    attenuation: 0.5,
  },
  death: {
    dataUrl: SFX_DATA.death,
    cooldownMs: 800,
    duplicateStrategy: "drop",
  },
  weapon_pistol: {
    url: "/audio/weapons/pistol.wav",
    cooldownMs: 60,
    duplicateStrategy: "drop",
  },
  weapon_shotgun: {
    url: "/audio/weapons/shotgun.wav",
    cooldownMs: 160,
    duplicateStrategy: "drop",
  },
  weapon_smg: {
    url: "/audio/weapons/smg.wav",
    cooldownMs: 0,
    duplicateStrategy: "drop",
    loop: true,
  },
  weapon_minigun: {
    url: "/audio/weapons/mini.mp3",
    cooldownMs: 0,
    duplicateStrategy: "drop",
    loop: true,
  },
  weapon_rpg: {
    url: "/audio/weapons/rpg.wav",
    cooldownMs: 200,
    duplicateStrategy: "drop",
  },
  weapon_laser_1: {
    url: "/audio/weapons/laser%20gun%201.wav",
    cooldownMs: 45,
    duplicateStrategy: "attenuate",
    attenuation: 0.4,
  },
  weapon_laser_2: {
    url: "/audio/weapons/laser%20gun%202.wav",
    cooldownMs: 45,
    duplicateStrategy: "attenuate",
    attenuation: 0.4,
  },
  weapon_laser_3: {
    url: "/audio/weapons/laser%20gun%203.wav",
    cooldownMs: 45,
    duplicateStrategy: "attenuate",
    attenuation: 0.4,
  },
  weapon_laser_4: {
    url: "/audio/weapons/laser%20gun%204.wav",
    cooldownMs: 45,
    duplicateStrategy: "attenuate",
    attenuation: 0.4,
  },
  weapon_railgun: {
    url: "/audio/weapons/railgun.wav",
    cooldownMs: 250,
    duplicateStrategy: "drop",
  },
  weapon_flamethrower: {
    url: "/audio/weapons/flamethrower.wav",
    cooldownMs: 0,
    duplicateStrategy: "drop",
    loop: true,
  },
  weapon_bow: {
    url: "/audio/weapons/bow.wav",
    cooldownMs: 120,
    duplicateStrategy: "drop",
  },
  weapon_homing_missile: {
    url: "/audio/weapons/homingmissle.wav",
    cooldownMs: 180,
    duplicateStrategy: "drop",
  },
};

class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private sfxBuffers = new Map<SfxKey, AudioBuffer>();
  private sfxLastPlay = new Map<SfxKey, number>();
  private sourcePool: PooledSource[] = [];
  private activeLoopingSources = new Map<SfxKey, PooledSource>();
  private sfxMuted = false;
  private sfxVolume = 1;

  private musicChannels = new Map<MusicChannel, HTMLAudioElement>();
  private musicVolume = new Map<MusicChannel, number>();
  private musicMuted = new Map<MusicChannel, boolean>();
  private musicListeners = new Map<
    MusicChannel,
    Map<MusicEvent, Set<MusicListener>>
  >();

  initialize() {
    if (this.audioContext) return;
    try {
      const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as {
        new (): AudioContext;
      } | undefined;
      if (!Ctor) return;
      const ctx = new Ctor();
      const masterGain = ctx.createGain();
      masterGain.gain.value = 1;
      masterGain.connect(ctx.destination);

      const sfxGain = ctx.createGain();
      sfxGain.connect(masterGain);

      this.audioContext = ctx;
      this.masterGain = masterGain;
      this.sfxGain = sfxGain;
    } catch (error) {
      console.warn("Failed to initialize AudioContext", error);
    }
  }

  async resumeContext() {
    if (!this.audioContext) return;
    if (this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn("Failed to resume audio context", error);
      }
    }
  }

  async preloadAllSfx() {
    const keys = Object.keys(SFX_DEFINITIONS) as SfxKey[];
    await Promise.all(keys.map((key) => this.loadSfxBuffer(key).catch(() => {})));
  }

  private async loadSfxBuffer(key: SfxKey) {
    if (this.sfxBuffers.has(key)) return this.sfxBuffers.get(key)!;
    this.initialize();
    if (!this.audioContext) return null;
    const definition = SFX_DEFINITIONS[key];
    if (!definition) return null;

    let arrayBuffer: ArrayBuffer | null = null;
    if (definition.dataUrl) {
      arrayBuffer = this.decodeDataUrl(definition.dataUrl);
    } else if (definition.url) {
      const response = await fetch(definition.url);
      arrayBuffer = await response.arrayBuffer();
    }

    if (!arrayBuffer) return null;

    const buffer = await this.audioContext.decodeAudioData(
      arrayBuffer.slice(0),
    );
    this.sfxBuffers.set(key, buffer);
    return buffer;
  }

  async playSfx(key: SfxKey, options: PlaySfxOptions = {}) {
    if (this.sfxMuted) return;
    this.initialize();
    const ctx = this.audioContext;
    const sfxGain = this.sfxGain;
    if (!ctx || !sfxGain) return;

    const definition = SFX_DEFINITIONS[key];
    if (!definition) return;

    const now = performance.now();
    const cooldown = definition.cooldownMs ?? DEFAULT_SFX_COOLDOWN_MS;
    let effectiveVolume = options.volume ?? 1;

    if (definition.loop) {
      const existing = this.activeLoopingSources.get(key);
      if (existing) {
        existing.gain.gain.value = effectiveVolume * this.sfxVolume;
        if (options.playbackRate !== undefined) {
          existing.source.playbackRate.value = options.playbackRate;
        }
        this.sfxLastPlay.set(key, now);
        return;
      }
    } else {
      const last = this.sfxLastPlay.get(key) ?? 0;
      if (cooldown > 0 && now - last < cooldown) {
        if (definition.duplicateStrategy === "drop") {
          return;
        }
        if (definition.duplicateStrategy === "attenuate") {
          const attenuation = definition.attenuation ?? 0.3;
          effectiveVolume *= attenuation;
          if (effectiveVolume <= 0.001) {
            return;
          }
        }
      }
    }

    const buffer = (await this.loadSfxBuffer(key)) ?? this.sfxBuffers.get(key);
    if (!buffer) return;

    await this.resumeContext();

    const wrapper = this.acquireSource();
    wrapper.source.buffer = buffer;
    wrapper.source.playbackRate.value = options.playbackRate ?? 1;
    wrapper.source.loop = !!definition.loop;
    wrapper.gain.gain.value = effectiveVolume * this.sfxVolume;

    wrapper.source.onended = () => {
      if (definition.loop) {
        this.activeLoopingSources.delete(key);
      }
      this.releaseSource(wrapper);
    };

    try {
      wrapper.source.start();
      this.sfxLastPlay.set(key, now);
      if (definition.loop) {
        this.activeLoopingSources.set(key, wrapper);
      }
    } catch (error) {
      console.warn("Failed to play SFX", key, error);
      this.releaseSource(wrapper);
    }
  }

  stopSfx(key: SfxKey) {
    const active = this.activeLoopingSources.get(key);
    if (!active) return;
    this.activeLoopingSources.delete(key);
    this.sfxLastPlay.delete(key);
    try {
      active.source.stop();
    } catch {}
  }

  isLoopingSfxPlaying(key: SfxKey) {
    return this.activeLoopingSources.has(key);
  }

  private acquireSource(): PooledSource {
    if (!this.audioContext || !this.sfxGain) {
      throw new Error("Audio context not initialized");
    }
    const ctx = this.audioContext;

    const pooled = this.sourcePool.pop();
    if (pooled) {
      try {
        pooled.source.disconnect();
      } catch {}
      pooled.source = ctx.createBufferSource();
      pooled.source.connect(pooled.gain);
      return pooled;
    }

    const gain = ctx.createGain();
    gain.connect(this.sfxGain);
    const source = ctx.createBufferSource();
    source.connect(gain);
    return { source, gain };
  }

  private releaseSource(wrapper: PooledSource) {
    if (!this.audioContext) return;
    try {
      wrapper.source.onended = null;
      wrapper.source.disconnect();
    } catch {}
    wrapper.source = this.audioContext.createBufferSource();
    wrapper.source.connect(wrapper.gain);
    this.sourcePool.push(wrapper);
  }

  setSfxMuted(muted: boolean) {
    this.sfxMuted = muted;
    if (this.sfxGain) {
      this.sfxGain.gain.value = muted ? 0 : this.sfxVolume;
    }
  }

  setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain && !this.sfxMuted) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }

  private getMusicChannel(channel: MusicChannel) {
    let element = this.musicChannels.get(channel);
    if (!element) {
      element = new Audio();
      element.loop = false;
      element.addEventListener("ended", () => this.emitMusicEvent(channel, "ended"));
      element.addEventListener("play", () => this.emitMusicEvent(channel, "play"));
      element.addEventListener("pause", () => this.emitMusicEvent(channel, "pause"));
      this.musicChannels.set(channel, element);
      this.musicVolume.set(channel, 1);
      this.musicMuted.set(channel, false);
    }
    return element;
  }

  addMusicEventListener(
    channel: MusicChannel,
    event: MusicEvent,
    listener: MusicListener,
  ) {
    const map = this.musicListeners.get(channel) ?? new Map();
    if (!this.musicListeners.has(channel)) {
      this.musicListeners.set(channel, map);
    }
    const set = map.get(event) ?? new Set();
    set.add(listener);
    map.set(event, set);
    return () => {
      const storedMap = this.musicListeners.get(channel);
      const storedSet = storedMap?.get(event);
      storedSet?.delete(listener);
    };
  }

  private emitMusicEvent(channel: MusicChannel, event: MusicEvent) {
    const listeners = this.musicListeners.get(channel)?.get(event);
    if (!listeners) return;
    listeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error("Music listener error", error);
      }
    });
  }

  async playMusic(
    channel: MusicChannel,
    src: string,
    options: { resetPosition?: boolean; loop?: boolean } = {},
  ) {
    const element = this.getMusicChannel(channel);
    if (options.loop !== undefined) {
      element.loop = options.loop;
    }
    if (options.resetPosition) {
      element.currentTime = 0;
    }
    if (!element.src || !element.src.includes(src)) {
      element.src = src;
    }
    this.applyMusicVolume(channel);
    try {
      await element.play();
    } catch (error) {
      throw error;
    }
  }

  async resumeMusic(channel: MusicChannel) {
    const element = this.getMusicChannel(channel);
    this.applyMusicVolume(channel);
    try {
      await element.play();
    } catch (error) {
      throw error;
    }
  }

  pauseMusic(channel: MusicChannel) {
    const element = this.musicChannels.get(channel);
    element?.pause();
  }

  stopMusic(channel: MusicChannel) {
    const element = this.musicChannels.get(channel);
    if (element) {
      element.pause();
      element.currentTime = 0;
    }
  }

  getMusicElement(channel: MusicChannel) {
    return this.getMusicChannel(channel);
  }

  setMusicVolume(channel: MusicChannel, volume: number) {
    this.musicVolume.set(channel, Math.max(0, Math.min(1, volume)));
    this.applyMusicVolume(channel);
  }

  setMusicMuted(channel: MusicChannel, muted: boolean) {
    this.musicMuted.set(channel, muted);
    this.applyMusicVolume(channel);
  }

  private applyMusicVolume(channel: MusicChannel) {
    const element = this.musicChannels.get(channel);
    if (!element) return;
    const volume = this.musicVolume.get(channel) ?? 1;
    const muted = this.musicMuted.get(channel) ?? false;
    element.volume = muted ? 0 : volume;
  }

  private decodeDataUrl(dataUrl: string): ArrayBuffer | null {
    const base64Index = dataUrl.indexOf("base64,");
    if (base64Index === -1) return null;
    const base64 = dataUrl.slice(base64Index + "base64,".length);
    try {
      const binary = atob(base64);
      const buffer = new ArrayBuffer(binary.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < binary.length; i++) {
        view[i] = binary.charCodeAt(i);
      }
      return buffer;
    } catch (error) {
      console.warn("Failed to decode SFX data URI", error);
      return null;
    }
  }
}

export const audioManager = new AudioManager();

export const SFX_KEYS = Object.keys(SFX_DEFINITIONS) as SfxKey[];
