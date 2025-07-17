import { Entity } from './Entity';

export interface System {
    update(deltaTime: number): void;
    getEntities(): Entity[];
    getRequiredComponents(): string[];
}