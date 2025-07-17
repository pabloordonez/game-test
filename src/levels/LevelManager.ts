import { LevelData, LevelParser } from './LevelParser';
import { World } from '../ecs/core/World';
import { Block } from '../ecs/entities/Block';
import { BlockType } from '../ecs/components/BlockComponent';

export class LevelManager {
	private currentLevel: LevelData | null = null;
	private levelProgress: number = 0; // 0 to 1, representing how far through the level
	private scrollSpeed: number = 50; // pixels per second
	private world: World;
	private blockSize: number = 40; // size of each block in pixels
	private screenHeight: number = 600;
	private levelHeight: number = 0; // calculated from level data

	constructor(world: World) {
		this.world = world;
	}

	loadLevel(levelData: LevelData): void {
		this.currentLevel = levelData;
		this.levelProgress = 0;
		this.levelHeight = levelData.height * this.blockSize;

		console.log(`Loading level: ${levelData.name}`);
		console.log(`Level dimensions: ${levelData.width}x${levelData.height}`);

		// Clear existing blocks
		this.clearLevelBlocks();

		// Create blocks from level data
		this.createLevelBlocks();
	}

	    async loadLevelFromFile(levelNumber: number): Promise<void> {
        try {
            console.log(`Loading level ${levelNumber} from file...`);

            // Use dynamic import to load the level file
            const levelModule = await import(`./levels/level${levelNumber}.txt?raw`);
            const levelContent = levelModule.default;

            console.log(`Level ${levelNumber} content loaded, length:`, levelContent.length);

            const levelData = LevelParser.parseLevelFile(levelContent);
            console.log(`Parsed level ${levelNumber}:`, levelData.name);

            this.loadLevel(levelData);
        } catch (error) {
            console.error(`Error loading level ${levelNumber}:`, error);
            // Fallback to default level
            const defaultLevel = LevelParser.createDefaultLevel();
            this.loadLevel(defaultLevel);
        }
    }

	private clearLevelBlocks(): void {
		// Get all entities with BlockComponent and destroy them
		const entities = this.world.getAllEntities();
		for (const entity of entities) {
			const blockComponent = this.world.getComponent(entity.id, 'BlockComponent');
			if (blockComponent) {
				this.world.destroyEntity(entity.id);
			}
		}
	}

	private createLevelBlocks(): void {
		if (!this.currentLevel) return;

		const { width, height, data } = this.currentLevel;
		let blockCount = 0;

		console.log('Creating level blocks...');
		console.log('Level data dimensions:', width, 'x', height);

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const blockType = data[y][x];
				if (blockType !== 'empty') {
					this.createBlock(x, y, blockType);
					blockCount++;
				}
			}
		}

		console.log(`Created ${blockCount} blocks`);
	}

	private createBlock(x: number, y: number, blockType: string): void {
		const screenX = x * this.blockSize + this.blockSize / 2;
		// Start blocks from the top of the screen (y = 0) and position them based on their level position
		const screenY = y * this.blockSize + this.blockSize / 2;

		let blockTypeEnum: BlockType;
		let color: string;

		switch (blockType) {
			case 'weak':
				blockTypeEnum = BlockType.WEAK;
				color = '#ff6666';
				break;
			case 'normal':
				blockTypeEnum = BlockType.NORMAL;
				color = '#ff0000';
				break;
			case 'strong':
				blockTypeEnum = BlockType.STRONG;
				color = '#cc0000';
				break;
			case 'indestructible':
				blockTypeEnum = BlockType.INDESTRUCTIBLE;
				color = '#666666';
				break;
			case 'powerup':
				blockTypeEnum = BlockType.NORMAL; // Power-up blocks start as normal
				color = '#00ff00';
				break;
			default:
				blockTypeEnum = BlockType.NORMAL;
				color = '#ff0000';
		}

		Block.create(this.world, screenX, screenY, blockTypeEnum, color);
	}

	update(deltaTime: number): void {
		if (!this.currentLevel) return;

		// Update level progress based on scroll speed
		this.levelProgress += (this.scrollSpeed * deltaTime) / this.levelHeight;

		// Clamp progress to 0-1 range
		this.levelProgress = Math.max(0, Math.min(1, this.levelProgress));

		// Move blocks downward to create scrolling effect
		this.updateBlockPositions(deltaTime);
	}

	private updateBlockPositions(deltaTime: number): void {
		const entities = this.world.getAllEntities();

		for (const entity of entities) {
			const blockComponent = this.world.getComponent(entity.id, 'BlockComponent');
			const positionComponent = this.world.getComponent(entity.id, 'PositionComponent') as any;

			if (blockComponent && positionComponent) {
				// Move blocks downward
				positionComponent.y += this.scrollSpeed * deltaTime;

				// Remove blocks that have moved off screen
				if (positionComponent.y > this.screenHeight + this.blockSize) {
					this.world.destroyEntity(entity.id);
				}
			}
		}
	}

	isLevelComplete(): boolean {
		if (!this.currentLevel) return false;

		// Level is complete when ship reaches the top boundary
		// For now, we'll use progress-based completion
		return this.levelProgress >= 1.0;
	}

	getCurrentProgress(): number {
		return this.levelProgress;
	}

	getCurrentLevel(): LevelData | null {
		return this.currentLevel;
	}

	setScrollSpeed(speed: number): void {
		this.scrollSpeed = speed;
	}

	getScrollSpeed(): number {
		return this.scrollSpeed;
	}

	resetLevel(): void {
		if (this.currentLevel) {
			this.loadLevel(this.currentLevel);
		}
	}

	advanceLevel(): void {
		// This would be called when a level is completed
		// For now, we'll just reset the current level
		this.resetLevel();
	}
}
