import { BaseScreen, ScreenType, TransitionType } from './Screen';
import { Game } from '../core/Game';
import { InputManager } from '../core/InputManager';
import { Canvas } from '../core/Canvas';
import { RenderPipeline } from '../core/RenderPipeline';
import { World } from '../ecs/core/World';
import { RenderQueue } from '../core/RenderQueue';
import { MovementSystem } from '../ecs/systems/MovementSystem';
import { InputSystem } from '../ecs/systems/InputSystem';
import { CollisionSystem } from '../ecs/systems/CollisionSystem';
import { RenderingSystem } from '../ecs/systems/RenderingSystem';
import { HealthSystem } from '../ecs/systems/HealthSystem';
import { EffectSystem } from '../ecs/systems/EffectSystem';
import { Ship } from '../ecs/entities/Ship';
import { LevelManager } from '../levels/LevelManager';

export class GameScreen extends BaseScreen {
    private world: World;
    private inputManager: InputManager;
    private renderPipeline: RenderPipeline;
    private systems: any[] = [];
    private levelManager: LevelManager;
    private state: "idle" | "transitioning" = 'idle';

    constructor(game: Game) {
        super();
        this.world = new World(); // GameScreen owns its own World
        this.world.initialize(); // Initialize the ECS world
        this.inputManager = game.getInputManager();
        this.renderPipeline = game.getRenderPipeline();
        this.levelManager = new LevelManager(this.world);
        this.setupSystems();
        this.createGameWorld();
    }

    private setupSystems(): void {
        // Set up resources first
        this.world.setResource('renderQueue', new RenderQueue());

        // Create and register systems
        const movementSystem = new MovementSystem(this.world);
        const inputSystem = new InputSystem(this.world, this.inputManager);
        const collisionSystem = new CollisionSystem(this.world);
        const healthSystem = new HealthSystem(this.world);
        const effectSystem = new EffectSystem(this.world);
        const renderingSystem = new RenderingSystem(this.world);

        this.systems = [
            inputSystem,        // Must run first to set input flags
            movementSystem,     // Then apply movement based on input
            collisionSystem,
            healthSystem,
            effectSystem,
            renderingSystem     // Process render data and queue commands
        ];

        // Register systems with the world
        this.systems.forEach(system => {
            this.world.registerSystem(system);
        });
    }

        private createGameWorld(): void {
        const ship = Ship.create(this.world, 400, 550);
        console.log('Ship created with ID:', ship.id);

        this.levelManager.loadLevelFromFile(1).then(() => {
            console.log('Level 1 loaded from file successfully');
        }).catch((error) => {
            console.error('Failed to load level 1:', error);
        });

        console.log('Total entities in world:', this.world.getEntityCount());
        console.log('Total systems registered:', this.world.getSystemCount());
    }

    update(deltaTime: number): void {
        // Update ECS world systems (GameScreen owns the World)
        this.world.updateSystems(deltaTime);

        // Update level manager
        this.levelManager.update(deltaTime);

        // Check for level completion
        if (this.levelManager.isLevelComplete() && this.state === 'idle') {
            this.state = 'transitioning';
            this.requestScreenChange(ScreenType.INTRO, {
                type: TransitionType.FADE,
                duration: 1.5
            });
            // TODO: Handle level completion (advance to next level or show win screen)
        }
    }

    render(canvas: Canvas): void {
        // Update the render pipeline with the current canvas
        this.renderPipeline.updateCanvas(canvas);

        // Get the render queue from resources
        const renderQueue = this.world.getResource<RenderQueue>('renderQueue');
        if (renderQueue) {
            // Execute the render pipeline
            this.renderPipeline.execute(renderQueue);
        }

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