export type SpatialHashEntity = {
  x: number;
  y: number;
  rad: number;
};

export class SpatialHash<Enemy extends SpatialHashEntity, Projectile extends SpatialHashEntity> {
  private readonly cellSize: number;
  private readonly invCellSize: number;
  private readonly cells: Map<string, { enemies: Enemy[]; projectiles: Projectile[] }> = new Map();
  private queryId = 1;

  constructor(cellSize: number) {
    this.cellSize = Math.max(1, cellSize);
    this.invCellSize = 1 / this.cellSize;
  }

  reset() {
    for (const cell of this.cells.values()) {
      cell.enemies.length = 0;
      cell.projectiles.length = 0;
    }
  }

  insertEnemy(enemy: Enemy) {
    this.insertEntity(enemy, "enemies");
  }

  insertProjectile(projectile: Projectile) {
    this.insertEntity(projectile, "projectiles");
  }

  queryEnemies(x: number, y: number, radius: number, result: Enemy[]): Enemy[] {
    const minCellX = Math.floor((x - radius) * this.invCellSize);
    const maxCellX = Math.floor((x + radius) * this.invCellSize);
    const minCellY = Math.floor((y - radius) * this.invCellSize);
    const maxCellY = Math.floor((y + radius) * this.invCellSize);

    const queryId = this.queryId++;

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = this.getKey(cx, cy);
        const cell = this.cells.get(key);
        if (!cell) continue;

        for (const enemy of cell.enemies) {
          const taggedEnemy = enemy as Enemy & { __shQueryId?: number };
          if (taggedEnemy.__shQueryId === queryId) continue;
          taggedEnemy.__shQueryId = queryId;
          result.push(enemy);
        }
      }
    }

    return result;
  }

  queryProjectiles(x: number, y: number, radius: number, result: Projectile[]): Projectile[] {
    const minCellX = Math.floor((x - radius) * this.invCellSize);
    const maxCellX = Math.floor((x + radius) * this.invCellSize);
    const minCellY = Math.floor((y - radius) * this.invCellSize);
    const maxCellY = Math.floor((y + radius) * this.invCellSize);

    const queryId = this.queryId++;

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = this.getKey(cx, cy);
        const cell = this.cells.get(key);
        if (!cell) continue;

        for (const projectile of cell.projectiles) {
          const taggedProjectile = projectile as Projectile & { __shQueryId?: number };
          if (taggedProjectile.__shQueryId === queryId) continue;
          taggedProjectile.__shQueryId = queryId;
          result.push(projectile);
        }
      }
    }

    return result;
  }

  private insertEntity(entity: Enemy | Projectile, type: "enemies" | "projectiles") {
    const radius = entity.rad ?? 0;
    const minCellX = Math.floor((entity.x - radius) * this.invCellSize);
    const maxCellX = Math.floor((entity.x + radius) * this.invCellSize);
    const minCellY = Math.floor((entity.y - radius) * this.invCellSize);
    const maxCellY = Math.floor((entity.y + radius) * this.invCellSize);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = this.getKey(cx, cy);
        let cell = this.cells.get(key);
        if (!cell) {
          cell = { enemies: [], projectiles: [] };
          this.cells.set(key, cell);
        }
        (cell[type] as (Enemy | Projectile)[]).push(entity as Enemy & Projectile);
      }
    }
  }

  private getKey(x: number, y: number) {
    return `${x},${y}`;
  }
}
