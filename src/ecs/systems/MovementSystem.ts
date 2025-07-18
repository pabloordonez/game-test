import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { World } from '../core/World';
import { PositionComponent } from '../components/PositionComponent';
import { MovementComponent } from '../components/MovementComponent';
import { CollisionComponent } from '../components/CollisionComponent';

export class MovementSystem implements System {
    private entities: Entity[] = [];
    private world: World;

    constructor(world: World) {
        this.world = world;
    }

    update(deltaTime: number): void {
        for (const entity of this.entities) {
            const position = this.world.getComponent(entity.id, 'PositionComponent') as PositionComponent;
            const movement = this.world.getComponent(entity.id, 'MovementComponent') as MovementComponent;

            if (!position || !movement) continue;

            // Apply velocity using proper deltaTime scaling
            position.x += position.velocityX * deltaTime;
            position.y += position.velocityY * deltaTime;

            // Apply deceleration only when there's no input (for inertia)
            if (!movement.hasInputX && position.velocityX !== 0) {
                const decelAmount = movement.deceleration * deltaTime;
                if (Math.abs(position.velocityX) <= decelAmount) {
                    position.velocityX = 0;
                } else {
                    position.velocityX -= Math.sign(position.velocityX) * decelAmount;
                }
            }

            if (!movement.hasInputY && position.velocityY !== 0) {
                const decelAmount = movement.deceleration * deltaTime;
                if (Math.abs(position.velocityY) <= decelAmount) {
                    position.velocityY = 0;
                } else {
                    position.velocityY -= Math.sign(position.velocityY) * decelAmount;
                }
            }

            // Clamp velocity to max speed
            const speed = Math.sqrt(position.velocityX * position.velocityX + position.velocityY * position.velocityY);
            if (speed > movement.maxSpeed) {
                const scale = movement.maxSpeed / speed;
                position.velocityX *= scale;
                position.velocityY *= scale;
            }

            // Clean up entities that go off-screen
            this.checkOffScreenCleanup(entity, position);
        }
    }

    private checkOffScreenCleanup(entity: Entity, position: PositionComponent): void {
        const canvasWidth = 800; // TODO: Get from canvas
        const canvasHeight = 600; // TODO: Get from canvas
        const buffer = 50; // Buffer to allow entities to go slightly off-screen before cleanup

        // Get entity tags to determine cleanup behavior
        const tags = this.getEntityTags(entity);

        // Clean up powerups and bullets that fall off the bottom or go too far off-screen
        if (tags.includes('powerup') || tags.includes('bullet')) {
            if (position.y > canvasHeight + buffer || 
                position.x < -buffer || 
                position.x > canvasWidth + buffer ||
                position.y < -buffer) {
                this.world.destroyEntity(entity.id);
            }
        }
    }

    private getEntityTags(entity: Entity): string[] {
        const collision = this.world.getComponent(entity.id, 'CollisionComponent') as CollisionComponent;
        return collision ? collision.tags : [];
    }

    getEntities(): Entity[] {
        return this.entities;
    }

    getRequiredComponents(): string[] {
        return ['PositionComponent', 'MovementComponent'];
    }

    setEntities(entities: Entity[]): void {
        this.entities = entities;
    }
}