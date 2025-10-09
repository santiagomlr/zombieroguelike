// BEGIN edit
import {
  getMusicVolume,
  getSfxVolume,
  isMusicMuted,
  isSfxMuted,
  setMusicMuted,
  setMusicVolume,
  setSfxMuted,
  setSfxVolume,
  unlockAudio,
} from "../audio/audioManager.js";
import gameClock, {
  getElapsedPlayTimeMs,
  resetPlayClock,
  startPlayClock,
  stopPlayClock,
} from "../state/gameClock.js";

const TAB_CONFIG = [
  { id: "main", label: "Main" },
  { id: "settings", label: "Settings" },
  { id: "wiki", label: "Wiki" },
];

const DEFAULT_LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
];

const externalHooks = {
  onPause: null,
  onResume: null,
  confirmQuit: null,
  getWave: null,
  getScore: null,
  getIsPaused: null,
  setPaused: null,
  getLanguage: null,
  setLanguage: null,
  getLanguages: null,
};

let pauseMenuEl = null;
let countdownOverlayEl = null;
let countdownLabelEl = null;
let tabButtons = [];
let tabPanels = new Map();
let isPaused = false;
let isCountdownActive = false;
let statsInterval = null;
let activeTab = "main";
let lastFocusedElement = null;
let countdownTimers = [];
let languageSelectEl = null;
let cachedLanguageOptionsKey = "";
let suppressNextEscape = false;
let lastToggleFromKeyboard = false;

function getGameStateFallback() {
  return (
    window.gameState ||
    window.__gameState ||
    window.state ||
    window.game ||
    null
  );
}

function getWaveValue() {
  if (typeof externalHooks.getWave === "function") {
    return externalHooks.getWave();
  }
  const state = getGameStateFallback();
  const candidate =
    (state &&
      (state.wave ??
        state.currentWave ??
        state.waveNumber ??
        (typeof state.getWave === "function" ? state.getWave() : undefined))) ||
    0;
  return typeof candidate === "number" ? candidate : 0;
}

function getScoreValue() {
  if (typeof externalHooks.getScore === "function") {
    return externalHooks.getScore();
  }
  const state = getGameStateFallback();
  const candidate =
    (state &&
      (state.score ??
        state.currentScore ??
        (typeof state.getScore === "function" ? state.getScore() : undefined))) ||
    0;
  return typeof candidate === "number" ? candidate : 0;
}

