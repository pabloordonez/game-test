import { Component } from '../core/Component';

export class RenderComponent implements Component {
    public entityId: number;
    public width: number;
    public height: number;
    public color: string;
    public alpha: number;
    public visible: boolean;
    public rotation: number;
    public scaleX: number;
    public scaleY: number;
    public sprite: string | null;

    constructor(entityId: number, width: number, height: number, color: string = "#ffffff") {
        this.entityId = entityId;
        this.width = width;
        this.height = height;
        this.color = color;
        this.alpha = 1.0;
        this.visible = true;
        this.rotation = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.sprite = null;
    }
}