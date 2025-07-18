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
import { AudioSystem } from '../ecs/systems/AudioSystem';
import { Ship } from '../ecs/entities/Ship';
import { LevelManager } from '../levels/LevelManager';
import { HealthComponent } from '../ecs/components/HealthComponent';
import { CollisionComponent } from '../ecs/components/CollisionComponent';
import { RapidFireComponent } from '../ecs/components/RapidFireComponent';
import { BiggerGunsComponent } from '../ecs/components/BiggerGunsComponent';
import { SpeedBoostComponent } from '../ecs/components/SpeedBoostComponent';
import { ShieldComponent } from '../ecs/components/ShieldComponent';
import { SpreadShotComponent } from '../ecs/components/SpreadShotComponent';
import { ParallaxBackground, ParallaxConfig } from '../background/ParallaxBackground';
import { ParallaxRenderer } from '../background/ParallaxRenderer';
import { ComponentCache } from '../utils/ComponentCache';

export class GameScreen extends BaseScreen {
	private world: World;
	private game: Game;
	private inputManager: InputManager;
	private renderPipeline: RenderPipeline;
	private audioManager: any;
	private parallaxBackground!: ParallaxBackground;
	private parallaxRenderer!: ParallaxRenderer;
	private systems: any[] = [];
	private levelManager: LevelManager;
	private state: 'idle' | 'transitioning' = 'idle';
	private currentLevelNumber: number = 1;
	private playerShip: Entity | null = null;

	constructor(game: Game) {
		super();
		this.game = game;
		this.world = new World(); // GameScreen owns its own World
		this.world.initialize(); // Initialize the ECS world
		this.inputManager = game.getInputManager();
		this.renderPipeline = game.getRenderPipeline();
		this.audioManager = game.getAudioManager();
		this.levelManager = new LevelManager(this.world);
		this.initializeParallaxBackground();
		this.setupSystems(game);
		this.createGameWorld();
	}

	update(deltaTime: number): void {
		// Update component cache
		const componentCache = this.world.getResource<ComponentCache>('componentCache');
		if (componentCache) {
			componentCache.update(deltaTime);
		}

		this.updateParallaxSpeed();
		this.parallaxBackground.update(deltaTime);
		this.world.updateSystems(deltaTime);
		this.levelManager.update(deltaTime);

		// Check for level completion
		if (this.levelManager.isLevelComplete() && this.state === 'idle') {
			this.state = 'transitioning';
			this.handleLevelCompletion();
		}
	}

