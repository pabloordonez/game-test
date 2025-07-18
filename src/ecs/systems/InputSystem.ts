import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { World } from '../core/World';
import { InputManager } from '../../core/InputManager';
import { PositionComponent } from '../components/PositionComponent';
import { MovementComponent } from '../components/MovementComponent';
import { WeaponComponent } from '../components/WeaponComponent';
import { CollisionComponent } from '../components/CollisionComponent';
import { RenderComponent } from '../components/RenderComponent';

export class InputSystem implements System {
    private entities: Entity[] = [];
    private world: World;
    private inputManager: InputManager;
    private currentTime: number = 0;

    constructor(world: World, inputManager: InputManager) {
        this.world = world;
        this.inputManager = inputManager;
    }

    update(deltaTime: number): void {
        this.currentTime += deltaTime;

        // Reset input flags for all movement components first
        for (const entity of this.entities) {
            const movement = this.world.getComponent(entity.id, 'MovementComponent') as MovementComponent;
            if (movement) {
                movement.hasInputX = false;
                movement.hasInputY = false;
            }
        }

        for (const entity of this.entities) {
            const position = this.world.getComponent(entity.id, 'PositionComponent') as PositionComponent;
            const movement = this.world.getComponent(entity.id, 'MovementComponent') as MovementComponent;
            const weapon = this.world.getComponent(entity.id, 'WeaponComponent') as WeaponComponent;

            if (!position || !movement) continue;

            this.handleMovement(entity, position, movement, deltaTime);

            if (weapon) {
                this.handleWeapon(entity, position, weapon);
            }
        }
    }

    private handleMovement(entity: Entity, position: PositionComponent, movement: MovementComponent, deltaTime: number): void {
        let inputX = 0;
        let inputY = 0;

        // Handle horizontal movement
        if (this.inputManager.isMoveLeft()) {
            inputX = -1;
        } else if (this.inputManager.isMoveRight()) {
            inputX = 1;
        }

        // Handle vertical movement
        if (this.inputManager.isMoveUp()) {
            inputY = -1;
        } else if (this.inputManager.isMoveDown()) {
            inputY = 1;
        }

        // Track input state for inertia system
        movement.hasInputX = inputX !== 0;
        movement.hasInputY = inputY !== 0;

        // Apply acceleration based on input (using proper deltaTime)
        if (inputX !== 0) {
            position.velocityX += inputX * movement.acceleration * deltaTime;
        }
        if (inputY !== 0) {
            position.velocityY += inputY * movement.acceleration * deltaTime;
        }

        // Clamp velocity to max speed
        const speed = Math.sqrt(position.velocityX * position.velocityX + position.velocityY * position.velocityY);
        if (speed > movement.maxSpeed) {
            const scale = movement.maxSpeed / speed;
            position.velocityX *= scale;
            position.velocityY *= scale;
        }

        // Apply screen boundaries for ship
        const tags = this.getEntityTags(entity);
        if (tags.includes('ship')) {
            this.applyScreenBoundaries(position);
        }
    }

    private handleWeapon(entity: Entity, position: PositionComponent, weapon: WeaponComponent): void {
        // Handle firing
        if (this.inputManager.isFire() && this.canFire(weapon, this.currentTime)) {
            this.fireBullet(entity, position, weapon);
            this.fireWeapon(weapon, this.currentTime);
        }
    }

    private canFire(weapon: WeaponComponent, currentTime: number): boolean {
        const timeSinceLastFire = currentTime - weapon.lastFireTime;
        const fireInterval = 1 / weapon.fireRate;
        return timeSinceLastFire >= fireInterval;
    }

    private fireWeapon(weapon: WeaponComponent, currentTime: number): void {
        weapon.lastFireTime = currentTime;
    }

    private fireBullet(_entity: Entity, position: PositionComponent, weapon: WeaponComponent): void {
        // Create bullet entity
        const bulletEntity = this.world.createEntity();

        // Calculate bullet position (in front of ship)
        const bulletX = position.x;
        const bulletY = position.y - 30; // 30 pixels in front of ship

        // Add components to bullet
        this.world.addComponent(bulletEntity.id, new PositionComponent(bulletEntity.id, bulletX, bulletY));

        // Create movement component with proper parameters for bullets
        const bulletMovement = new MovementComponent(
            bulletEntity.id,
            weapon.bulletSpeed, // speed
            0, // acceleration (bullets don't accelerate)
            0, // deceleration (bullets don't decelerate)
            weapon.bulletSpeed // maxSpeed
        );
        this.world.addComponent(bulletEntity.id, bulletMovement);

        // Set bullet velocity (moving upward)
        const bulletPosition = this.world.getComponent(bulletEntity.id, 'PositionComponent') as PositionComponent;
        if (bulletPosition) {
            bulletPosition.velocityY = -weapon.bulletSpeed;
        }

        // Add collision component
        const collisionComponent = new CollisionComponent(bulletEntity.id, 4, 8);
        collisionComponent.tags = ['bullet'];
        this.world.addComponent(bulletEntity.id, collisionComponent);

        // Add render component
        this.world.addComponent(bulletEntity.id, new RenderComponent(bulletEntity.id, 4, 8, '#ffff00'));

        // Add weapon component for damage
        this.world.addComponent(bulletEntity.id, new WeaponComponent(bulletEntity.id, 0, weapon.bulletType, weapon.damage));

        console.log('Bullet created with velocity:', bulletPosition?.velocityY, 'maxSpeed:', bulletMovement.maxSpeed);
    }

    private applyScreenBoundaries(position: PositionComponent): void {
        const canvasWidth = 800; // TODO: Get from canvas
        const canvasHeight = 600; // TODO: Get from canvas
        const shipWidth = 30; // TODO: Get from render component
        const shipHeight = 30; // TODO: Get from render component

        // Horizontal boundaries
        if (position.x - shipWidth / 2 < 0) {
            position.x = shipWidth / 2;
            position.velocityX = 0;
        } else if (position.x + shipWidth / 2 > canvasWidth) {
            position.x = canvasWidth - shipWidth / 2;
            position.velocityX = 0;
        }

        // Vertical boundaries (ship can move within screen bounds)
        if (position.y - shipHeight / 2 < 0) {
            position.y = shipHeight / 2;
            position.velocityY = 0;
        } else if (position.y + shipHeight / 2 > canvasHeight) {
            position.y = canvasHeight - shipHeight / 2;
            position.velocityY = 0;
        }
    }

    private getEntityTags(entity: Entity): string[] {
        const collision = this.world.getComponent(entity.id, 'CollisionComponent');
        return collision ? (collision as any).tags : [];
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