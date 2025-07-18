import { Entity } from '../ecs/core/Entity';

export interface Bounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export interface SpatialEntity {
    entity: Entity;
    bounds: Bounds;
}

export class SpatialGrid {
    private cellSize: number;
    private width: number;
    private height: number;
    private cols: number;
    private rows: number;
    private grid: Map<string, SpatialEntity[]>;
    private entityCells: Map<number, string[]>; // Track which cells each entity is in

    constructor(width: number, height: number, cellSize: number = 64) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.grid = new Map();
        this.entityCells = new Map();
    }

    clear(): void {
        this.grid.clear();
        this.entityCells.clear();
    }

    insert(entity: Entity, bounds: Bounds): void {
        // Remove entity from previous cells if it exists
        this.remove(entity);

        // Find all cells this entity overlaps
        const startCol = Math.max(0, Math.floor(bounds.left / this.cellSize));
        const endCol = Math.min(this.cols - 1, Math.floor(bounds.right / this.cellSize));
        const startRow = Math.max(0, Math.floor(bounds.top / this.cellSize));
        const endRow = Math.min(this.rows - 1, Math.floor(bounds.bottom / this.cellSize));

        const spatialEntity: SpatialEntity = { entity, bounds };
        const entityCells: string[] = [];

        // Add entity to all overlapping cells
        for (let col = startCol; col <= endCol; col++) {
            for (let row = startRow; row <= endRow; row++) {
                const cellKey = `${col},${row}`;
                
                if (!this.grid.has(cellKey)) {
                    this.grid.set(cellKey, []);
                }
                
                this.grid.get(cellKey)!.push(spatialEntity);
                entityCells.push(cellKey);
            }
        }

        // Track which cells this entity is in
        this.entityCells.set(entity.id, entityCells);
    }

    remove(entity: Entity): void {
        const cells = this.entityCells.get(entity.id);
        if (!cells) return;

        // Remove entity from all cells it was in
        for (const cellKey of cells) {
            const cellEntities = this.grid.get(cellKey);
            if (cellEntities) {
                const index = cellEntities.findIndex(se => se.entity.id === entity.id);
                if (index !== -1) {
                    cellEntities.splice(index, 1);
                }
                
                // Remove empty cells to save memory
                if (cellEntities.length === 0) {
                    this.grid.delete(cellKey);
                }
            }
        }

        this.entityCells.delete(entity.id);
    }

    queryArea(bounds: Bounds): SpatialEntity[] {
        const result: SpatialEntity[] = [];
        const seen = new Set<number>();

        // Find all cells that overlap with the query bounds
        const startCol = Math.max(0, Math.floor(bounds.left / this.cellSize));
        const endCol = Math.min(this.cols - 1, Math.floor(bounds.right / this.cellSize));
        const startRow = Math.max(0, Math.floor(bounds.top / this.cellSize));
        const endRow = Math.min(this.rows - 1, Math.floor(bounds.bottom / this.cellSize));

        for (let col = startCol; col <= endCol; col++) {
            for (let row = startRow; row <= endRow; row++) {
                const cellKey = `${col},${row}`;
                const cellEntities = this.grid.get(cellKey);
                
                if (cellEntities) {
                    for (const spatialEntity of cellEntities) {
                        // Avoid duplicates (entities can be in multiple cells)
                        if (!seen.has(spatialEntity.entity.id)) {
                            seen.add(spatialEntity.entity.id);
                            result.push(spatialEntity);
                        }
                    }
                }
            }
        }

        return result;
    }

    queryPoint(x: number, y: number): SpatialEntity[] {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return [];
        }

        const cellKey = `${col},${row}`;
        return this.grid.get(cellKey) || [];
    }

    queryRadius(centerX: number, centerY: number, radius: number): SpatialEntity[] {
        const bounds: Bounds = {
            left: centerX - radius,
            right: centerX + radius,
            top: centerY - radius,
            bottom: centerY + radius
        };
        
        return this.queryArea(bounds).filter(spatialEntity => {
            const dx = spatialEntity.bounds.left + (spatialEntity.bounds.right - spatialEntity.bounds.left) / 2 - centerX;
            const dy = spatialEntity.bounds.top + (spatialEntity.bounds.bottom - spatialEntity.bounds.top) / 2 - centerY;
            return dx * dx + dy * dy <= radius * radius;
        });
    }

    // Get potential collision pairs more efficiently
    getPotentialCollisions(): Array<[SpatialEntity, SpatialEntity]> {
        const pairs: Array<[SpatialEntity, SpatialEntity]> = [];
        const processed = new Set<string>();

        for (const [cellKey, cellEntities] of this.grid.entries()) {
            // Check collisions within this cell
            for (let i = 0; i < cellEntities.length; i++) {
                for (let j = i + 1; j < cellEntities.length; j++) {
                    const entityA = cellEntities[i];
                    const entityB = cellEntities[j];
                    
                    // Create unique pair key (smaller ID first)
                    const pairKey = entityA.entity.id < entityB.entity.id 
                        ? `${entityA.entity.id}-${entityB.entity.id}`
                        : `${entityB.entity.id}-${entityA.entity.id}`;
                    
                    if (!processed.has(pairKey)) {
                        processed.add(pairKey);
                        pairs.push([entityA, entityB]);
                    }
                }
            }
        }

        return pairs;
    }

    getStats(): { totalCells: number, activeCells: number, totalEntities: number } {
        const totalEntities = this.entityCells.size;
        let entitiesInCells = 0;
        
        for (const entities of this.grid.values()) {
            entitiesInCells += entities.length;
        }

        return {
            totalCells: this.cols * this.rows,
            activeCells: this.grid.size,
            totalEntities: totalEntities
        };
    }
} 