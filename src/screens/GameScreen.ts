import { BaseScreen, ScreenType, TransitionType } from './Screen';
import { Game } from '../core/Game';
import { InputManager } from '../core/InputManager';
import { Canvas } from '../core/Canvas';
import { RenderPipeline } from '../core/RenderPipeline';
import { World } from '../ecs/core/World';
import { Entity } from '../ecs/core/Entity';
import { RenderQueue } from '../core/RenderQueue';
import { MovementSystem } from '../ecs/systems/MovementSystem';
import { InputSystem } from '../ecs/systems/InputSystem';
import { CollisionSystem } from '../ecs/systems/CollisionSystem';
import { RenderingSystem } from '../ecs/systems/RenderingSystem';
import { HealthSystem } from '../ecs/systems/HealthSystem';
import { EffectSystem } from '../ecs/systems/EffectSystem';
import { Ship } from '../ecs/entities/Ship';
import { LevelManager } from '../levels/LevelManager';
import { HealthComponent } from '../ecs/components/HealthComponent';
import { CollisionComponent } from '../ecs/components/CollisionComponent';
import { RapidFireComponent } from '../ecs/components/RapidFireComponent';
import { BiggerGunsComponent } from '../ecs/components/BiggerGunsComponent';
import { SpeedBoostComponent } from '../ecs/components/SpeedBoostComponent';
import { ShieldComponent } from '../ecs/components/ShieldComponent';
import { SpreadShotComponent } from '../ecs/components/SpreadShotComponent';

export class GameScreen extends BaseScreen {
    private world: World;
    private inputManager: InputManager;
    private renderPipeline: RenderPipeline;
    private systems: any[] = [];
    private levelManager: LevelManager;
    private state: "idle" | "transitioning" = 'idle';
    private currentLevelNumber: number = 1;
    private playerShip: Entity | null = null;

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

        // Set up player death callback
        healthSystem.setPlayerDeathCallback(() => {
            this.handlePlayerDeath();
        });

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
        this.playerShip = Ship.create(this.world, 400, 550);
        console.log('Ship created with ID:', this.playerShip.id);

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
            this.handleLevelCompletion();
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

        // Display player health
        this.renderPlayerHealth(canvas);

