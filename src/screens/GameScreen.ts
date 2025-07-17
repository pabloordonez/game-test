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
import { LevelManager } from '../levels/LevelManager';

export class GameScreen implements Screen {
    private world: World;
    private inputManager: InputManager;
    private systems: any[] = [];
    private renderingSystem: RenderingSystem | null = null;
    private levelManager: LevelManager;

    constructor(game: Game) {
        this.world = game.getWorld();
        this.inputManager = game.getInputManager();
        this.levelManager = new LevelManager(this.world);
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

        // Load level 1 from file
        this.levelManager.loadLevelFromFile(1).then(() => {
            console.log('Level 1 loaded from file successfully');
        }).catch((error) => {
            console.error('Failed to load level 1:', error);
        });

        // Debug: Check how many entities we have
        console.log('Total entities in world:', this.world.getEntityCount());
        console.log('Total systems registered:', this.world.getSystemCount());
    }

    update(deltaTime: number): void {
        // Update level manager
        this.levelManager.update(deltaTime);

        // Check for level completion
        if (this.levelManager.isLevelComplete()) {
            console.log('Level completed!');
            // TODO: Handle level completion (advance to next level or show win screen)
        }
    }

    render(canvas: Canvas): void {
        // Clear canvas
        canvas.clear();

        // Create rendering system with the canvas if not already created
        if (!this.renderingSystem) {
            this.renderingSystem = new RenderingSystem(this.world, canvas);
            this.world.registerSystem(this.renderingSystem);
        } else {
            // Update the canvas reference in case it changed
            (this.renderingSystem as any).canvas = canvas;
        }

        // Use the world's render method which will call the rendering system
        this.world.render(canvas);

        // Render level progress
        this.renderLevelProgress(canvas);
    }

    private renderLevelProgress(canvas: Canvas): void {
        const progress = this.levelManager.getCurrentProgress();
        const progressText = `Level Progress: ${Math.round(progress * 100)}%`;

        canvas.drawText(progressText, 10, 30, '16px Arial', '#ffffff');

        const currentLevel = this.levelManager.getCurrentLevel();
        if (currentLevel) {
            canvas.drawText(`Level: ${currentLevel.name}`, 10, 50, '16px Arial', '#ffffff');
        }
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