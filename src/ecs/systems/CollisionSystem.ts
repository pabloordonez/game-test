import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { World } from '../core/World';
import { PositionComponent } from '../components/PositionComponent';
import { CollisionComponent } from '../components/CollisionComponent';
import { HealthComponent } from '../components/HealthComponent';
import { BlockComponent, BlockType } from '../components/BlockComponent';
import { WeaponComponent } from '../components/WeaponComponent';
import { PowerUpComponent, PowerUpType } from '../components/PowerUpComponent';
import { RenderComponent } from '../components/RenderComponent';
import { TimeComponent, TimeEffectType } from '../components/TimeComponent';
import { BiggerGunsComponent } from '../components/BiggerGunsComponent';
import { RapidFireComponent } from '../components/RapidFireComponent';
import { ShieldComponent } from '../components/ShieldComponent';
import { SpeedBoostComponent } from '../components/SpeedBoostComponent';
import { SpreadShotComponent } from '../components/SpreadShotComponent';

export class CollisionSystem implements System {
    private entities: Entity[] = [];
    private world: World;

    constructor(world: World) {
        this.world = world;
    }

    update(_deltaTime: number): void {
        // Check collisions between all entities with collision components
        for (let i = 0; i < this.entities.length; i++) {
            const entityA = this.entities[i];
            const positionA = this.world.getComponent(entityA.id, 'PositionComponent') as PositionComponent;
            const collisionA = this.world.getComponent(entityA.id, 'CollisionComponent') as CollisionComponent;

            if (!positionA || !collisionA) continue;

            for (let j = i + 1; j < this.entities.length; j++) {
                const entityB = this.entities[j];
                const positionB = this.world.getComponent(entityB.id, 'PositionComponent') as PositionComponent;
                const collisionB = this.world.getComponent(entityB.id, 'CollisionComponent') as CollisionComponent;

                if (!positionB || !collisionB) continue;

                // Check if entities should collide
                if (this.shouldCollide(entityA, entityB)) {
                    this.checkCollision(entityA, entityB, positionA, positionB, collisionA, collisionB);
                }
            }
        }
    }

    private shouldCollide(entityA: Entity, entityB: Entity): boolean {
        // Check collision layers and tags
        const collisionA = this.world.getComponent(entityA.id, 'CollisionComponent') as CollisionComponent;
        const collisionB = this.world.getComponent(entityB.id, 'CollisionComponent') as CollisionComponent;

        if (!collisionA || !collisionB) return false;

        // Check if they're on the same layer or if one is a trigger
        return collisionA.layer === collisionB.layer || collisionA.isTrigger || collisionB.isTrigger;
    }

    private checkCollision(
        entityA: Entity,
        entityB: Entity,
        positionA: PositionComponent,
        positionB: PositionComponent,
        collisionA: CollisionComponent,
        collisionB: CollisionComponent
    ): void {
        if (this.intersects(collisionA, positionA.x, positionA.y, collisionB, positionB.x, positionB.y)) {
            this.handleCollision(entityA, entityB);
        }
    }

    private intersects(
        collisionA: CollisionComponent,
        xA: number,
        yA: number,
        collisionB: CollisionComponent,
        xB: number,
        yB: number
    ): boolean {
        const boundsA = this.getBounds(collisionA, xA, yA);
        const boundsB = this.getBounds(collisionB, xB, yB);

        return !(boundsA.left > boundsB.right ||
                boundsA.right < boundsB.left ||
                boundsA.top > boundsB.bottom ||
                boundsA.bottom < boundsB.top);
    }

    private getBounds(collision: CollisionComponent, x: number, y: number): { left: number, right: number, top: number, bottom: number } {
        return {
            left: x - collision.width / 2,
            right: x + collision.width / 2,
            top: y - collision.height / 2,
            bottom: y + collision.height / 2
        };
    }

    private handleCollision(entityA: Entity, entityB: Entity): void {
        // Handle different types of collisions
        const tagsA = this.getEntityTags(entityA);
        const tagsB = this.getEntityTags(entityB);

        // Bullet vs Block collision
        if (tagsA.includes('bullet') && tagsB.includes('block')) {
            this.handleBulletBlockCollision(entityA, entityB);
        } else if (tagsB.includes('bullet') && tagsA.includes('block')) {
            this.handleBulletBlockCollision(entityB, entityA);
        }

        // Ship vs PowerUp collision
        if (tagsA.includes('ship') && tagsB.includes('powerup')) {
            this.handleShipPowerUpCollision(entityA, entityB);
        } else if (tagsB.includes('ship') && tagsA.includes('powerup')) {
            this.handleShipPowerUpCollision(entityB, entityA);
        }

        // Ship vs Block collision (for damage)
        if (tagsA.includes('ship') && tagsB.includes('block')) {
            this.handleShipBlockCollision(entityA, entityB);
        } else if (tagsB.includes('ship') && tagsA.includes('block')) {
            this.handleShipBlockCollision(entityB, entityA);
        }
    }

