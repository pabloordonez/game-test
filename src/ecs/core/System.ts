import { Entity } from './Entity';

export abstract class System {
    abstract update(deltaTime: number): void;
    abstract getEntities(): Entity[];
    abstract getRequiredComponents(): string[];
    abstract setEntities?(entities: Entity[]): void;
}