function callHook(name, ...args) {
  const fn = externalHooks[name];
  if (typeof fn === "function") {
    return fn(...args);
  }
  const state = getGameStateFallback();
  if (!state) return undefined;
  if (name === "setPaused" && typeof state.setPaused === "function") {
    return state.setPaused(...args);
  }
  if (name === "onPause" && typeof state.pause === "function") {
    return state.pause(...args);
  }
  if (name === "onResume" && typeof state.resume === "function") {
    return state.resume(...args);
  }
  if (name === "confirmQuit" && typeof state.confirmQuit === "function") {
    return state.confirmQuit(...args);
  }
  return undefined;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeLanguageOption(option) {
  if (!option) return null;
  if (typeof option === "string") {
    const value = option.trim();
    return value ? { value, label: value } : null;
  }
  if (typeof option === "object") {
    const value = typeof option.value === "string" ? option.value.trim() : String(option.value ?? "").trim();
    if (!value) return null;
    const label = typeof option.label === "string" ? option.label.trim() : value;
    return { value, label: label || value };
  }
  return null;
}

function getLanguageOptions() {
  let provided = null;
  if (typeof externalHooks.getLanguages === "function") {
    try {
      provided = externalHooks.getLanguages();
    } catch (error) {
      console.error("pauseMenu: getLanguages hook threw", error);
    }
  }
  const normalized = Array.isArray(provided) && provided.length
    ? provided.map(normalizeLanguageOption).filter(Boolean)
    : DEFAULT_LANGUAGES;
  return normalized.length ? normalized : DEFAULT_LANGUAGES;
}

function getStoredLanguage(options) {
  try {
    const stored = localStorage.getItem("language");
    if (stored && options.some((opt) => opt.value === stored)) {
      return stored;
    }
  } catch (error) {
    console.warn("pauseMenu: unable to read stored language", error);
  }
  return options[0]?.value ?? "en";
}

function getActiveLanguage(options = getLanguageOptions()) {
  if (typeof externalHooks.getLanguage === "function") {
    try {
      const lang = externalHooks.getLanguage();
      if (typeof lang === "string" && options.some((opt) => opt.value === lang)) {
        return lang;
      }
    } catch (error) {
      console.error("pauseMenu: getLanguage hook threw", error);
    }
  }
  return getStoredLanguage(options);
}

function persistLanguagePreference(language) {
  try {
    localStorage.setItem("language", language);
  } catch (error) {
    console.warn("pauseMenu: unable to persist language", error);
  }
}

function applyLanguage(language) {
  if (typeof externalHooks.setLanguage === "function") {
    try {
      externalHooks.setLanguage(language);
    } catch (error) {
      console.error("pauseMenu: setLanguage hook threw", error);
    }
  }
  document.documentElement?.setAttribute("lang", language);
  document.dispatchEvent(
    new CustomEvent("pausemenu:language-change", { detail: { language } })
  );
}

function sendEscapeToGame() {
  suppressNextEscape = true;
  const keyboardOptions = {
    key: "Escape",
    code: "Escape",
    keyCode: 27,
    which: 27,
    bubbles: true,
  };
  const syntheticEvent = new KeyboardEvent("keydown", keyboardOptions);
  try {
    Object.defineProperty(syntheticEvent, "keyCode", { get: () => 27 });
    Object.defineProperty(syntheticEvent, "which", { get: () => 27 });
  } catch (error) {
    // Ignore assignment errors in strict browsers
  }
  window.dispatchEvent(syntheticEvent);
  const syntheticKeyUp = new KeyboardEvent("keyup", keyboardOptions);
  try {
    Object.defineProperty(syntheticKeyUp, "keyCode", { get: () => 27 });
    Object.defineProperty(syntheticKeyUp, "which", { get: () => 27 });
  } catch (error) {
    // Ignore assignment errors in strict browsers
  }
  window.dispatchEvent(syntheticKeyUp);
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function ensureUiRoot() {
  let root = document.getElementById("ui-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "ui-root";
    document.body.appendChild(root);
  }
  return root;
}

function createMenuMarkup(root) {
  const container = document.createElement("div");
  container.className = "pause-menu";
  container.setAttribute("role", "dialog");
  container.setAttribute("aria-modal", "true");
  container.setAttribute("aria-hidden", "true");

  const tabsMarkup = TAB_CONFIG.map(
    ({ id, label }, index) => `
      <button
        role="tab"
        id="pause-tab-${id}"
        class="pause-menu__tab"
        data-tab="${id}"
        aria-selected="${index === 0 ? "true" : "false"}"
        aria-controls="pause-panel-${id}"
        tabindex="${index === 0 ? "0" : "-1"}"
      >${label}</button>`
  ).join("");

  container.innerHTML = `
    <div class="pause-menu__backdrop" aria-hidden="true"></div>
    <div class="pause-menu__content" role="document">
      <header class="pause-menu__header">
        <h2 class="pause-menu__title">Game Paused</h2>
        <p class="pause-menu__subtitle">Take a breather, then jump back in.</p>
      </header>
      <div class="pause-menu__tabs" role="tablist" aria-label="Pause menu tabs">
        ${tabsMarkup}
      </div>
      <section class="pause-menu__panels">
        <div id="pause-panel-main" class="pause-menu__panel" role="tabpanel" aria-labelledby="pause-tab-main">
          <div class="pause-menu__stats">
            <div class="pause-menu__stat">
              <span class="pause-menu__stat-label">Wave</span>
              <span class="pause-menu__stat-value" data-stat="wave">0</span>
            </div>
            <div class="pause-menu__stat">
              <span class="pause-menu__stat-label">Score</span>
              <span class="pause-menu__stat-value" data-stat="score">0</span>
            </div>
            <div class="pause-menu__stat">
              <span class="pause-menu__stat-label">Time in Game</span>
              <span class="pause-menu__stat-value" data-stat="time">00:00:00</span>
            </div>
          </div>
          <div class="pause-menu__actions">
            <button type="button" class="pause-menu__button pause-menu__button--primary" data-action="resume">Resume</button>
            <button type="button" class="pause-menu__button pause-menu__button--ghost" data-action="quit">Quit to Main</button>
          </div>
        </div>
        <div id="pause-panel-settings" class="pause-menu__panel" role="tabpanel" aria-labelledby="pause-tab-settings" hidden>
          <form class="pause-menu__form" autocomplete="off">
            <fieldset class="pause-menu__fieldset">
              <legend class="pause-menu__legend">SFX Volume</legend>
              <div class="pause-menu__slider-row">
                <input type="range" min="0" max="100" value="100" step="1" aria-label="SFX volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" data-control="sfx-slider" />
                <span class="pause-menu__slider-value" data-display="sfx-volume">100</span>
              </div>
              <label class="pause-menu__checkbox">
                <input type="checkbox" data-control="sfx-mute" />
                <span>Mute SFX</span>
              </label>
            </fieldset>
            <fieldset class="pause-menu__fieldset">
              <legend class="pause-menu__legend">Music Volume</legend>
              <div class="pause-menu__slider-row">
                <input type="range" min="0" max="100" value="100" step="1" aria-label="Music volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" data-control="music-slider" />
                <span class="pause-menu__slider-value" data-display="music-volume">100</span>
              </div>
              <label class="pause-menu__checkbox">
                <input type="checkbox" data-control="music-mute" />
                <span>Mute Music</span>
              </label>
            </fieldset>
            <fieldset class="pause-menu__fieldset">
              <legend class="pause-menu__legend">Language</legend>
              <div class="pause-menu__select" data-language-slot>
                <select data-control="language-select" aria-label="Language selector"></select>
                <span class="pause-menu__select-icon" aria-hidden="true">▾</span>
              </div>
              <p class="pause-menu__helper">Current language: <span data-display="language-name">&mdash;</span></p>
            </fieldset>
          </form>
        </div>
        <div id="pause-panel-wiki" class="pause-menu__panel" role="tabpanel" aria-labelledby="pause-tab-wiki" hidden>
          <div class="pause-menu__wiki" tabindex="0">
            <h3>Zombie Survival Wiki</h3>
            <p>
              Welcome to the field guide for our roguelike shooter. Survive relentless waves, upgrade your arsenal,
              and control the arena with tactical positioning. Master crowd control, manage cooldowns, and always watch
              your flanks.
            </p>
            <h4>Core Tips</h4>
            <ul>
              <li>Keep moving in loose circles to kite the horde.</li>
              <li>Prioritize damage upgrades early, sustain later.</li>
              <li>Use environmental chokepoints to funnel enemies.</li>
              <li>Break glowing crates for burst XP and healing.</li>
            </ul>
            <h4>Enemy Intel</h4>
            <p>
              Runners close gaps fast, Brutes soak damage, and Spitters punish stationary players. Listen for audio cues to
              anticipate elite spawns.
            </p>
            <h4>Credits</h4>
            <p><strong>Game Design &amp; Code:</strong> Your Name</p>
            <p><strong>Art / Audio / Fonts:</strong> Community Assets &amp; Licensed Packs</p>
            <p><strong>Special Thanks:</strong> Playtesters, Friends, and the Indie Dev Collective</p>
          </div>
        </div>
      </section>
    </div>
  `;

  root.appendChild(container);
  return container;
}

function createCountdownOverlay(root) {
  const overlay = document.createElement("div");
  overlay.className = "pause-countdown";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `<div class="pause-countdown__content" role="status" aria-live="assertive"><span class="pause-countdown__label">3</span></div>`;
  root.appendChild(overlay);
  return overlay;
}

function getFocusableElements() {
  if (!pauseMenuEl) return [];
  const focusables = pauseMenuEl.querySelectorAll(
    "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
  );
  return Array.from(focusables).filter((el) =>
    !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden") && el.offsetParent !== null
  );
}

function updateTabState(newTabId) {
  activeTab = newTabId;
  tabButtons.forEach((btn) => {
    const isActive = btn.dataset.tab === newTabId;
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
    btn.tabIndex = isActive ? 0 : -1;
  });
  tabPanels.forEach((panel, id) => {
    if (id === newTabId) {
      panel.removeAttribute("hidden");
    } else {
      panel.setAttribute("hidden", "");
    }
  });
}

function syncAudioControls() {
  if (!pauseMenuEl) return;
  const sfxSlider = pauseMenuEl.querySelector("[data-control='sfx-slider']");
  const musicSlider = pauseMenuEl.querySelector("[data-control='music-slider']");
  const sfxMute = pauseMenuEl.querySelector("[data-control='sfx-mute']");
  const musicMute = pauseMenuEl.querySelector("[data-control='music-mute']");
  const sfxDisplay = pauseMenuEl.querySelector("[data-display='sfx-volume']");
  const musicDisplay = pauseMenuEl.querySelector("[data-display='music-volume']");

  const sfxVolume = Math.round(clamp(getSfxVolume(), 0, 1) * 100);
  const musicVolume = Math.round(clamp(getMusicVolume(), 0, 1) * 100);

  if (sfxSlider) {
    sfxSlider.value = String(sfxVolume);
    sfxSlider.setAttribute("aria-valuenow", String(sfxVolume));
  }
  if (musicSlider) {
    musicSlider.value = String(musicVolume);
    musicSlider.setAttribute("aria-valuenow", String(musicVolume));
  }
  if (sfxDisplay) {
    sfxDisplay.textContent = String(sfxVolume);
  }
  if (musicDisplay) {
    musicDisplay.textContent = String(musicVolume);
  }
  if (sfxMute) {
    sfxMute.checked = isSfxMuted();
  }
  if (musicMute) {
    musicMute.checked = isMusicMuted();
  }
}

function populateLanguageOptions() {
  if (!pauseMenuEl) return;
  const select = pauseMenuEl.querySelector("[data-control='language-select']");
  if (!(select instanceof HTMLSelectElement)) {
    languageSelectEl = null;
    cachedLanguageOptionsKey = "";
    return;
  }
  const options = getLanguageOptions();
  const key = options.map((opt) => `${opt.value}:${opt.label}`).join("|");
  if (key === cachedLanguageOptionsKey && languageSelectEl) {
    return;
  }
  select.innerHTML = "";
  options.forEach((opt) => {
    const optionEl = document.createElement("option");
    optionEl.value = opt.value;
    optionEl.textContent = opt.label;
    select.appendChild(optionEl);
  });
  languageSelectEl = select;
  cachedLanguageOptionsKey = key;
}

function syncLanguageControls() {
  if (!pauseMenuEl) return;
  populateLanguageOptions();
  const select = languageSelectEl || pauseMenuEl.querySelector("[data-control='language-select']");
  if (!(select instanceof HTMLSelectElement)) {
    return;
  }
  const options = getLanguageOptions();
  const activeLanguage = getActiveLanguage(options);
  select.value = activeLanguage;
  select.setAttribute("aria-valuenow", activeLanguage);
  const labelEl = pauseMenuEl.querySelector("[data-display='language-name']");
  if (labelEl) {
    const match = options.find((opt) => opt.value === activeLanguage);
    labelEl.textContent = match ? match.label : activeLanguage;
  }
  document.documentElement?.setAttribute("lang", activeLanguage);
}

function syncSettingsControls() {
  syncAudioControls();
  syncLanguageControls();
}

function updateStats() {
  if (!pauseMenuEl) return;
  const waveEl = pauseMenuEl.querySelector("[data-stat='wave']");
  const scoreEl = pauseMenuEl.querySelector("[data-stat='score']");
  const timeEl = pauseMenuEl.querySelector("[data-stat='time']");
  const wave = getWaveValue();
  const score = getScoreValue();
  const time = formatTime(getElapsedPlayTimeMs());
  if (waveEl) waveEl.textContent = String(Math.max(0, Math.floor(wave)));
  if (scoreEl) scoreEl.textContent = Number.isFinite(score)
    ? Math.floor(score).toLocaleString()
    : "0";
  if (timeEl) timeEl.textContent = time;
}

function startStatsUpdates() {
  updateStats();
  if (statsInterval) clearInterval(statsInterval);
  statsInterval = setInterval(updateStats, 1000);
}

function stopStatsUpdates() {
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }
}

function showMenu() {
  if (!pauseMenuEl || isPaused) return;
  isPaused = true;
  pauseMenuEl.setAttribute("aria-hidden", "false");
  pauseMenuEl.classList.add("pause-menu--visible");
  document.body.classList.add("pause-menu-open");
  stopPlayClock();
  callHook("setPaused", true);
  callHook("onPause");
  startStatsUpdates();
  syncSettingsControls();
  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const firstTab = tabButtons[0];
  if (firstTab) firstTab.focus();
  document.dispatchEvent(new CustomEvent("pausemenu:opened"));
}

function hideMenu() {
  if (!pauseMenuEl) return;
  pauseMenuEl.setAttribute("aria-hidden", "true");
  pauseMenuEl.classList.remove("pause-menu--visible");
  document.body.classList.remove("pause-menu-open");
  stopStatsUpdates();
  isPaused = false;
}

function resumeFromCountdown() {
  isCountdownActive = false;
  countdownOverlayEl?.setAttribute("aria-hidden", "true");
  countdownOverlayEl?.classList.remove("pause-countdown--visible");
  document.body.classList.remove("pause-menu-open");
  callHook("setPaused", false);
  callHook("onResume");
  startPlayClock();
  document.dispatchEvent(new CustomEvent("pausemenu:closed"));
  isPaused = false;
  if (lastFocusedElement) {
    lastFocusedElement.focus({ preventScroll: true });
    lastFocusedElement = null;
  }
}

function finishCountdown() {
  resumeFromCountdown();
}

function clearCountdownTimers() {
  countdownTimers.forEach((timer) => clearTimeout(timer));
  countdownTimers = [];
}

function cancelCountdown() {
  if (!isCountdownActive) return;
  clearCountdownTimers();
  isCountdownActive = false;
  countdownOverlayEl?.setAttribute("aria-hidden", "true");
  countdownOverlayEl?.classList.remove("pause-countdown--visible");
  showMenu();
}

function startCountdown(syncGameWithEngine = false) {
  if (isCountdownActive) return;
  isCountdownActive = true;
  hideMenu();
  if (syncGameWithEngine) {
    sendEscapeToGame();
  }
  countdownOverlayEl?.setAttribute("aria-hidden", "false");
  countdownOverlayEl?.classList.add("pause-countdown--visible");
  if (countdownLabelEl) countdownLabelEl.textContent = "3";
  document.activeElement instanceof HTMLElement && document.activeElement.blur();

  const steps = ["3", "2", "1", "GO"];
  steps.forEach((step, index) => {
    const timeout = setTimeout(() => {
      if (!isCountdownActive) return;
      if (countdownLabelEl) countdownLabelEl.textContent = step;
      if (step === "GO") {
        const finishTimer = setTimeout(() => {
          if (!isCountdownActive) return;
          clearCountdownTimers();
          finishCountdown();
        }, 750);
        countdownTimers.push(finishTimer);
      }
    }, index * 1000);
    countdownTimers.push(timeout);
  });
}

function togglePause(input) {
  let syncGame = false;
  if (input instanceof Event) {
    syncGame = true;
  } else if (typeof input === "boolean") {
    syncGame = input;
  } else if (input && typeof input === "object") {
    syncGame = Boolean(input.syncGame);
  } else {
    syncGame = !lastToggleFromKeyboard;
  }
  lastToggleFromKeyboard = false;
  if (isCountdownActive) {
    cancelCountdown();
    if (syncGame) {
      sendEscapeToGame();
    }
    return;
  }
  if (!isPaused) {
    if (syncGame) {
      sendEscapeToGame();
    }
    showMenu();
  } else {
    startCountdown(syncGame);
  }
}

function handleGlobalKeyDown(event) {
  if (event.key === "Escape") {
    if (suppressNextEscape) {
      suppressNextEscape = false;
      return;
    }
    lastToggleFromKeyboard = true;
    togglePause();
    return;
  }
  if (!isPaused) {
    return;
  }
  event.stopPropagation();
  if (isCountdownActive) {
    event.preventDefault();
    return;
  }
  if (event.key === "Tab") {
    const focusables = getFocusableElements();
    if (!focusables.length) {
      event.preventDefault();
      return;
    }
    const currentIndex = focusables.indexOf(document.activeElement);
    let nextIndex = currentIndex;
    if (event.shiftKey) {
      nextIndex = currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex === focusables.length - 1 ? 0 : currentIndex + 1;
    }
    event.preventDefault();
    focusables[nextIndex].focus();
  } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const index = TAB_CONFIG.findIndex((tab) => tab.id === activeTab);
    if (index !== -1) {
      const nextIndex = (index + direction + TAB_CONFIG.length) % TAB_CONFIG.length;
      const nextTab = TAB_CONFIG[nextIndex];
      updateTabState(nextTab.id);
      const btn = tabButtons.find((b) => b.dataset.tab === nextTab.id);
      btn?.focus();
    }
    event.preventDefault();
  } else if (event.key === "Enter" || event.key === " ") {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.click();
      event.preventDefault();
    }
  }
}

