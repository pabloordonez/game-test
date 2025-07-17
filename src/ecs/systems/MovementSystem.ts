import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { World } from '../core/World';
import { PositionComponent } from '../components/PositionComponent';
import { MovementComponent } from '../components/MovementComponent';

export class MovementSystem implements System {
    private entities: Entity[] = [];
    private world: World;

    constructor(world: World) {
        this.world = world;
    }

    update(deltaTime: number): void {
        console.log('MovementSystem update, deltaTime:', deltaTime, 'entities:', this.entities.length);

        for (const entity of this.entities) {
            const position = this.world.getComponent(entity.id, 'PositionComponent') as PositionComponent;
            const movement = this.world.getComponent(entity.id, 'MovementComponent') as MovementComponent;

            if (!position || !movement) continue;

            console.log('Entity', entity.id, 'position:', position.x, position.y, 'velocity:', position.velocityX, position.velocityY);

            // Apply velocity (deltaTime is in seconds, so multiply by 60 for 60 FPS equivalent)
            const timeScale = 60; // Scale to make movement feel responsive
            position.x += position.velocityX * deltaTime * timeScale;
            position.y += position.velocityY * deltaTime * timeScale;

            console.log('Entity', entity.id, 'new position:', position.x, position.y);

            // Apply deceleration
            if (position.velocityX !== 0) {
                const decelAmount = movement.deceleration * deltaTime * timeScale;
                if (Math.abs(position.velocityX) <= decelAmount) {
                    position.velocityX = 0;
                } else {
                    position.velocityX -= Math.sign(position.velocityX) * decelAmount;
                }
            }

            if (position.velocityY !== 0) {
                const decelAmount = movement.deceleration * deltaTime * timeScale;
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
        }
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