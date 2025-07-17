import { Component } from '../core/Component';

export enum BulletType {
    BASIC = "basic",
    RAPID = "rapid",
    SPREAD = "spread",
    LASER = "laser"
}

export class WeaponComponent implements Component {
    public entityId: number;
    public fireRate: number;
    public bulletType: BulletType;
    public damage: number;
    public lastFireTime: number;
    public isAutomatic: boolean;
    public spreadAngle: number;
    public bulletSpeed: number;

    constructor(entityId: number, fireRate: number = 5, bulletType: BulletType = BulletType.BASIC, damage: number = 25) {
        this.entityId = entityId;
        this.fireRate = fireRate;
        this.bulletType = bulletType;
        this.damage = damage;
        this.lastFireTime = 0;
        this.isAutomatic = false;
        this.spreadAngle = 0;
        this.bulletSpeed = 14;
    }
}