function attachTabHandlers() {
  const tablist = pauseMenuEl?.querySelector(".pause-menu__tabs");
  if (!tablist) return;
  tabButtons = Array.from(tablist.querySelectorAll("[role='tab']"));
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      updateTabState(btn.dataset.tab);
    });
    btn.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        handleGlobalKeyDown(event);
      }
    });
  });
}

function attachActionHandlers() {
  if (!pauseMenuEl) return;
  pauseMenuEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    if (!action) return;
    if (action === "resume") {
      lastToggleFromKeyboard = false;
      startCountdown(true);
    } else if (action === "quit") {
      const shouldQuit = callHook("confirmQuit");
      if (shouldQuit !== false) {
        resetPlayClock();
        isCountdownActive = false;
        clearCountdownTimers();
        countdownOverlayEl?.setAttribute("aria-hidden", "true");
        countdownOverlayEl?.classList.remove("pause-countdown--visible");
        hideMenu();
        document.body.classList.remove("pause-menu-open");
        isPaused = false;
      }
    }
  });
}

function attachFormHandlers() {
  if (!pauseMenuEl) return;
  const sfxSlider = pauseMenuEl.querySelector("[data-control='sfx-slider']");
  const musicSlider = pauseMenuEl.querySelector("[data-control='music-slider']");
  const sfxMute = pauseMenuEl.querySelector("[data-control='sfx-mute']");
  const musicMute = pauseMenuEl.querySelector("[data-control='music-mute']");
  const sfxDisplay = pauseMenuEl.querySelector("[data-display='sfx-volume']");
  const musicDisplay = pauseMenuEl.querySelector("[data-display='music-volume']");
  const languageSelect = pauseMenuEl.querySelector("[data-control='language-select']");

  if (sfxSlider instanceof HTMLInputElement) {
    sfxSlider.addEventListener("input", () => {
      const value = Number(sfxSlider.value);
      const normalized = clamp(value / 100, 0, 1);
      setSfxVolume(normalized);
      sfxSlider.setAttribute("aria-valuenow", String(value));
      if (sfxDisplay) sfxDisplay.textContent = String(value);
      unlockAudio();
    });
  }
  if (musicSlider instanceof HTMLInputElement) {
    musicSlider.addEventListener("input", () => {
      const value = Number(musicSlider.value);
      const normalized = clamp(value / 100, 0, 1);
      setMusicVolume(normalized);
      musicSlider.setAttribute("aria-valuenow", String(value));
      if (musicDisplay) musicDisplay.textContent = String(value);
      unlockAudio();
    });
  }
  if (sfxMute instanceof HTMLInputElement) {
    sfxMute.addEventListener("change", () => {
      setSfxMuted(sfxMute.checked);
      unlockAudio();
    });
  }
  if (musicMute instanceof HTMLInputElement) {
    musicMute.addEventListener("change", () => {
      setMusicMuted(musicMute.checked);
      unlockAudio();
    });
  }
  if (languageSelect instanceof HTMLSelectElement) {
    languageSelect.addEventListener("change", () => {
      const options = getLanguageOptions();
      const candidate = languageSelect.value;
      const nextLanguage = options.some((opt) => opt.value === candidate)
        ? candidate
        : getActiveLanguage(options);
      persistLanguagePreference(nextLanguage);
      applyLanguage(nextLanguage);
      syncLanguageControls();
    });
  }
}

