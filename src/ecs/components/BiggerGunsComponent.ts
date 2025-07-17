import { Component } from '../core/Component';

export class BiggerGunsComponent implements Component {
    public entityId: number;
    public duration: number;
    public bonusDamage: number;

    constructor(entityId: number, duration: number = 10) {
        this.entityId = entityId;
        this.duration = duration;
        this.bonusDamage = 25; // Additional damage
    }
}