import { Component } from '../core/Component';

export enum BlockType {
    WEAK = "weak", // 1 hit
    NORMAL = "normal", // 2 hits
    STRONG = "strong", // 3 hits
    INDESTRUCTIBLE = "indestructible"
}

export class BlockComponent implements Component {
    public entityId: number;
    public health: number;
    public maxHealth: number;
    public blockType: BlockType;
    public points: number;
    public dropChance: number;
    public powerUpType: string | null;

    constructor(entityId: number, blockType: BlockType = BlockType.NORMAL, points: number = 100) {
        this.entityId = entityId;
        this.blockType = blockType;
        this.points = points;
        this.dropChance = 0.1;
        this.powerUpType = null;
        switch (blockType) {
            case BlockType.WEAK:
                this.maxHealth = 1;
                break;
            case BlockType.NORMAL:
                this.maxHealth = 2;
                break;
            case BlockType.STRONG:
                this.maxHealth = 3;
                break;
            case BlockType.INDESTRUCTIBLE:
                this.maxHealth = Infinity;
                break;
        }
        this.health = this.maxHealth;
    }
}