export type OverlayParticle = {
  x: number;
  y: number;
  size: number;
  life: number;
  color: string;
};

export type MinimapEntityVariant =
  | "player"
  | "enemy"
  | "boss"
  | "drop"
  | "portal"
  | "hotspot-objective"
  | "hotspot-danger"
  | "hotspot-radioactive";

export type MinimapEntity = {
  x: number;
  y: number;
  radius: number;
  color: string;
  variant?: MinimapEntityVariant;
  pulse?: number;
};

export type MinimapFrame = {
  worldWidth: number;
  worldHeight: number;
  player: MinimapEntity | null;
  enemies: MinimapEntity[];
  bosses: MinimapEntity[];
  drops: MinimapEntity[];
  hotspots: MinimapEntity[];
  portals: MinimapEntity[];
  playerHeading: number;
  detailLevel: number;
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
const MINIMAP_INNER_RADIUS = MINIMAP_RADIUS - 12;
const MINIMAP_FRAME_RADIUS = MINIMAP_RADIUS + 10;
const MINIMAP_BOTTOM_OFFSET = 50;

function ensureMinimapGeometry() {
  overlay.minimapPath = new Path2D();
  overlay.minimapPath.arc(0, 0, MINIMAP_INNER_RADIUS, 0, Math.PI * 2);
}

function ensureMinimapGradient() {
  if (!overlay.ctx) return;
  overlay.minimapGradient = overlay.ctx.createRadialGradient(
    0,
    0,
    MINIMAP_INNER_RADIUS * 0.15,
    0,
    0,
    MINIMAP_INNER_RADIUS,
  );
  overlay.minimapGradient.addColorStop(0, "rgba(70, 220, 200, 0.4)");
  overlay.minimapGradient.addColorStop(0.65, "rgba(18, 48, 70, 0.85)");
  overlay.minimapGradient.addColorStop(1, "rgba(6, 12, 20, 0.95)");
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
  const detailLevel = Math.max(0, frame.detailLevel | 0);
  if (alpha <= 0 || detailLevel <= 0) {
    return;
  }

  const cx = MINIMAP_RADIUS + MINIMAP_PADDING;
  const cy = overlay.height - MINIMAP_RADIUS - MINIMAP_BOTTOM_OFFSET;
  const mapRadius = MINIMAP_INNER_RADIUS;
  const frameRadius = MINIMAP_FRAME_RADIUS;

  const scaleX = (mapRadius * 2) / Math.max(frame.worldWidth, 1);
  const scaleY = (mapRadius * 2) / Math.max(frame.worldHeight, 1);
  const mapScale = Math.max(scaleX, scaleY);

  const project = (entity: MinimapEntity) => ({
    x: entity.x * scaleX - mapRadius,
    y: entity.y * scaleY - mapRadius,
    r: Math.max(2, entity.radius * mapScale),
  });

  const drawEnemy = (entity: MinimapEntity, isBoss = false) => {
    const { x, y, r } = project(entity);
    ctx.save();
    ctx.translate(x, y);
    if (isBoss) {
      const size = Math.max(r * 2.2, 8);
      ctx.fillStyle = "rgba(255, 102, 135, 0.18)";
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 102, 135, 0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-size, 0);
      ctx.lineTo(size, 0);
      ctx.moveTo(0, -size);
      ctx.lineTo(0, size);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 166, 189, 0.8)";
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.55);
      ctx.lineTo(size * 0.55, 0);
      ctx.lineTo(0, size * 0.55);
      ctx.lineTo(-size * 0.55, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      const size = Math.max(r * 1.3, 3);
      ctx.fillStyle = entity.color;
      ctx.globalAlpha = detailLevel >= 2 ? 0.95 : 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const drawDrop = (entity: MinimapEntity) => {
    const { x, y, r } = project(entity);
    const size = Math.max(r * 1.6, 4);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = entity.color;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.restore();
  };

  const drawHotspot = (entity: MinimapEntity) => {
    const { x, y, r } = project(entity);
    const size = Math.max(r * 1.4, 6);
    const pulse = entity.pulse ?? 0;
    const hotspotAlpha = 0.2 + pulse * 0.3;
    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = 2;
    switch (entity.variant) {
      case "hotspot-danger": {
        ctx.fillStyle = `rgba(239, 68, 68, ${hotspotAlpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.7 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.9);
        ctx.lineTo(size * 0.85, size * 0.9);
        ctx.lineTo(-size * 0.85, size * 0.9);
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case "hotspot-radioactive": {
        ctx.strokeStyle = `rgba(142, 68, 173, ${0.7 + pulse * 0.3})`;
        ctx.fillStyle = `rgba(142, 68, 173, ${0.12 + pulse * 0.25})`;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.9);
        ctx.lineTo(size * 0.9, size * 0.45);
        ctx.lineTo(-size * 0.9, size * 0.45);
        ctx.closePath();
        ctx.stroke();
        break;
      }
      default: {
        ctx.strokeStyle = `rgba(255, 196, 0, ${0.75 + pulse * 0.25})`;
        ctx.fillStyle = `rgba(255, 196, 0, ${0.16 + pulse * 0.25})`;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.9);
        ctx.lineTo(size * 0.9, 0);
        ctx.lineTo(0, size * 0.9);
        ctx.lineTo(-size * 0.9, 0);
        ctx.closePath();
        ctx.stroke();
        break;
      }
    }
    ctx.restore();
  };

  const drawPortal = (entity: MinimapEntity) => {
    const { x, y, r } = project(entity);
    const size = Math.max(r * 1.6, 6);
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "rgba(147, 197, 253, 0.9)";
    ctx.fillStyle = "rgba(96, 165, 250, 0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  if (!overlay.minimapGradient) {
    ensureMinimapGradient();
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);

  ctx.shadowColor = "rgba(5, 9, 16, 0.85)";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "rgba(7, 13, 22, 0.88)";
  ctx.beginPath();
  ctx.arc(0, 0, frameRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "rgba(110, 220, 255, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, frameRadius - 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.clip(overlay.minimapPath);
  ctx.fillStyle = overlay.minimapGradient ?? "rgba(10, 18, 28, 0.9)";
  ctx.fillRect(-mapRadius, -mapRadius, mapRadius * 2, mapRadius * 2);

  const gridAlpha = detailLevel >= 2 ? 0.25 : 0.12;
  ctx.strokeStyle = `rgba(148, 209, 255, ${gridAlpha})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-mapRadius, 0);
  ctx.lineTo(mapRadius, 0);
  ctx.moveTo(0, -mapRadius);
  ctx.lineTo(0, mapRadius);
  ctx.stroke();

  if (detailLevel >= 2) {
    ctx.strokeStyle = "rgba(148, 209, 255, 0.12)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(-mapRadius, -mapRadius);
    ctx.lineTo(mapRadius, mapRadius);
    ctx.moveTo(-mapRadius, mapRadius);
    ctx.lineTo(mapRadius, -mapRadius);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const ringCount = detailLevel >= 2 ? 3 : 1;
  ctx.strokeStyle = `rgba(110, 220, 255, ${detailLevel >= 2 ? 0.14 : 0.08})`;
  ctx.setLineDash([4, 10]);
  for (let i = 1; i <= ringCount; i++) {
    const radius = (mapRadius / (ringCount + 1)) * i;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  if (frame.player) {
    const { x, y, r } = project(frame.player);
    const haloRadius = Math.max(r * 2.4, 9);
    ctx.fillStyle = "rgba(94, 243, 255, 0.22)";
    ctx.beginPath();
    ctx.arc(x, y, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(161, 255, 250, 0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(r * 1.1, 4), 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(226, 255, 247, 0.95)";
    ctx.beginPath();
    ctx.arc(x, y, Math.max(r * 0.7, 3.5), 0, Math.PI * 2);
    ctx.fill();

    if (detailLevel >= 2 && Number.isFinite(frame.playerHeading)) {
      const heading = frame.playerHeading;
      const arrowLength = Math.max(r * 4, 12);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(heading);
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.moveTo(arrowLength, 0);
      ctx.lineTo(-arrowLength * 0.35, arrowLength * 0.4);
      ctx.lineTo(-arrowLength * 0.35, -arrowLength * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  if (detailLevel >= 1) {
    for (const enemy of frame.enemies) {
      drawEnemy(enemy, false);
    }
    for (const boss of frame.bosses ?? []) {
      drawEnemy(boss, true);
    }
  }

  if (detailLevel >= 2) {
    for (const drop of frame.drops) {
      drawDrop(drop);
    }
    for (const hotspot of frame.hotspots) {
      drawHotspot(hotspot);
    }
    for (const portal of frame.portals ?? []) {
      drawPortal(portal);
    }
  }

  ctx.restore();

  ctx.strokeStyle = "rgba(148, 209, 255, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke(overlay.minimapPath);

  if (detailLevel >= 2) {
    const labelRadius = frameRadius + 12;
    ctx.fillStyle = "rgba(148, 209, 255, 0.85)";
    ctx.font = "600 12px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cardinals: Array<{ label: string; angle: number }> = [
      { label: "N", angle: -Math.PI / 2 },
      { label: "E", angle: 0 },
      { label: "S", angle: Math.PI / 2 },
      { label: "W", angle: Math.PI },
    ];
    for (const { label, angle } of cardinals) {
      const lx = Math.cos(angle) * labelRadius;
      const ly = Math.sin(angle) * labelRadius;
      ctx.fillText(label, lx, ly);
    }

    if (Number.isFinite(frame.playerHeading)) {
      const heading = frame.playerHeading;
      const indicatorRadius = frameRadius;
      ctx.save();
      ctx.rotate(heading);
      ctx.strokeStyle = "rgba(110, 220, 255, 0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(indicatorRadius - 4, 0);
      ctx.lineTo(indicatorRadius + 6, 0);
      ctx.stroke();
      ctx.fillStyle = "rgba(110, 220, 255, 0.65)";
      ctx.beginPath();
      ctx.moveTo(indicatorRadius + 6, 0);
      ctx.lineTo(indicatorRadius + 12, -4);
      ctx.lineTo(indicatorRadius + 12, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
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
