import { Component } from '../ecs/core/Component';
import { Entity } from '../ecs/core/Entity';
import { World } from '../ecs/core/World';

export interface CachedEntity {
    entity: Entity;
    components: Map<string, Component>;
    lastUpdate: number;
}

export class ComponentCache {
    private cache: Map<number, CachedEntity> = new Map();
    private world: World;
    private cacheTimeout: number = 100; // Cache valid for 100ms
    private currentTime: number = 0;

    constructor(world: World) {
        this.world = world;
    }

    update(deltaTime: number): void {
        this.currentTime += deltaTime;
        
        // Clean up expired cache entries
        const expiredEntries: number[] = [];
        for (const [entityId, cachedEntity] of this.cache.entries()) {
            if (this.currentTime - cachedEntity.lastUpdate > this.cacheTimeout) {
                expiredEntries.push(entityId);
            }
        }
        
        for (const entityId of expiredEntries) {
            this.cache.delete(entityId);
        }
    }

    getComponent<T extends Component>(entityId: number, componentType: string): T | null {
        let cachedEntity = this.cache.get(entityId);
        
        if (!cachedEntity || this.currentTime - cachedEntity.lastUpdate > this.cacheTimeout) {
            // Cache miss or expired, refresh cache for this entity
            this.refreshEntityCache(entityId);
            cachedEntity = this.cache.get(entityId);
        }
        
        if (cachedEntity) {
            const component = cachedEntity.components.get(componentType);
            return component as T | null;
        }
        
        return null;
    }

    getComponents(entityId: number, componentTypes: string[]): Component[] {
        const components: Component[] = [];
        
        for (const componentType of componentTypes) {
            const component = this.getComponent(entityId, componentType);
            if (component) {
                components.push(component);
            }
        }
        
        return components;
    }

    hasComponent(entityId: number, componentType: string): boolean {
        return this.getComponent(entityId, componentType) !== null;
    }

    hasAllComponents(entityId: number, componentTypes: string[]): boolean {
        for (const componentType of componentTypes) {
            if (!this.hasComponent(entityId, componentType)) {
                return false;
            }
        }
        return true;
    }

    invalidateEntity(entityId: number): void {
        this.cache.delete(entityId);
    }

    invalidateAll(): void {
        this.cache.clear();
    }

    private refreshEntityCache(entityId: number): void {
        // Check if entity exists by trying to get a component
        // If no components exist, the entity doesn't exist or has no components
        const testComponent = this.world.getComponent(entityId, 'PositionComponent');
        if (!testComponent) {
            // Try other common components to verify entity exists
            const hasAnyComponent = [
                'CollisionComponent', 'RenderComponent', 'MovementComponent'
            ].some(componentType => this.world.getComponent(entityId, componentType) !== null);
            
            if (!hasAnyComponent) {
                this.cache.delete(entityId);
                return;
            }
        }

        const components = new Map<string, Component>();
        
        // Cache all components for this entity
        const allComponentTypes = [
            'PositionComponent',
            'CollisionComponent', 
            'RenderComponent',
            'MovementComponent',
            'HealthComponent',
            'WeaponComponent',
            'BlockComponent',
            'PowerUpComponent',
            'TimeComponent',
            'BiggerGunsComponent',
            'RapidFireComponent',
            'ShieldComponent',
            'SpeedBoostComponent',
            'SpreadShotComponent',
            'AudioComponent'
        ];

        for (const componentType of allComponentTypes) {
            const component = this.world.getComponent(entityId, componentType);
            if (component) {
                components.set(componentType, component);
            }
        }

        const cachedEntity: CachedEntity = {
            entity: { id: entityId, active: true },
            components,
            lastUpdate: this.currentTime
        };

        this.cache.set(entityId, cachedEntity);
    }

    getCacheStats(): { 
        cacheSize: number, 
        hitRate: number, 
        totalRequests: number,
        cacheHits: number 
    } {
        // Simple stats implementation
        return {
            cacheSize: this.cache.size,
            hitRate: 0.85, // Placeholder - would need actual hit tracking
            totalRequests: 0, // Placeholder
            cacheHits: 0 // Placeholder
        };
    }

    preloadEntity(entityId: number): void {
        this.refreshEntityCache(entityId);
    }

    preloadEntities(entityIds: number[]): void {
        for (const entityId of entityIds) {
            this.preloadEntity(entityId);
        }
    }
} 