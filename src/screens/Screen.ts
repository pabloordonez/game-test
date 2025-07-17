import { Canvas } from '../core/Canvas';
import { InputManager } from '../core/InputManager';

export interface Screen {
    update(deltaTime: number): void;
    render(canvas: Canvas): void;
    onEnter(): void;
    onExit(): void;
    handleInput(inputManager: InputManager): void;
}

export enum ScreenType {
    INTRO = 'intro',
    MENU = 'menu',
    GAME = 'game',
    PAUSE = 'pause',
    WIN = 'win',
    LOSE = 'lose'
}

export abstract class BaseScreen implements Screen {
    protected isActive: boolean = false;
    protected screenTime: number = 0;

    abstract update(deltaTime: number): void;
    abstract render(canvas: Canvas): void;
    abstract handleInput(inputManager: InputManager): void;

    onEnter(): void {
        this.isActive = true;
        this.screenTime = 0;
        console.log(`Entering screen: ${this.constructor.name}`);
    }

    onExit(): void {
        this.isActive = false;
        console.log(`Exiting screen: ${this.constructor.name}`);
    }

    isScreenActive(): boolean {
        return this.isActive;
    }

    getScreenTime(): number {
        return this.screenTime;
    }
}