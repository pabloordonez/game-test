import { Screen } from './Screen';
import { Game } from '../core/Game';
import { InputManager } from '../core/InputManager';
import { Canvas } from '../core/Canvas';
import { World } from '../ecs/core/World';
import { MovementSystem } from '../ecs/systems/MovementSystem';
import { InputSystem } from '../ecs/systems/InputSystem';
import { CollisionSystem } from '../ecs/systems/CollisionSystem';
import { RenderingSystem } from '../ecs/systems/RenderingSystem';
import { HealthSystem } from '../ecs/systems/HealthSystem';
import { EffectSystem } from '../ecs/systems/EffectSystem';
import { Ship } from '../ecs/entities/Ship';
import { Block } from '../ecs/entities/Block';

export class GameScreen implements Screen {
    private world: World;
    private inputManager: InputManager;
    private systems: any[] = [];
    private renderingSystem: RenderingSystem | null = null;

    constructor(game: Game) {
        this.world = new World();
        this.inputManager = game.getInputManager();
        this.setupSystems();
        this.createGameWorld();
    }

    private setupSystems(): void {
        // Create and register systems
        const movementSystem = new MovementSystem(this.world);
        const inputSystem = new InputSystem(this.world, this.inputManager);
        const collisionSystem = new CollisionSystem(this.world);
        const healthSystem = new HealthSystem(this.world);
        const effectSystem = new EffectSystem(this.world);

        this.systems = [
            movementSystem,
            inputSystem,
            collisionSystem,
            healthSystem,
            effectSystem
        ];

        // Register systems with the world
        this.systems.forEach(system => {
            this.world.registerSystem(system);
        });
    }

    private createGameWorld(): void {
        // Create ship
        const ship = Ship.create(this.world, 400, 550);
        console.log('Ship created with ID:', ship.id);

        // Create some blocks
        for (let i = 0; i < 5; i++) {
            const block = Block.create(this.world, 100 + i * 150, 100);
            console.log('Block created with ID:', block.id);
        }
    }

    update(deltaTime: number): void {
        this.world.updateSystems(deltaTime);
    }

    render(canvas: Canvas): void {
        // Clear canvas
        canvas.clear();

        // Create and register rendering system if not already done
        if (!this.renderingSystem) {
            this.renderingSystem = new RenderingSystem(this.world, canvas);
            this.world.registerSystem(this.renderingSystem);
        } else {
            // Update the canvas reference in case it changed
            (this.renderingSystem as any).canvas = canvas;
        }

        // Use the world's render method which will call the rendering system
        this.world.render(canvas);
    }

    renderWithTransition(canvas: Canvas): void {
        this.render(canvas);
    }

    handleInput(_inputManager: InputManager): void {
        // Input is handled by InputSystem
    }

    onEnter(): void {
        console.log('Entering GameScreen');
    }

    onExit(): void {
        console.log('Exiting GameScreen');
    }
}