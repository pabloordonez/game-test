import { Component } from '../core/Component';

export class HealthComponent implements Component {
    public entityId: number;
    public currentHealth: number;
    public maxHealth: number;
    public isInvulnerable: boolean;
    public invulnerabilityTime: number;

    constructor(entityId: number, maxHealth: number = 100) {
        this.entityId = entityId;
        this.currentHealth = maxHealth;
        this.maxHealth = maxHealth;
        this.isInvulnerable = false;
        this.invulnerabilityTime = 0;
    }
}