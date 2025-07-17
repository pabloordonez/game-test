import { Component } from '../core/Component';

export class SpeedBoostComponent implements Component {
    public entityId: number;
    public duration: number;
    public speedMultiplier: number;

    constructor(entityId: number, duration: number = 10) {
        this.entityId = entityId;
        this.duration = duration;
        this.speedMultiplier = 1.5; // 50% speed increase
    }
}