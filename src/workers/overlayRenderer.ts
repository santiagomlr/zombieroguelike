export type OverlayParticle = {
  x: number;
  y: number;
  size: number;
  life: number;
  color: string;
};

export type MinimapEntity = {
  x: number;
  y: number;
  radius: number;
  color: string;
};

export type MinimapFrame = {
  worldWidth: number;
  worldHeight: number;
  player: MinimapEntity | null;
  enemies: MinimapEntity[];
  drops: MinimapEntity[];
  hotspots: MinimapEntity[];
  opacity: number;
};

export type OverlayFrameMessage = {
  type: "frame";
  width: number;
  height: number;
  particles: OverlayParticle[];
  minimap: MinimapFrame;
};

export type OverlayInitMessage = {
  type: "init";
  canvas: OffscreenCanvas;
  width: number;
  height: number;
};

export type OverlayResizeMessage = {
  type: "resize";
  width: number;
  height: number;
};

type OverlayMessage = OverlayFrameMessage | OverlayInitMessage | OverlayResizeMessage;

type OverlayRenderingContext = {
  ctx: OffscreenCanvasRenderingContext2D | null;
  width: number;
  height: number;
  minimapPath: Path2D;
  minimapGradient: CanvasGradient | null;
};

const overlay: OverlayRenderingContext = {
  ctx: null,
  width: 0,
  height: 0,
  minimapPath: new Path2D(),
  minimapGradient: null,
};

const MINIMAP_SIZE = 180;
const MINIMAP_PADDING = 24;
const MINIMAP_RADIUS = MINIMAP_SIZE / 2;
const MINIMAP_BOTTOM_OFFSET = 50;

function ensureMinimapGeometry() {
  overlay.minimapPath = new Path2D();
  overlay.minimapPath.arc(0, 0, MINIMAP_RADIUS, 0, Math.PI * 2);
}

function ensureMinimapGradient() {
  if (!overlay.ctx) return;
  overlay.minimapGradient = overlay.ctx.createRadialGradient(0, 0, MINIMAP_RADIUS * 0.1, 0, 0, MINIMAP_RADIUS);
  overlay.minimapGradient.addColorStop(0, "rgba(20, 40, 20, 0.75)");
  overlay.minimapGradient.addColorStop(1, "rgba(10, 10, 10, 0.35)");
}

function drawParticles(particles: OverlayParticle[]) {
  const ctx = overlay.ctx;
  if (!ctx) return;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "lighter";
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMinimap(frame: MinimapFrame) {
  const ctx = overlay.ctx;
  if (!ctx) return;
  const alpha = Math.max(0, Math.min(1, frame.opacity));
  if (alpha <= 0) {
    return;
  }

  const cx = MINIMAP_RADIUS + MINIMAP_PADDING;
  const cy = overlay.height - MINIMAP_RADIUS - MINIMAP_BOTTOM_OFFSET;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(-MINIMAP_RADIUS - 6, -MINIMAP_RADIUS - 6, MINIMAP_SIZE + 12, MINIMAP_SIZE + 12);

  if (!overlay.minimapGradient) {
    ensureMinimapGradient();
  }
  ctx.fillStyle = overlay.minimapGradient ?? "rgba(0,0,0,0.45)";
  ctx.fill(overlay.minimapPath);

  const scaleX = MINIMAP_RADIUS * 2 / Math.max(frame.worldWidth, 1);
  const scaleY = MINIMAP_RADIUS * 2 / Math.max(frame.worldHeight, 1);

  const drawEntity = (entity: MinimapEntity, tint: string, scale = 1) => {
    ctx.fillStyle = tint;
    const x = entity.x * scaleX - MINIMAP_RADIUS;
    const y = entity.y * scaleY - MINIMAP_RADIUS;
    const r = Math.max(2, entity.radius * Math.max(scaleX, scaleY) * scale);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };

  if (frame.player) {
    drawEntity(frame.player, "#5dbb63", 1.4);
  }
  for (const hotspot of frame.hotspots) {
    drawEntity(hotspot, "#ffc300", 1.2);
  }
  for (const drop of frame.drops) {
    drawEntity(drop, drop.color, 1);
  }
  for (const enemy of frame.enemies) {
    drawEntity(enemy, enemy.color, 0.8);
  }

  ctx.restore();
}

function renderFrame(message: OverlayFrameMessage) {
  if (!overlay.ctx) return;
  overlay.width = message.width;
  overlay.height = message.height;

  overlay.ctx.clearRect(0, 0, overlay.width, overlay.height);
  drawParticles(message.particles);
  drawMinimap(message.minimap);
}

self.onmessage = (event: MessageEvent<OverlayMessage>) => {
  const data = event.data;
  if (!data) return;
  switch (data.type) {
    case "init": {
      overlay.ctx = data.canvas.getContext("2d");
      overlay.width = data.width;
      overlay.height = data.height;
      ensureMinimapGeometry();
      ensureMinimapGradient();
      break;
    }
    case "resize": {
      overlay.width = data.width;
      overlay.height = data.height;
      ensureMinimapGeometry();
      ensureMinimapGradient();
      break;
    }
    case "frame": {
      renderFrame(data);
      break;
    }
    default:
      break;
  }
};

export {};
