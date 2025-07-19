import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { World } from '../core/World';
import { InputManager } from '../../core/InputManager';
import { PositionComponent } from '../components/PositionComponent';
import { MovementComponent } from '../components/MovementComponent';
import { WeaponComponent } from '../components/WeaponComponent';
import { CollisionComponent } from '../components/CollisionComponent';
import { RenderComponent } from '../components/RenderComponent';
import { RapidFireComponent } from '../components/RapidFireComponent';
import { BiggerGunsComponent } from '../components/BiggerGunsComponent';
import { SpreadShotComponent } from '../components/SpreadShotComponent';
import { AudioComponent, AudioEventType } from '../components/AudioComponent';

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
        if (this.inputManager.isFire() && this.canFire(entity, weapon, this.currentTime)) {
            this.fireBullet(entity, position, weapon);
            this.fireWeapon(weapon, this.currentTime);
        }
    }

    private canFire(entity: Entity, weapon: WeaponComponent, currentTime: number): boolean {
        const timeSinceLastFire = currentTime - weapon.lastFireTime;

        // Apply rapid fire effect if present
        let effectiveFireRate = weapon.fireRate;
        const rapidFire = this.world.getComponent(entity.id, 'RapidFireComponent') as RapidFireComponent;
        if (rapidFire) {
            effectiveFireRate *= rapidFire.fireRateMultiplier;
        }

        const fireInterval = 1 / effectiveFireRate;
        return timeSinceLastFire >= fireInterval;
    }

    private fireWeapon(weapon: WeaponComponent, currentTime: number): void {
        weapon.lastFireTime = currentTime;
    }

    private fireBullet(entity: Entity, position: PositionComponent, weapon: WeaponComponent): void {
        // Check for spread shot effect
        const spreadShot = this.world.getComponent(entity.id, 'SpreadShotComponent') as SpreadShotComponent;

        if (spreadShot) {
            // Fire multiple bullets in a spread pattern
            this.fireSpreadBullets(entity, position, weapon, spreadShot);
            this.triggerAudioEvent(entity, 'weapon_spread', 0.6);
        } else {
            // Fire single bullet
            this.createBullet(entity, position, weapon, 0); // 0 angle for straight shot
            this.triggerAudioEvent(entity, 'weapon_fire', 0.5);
        }
    }

    private fireSpreadBullets(entity: Entity, position: PositionComponent, weapon: WeaponComponent, spreadShot: SpreadShotComponent): void {
        const bulletCount = spreadShot.bulletCount;
        const spreadAngle = spreadShot.spreadAngle;

        for (let i = 0; i < bulletCount; i++) {
            // Calculate angle for each bullet
            const angle = (i - (bulletCount - 1) / 2) * (spreadAngle / (bulletCount - 1));
            this.createBullet(entity, position, weapon, angle);
        }
    }

    private createBullet(entity: Entity, position: PositionComponent, weapon: WeaponComponent, angle: number): void {
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

        // Set bullet velocity with angle consideration
        const bulletPosition = this.world.getComponent(bulletEntity.id, 'PositionComponent') as PositionComponent;
        if (bulletPosition) {
            // Convert angle to radians and apply
            const angleRad = (angle * Math.PI) / 180;
            bulletPosition.velocityX = Math.sin(angleRad) * weapon.bulletSpeed;
            bulletPosition.velocityY = -Math.cos(angleRad) * weapon.bulletSpeed;
        }

        // Add collision component
        const collisionComponent = new CollisionComponent(bulletEntity.id, 4, 8);
        collisionComponent.tags = ['bullet'];
        this.world.addComponent(bulletEntity.id, collisionComponent);

        // Add render component
        this.world.addComponent(bulletEntity.id, new RenderComponent(bulletEntity.id, 4, 8, '#ffff00'));

        // Calculate effective damage (apply BiggerGuns effect)
        let effectiveDamage = weapon.damage;
        const biggerGuns = this.world.getComponent(entity.id, 'BiggerGunsComponent') as BiggerGunsComponent;
        if (biggerGuns) {
            effectiveDamage += biggerGuns.bonusDamage;
        }

        // Add weapon component for damage
        this.world.addComponent(bulletEntity.id, new WeaponComponent(bulletEntity.id, 0, weapon.bulletType, effectiveDamage));
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