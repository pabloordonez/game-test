import { World } from '../core/World';
import { Entity } from '../core/Entity';
import { PositionComponent } from '../components/PositionComponent';
import { CollisionComponent } from '../components/CollisionComponent';
import { RenderComponent } from '../components/RenderComponent';
import { BlockComponent, BlockType } from '../components/BlockComponent';

export { BlockType };

export class Block {
    static create(world: World, x: number, y: number, blockType: BlockType = BlockType.NORMAL, color: string = '#ff0000'): Entity {
        const entity = world.createEntity();

        // Add position component
        world.addComponent(entity.id, new PositionComponent(entity.id, x, y));

        // Add collision component
        const collisionComponent = new CollisionComponent(entity.id, 40, 20);
        collisionComponent.tags = ['block'];
        world.addComponent(entity.id, collisionComponent);

        // Add render component
        world.addComponent(entity.id, new RenderComponent(entity.id, 40, 20, color));

        // Add block component
        world.addComponent(entity.id, new BlockComponent(entity.id, blockType, 100));

        return entity;
    }

    static createWeak(world: World, x: number, y: number): Entity {
        return this.create(world, x, y, BlockType.WEAK, '#ff6666');
    }

    static createNormal(world: World, x: number, y: number): Entity {
        return this.create(world, x, y, BlockType.NORMAL, '#ff0000');
    }

    static createStrong(world: World, x: number, y: number): Entity {
        return this.create(world, x, y, BlockType.STRONG, '#cc0000');
    }

    static createIndestructible(world: World, x: number, y: number): Entity {
        return this.create(world, x, y, BlockType.INDESTRUCTIBLE, '#666666');
    }
}