        // Display active power-ups
        this.renderActivePowerUps(canvas);
    }

    private renderPlayerHealth(canvas: Canvas): void {
        const playerShip = this.getPlayerShip();
        if (playerShip) {
            const healthComponent = this.world.getComponent(playerShip.id, 'HealthComponent') as HealthComponent;
            if (healthComponent) {
                const healthText = `Health: ${healthComponent.currentHealth}/${healthComponent.maxHealth}`;
                canvas.drawText(healthText, 10, 70, '16px Arial', '#ffffff');

                // Draw health bar
                const barWidth = 200;
                const barHeight = 10;
                const barX = 10;
                const barY = 90;

                // Background bar (gray)
                canvas.drawRect(barX, barY, barWidth, barHeight, '#333333');

                // Health bar (red to green based on health percentage)
                const healthPercentage = healthComponent.currentHealth / healthComponent.maxHealth;
                const healthBarWidth = barWidth * healthPercentage;

                let healthColor = '#ff0000'; // Red for low health
                if (healthPercentage > 0.6) {
                    healthColor = '#00ff00'; // Green for high health
                } else if (healthPercentage > 0.3) {
                    healthColor = '#ffff00'; // Yellow for medium health
                }

                canvas.drawRect(barX, barY, healthBarWidth, barHeight, healthColor);
            }
        }
    }

    // Ensures we have a valid player ship reference, searches if cache is invalid
    private getPlayerShip(): Entity | null {
        // Check if cached reference is still valid
        if (this.playerShip) {
            const healthComponent = this.world.getComponent(this.playerShip.id, 'HealthComponent');
            if (healthComponent) {
                return this.playerShip; // Cache is valid
            }
        }

        // Cache is invalid, search for player ship and update cache
        this.playerShip = this.findPlayerShip();
        return this.playerShip;
    }

    // Fallback method for searching - used by getPlayerShip() when cache is invalid
    private findPlayerShip(): Entity | null {
        const entities = this.world.getAllEntities();
        for (const entity of entities) {
            const collisionComponent = this.world.getComponent(entity.id, 'CollisionComponent') as CollisionComponent;
            if (collisionComponent && collisionComponent.tags.includes('ship')) {
                return entity;
            }
        }
        return null;
    }

    private renderActivePowerUps(canvas: Canvas): void {
        const playerShip = this.getPlayerShip();
        if (!playerShip) return;

        const powerUps: { name: string; duration: number; color: string }[] = [];

        // Check for active power-ups
        const rapidFire = this.world.getComponent(playerShip.id, 'RapidFireComponent') as RapidFireComponent;
        if (rapidFire) {
            powerUps.push({ name: 'Rapid Fire', duration: rapidFire.duration, color: '#ffff00' });
        }

        const biggerGuns = this.world.getComponent(playerShip.id, 'BiggerGunsComponent') as BiggerGunsComponent;
        if (biggerGuns) {
            powerUps.push({ name: 'Bigger Guns', duration: biggerGuns.duration, color: '#ff0000' });
        }

        const speedBoost = this.world.getComponent(playerShip.id, 'SpeedBoostComponent') as SpeedBoostComponent;
        if (speedBoost) {
            powerUps.push({ name: 'Speed Boost', duration: speedBoost.duration, color: '#00ff00' });
        }

        const shield = this.world.getComponent(playerShip.id, 'ShieldComponent') as ShieldComponent;
        if (shield) {
            powerUps.push({ name: `Shield (${shield.strength})`, duration: shield.duration, color: '#0000ff' });
        }

        const spreadShot = this.world.getComponent(playerShip.id, 'SpreadShotComponent') as SpreadShotComponent;
        if (spreadShot) {
            powerUps.push({ name: 'Spread Shot', duration: spreadShot.duration, color: '#ff8800' });
        }

        // Render power-ups
        if (powerUps.length > 0) {
            canvas.drawText('Active Power-ups:', 600, 30, '16px Arial', '#ffffff');

            powerUps.forEach((powerUp, index) => {
                const y = 50 + index * 25;
                const timeText = `${Math.ceil(powerUp.duration)}s`;

                // Draw power-up name with color
                canvas.drawText(`${powerUp.name}: ${timeText}`, 600, y, '14px Arial', powerUp.color);

                // Draw duration bar
                const barWidth = 100;
                const barHeight = 6;
                const barX = 750;
                const barY = y - 8;

                // Background bar
                canvas.drawRect(barX, barY, barWidth, barHeight, '#333333');

                // Duration bar (assuming max duration of 10 seconds)
                const maxDuration = 10;
                const durationPercentage = Math.min(powerUp.duration / maxDuration, 1);
                const durationBarWidth = barWidth * durationPercentage;

                canvas.drawRect(barX, barY, durationBarWidth, barHeight, powerUp.color);
            });
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

    private handlePlayerDeath(): void {
        console.log('Player died! Restarting level...');
        this.restartLevel();
    }

    private restartLevel(): void {
        // Reset player health
        this.restorePlayerHealth();

        // Restart the current level
        this.levelManager.resetLevel();
        console.log('Level restarted');
    }

    private restorePlayerHealth(): void {
        const playerShip = this.getPlayerShip();
        if (playerShip) {
            const healthComponent = this.world.getComponent(playerShip.id, 'HealthComponent') as HealthComponent;
            if (healthComponent) {
                healthComponent.currentHealth = healthComponent.maxHealth;
            }
        }
    }

    private async handleLevelCompletion(): Promise<void> {
        console.log(`Level ${this.currentLevelNumber} completed!`);

        // Try to load the next level
        const nextLevelNumber = this.currentLevelNumber + 1;

        try {
            await this.levelManager.loadLevelFromFile(nextLevelNumber);
            this.currentLevelNumber = nextLevelNumber;
            this.state = 'idle';

            // Restore player health for the new level
            this.restorePlayerHealth();

            console.log(`Advanced to level ${nextLevelNumber}`);
        } catch (error) {
            // No more levels, return to intro screen
            console.log('No more levels available, returning to intro');
            this.requestScreenChange(ScreenType.INTRO, {
                type: TransitionType.FADE,
                duration: 1.5
            });
        }
    }
}