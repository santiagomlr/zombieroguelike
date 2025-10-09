// BEGIN edit
class GameClock {
  constructor() {
    this._elapsedMs = 0;
    this._lastStart = 0;
    this._running = false;
  }

  startPlayClock() {
    if (this._running) return;
    this._running = true;
    this._lastStart = performance.now();
  }

  stopPlayClock() {
    if (!this._running) return;
    const now = performance.now();
    this._elapsedMs += now - this._lastStart;
    this._lastStart = 0;
    this._running = false;
  }

  resetPlayClock() {
    this._elapsedMs = 0;
    this._lastStart = 0;
    this._running = false;
  }

  getElapsedPlayTimeMs() {
    if (this._running) {
      return this._elapsedMs + (performance.now() - this._lastStart);
    }
    return this._elapsedMs;
  }
}

const gameClock = new GameClock();

export function startPlayClock() {
  gameClock.startPlayClock();
}

export function stopPlayClock() {
  gameClock.stopPlayClock();
}

export function resetPlayClock() {
  gameClock.resetPlayClock();
}

export function getElapsedPlayTimeMs() {
  return gameClock.getElapsedPlayTimeMs();
}

export default gameClock;
// END edit
