import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { World } from '../core/World';
import { PositionComponent } from '../components/PositionComponent';
import { CollisionComponent } from '../components/CollisionComponent';
import { HealthComponent } from '../components/HealthComponent';
import { BlockComponent, BlockType } from '../components/BlockComponent';
import { WeaponComponent } from '../components/WeaponComponent';
import { PowerUpComponent, PowerUpType } from '../components/PowerUpComponent';
import { BiggerGunsComponent } from '../components/BiggerGunsComponent';
import { RapidFireComponent } from '../components/RapidFireComponent';
import { ShieldComponent } from '../components/ShieldComponent';
import { SpeedBoostComponent } from '../components/SpeedBoostComponent';
import { SpreadShotComponent } from '../components/SpreadShotComponent';
import { AudioComponent, AudioEventType } from '../components/AudioComponent';
import { PowerUp } from '../entities/PowerUp';
import { SpatialGrid, Bounds, SpatialEntity } from '../../utils/SpatialGrid';
import { PerformanceMonitor } from '../../utils/PerformanceMonitor';

export class CollisionSystem implements System {
    private entities: Entity[] = [];
    private world: World;
    private spatialGrid: SpatialGrid;
    private performanceMonitor: PerformanceMonitor;
    private viewport: { width: number, height: number };

    constructor(world: World, performanceMonitor: PerformanceMonitor, width: number = 800, height: number = 600) {
        this.world = world;
        this.performanceMonitor = performanceMonitor;
        this.viewport = { width, height };

        // Create spatial grid with optimal cell size (64x64 pixels)
        this.spatialGrid = new SpatialGrid(width, height, 64);
    }

    update(_deltaTime: number): void {
        this.performanceMonitor.startSystemTiming('CollisionSystem');

        // Clear and rebuild spatial grid each frame
        this.spatialGrid.clear();

        // First pass: Insert all entities into spatial grid and cull off-screen entities
        const activeEntities = this.cullAndInsertEntities();

        // Second pass: Use spatial grid to find potential collision pairs
        const collisionPairs = this.spatialGrid.getPotentialCollisions();

        // Third pass: Check actual collisions for potential pairs
        let collisionChecks = 0;
        for (const [spatialEntityA, spatialEntityB] of collisionPairs) {
            collisionChecks++;
            if (this.shouldCollide(spatialEntityA.entity, spatialEntityB.entity)) {
                if (this.checkCollision(spatialEntityA, spatialEntityB)) {
                    this.handleCollision(spatialEntityA.entity, spatialEntityB.entity);
                }
            }
        }

        // Update performance metrics
        this.performanceMonitor.incrementCollisionChecks(collisionChecks);
        this.performanceMonitor.setEntityCount(activeEntities);
        this.performanceMonitor.endSystemTiming('CollisionSystem');
    }

    private cullAndInsertEntities(): number {
        let activeEntities = 0;
        const buffer = 100; // Extra buffer for off-screen culling

        for (const entity of this.entities) {
            const position = this.world.getComponent(entity.id, 'PositionComponent') as PositionComponent;
            const collision = this.world.getComponent(entity.id, 'CollisionComponent') as CollisionComponent;

            if (!position || !collision) continue;

            // Calculate entity bounds
            const bounds: Bounds = {
                left: position.x - collision.width / 2,
                right: position.x + collision.width / 2,
                top: position.y - collision.height / 2,
                bottom: position.y + collision.height / 2
            };

            // Cull entities that are far off-screen (except for ships)
            const tags = this.getEntityTags(entity);
            const isShip = tags.includes('ship');

            if (!isShip && this.isEntityOffScreen(bounds, buffer)) {
                // Don't add to spatial grid, and optionally destroy entity
                if (tags.includes('bullet') || tags.includes('powerup')) {
                    this.world.destroyEntity(entity.id);
                }
                continue;
            }

            // Insert into spatial grid
            this.spatialGrid.insert(entity, bounds);
            activeEntities++;
        }

        return activeEntities;
    }

    private isEntityOffScreen(bounds: Bounds, buffer: number): boolean {
        return bounds.right < -buffer ||
               bounds.left > this.viewport.width + buffer ||
               bounds.bottom < -buffer ||
               bounds.top > this.viewport.height + buffer;
    }

