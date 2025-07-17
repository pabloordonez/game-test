import { Entity } from './Entity';
import { Component } from './Component';
import { System } from './System';
import { SystemRegistration } from './SystemRegistration';

export class World {
    private entities: Map<number, Entity> = new Map();
    private components: Map<string, Map<number, Component>> = new Map();
    private systems: SystemRegistration[] = [];
    private nextEntityId: number = 1;
    private isInitialized: boolean = false;

    constructor() {
        // Initialize component storage
        this.components = new Map();
    }

    initialize(): void {
        this.isInitialized = true;
        console.log('ECS World initialized');
    }

    createEntity(): Entity {
        const entity: Entity = {
            id: this.nextEntityId++,
            active: true
        };

        this.entities.set(entity.id, entity);
        return entity;
    }

    destroyEntity(entityId: number): void {
        const entity = this.entities.get(entityId);
        if (entity) {
            entity.active = false;
            this.entities.delete(entityId);

            // Remove all components for this entity
            for (const [componentType, componentMap] of this.components) {
                componentMap.delete(entityId);
            }

            // Update system entity lists
            this.updateSystemEntityLists();
        }
    }

    addComponent(entityId: number, component: Component): void {
        const componentType = component.constructor.name;

        if (!this.components.has(componentType)) {
            this.components.set(componentType, new Map());
        }

        this.components.get(componentType)!.set(entityId, component);

        // Update system entity lists
        this.updateSystemEntityLists();
    }

    removeComponent(entityId: number, componentType: string): void {
        const componentMap = this.components.get(componentType);
        if (componentMap) {
            componentMap.delete(entityId);
            this.updateSystemEntityLists();
        }
    }

    getComponents(entityId: number): Component[] {
        const components: Component[] = [];

        for (const [componentType, componentMap] of this.components) {
            const component = componentMap.get(entityId);
            if (component) {
                components.push(component);
            }
        }

        return components;
    }

    getComponent<T extends Component>(entityId: number, componentType: string): T | null {
        const componentMap = this.components.get(componentType);
        if (componentMap) {
            return componentMap.get(entityId) as T || null;
        }
        return null;
    }

    registerSystem(system: System): void {
        const requiredComponents = system.getRequiredComponents();
        const entityList: Entity[] = [];

        const registration: SystemRegistration = {
            system,
            requiredComponents,
            entityList,
            updateEntityList: () => this.updateEntityListForSystem(registration)
        };

        this.systems.push(registration);
        this.updateEntityListForSystem(registration);
    }

    private updateEntityListForSystem(registration: SystemRegistration): void {
        const { system, requiredComponents, entityList } = registration;

        // Clear current entity list
        entityList.length = 0;

        // Find entities that have all required components
        for (const [entityId, entity] of this.entities) {
            if (!entity.active) continue;

            let hasAllComponents = true;
            for (const componentType of requiredComponents) {
                if (!this.getComponent(entityId, componentType)) {
                    hasAllComponents = false;
                    break;
                }
            }

            if (hasAllComponents) {
                entityList.push(entity);
            }
        }
    }

    private updateSystemEntityLists(): void {
        for (const registration of this.systems) {
            registration.updateEntityList();
        }
    }

    updateSystems(deltaTime: number): void {
        for (const registration of this.systems) {
            registration.system.update(deltaTime);
        }
    }

    render(canvas: any): void {
        // For now, just a placeholder
        // Rendering will be handled by specific rendering systems
    }

    getEntityCount(): number {
        return this.entities.size;
    }

    getSystemCount(): number {
        return this.systems.length;
    }
}