import { World } from '../core/World';
import { Entity } from '../core/Entity';
import { PositionComponent } from '../components/PositionComponent';
import { MovementComponent } from '../components/MovementComponent';
import { HealthComponent } from '../components/HealthComponent';
import { WeaponComponent, BulletType } from '../components/WeaponComponent';
import { CollisionComponent } from '../components/CollisionComponent';
import { RenderComponent } from '../components/RenderComponent';

export class Ship {
    static create(world: World, x: number, y: number): Entity {
        const entity = world.createEntity();

        // Add position component
        world.addComponent(entity.id, new PositionComponent(entity.id, x, y));

        // Add movement component with faster, responsive values
        // speed, acceleration, deceleration, maxSpeed
        world.addComponent(entity.id, new MovementComponent(entity.id, 400, 500, 400, 350));

        // Add health component
        world.addComponent(entity.id, new HealthComponent(entity.id, 100));

        // Add weapon component
        world.addComponent(entity.id, new WeaponComponent(entity.id, 5, BulletType.BASIC, 25));

        // Add collision component
        const collisionComponent = new CollisionComponent(entity.id, 30, 30);
        collisionComponent.tags = ['ship'];
        world.addComponent(entity.id, collisionComponent);

        // Add render component
        world.addComponent(entity.id, new RenderComponent(entity.id, 30, 30, '#00ff00'));

        return entity;
    }
}