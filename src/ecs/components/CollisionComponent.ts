import { Component } from '../core/Component';

export class CollisionComponent implements Component {
    public entityId: number;
    public width: number;
    public height: number;
    public isTrigger: boolean;
    public layer: string;
    public tags: string[];

    constructor(entityId: number, width: number, height: number, isTrigger: boolean = false) {
        this.entityId = entityId;
        this.width = width;
        this.height = height;
        this.isTrigger = isTrigger;
        this.layer = "default";
        this.tags = [];
    }
}