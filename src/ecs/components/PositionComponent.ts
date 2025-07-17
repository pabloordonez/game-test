import { Component } from '../core/Component';

export class PositionComponent implements Component {
    public entityId: number;
    public x: number;
    public y: number;
    public velocityX: number = 0;
    public velocityY: number = 0;

    constructor(entityId: number, x: number, y: number) {
        this.entityId = entityId;
        this.x = x;
        this.y = y;
    }
}