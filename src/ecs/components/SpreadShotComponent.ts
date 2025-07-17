import { Component } from '../core/Component';

export class SpreadShotComponent implements Component {
    public entityId: number;
    public duration: number;
    public spreadAngle: number;
    public bulletCount: number;

    constructor(entityId: number, duration: number = 10) {
        this.entityId = entityId;
        this.duration = duration;
        this.spreadAngle = 30; // 30 degrees spread
        this.bulletCount = 3; // Fire 3 bullets
    }
}