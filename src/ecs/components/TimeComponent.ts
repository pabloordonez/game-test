import { Component } from '../core/Component';

export enum TimeEffectType {
    SLOWDOWN = "slowdown",
    SPEEDUP = "speedup",
    FREEZE = "freeze"
}

export class TimeComponent implements Component {
    public entityId: number;
    public timeScale: number;
    public duration: number;
    public effectType: TimeEffectType;
    public isActive: boolean;

    constructor(entityId: number, effectType: TimeEffectType, duration: number = 5) {
        this.entityId = entityId;
        this.effectType = effectType;
        this.duration = duration;
        this.timeScale = 1.0;
        this.isActive = false;
    }
}