function cachePanels() {
  if (!pauseMenuEl) return;
  TAB_CONFIG.forEach(({ id }) => {
    const panel = pauseMenuEl.querySelector(`#pause-panel-${id}`);
    if (panel instanceof HTMLElement) {
      tabPanels.set(id, panel);
    }
  });
}

function initPauseMenu() {
  if (pauseMenuEl) return;
  const root = ensureUiRoot();
  pauseMenuEl = createMenuMarkup(root);
  countdownOverlayEl = createCountdownOverlay(root);
  countdownLabelEl = countdownOverlayEl.querySelector(".pause-countdown__label");
  cachePanels();
  attachTabHandlers();
  attachActionHandlers();
  attachFormHandlers();
  updateTabState(activeTab);
  syncSettingsControls();
  window.addEventListener("keydown", handleGlobalKeyDown, false);
  document.addEventListener("pausemenu:toggle", togglePause);
  if (countdownOverlayEl) {
    countdownOverlayEl.addEventListener("click", () => {
      if (isCountdownActive) {
        togglePause({ syncGame: true });
      }
    });
  }
  startPlayClock();
}

export function registerPauseMenuHooks(hooks = {}) {
  Object.assign(externalHooks, hooks);
}

export function openPauseMenu(options = {}) {
  const shouldSync = typeof options === "boolean" ? options : options?.syncGame ?? true;
  lastToggleFromKeyboard = false;
  if (shouldSync && !isPaused && !isCountdownActive) {
    sendEscapeToGame();
  }
  showMenu();
}

export function closePauseMenu() {
  if (isCountdownActive) {
    cancelCountdown();
    return;
  }
  hideMenu();
  isPaused = false;
  document.body.classList.remove("pause-menu-open");
  callHook("setPaused", false);
  callHook("onResume");
  startPlayClock();
  document.dispatchEvent(new CustomEvent("pausemenu:closed"));
}

export function isPauseMenuOpen() {
  return isPaused;
}

export function isCountdownRunning() {
  return isCountdownActive;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPauseMenu);
} else {
  initPauseMenu();
}

window.pauseMenu = {
  open: openPauseMenu,
  close: closePauseMenu,
  toggle: togglePause,
  registerHooks: registerPauseMenuHooks,
  isOpen: isPauseMenuOpen,
  isCountingDown: isCountdownRunning,
};

window.gameClock = gameClock;
// END edit
