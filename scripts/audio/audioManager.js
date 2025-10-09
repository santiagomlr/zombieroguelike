// BEGIN edit
const STORAGE_KEYS = {
  sfxVolume: "settings.sfxVolume",
  musicVolume: "settings.musicVolume",
  sfxMuted: "settings.sfxMuted",
  musicMuted: "settings.musicMuted",
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

class AudioManager {
  constructor() {
    this._context = null;
    this._sfxGain = null;
    this._musicGain = null;
    this._sfxVolume = 1;
    this._musicVolume = 1;
    this._sfxMuted = false;
    this._musicMuted = false;

    this._initFromStorage();
    this._ensureContext();
    this._applyAll();
  }

  _ensureContext() {
    if (this._context) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      console.warn("Web Audio API is not supported in this browser.");
      return;
    }

    this._context = new AudioCtx();
    this._sfxGain = this._context.createGain();
    this._musicGain = this._context.createGain();

    this._sfxGain.connect(this._context.destination);
    this._musicGain.connect(this._context.destination);
  }

  unlock() {
    if (!this._context) return;
    if (this._context.state === "suspended") {
      this._context.resume().catch((err) => console.warn("Failed to resume audio context", err));
    }
  }

  _initFromStorage() {
    const storedSfxVolume = Number(localStorage.getItem(STORAGE_KEYS.sfxVolume));
    const storedMusicVolume = Number(localStorage.getItem(STORAGE_KEYS.musicVolume));
    const storedSfxMuted = localStorage.getItem(STORAGE_KEYS.sfxMuted);
    const storedMusicMuted = localStorage.getItem(STORAGE_KEYS.musicMuted);

    if (!Number.isNaN(storedSfxVolume)) {
      this._sfxVolume = clamp(storedSfxVolume / 100, 0, 1);
    }
    if (!Number.isNaN(storedMusicVolume)) {
      this._musicVolume = clamp(storedMusicVolume / 100, 0, 1);
    }
    if (storedSfxMuted != null) {
      this._sfxMuted = storedSfxMuted === "true";
    }
    if (storedMusicMuted != null) {
      this._musicMuted = storedMusicMuted === "true";
    }
  }

  _persist() {
    localStorage.setItem(STORAGE_KEYS.sfxVolume, String(Math.round(this._sfxVolume * 100)));
    localStorage.setItem(STORAGE_KEYS.musicVolume, String(Math.round(this._musicVolume * 100)));
    localStorage.setItem(STORAGE_KEYS.sfxMuted, this._sfxMuted ? "true" : "false");
    localStorage.setItem(STORAGE_KEYS.musicMuted, this._musicMuted ? "true" : "false");
  }

  _applyAll() {
    if (!this._context || !this._sfxGain || !this._musicGain) return;
    this._sfxGain.gain.value = this._sfxMuted ? 0 : this._sfxVolume;
    this._musicGain.gain.value = this._musicMuted ? 0 : this._musicVolume;
  }

  _applyAndPersist() {
    this._applyAll();
    this._persist();
  }

  setSfxVolume(volume) {
    const normalized = clamp(volume, 0, 1);
    this._sfxVolume = normalized;
    this._applyAndPersist();
  }

  setMusicVolume(volume) {
    const normalized = clamp(volume, 0, 1);
    this._musicVolume = normalized;
    this._applyAndPersist();
  }

  setSfxMuted(muted) {
    this._sfxMuted = Boolean(muted);
    this._applyAndPersist();
  }

  setMusicMuted(muted) {
    this._musicMuted = Boolean(muted);
    this._applyAndPersist();
  }

  getSfxVolume() {
    return this._sfxVolume;
  }

  getMusicVolume() {
    return this._musicVolume;
  }

  isSfxMuted() {
    return this._sfxMuted;
  }

  isMusicMuted() {
    return this._musicMuted;
  }

  getSfxGainNode() {
    return this._sfxGain;
  }

  getMusicGainNode() {
    return this._musicGain;
  }
}

const audioManager = new AudioManager();

export function setSfxVolume(volume) {
  audioManager.setSfxVolume(volume);
}

export function setMusicVolume(volume) {
  audioManager.setMusicVolume(volume);
}

export function setSfxMuted(muted) {
  audioManager.setSfxMuted(muted);
}

export function setMusicMuted(muted) {
  audioManager.setMusicMuted(muted);
}

export function getSfxVolume() {
  return audioManager.getSfxVolume();
}

export function getMusicVolume() {
  return audioManager.getMusicVolume();
}

export function isSfxMuted() {
  return audioManager.isSfxMuted();
}

export function isMusicMuted() {
  return audioManager.isMusicMuted();
}

export function unlockAudio() {
  audioManager.unlock();
}

export default audioManager;
// END edit
