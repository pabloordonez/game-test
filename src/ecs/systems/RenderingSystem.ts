import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { World } from '../core/World';
import { PositionComponent } from '../components/PositionComponent';
import { RenderComponent } from '../components/RenderComponent';
import { CollisionComponent } from '../components/CollisionComponent';
import { RenderQueue, RenderCommand } from '../../core/RenderQueue';

export class RenderingSystem implements System {
	private entities: Entity[] = [];
	private world: World;

	constructor(world: World) {
		this.world = world;
	}

	update(_deltaTime: number): void {
		// Get the render queue resource
		const renderQueue = this.world.getResource<RenderQueue>('renderQueue');
		if (!renderQueue) return;

		// Clear previous frame's commands at start of update
		renderQueue.clear();

		// Sort entities by render order (background first, UI last)
		const sortedEntities = [...this.entities].sort((a, b) => {
			const renderA = this.world.getComponent(a.id, 'RenderComponent') as RenderComponent;
			const renderB = this.world.getComponent(b.id, 'RenderComponent') as RenderComponent;

			if (!renderA || !renderB) return 0;

			// Simple render order based on entity type
			const orderA = this.getRenderOrder(a);
			const orderB = this.getRenderOrder(b);

			return orderA - orderB;
		});

		// Process each entity and queue render commands
		for (const entity of sortedEntities) {
			this.queueRenderCommand(entity, renderQueue);
		}
	}

	private queueRenderCommand(entity: Entity, renderQueue: RenderQueue): void {
		const position = this.world.getComponent(entity.id, 'PositionComponent') as PositionComponent;
		const render = this.world.getComponent(entity.id, 'RenderComponent') as RenderComponent;

		if (!position || !render || !render.visible) return;

		// Create render command based on entity type
		const tags = this.getEntityTags(entity);
		const command = this.createRenderCommand(entity, position, render, tags);

		if (command) {
			renderQueue.addCommand(command);
		}
	}

	private createRenderCommand(entity: Entity, position: PositionComponent, render: RenderComponent, tags: string[]): RenderCommand | null {
		const baseCommand = {
			x: position.x,
			y: position.y,
			width: render.width,
			height: render.height,
			color: render.color,
			alpha: render.alpha,
			rotation: render.rotation,
			scaleX: render.scaleX,
			scaleY: render.scaleY,
			entityId: entity.id,
			tags: tags
		};

		if (tags.includes('ship')) {
			return { ...baseCommand, type: 'triangle' as const };
		} else if (tags.includes('bullet')) {
			return { ...baseCommand, type: 'rect' as const };
		} else if (tags.includes('block')) {
			return { ...baseCommand, type: 'rect' as const };
		} else if (tags.includes('powerup')) {
			return { ...baseCommand, type: 'circle' as const, radius: Math.min(render.width, render.height) / 2 };
		} else {
			return { ...baseCommand, type: 'rect' as const };
		}
	}

	private getRenderOrder(entity: Entity): number {
		const tags = this.getEntityTags(entity);

		if (tags.includes('background')) return 0;
		if (tags.includes('block')) return 1;
		if (tags.includes('ship')) return 2;
		if (tags.includes('bullet')) return 3;
		if (tags.includes('powerup')) return 4;
		if (tags.includes('ui')) return 5;

		return 1; // Default order
	}

	private getEntityTags(entity: Entity): string[] {
		const collision = this.world.getComponent(entity.id, 'CollisionComponent') as CollisionComponent;
		return collision ? collision.tags : [];
	}

	getEntities(): Entity[] {
		return this.entities;
	}

	getRequiredComponents(): string[] {
		return ['PositionComponent', 'RenderComponent'];
	}

	setEntities(entities: Entity[]): void {
		this.entities = entities;
	}
}