    private handleBulletBlockCollision(bullet: Entity, block: Entity): void {
        const blockComponent = this.world.getComponent(block.id, 'BlockComponent') as BlockComponent;
        const bulletComponent = this.world.getComponent(bullet.id, 'WeaponComponent') as WeaponComponent;

        if (blockComponent && bulletComponent) {
            // Damage the block
            const destroyed = this.damageBlock(blockComponent, bulletComponent.damage);

            // Destroy the bullet
            this.world.destroyEntity(bullet.id);

            if (destroyed) {
                // Handle block destruction
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

    private handleShipPowerUpCollision(_ship: Entity, powerUp: Entity): void {
        const powerUpComponent = this.world.getComponent(powerUp.id, 'PowerUpComponent') as PowerUpComponent;

        if (powerUpComponent) {
            // Apply power-up effect by adding the appropriate effect component to the ship
            this.applyPowerUpToShip(_ship, powerUpComponent);

            // Destroy the power-up
            this.world.destroyEntity(powerUp.id);
        }
    }

    private applyPowerUpToShip(ship: Entity, powerUpComponent: PowerUpComponent): void {
        // Create the appropriate effect component based on power-up type
        switch (powerUpComponent.powerUpType) {
            case PowerUpType.BIGGER_GUNS:
                this.world.addComponent(ship.id, new BiggerGunsComponent(ship.id, powerUpComponent.duration));
                break;
            case PowerUpType.RAPID_FIRE:
                this.world.addComponent(ship.id, new RapidFireComponent(ship.id, powerUpComponent.duration));
                break;
            case PowerUpType.SHIELD:
                this.world.addComponent(ship.id, new ShieldComponent(ship.id, powerUpComponent.duration));
                break;
            case PowerUpType.SPEED_BOOST:
                this.world.addComponent(ship.id, new SpeedBoostComponent(ship.id, powerUpComponent.duration));
                break;
            case PowerUpType.SPREAD_SHOT:
                this.world.addComponent(ship.id, new SpreadShotComponent(ship.id, powerUpComponent.duration));
                break;
            case PowerUpType.TIME_SLOWDOWN:
                this.world.addComponent(ship.id, new TimeComponent(ship.id, TimeEffectType.SLOWDOWN, powerUpComponent.duration));
                break;
            case PowerUpType.TIME_SPEEDUP:
                this.world.addComponent(ship.id, new TimeComponent(ship.id, TimeEffectType.SPEEDUP, powerUpComponent.duration));
                break;
            case PowerUpType.TIME_FREEZE:
                this.world.addComponent(ship.id, new TimeComponent(ship.id, TimeEffectType.FREEZE, powerUpComponent.duration));
                break;
        }
    }

    private handleShipBlockCollision(ship: Entity, _block: Entity): void {
        const shipHealth = this.world.getComponent(ship.id, 'HealthComponent') as HealthComponent;

        if (shipHealth) {
            // Ship takes damage from hitting block
            this.damageEntity(shipHealth, 10);
        }
    }

    private damageEntity(healthComponent: HealthComponent, damage: number): boolean {
        if (healthComponent.isInvulnerable) return false;

        healthComponent.currentHealth = Math.max(0, healthComponent.currentHealth - damage);
        return healthComponent.currentHealth <= 0;
    }

    private handleBlockDestruction(block: Entity, blockComponent: BlockComponent): void {
        // Award points
        // TODO: Add score system

        // Check if power-up should drop
        if (this.shouldDropPowerUp(blockComponent)) {
            this.spawnPowerUp(block);
        }

        // Destroy the block
        this.world.destroyEntity(block.id);
    }

    private shouldDropPowerUp(blockComponent: BlockComponent): boolean {
        return Math.random() < blockComponent.dropChance;
    }

    private spawnPowerUp(block: Entity): void {
        const position = this.world.getComponent(block.id, 'PositionComponent') as PositionComponent;
        if (!position) return;

        // Create power-up entity
        const powerUpEntity = this.world.createEntity();

        // Add components to power-up
        this.world.addComponent(powerUpEntity.id, new PositionComponent(powerUpEntity.id, position.x, position.y));
        this.world.addComponent(powerUpEntity.id, new CollisionComponent(powerUpEntity.id, 20, 20, true));
        this.world.addComponent(powerUpEntity.id, new RenderComponent(powerUpEntity.id, 20, 20, '#00ff00'));

        // Random power-up type
        const powerUpTypes = Object.values(PowerUpType);
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        this.world.addComponent(powerUpEntity.id, new PowerUpComponent(powerUpEntity.id, randomType));
    }

    private getEntityTags(entity: Entity): string[] {
        const collision = this.world.getComponent(entity.id, 'CollisionComponent') as CollisionComponent;
        return collision ? collision.tags : [];
    }

    getEntities(): Entity[] {
        return this.entities;
    }

    getRequiredComponents(): string[] {
        return ['PositionComponent', 'CollisionComponent'];
    }

    setEntities(entities: Entity[]): void {
        this.entities = entities;
    }
}