	render(canvas: Canvas): void {
		// Update parallax background dimensions if needed
		const currentWidth = canvas.getWidth();
		const currentHeight = canvas.getHeight();
		this.parallaxBackground.resize(currentWidth, currentHeight);

		const renderQueue = this.world.getResource<RenderQueue>('renderQueue');
		if (renderQueue) this.renderPipeline.execute(renderQueue);

		this.parallaxRenderer.renderLayers(this.parallaxBackground.getLayers());
		this.renderLevelProgress(canvas);
		this.renderPerformanceInfo(canvas);
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

	private setupSystems(game: Game): void {
		// Set up resources first
		const renderQueue = new RenderQueue();
		renderQueue.setPerformanceMonitor(game.getPerformanceMonitor());
		this.world.setResource('renderQueue', renderQueue);
		this.world.setResource('componentCache', new ComponentCache(this.world));

		// Create and register systems
		const movementSystem = new MovementSystem(this.world);
		const inputSystem = new InputSystem(this.world, this.inputManager);
		const collisionSystem = new CollisionSystem(this.world, this.game.getPerformanceMonitor());
		const healthSystem = new HealthSystem(this.world);
		const effectSystem = new EffectSystem(this.world);
		const audioSystem = new AudioSystem(this.world, game.getAudioManager());
		const renderingSystem = new RenderingSystem(this.world);

		// Set up player death callback
		healthSystem.setPlayerDeathCallback(() => {
			this.handlePlayerDeath();
		});

		this.systems = [
			inputSystem, // Must run first to set input flags
			movementSystem, // Then apply movement based on input
			collisionSystem,
			healthSystem,
			effectSystem,
			audioSystem, // Process audio events
			renderingSystem // Process render data and queue commands
		];

		// Register systems with the world
		this.systems.forEach((system) => {
			this.world.registerSystem(system);
		});
	}

	private createGameWorld(): void {
		this.playerShip = Ship.create(this.world, 400, 550);
		console.log('Ship created with ID:', this.playerShip.id);

		this.levelManager
			.loadLevelFromFile(1)
			.then(() => {
				console.log('Level 1 loaded from file successfully');
			})
			.catch((error) => {
				console.error('Failed to load level 1:', error);
			});

		// Initialize audio
		this.initializeAudio();

		console.log('Total entities in world:', this.world.getEntityCount());
		console.log('Total systems registered:', this.world.getSystemCount());
	}

	private initializeParallaxBackground(): void {
		// Get canvas dimensions from the game's canvas
		// We'll initialize with default dimensions and update in render
		const config: ParallaxConfig = {
			layerCount: 6,
			baseSpeed: 20,
			speedMultiplier: 1.5,
			screenWidth: 800, // Default, will be updated
			screenHeight: 600, // Default, will be updated
			theme: 'space'
		};

		this.parallaxBackground = new ParallaxBackground(config);
		this.parallaxRenderer = new ParallaxRenderer(this.game.getCanvas());
	}

	private async initializeAudio(): Promise<void> {
		if (!this.audioManager) {
			console.warn('AudioManager not available');
			return;
		}

		try {
			// Preload all game sound effects
			console.log('Loading sound effects...');

			await this.audioManager.preloadSound('weapon_fire', '/assets/sounds/weapon_fire.wav');
			await this.audioManager.preloadSound('weapon_spread', '/assets/sounds/weapon_spread.wav');
			await this.audioManager.preloadSound('bullet_hit', '/assets/sounds/bullet_hit.wav');
			await this.audioManager.preloadSound('block_destroy', '/assets/sounds/block_destroy.wav');
			await this.audioManager.preloadSound('powerup_collect', '/assets/sounds/powerup_collect.wav');
			await this.audioManager.preloadSound('shield_hit', '/assets/sounds/shield_hit.wav');
			await this.audioManager.preloadSound('shield_break', '/assets/sounds/shield_break.wav');
			await this.audioManager.preloadSound('ship_damage', '/assets/sounds/ship_damage.wav');

			console.log('All sound effects loaded successfully!');
		} catch (error) {
			console.warn('Failed to load some audio files:', error);
			console.log('Game will continue without sound effects');
		}
	}

	private updateParallaxSpeed(): void {
		// Get player ship to check movement
		const playerShip = this.getPlayerShip();
		if (playerShip) {
			// Get player velocity to adjust parallax speed
			const positionComponent = this.world.getComponent(playerShip.id, 'PositionComponent') as any;
			if (positionComponent) {
				// Adjust speed based on player vertical movement
				// When ship moves up (negative velocityY), stars should move faster backward
				// When ship moves down (positive velocityY), stars should move slower
				const speedMultiplier = Math.max(0.1, 1.0 - positionComponent.velocityY * 0.01);
				this.parallaxBackground.setScrollSpeed(speedMultiplier);
			}
		}
	}

	private updateParallaxTheme(): void {
		// Change theme based on level or game state
		const currentLevel = this.currentLevelNumber;

		let theme: 'space' | 'nebula' | 'grid' | 'stars' = 'stars';
		if (currentLevel % 2 === 0) theme = 'space';
		if (currentLevel % 3 === 0) theme = 'nebula';
		if (currentLevel % 4 === 0) theme = 'grid';

		this.parallaxBackground.setTheme(theme);
		console.log(`Level theme changed to: ${theme} for level ${currentLevel}`);
	}

	private renderLevelProgress(canvas: Canvas): void {
		const progress = this.levelManager.getCurrentProgress();
		const progressText = `Level Progress: ${Math.round(progress * 100)}%`;

		canvas.drawText(progressText, 10, 30, '16px Arial', '#ffffff');

		const currentLevel = this.levelManager.getCurrentLevel();
		if (currentLevel) {
			canvas.drawText(`Level: ${currentLevel.name}`, 10, 50, '16px Arial', '#ffffff');
		}

		this.renderPlayerHealth(canvas);
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

	private renderPerformanceInfo(canvas: Canvas): void {
		const performanceMonitor = this.game.getPerformanceMonitor();
		const metrics = performanceMonitor.getMetrics();
		const status = performanceMonitor.getPerformanceStatus();

		// Position at top-right corner
		const x = canvas.getWidth() - 200;
		let y = canvas.getHeight() - 120;

		// Status indicator with color
		let statusColor = '#00ff00'; // Green for excellent
		if (status === 'good') statusColor = '#ffff00'; // Yellow for good
		else if (status === 'warning') statusColor = '#ff8800'; // Orange for warning
		else if (status === 'critical') statusColor = '#ff0000'; // Red for critical

		canvas.drawText(`Performance: ${status.toUpperCase()}`, x, y, '12px Arial', statusColor);
		y += 16;

		// FPS (most important metric)
		const fpsColor = metrics.fps >= 55 ? '#00ff00' : metrics.fps >= 30 ? '#ffff00' : '#ff0000';
		canvas.drawText(`FPS: ${metrics.fps.toFixed(0)}`, x, y, '12px Arial', fpsColor);
		y += 16;

		// Entity count
		canvas.drawText(`Entities: ${metrics.entityCount}`, x, y, '12px Arial', '#ffffff');
		y += 16;

		// Collision checks (performance indicator)
		const collisionColor = metrics.collisionChecks < 100 ? '#00ff00' : metrics.collisionChecks < 500 ? '#ffff00' : '#ff0000';
		canvas.drawText(`Collisions: ${metrics.collisionChecks}`, x, y, '12px Arial', collisionColor);
		y += 16;

		// Render calls (optimization indicator)
		const renderColor = metrics.renderCalls < 20 ? '#00ff00' : metrics.renderCalls < 50 ? '#ffff00' : '#ff0000';
		canvas.drawText(`Render Calls: ${metrics.renderCalls}`, x, y, '12px Arial', renderColor);
		y += 16;

		// Memory usage (if available)
		if (metrics.memoryUsage > 0) {
			const memoryColor = metrics.memoryUsage < 50 ? '#00ff00' : metrics.memoryUsage < 100 ? '#ffff00' : '#ff0000';
			canvas.drawText(`Memory: ${metrics.memoryUsage.toFixed(1)}MB`, x, y, '12px Arial', memoryColor);
			y += 16;
		}

		// Frame time variance (stability indicator)
		const variance = performanceMonitor.getFrameTimeVariance();
		const varianceColor = variance < 2 ? '#00ff00' : variance < 5 ? '#ffff00' : '#ff0000';
		canvas.drawText(`Frame Stability: ${variance.toFixed(1)}ms`, x, y, '12px Arial', varianceColor);
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
			this.updateParallaxTheme();

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
