import { Component } from '../core/Component';

export class RapidFireComponent implements Component {
    public entityId: number;
    public duration: number;
    public fireRateMultiplier: number;

    constructor(entityId: number, duration: number = 10) {
        this.entityId = entityId;
        this.duration = duration;
        this.fireRateMultiplier = 2.0; // Double fire rate
    }
}