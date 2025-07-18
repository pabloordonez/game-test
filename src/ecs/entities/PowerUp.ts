import { World } from '../core/World';
import { Entity } from '../core/Entity';
import { PositionComponent } from '../components/PositionComponent';
import { MovementComponent } from '../components/MovementComponent';
import { CollisionComponent } from '../components/CollisionComponent';
import { RenderComponent } from '../components/RenderComponent';
import { PowerUpComponent, PowerUpType } from '../components/PowerUpComponent';

export { PowerUpType };

export class PowerUp {
    static create(world: World, x: number, y: number, powerUpType: PowerUpType = PowerUpType.BIGGER_GUNS): Entity {
        const entity = world.createEntity();

        // Add position component
        const position = new PositionComponent(entity.id, x, y);
        world.addComponent(entity.id, position);

        // Add movement component to make powerup fall down
        world.addComponent(entity.id, new MovementComponent(entity.id, 100, 0, 0, 100));

        // Set initial downward velocity
        position.velocityY = 100; // Fall downward

        // Add collision component with powerup tag
        const collisionComponent = new CollisionComponent(entity.id, 20, 20, true);
        collisionComponent.tags = ['powerup'];
        world.addComponent(entity.id, collisionComponent);

        // Add render component with color based on powerup type
        const color = PowerUp.getColorForType(powerUpType);
        world.addComponent(entity.id, new RenderComponent(entity.id, 20, 20, color));

        // Add powerup component
        world.addComponent(entity.id, new PowerUpComponent(entity.id, powerUpType));

        return entity;
    }

    static createBiggerGuns(world: World, x: number, y: number): Entity {
        return this.create(world, x, y, PowerUpType.BIGGER_GUNS);
    }

    static createRapidFire(world: World, x: number, y: number): Entity {
        return this.create(world, x, y, PowerUpType.RAPID_FIRE);
    }

    static createShield(world: World, x: number, y: number): Entity {
        return this.create(world, x, y, PowerUpType.SHIELD);
    }

    static createSpeedBoost(world: World, x: number, y: number): Entity {
        return this.create(world, x, y, PowerUpType.SPEED_BOOST);
    }

    static createSpreadShot(world: World, x: number, y: number): Entity {
        return this.create(world, x, y, PowerUpType.SPREAD_SHOT);
    }

    static createTimeSlowdown(world: World, x: number, y: number): Entity {
        return this.create(world, x, y, PowerUpType.TIME_SLOWDOWN);
    }

    static createTimeSpeedup(world: World, x: number, y: number): Entity {
        return this.create(world, x, y, PowerUpType.TIME_SPEEDUP);
    }

    static createTimeFreeze(world: World, x: number, y: number): Entity {
        return this.create(world, x, y, PowerUpType.TIME_FREEZE);
    }

    static createRandom(world: World, x: number, y: number): Entity {
        const powerUpTypes = Object.values(PowerUpType);
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        return this.create(world, x, y, randomType);
    }

    private static getColorForType(powerUpType: PowerUpType): string {
        switch (powerUpType) {
            case PowerUpType.BIGGER_GUNS:
                return '#ff0000'; // Red
            case PowerUpType.RAPID_FIRE:
                return '#ffff00'; // Yellow
            case PowerUpType.SHIELD:
                return '#0000ff'; // Blue
            case PowerUpType.SPEED_BOOST:
                return '#00ff00'; // Green
            case PowerUpType.SPREAD_SHOT:
                return '#ff8800'; // Orange
            case PowerUpType.TIME_SLOWDOWN:
                return '#8800ff'; // Purple
            case PowerUpType.TIME_SPEEDUP:
                return '#ff00ff'; // Magenta
            case PowerUpType.TIME_FREEZE:
                return '#00ffff'; // Cyan
            default:
                return '#ffffff'; // White
        }
    }
}