import { System } from './System';
import { Entity } from './Entity';

export interface SystemRegistration {
    system: System;
    requiredComponents: string[];
    entityList: Entity[];
    updateEntityList(): void;
}