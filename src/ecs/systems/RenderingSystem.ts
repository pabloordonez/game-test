import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { World } from '../core/World';
import { PositionComponent } from '../components/PositionComponent';
import { RenderComponent } from '../components/RenderComponent';
import { Canvas } from '../../core/Canvas';

export class RenderingSystem implements System {
    private entities: Entity[] = [];
    private world: World;
    private canvas: Canvas;

    constructor(world: World, canvas: Canvas) {
        this.world = world;
        this.canvas = canvas;
    }

    update(_deltaTime: number): void {
        // Rendering system doesn't need update logic
        // It only renders in the render method
    }

    render(): void {
        console.log(`RenderingSystem: Rendering ${this.entities.length} entities`);

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

        for (const entity of sortedEntities) {
            this.renderEntity(entity);
        }
    }

    private renderEntity(entity: Entity): void {
        const position = this.world.getComponent(entity.id, 'PositionComponent') as PositionComponent;
        const render = this.world.getComponent(entity.id, 'RenderComponent') as RenderComponent;

        if (!position || !render || !render.visible) return;

        // Save context state
        this.canvas.save();

        // Apply transformations
        this.canvas.translate(position.x, position.y);
        this.canvas.rotate(render.rotation);
        this.canvas.scale(render.scaleX, render.scaleY);

        // Set alpha
        this.canvas.setGlobalAlpha(render.alpha);

        // Render based on entity type
        this.renderEntityByType(entity, position, render);

        // Restore context state
        this.canvas.restore();
    }

    private renderEntityByType(entity: Entity, position: PositionComponent, render: RenderComponent): void {
        const tags = this.getEntityTags(entity);

        if (tags.includes('ship')) {
            this.renderShip(entity, position, render);
        } else if (tags.includes('bullet')) {
            this.renderBullet(entity, position, render);
        } else if (tags.includes('block')) {
            this.renderBlock(entity, position, render);
        } else if (tags.includes('powerup')) {
            this.renderPowerUp(entity, position, render);
        } else {
            // Default rendering
            this.renderDefault(entity, position, render);
        }
    }

    private renderShip(_entity: Entity, _position: PositionComponent, render: RenderComponent): void {
        // Render ship as a triangle pointing upward
        const context = this.canvas.getContext();
        context.beginPath();
        context.moveTo(0, -render.height / 2);
        context.lineTo(-render.width / 2, render.height / 2);
        context.lineTo(render.width / 2, render.height / 2);
        context.closePath();
        context.fillStyle = render.color;
        context.fill();
    }

    private renderBullet(_entity: Entity, _position: PositionComponent, render: RenderComponent): void {
        // Render bullet as a small circle
        this.canvas.drawCircle(0, 0, render.width / 2, render.color);
    }

    private renderBlock(_entity: Entity, _position: PositionComponent, render: RenderComponent): void {
        // Render block as a rectangle
        this.canvas.drawRect(-render.width / 2, -render.height / 2, render.width, render.height, render.color);

        // Add border
        const context = this.canvas.getContext();
        context.strokeStyle = '#000000';
        context.lineWidth = 1;
        context.strokeRect(-render.width / 2, -render.height / 2, render.width, render.height);
    }

    private renderPowerUp(_entity: Entity, _position: PositionComponent, render: RenderComponent): void {
        // Render power-up as a diamond shape
        const context = this.canvas.getContext();
        context.beginPath();
        context.moveTo(0, -render.height / 2);
        context.lineTo(render.width / 2, 0);
        context.lineTo(0, render.height / 2);
        context.lineTo(-render.width / 2, 0);
        context.closePath();
        context.fillStyle = render.color;
        context.fill();

        // Add sparkle effect
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        context.stroke();
    }

    private renderDefault(_entity: Entity, _position: PositionComponent, render: RenderComponent): void {
        // Default rectangle rendering
        this.canvas.drawRect(-render.width / 2, -render.height / 2, render.width, render.height, render.color);
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
        const collision = this.world.getComponent(entity.id, 'CollisionComponent');
        return collision ? (collision as any).tags : [];
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