    private shouldCollide(entityA: Entity, entityB: Entity): boolean {
        const collisionA = this.world.getComponent(entityA.id, 'CollisionComponent') as CollisionComponent;
        const collisionB = this.world.getComponent(entityB.id, 'CollisionComponent') as CollisionComponent;

        if (!collisionA || !collisionB) return false;

        // Use collision layers and tags for filtering
        const tagsA = collisionA.tags;
        const tagsB = collisionB.tags;

        // Define collision rules
        if (tagsA.includes('bullet') && tagsB.includes('block')) return true;
        if (tagsA.includes('block') && tagsB.includes('bullet')) return true;
        if (tagsA.includes('ship') && tagsB.includes('powerup')) return true;
        if (tagsA.includes('powerup') && tagsB.includes('ship')) return true;
        if (tagsA.includes('ship') && tagsB.includes('block')) return true;
        if (tagsA.includes('block') && tagsB.includes('ship')) return true;

        return false;
    }

    private checkCollision(spatialEntityA: SpatialEntity, spatialEntityB: SpatialEntity): boolean {
        const boundsA = spatialEntityA.bounds;
        const boundsB = spatialEntityB.bounds;

        // AABB collision detection
        return !(boundsA.left > boundsB.right ||
                boundsA.right < boundsB.left ||
                boundsA.top > boundsB.bottom ||
                boundsA.bottom < boundsB.top);
    }

    private handleCollision(entityA: Entity, entityB: Entity): void {
        const tagsA = this.getEntityTags(entityA);
        const tagsB = this.getEntityTags(entityB);

        // Handle different collision types
        if (tagsA.includes('bullet') && tagsB.includes('block')) {
            this.handleBulletBlockCollision(entityA, entityB);
        } else if (tagsB.includes('bullet') && tagsA.includes('block')) {
            this.handleBulletBlockCollision(entityB, entityA);
        } else if (tagsA.includes('ship') && tagsB.includes('powerup')) {
            this.handleShipPowerUpCollision(entityA, entityB);
        } else if (tagsB.includes('ship') && tagsA.includes('powerup')) {
            this.handleShipPowerUpCollision(entityB, entityA);
        } else if (tagsA.includes('ship') && tagsB.includes('block')) {
            this.handleShipBlockCollision(entityA, entityB);
        } else if (tagsB.includes('ship') && tagsA.includes('block')) {
            this.handleShipBlockCollision(entityB, entityA);
        }
    }

    private handleBulletBlockCollision(bullet: Entity, block: Entity): void {
        const blockComponent = this.world.getComponent(block.id, 'BlockComponent') as BlockComponent;
        const bulletComponent = this.world.getComponent(bullet.id, 'WeaponComponent') as WeaponComponent;

        if (blockComponent && bulletComponent) {
            const destroyed = this.damageBlock(blockComponent, bulletComponent.damage);

            this.triggerAudioEvent(bullet, 'bullet_hit', 0.6);
            this.world.destroyEntity(bullet.id);

            if (destroyed) {
                this.triggerAudioEvent(block, 'block_destroy', 0.8);
                this.handleBlockDestruction(block, blockComponent);
            }
        }
    }

    private damageBlock(blockComponent: BlockComponent, damage: number): boolean {
        if (blockComponent.blockType === BlockType.INDESTRUCTIBLE) {
            return false;
        }

        blockComponent.health = Math.max(0, blockComponent.health - damage);
        return blockComponent.health <= 0;
    }

    private handleBlockDestruction(block: Entity, blockComponent: BlockComponent): void {
        if (this.shouldDropPowerUp(blockComponent)) {
            this.spawnPowerUp(block);
        }
        this.world.destroyEntity(block.id);
    }

    private shouldDropPowerUp(blockComponent: BlockComponent): boolean {
        return Math.random() < 0.15; // 15% chance
    }

    private spawnPowerUp(block: Entity): void {
        const position = this.world.getComponent(block.id, 'PositionComponent') as PositionComponent;
        if (!position) return;

        const powerUpTypes = Object.values(PowerUpType);
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

        const powerUp = PowerUp.create(
            this.world,
            position.x,
            position.y,
            randomType
        );
    }

