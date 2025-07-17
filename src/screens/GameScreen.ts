import { BaseScreen } from './Screen';
import { Canvas } from '../core/Canvas';
import { InputManager } from '../core/InputManager';
import { ScreenType } from './Screen';
import { World } from '../ecs/World';

export class GameScreen extends BaseScreen {
    private world: World;
    private inputManager: InputManager;
    private score: number = 0;
    private health: number = 100;
    private isPaused: boolean = false;

    constructor(world: World, inputManager: InputManager) {
        super();
        this.world = world;
        this.inputManager = inputManager;
    }

    update(deltaTime: number): void {
        if (!this.isActive || this.isPaused) return;

        this.screenTime += deltaTime;

        // Update ECS world
        this.world.updateSystems(deltaTime);

        // Handle gameplay input
        this.handleGameplayInput();
    }

    render(canvas: Canvas): void {
        if (!this.isActive) return;

        // Clear canvas
        canvas.clear();

        // Render game world
        this.world.render(canvas);

        // Render UI
        this.renderUI(canvas);

        // Render pause overlay if paused
        if (this.isPaused) {
            this.renderPauseOverlay(canvas);
        }
    }

    handleInput(inputManager: InputManager): void {
        if (!this.isActive) return;

        // Handle pause
        if (inputManager.isPause()) {
            this.togglePause();
        }

        // Handle gameplay input only when not paused
        if (!this.isPaused) {
            this.handleGameplayInput();
        }
    }

    private handleGameplayInput(): void {
        // Handle movement
        if (this.inputManager.isMoveLeft()) {
            // TODO: Move ship left
            console.log('Move left');
        }

        if (this.inputManager.isMoveRight()) {
            // TODO: Move ship right
            console.log('Move right');
        }

        // Handle firing
        if (this.inputManager.isFire()) {
            // TODO: Fire bullet
            console.log('Fire');
        }
    }

    private renderUI(canvas: Canvas): void {
        // Render score
        canvas.drawText(`Score: ${this.score}`, 50, 30, '20px Arial', '#ffffff');

        // Render health
        canvas.drawText(`Health: ${this.health}`, 50, 60, '20px Arial', '#ffffff');

        // Render game time
        const minutes = Math.floor(this.screenTime / 60);
        const seconds = Math.floor(this.screenTime % 60);
        canvas.drawText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, 50, 90, '20px Arial', '#ffffff');
    }

    private renderPauseOverlay(canvas: Canvas): void {
        // Semi-transparent overlay
        canvas.drawRect(0, 0, canvas.getWidth(), canvas.getHeight(), 'rgba(0, 0, 0, 0.5)');

        // Pause text
        canvas.drawText('PAUSED', 400, 300, '48px Arial', '#ffffff');
        canvas.drawText('Press ESC to resume', 400, 350, '24px Arial', '#cccccc');
    }

    private togglePause(): void {
        this.isPaused = !this.isPaused;
        console.log(this.isPaused ? 'Game paused' : 'Game resumed');
    }

    onEnter(): void {
        super.onEnter();
        console.log('Entering game screen');

        // Initialize game world if needed
        if (this.world.getEntityCount() === 0) {
            this.initializeGameWorld();
        }
    }

    onExit(): void {
        super.onExit();
        console.log('Exiting game screen');
    }

    private initializeGameWorld(): void {
        console.log('Initializing game world...');

        // TODO: Create initial game entities
        // - Ship entity
        // - Initial blocks
        // - Background elements

        console.log('Game world initialized');
    }

    getWorld(): World {
        return this.world;
    }

    isGamePaused(): boolean {
        return this.isPaused;
    }

    getScore(): number {
        return this.score;
    }

    getHealth(): number {
        return this.health;
    }

    addScore(points: number): void {
        this.score += points;
    }

    takeDamage(damage: number): void {
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.requestScreenChange(ScreenType.LOSE);
        }
    }

    private requestScreenChange(screenType: ScreenType): void {
        if (this.onScreenChangeRequest) {
            this.onScreenChangeRequest(screenType);
        }
    }

    // Callback to be set by Game class
    onScreenChangeRequest?: (screenType: ScreenType) => void;
}