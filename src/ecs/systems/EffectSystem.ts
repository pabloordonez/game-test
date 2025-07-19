import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { World } from '../core/World';
import { BiggerGunsComponent } from '../components/BiggerGunsComponent';
import { RapidFireComponent } from '../components/RapidFireComponent';
import { ShieldComponent } from '../components/ShieldComponent';
import { SpeedBoostComponent } from '../components/SpeedBoostComponent';
import { SpreadShotComponent } from '../components/SpreadShotComponent';

export class EffectSystem implements System {
	private entities: Entity[] = [];
	private world: World;

	constructor(world: World) {
		this.world = world;
	}

	update(deltaTime: number): void {
		for (const entity of this.entities) {
			// Update BiggerGuns effect
			const biggerGuns = this.world.getComponent(entity.id, 'BiggerGunsComponent') as BiggerGunsComponent;
			if (biggerGuns) {
				this.updateBiggerGuns(entity, biggerGuns, deltaTime);
			}

			// Update RapidFire effect
			const rapidFire = this.world.getComponent(entity.id, 'RapidFireComponent') as RapidFireComponent;
			if (rapidFire) {
				this.updateRapidFire(entity, rapidFire, deltaTime);
			}

			// Update Shield effect
			const shield = this.world.getComponent(entity.id, 'ShieldComponent') as ShieldComponent;
			if (shield) {
				this.updateShield(entity, shield, deltaTime);
			}

			// Update SpeedBoost effect
			const speedBoost = this.world.getComponent(entity.id, 'SpeedBoostComponent') as SpeedBoostComponent;
			if (speedBoost) {
				this.updateSpeedBoost(entity, speedBoost, deltaTime);
			}

			// Update SpreadShot effect
			const spreadShot = this.world.getComponent(entity.id, 'SpreadShotComponent') as SpreadShotComponent;
			if (spreadShot) {
				this.updateSpreadShot(entity, spreadShot, deltaTime);
			}
		}
	}

	private updateBiggerGuns(entity: Entity, effect: BiggerGunsComponent, deltaTime: number): void {
		effect.duration -= deltaTime;
		if (effect.duration <= 0) {
			// Remove the effect
			this.world.removeComponent(entity.id, 'BiggerGunsComponent');
			console.log('Bigger guns effect expired');
		}
	}

	private updateRapidFire(entity: Entity, effect: RapidFireComponent, deltaTime: number): void {
		effect.duration -= deltaTime;
		if (effect.duration <= 0) {
			// Remove the effect
			this.world.removeComponent(entity.id, 'RapidFireComponent');
			console.log('Rapid fire effect expired');
		}
	}

	private updateShield(entity: Entity, effect: ShieldComponent, deltaTime: number): void {
		effect.duration -= deltaTime;
		if (effect.duration <= 0) {
			// Remove the effect
			this.world.removeComponent(entity.id, 'ShieldComponent');
			console.log('Shield effect expired');
		}
	}

	private updateSpeedBoost(entity: Entity, effect: SpeedBoostComponent, deltaTime: number): void {
		effect.duration -= deltaTime;
		if (effect.duration <= 0) {
			// Remove the effect
			this.world.removeComponent(entity.id, 'SpeedBoostComponent');
			console.log('Speed boost effect expired');
		}
	}

	private updateSpreadShot(entity: Entity, effect: SpreadShotComponent, deltaTime: number): void {
		effect.duration -= deltaTime;
		if (effect.duration <= 0) {
			// Remove the effect
			this.world.removeComponent(entity.id, 'SpreadShotComponent');
			console.log('Spread shot effect expired');
		}
	}

	getEntities(): Entity[] {
		return this.entities;
	}

	getRequiredComponents(): string[] {
		return ['BiggerGunsComponent', 'RapidFireComponent', 'ShieldComponent', 'SpeedBoostComponent', 'SpreadShotComponent'];
	}

	setEntities(entities: Entity[]): void {
		this.entities = entities;
	}
}
