import { Component } from '../core/Component';

export enum PowerUpType {
    BIGGER_GUNS = "bigger_guns",
    RAPID_FIRE = "rapid_fire",
    SHIELD = "shield",
    SPEED_BOOST = "speed_boost",
    SPREAD_SHOT = "spread_shot",
    TIME_SLOWDOWN = "time_slowdown",
    TIME_SPEEDUP = "time_speedup",
    TIME_FREEZE = "time_freeze"
}

export class PowerUpComponent implements Component {
    public entityId: number;
    public powerUpType: PowerUpType;
    public duration: number;

    constructor(entityId: number, powerUpType: PowerUpType, duration: number = 10) {
        this.entityId = entityId;
        this.powerUpType = powerUpType;
        this.duration = duration;
    }
}