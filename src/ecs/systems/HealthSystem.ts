import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { World } from '../core/World';
import { HealthComponent } from '../components/HealthComponent';
import { CollisionComponent } from '../components/CollisionComponent';

export class HealthSystem implements System {
	private entities: Entity[] = [];
	private world: World;
	private onPlayerDeath?: () => void;

	constructor(world: World) {
		this.world = world;
	}

	setPlayerDeathCallback(callback: () => void): void {
		this.onPlayerDeath = callback;
	}

	update(deltaTime: number): void {
		for (const entity of this.entities) {
			const health = this.world.getComponent(entity.id, 'HealthComponent') as HealthComponent;
			if (health) {
				this.updateInvulnerability(health, deltaTime);

				// Check for death
				if (health.currentHealth <= 0) {
					this.handleEntityDeath(entity);
				}
			}
		}
	}

	private handleEntityDeath(entity: Entity): void {
		// Check if this is the player ship
		const collisionComponent = this.world.getComponent(entity.id, 'CollisionComponent') as CollisionComponent;
		if (collisionComponent && collisionComponent.tags.includes('ship')) {
			// Player died
			console.log('Player died!');
			if (this.onPlayerDeath) {
				this.onPlayerDeath();
			}
		}

		// Don't destroy the entity immediately - let the callback handle respawn/restart
	}

	private updateInvulnerability(health: HealthComponent, deltaTime: number): void {
		if (health.isInvulnerable) {
			health.invulnerabilityTime -= deltaTime;
			if (health.invulnerabilityTime <= 0) {
				health.isInvulnerable = false;
			}
		}
	}

	public damageEntity(health: HealthComponent, damage: number): boolean {
		if (health.isInvulnerable) return false;

		health.currentHealth = Math.max(0, health.currentHealth - damage);
		return health.currentHealth <= 0;
	}

	public healEntity(health: HealthComponent, amount: number): void {
		health.currentHealth = Math.min(health.maxHealth, health.currentHealth + amount);
	}

	public setInvulnerable(health: HealthComponent, duration: number): void {
		health.isInvulnerable = true;
		health.invulnerabilityTime = duration;
	}

	getEntities(): Entity[] {
		return this.entities;
	}

	getRequiredComponents(): string[] {
		return ['HealthComponent'];
	}

	setEntities(entities: Entity[]): void {
		this.entities = entities;
	}
}
