import { Component } from '../core/Component';

export class MovementComponent implements Component {
    public entityId: number;
    public speed: number;
    public acceleration: number;
    public deceleration: number;
    public maxSpeed: number;

    constructor(entityId: number, speed: number = 200, acceleration: number = 800, deceleration: number = 600, maxSpeed: number = 400) {
        this.entityId = entityId;
        this.speed = speed;
        this.acceleration = acceleration;
        this.deceleration = deceleration;
        this.maxSpeed = maxSpeed;
    }
}