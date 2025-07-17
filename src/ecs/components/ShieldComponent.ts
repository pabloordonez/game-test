import { Component } from '../core/Component';

export class ShieldComponent implements Component {
    public entityId: number;
    public duration: number;
    public strength: number;

    constructor(entityId: number, duration: number = 10) {
        this.entityId = entityId;
        this.duration = duration;
        this.strength = 50; // Shield absorbs 50 damage
    }
}