    private handleShipPowerUpCollision(ship: Entity, powerUp: Entity): void {
        const powerUpComponent = this.world.getComponent(powerUp.id, 'PowerUpComponent') as PowerUpComponent;

        if (powerUpComponent) {
            this.triggerAudioEvent(ship, 'powerup_collect', 0.7);
            this.applyPowerUpEffect(ship, powerUpComponent);
            this.world.destroyEntity(powerUp.id);
        }
    }

    private applyPowerUpEffect(ship: Entity, powerUpComponent: PowerUpComponent): void {
        switch (powerUpComponent.powerUpType) {
            case PowerUpType.BIGGER_GUNS:
                this.world.addComponent(ship.id, new BiggerGunsComponent(ship.id, 15));
                break;

            case PowerUpType.RAPID_FIRE:
                this.world.addComponent(ship.id, new RapidFireComponent(ship.id, 10));
                break;

            case PowerUpType.SHIELD:
                this.world.addComponent(ship.id, new ShieldComponent(ship.id, 50));
                break;

            case PowerUpType.SPEED_BOOST:
                this.world.addComponent(ship.id, new SpeedBoostComponent(ship.id, 12));
                break;

            case PowerUpType.SPREAD_SHOT:
                this.world.addComponent(ship.id, new SpreadShotComponent(ship.id, 8));
                break;
        }
    }

    private handleShipBlockCollision(ship: Entity, block: Entity): void {
        const shipHealth = this.world.getComponent(ship.id, 'HealthComponent') as HealthComponent;
        const blockComponent = this.world.getComponent(block.id, 'BlockComponent') as BlockComponent;

        if (shipHealth) {
            const shield = this.world.getComponent(ship.id, 'ShieldComponent') as ShieldComponent;
            if (shield && shield.strength > 0) {
                const damage = 10;
                shield.strength = Math.max(0, shield.strength - damage);

                this.triggerAudioEvent(ship, 'shield_hit', 0.5);

                if (shield.strength <= 0) {
                    this.world.removeComponent(ship.id, 'ShieldComponent');
                    this.triggerAudioEvent(ship, 'shield_break', 0.8);
                }
            } else {
                this.triggerAudioEvent(ship, 'ship_damage', 0.7);
                this.damageEntity(shipHealth, 10);
            }
        }

        if (blockComponent) {
            this.world.destroyEntity(block.id);
        }
    }

    private damageEntity(healthComponent: HealthComponent, damage: number): boolean {
        if (healthComponent.isInvulnerable) return false;

        healthComponent.currentHealth = Math.max(0, healthComponent.currentHealth - damage);
        return healthComponent.currentHealth <= 0;
    }

    private getEntityTags(entity: Entity): string[] {
        const collision = this.world.getComponent(entity.id, 'CollisionComponent') as CollisionComponent;
        return collision ? collision.tags : [];
    }

    private triggerAudioEvent(entity: Entity, soundId: string, volume: number = 1.0): void {
        let audioComponent = this.world.getComponent(entity.id, 'AudioComponent') as AudioComponent;

        if (!audioComponent) {
            audioComponent = new AudioComponent(entity.id);
            this.world.addComponent(entity.id, audioComponent);
        }

        audioComponent.addEvent({
            type: AudioEventType.PLAY_SOUND,
            soundId: soundId,
            volume: volume
        });

        this.performanceMonitor.incrementAudioEvents();
    }

    // Query methods for other systems to use
    queryArea(bounds: Bounds): Entity[] {
        return this.spatialGrid.queryArea(bounds).map(se => se.entity);
    }

    queryRadius(centerX: number, centerY: number, radius: number): Entity[] {
        return this.spatialGrid.queryRadius(centerX, centerY, radius).map(se => se.entity);
    }

    queryPoint(x: number, y: number): Entity[] {
        return this.spatialGrid.queryPoint(x, y).map(se => se.entity);
    }

    getSpatialStats(): { totalCells: number, activeCells: number, totalEntities: number } {
        return this.spatialGrid.getStats();
    }

    getRequiredComponents(): string[] {
        return ['PositionComponent', 'CollisionComponent'];
    }

    setEntities(entities: Entity[]): void {
        this.entities = entities;
    }

    getEntities(): Entity[] {
        return this.entities;
    }
}