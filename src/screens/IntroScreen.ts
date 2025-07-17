import { BaseScreen } from './Screen';
import { Canvas } from '../core/Canvas';
import { InputManager } from '../core/InputManager';
import { ScreenType, TransitionType } from './Screen';
import { AnimationSequencer, EasingFunctions } from '../animation';
import { StarParticleSystem } from '../particles';
import { Viewport } from '../utils/Viewport';
import { Vector2 } from '../utils/Math';

export class IntroScreen extends BaseScreen {
	private sequencer: AnimationSequencer;
	private starSystem: StarParticleSystem;
	private viewport: Viewport;
	private colors: string[];
	private isComplete: boolean;
	private isExpanding: boolean;

	constructor() {
		super();
		this.isComplete = false;
		this.isExpanding = false;
		this.colors = ['#F14F21', '#7EB900', '#00A3EE', '#FEB800'];
		this.viewport = new Viewport(800, 600); // Standard game viewport
		this.sequencer = new AnimationSequencer();
		this.starSystem = new StarParticleSystem(this.viewport.getCenterX(), this.viewport.getCenterY(), this.viewport.getWidth(), this.viewport.getHeight());
		this.initializeAnimations();
	}

	private initializeAnimations(): void {
		console.log('Initializing initial logo animation...');

		this.sequencer
			// Phase 1: Logo and text fade in together (0-2s)
			.fade('logoFade', 0, 1, 2, 0, EasingFunctions.easeIn)
			.fade('titleFade', 0, 1, 2, 0, EasingFunctions.easeIn)
			// Phase 2: "Press any key" prompt (appears at 2s, right after boxes complete)
			.fade('pressKey', 0, 1, 1, 2, EasingFunctions.easeIn);
	}

	private startExpansionAnimation(): void {
		console.log('Starting expansion animation...');
		const centerX = this.viewport.getCenterX();
		const centerY = this.viewport.getCenterY();

		// Create new sequencer for expansion animation
		this.sequencer = new AnimationSequencer();

		// Positions for the 4 boxes
		const startPositions: Vector2[] = [
			{ x: centerX - 23, y: centerY - 23 }, // Top-left
			{ x: centerX + 23, y: centerY - 23 }, // Top-right
			{ x: centerX - 23, y: centerY + 23 }, // Bottom-left
			{ x: centerX + 23, y: centerY + 23 } // Bottom-right
		];

		const targetPositions: Vector2[] = [
			{ x: 50, y: 50 }, // Top-left corner
			{ x: 750, y: 50 }, // Top-right corner
			{ x: 50, y: 550 }, // Bottom-left corner
			{ x: 750, y: 550 } // Bottom-right corner
		];

		// Movement animations for all 4 boxes (all start at t=0)
		this.sequencer
			.moveMultiple('movement', startPositions, targetPositions, 3, 0, EasingFunctions.easeOut)
			.fade('logoFade', 1, 0, 3, 0, EasingFunctions.easeOut)
			.scale('logoScale', 1, 2.5, 3, 0, EasingFunctions.easeOut)
			.fade('titleFade', 1, 0, 2, 0, EasingFunctions.easeOut)
			.fade('pressKey', 1, 0, 2, 0, EasingFunctions.easeOut);

		this.isExpanding = true;

		console.log('Expansion animation started');
	}

	update(deltaTime: number): void {
		if (!this.isActive) return;

		this.screenTime += deltaTime;
		this.sequencer.update(deltaTime);
		this.starSystem.update(deltaTime);

		// Check expansion animation completion (auto-transition to game)
		if (this.isExpanding && !this.isComplete && this.sequencer.isComplete()) {
			this.isExpanding = false;
			this.isComplete = true;
			this.requestScreenChange(ScreenType.GAME, { type: TransitionType.FADE, duration: 1.5 });
		}
	}

	render(canvas: Canvas): void {
		if (!this.isActive) return;

		// Clear canvas
		canvas.clear();

		this.renderStarParticles(canvas);
		this.renderWindowsLogo(canvas);
		this.renderMovingBoxes(canvas);

		// Draw appropriate prompt text
		const centerX = this.viewport.getCenterX();

		// ✨ NEW ACCESS: Named animation access
		const pressKeyAlpha = this.sequencer.getValue('pressKey');
		if (pressKeyAlpha > 0) {
			canvas.drawCenteredText('Press any key to start', centerX, 500, '24px Segoe UI', '#ffffff', pressKeyAlpha);
		}

		// Note: No text shown during/after expansion - automatic transition
	}

	private renderStarParticles(canvas: Canvas): void {
		const particles = this.starSystem.getParticles();

		for (const particle of particles) {
			if (particle.alpha > 0) {
				// Use dynamic radius from particle (grows over time and distance)
				canvas.drawCircle(particle.x, particle.y, particle.radius, particle.color, particle.alpha);
			}
		}
	}

	private renderWindowsLogo(canvas: Canvas): void {
		const centerX = this.viewport.getCenterX();
		const titleY = this.viewport.getCenterY() - 120; // Move "Stellar Breach" much higher
		const logoY = this.viewport.getCenterY() - 70; // Keep "Microsoft" above the squares

		const logoAlpha = this.sequencer.getValue('logoFade');
		const textAlpha = this.sequencer.getValue('titleFade');

		// Draw title first (well above logo)
		if (textAlpha > 0) {
			canvas.drawCenteredText('Stellar Breach', centerX, titleY, '28px Segoe UI', '#cccccc', textAlpha);
		}

		// Draw logo below title but above squares
		if (logoAlpha > 0) {
			canvas.drawCenteredText('Microsoft', centerX, logoY, '24px Segoe UI', '#ffffff', logoAlpha);
		}
	}

	private renderMovingBoxes(canvas: Canvas): void {
		// Don't render boxes after expansion is complete
		if (this.isComplete) return;

		const centerX = this.viewport.getCenterX();
		const centerY = this.viewport.getCenterY();

		// Centered box positions
		const centeredBoxPositions = [
			{ x: centerX - 23, y: centerY - 23 }, // Top-left square
			{ x: centerX + 23, y: centerY - 23 }, // Top-right square
			{ x: centerX - 23, y: centerY + 23 }, // Bottom-left square
			{ x: centerX + 23, y: centerY + 23 } // Bottom-right square
		];

		for (let i = 0; i < 4; i++) {
			const color = this.colors[i];

			let position = centeredBoxPositions[i];
			let alpha = 1;
			let scale = 1;

			if (this.isExpanding) {
				const movements = this.sequencer.getAnimation(`movement.${i}`);
				if (movements && (movements as any).getPosition) {
					position = (movements as any).getPosition();
				}
				scale = this.sequencer.getValue('logoScale');
			}

			// Reuse single animation values for all boxes
			alpha = this.sequencer.getValue('logoFade');
			if (alpha > 0) {
				// Calculate scaled size
				const size = 40 * scale;
				const halfSize = size / 2;

				// Draw squares that form the Windows symbol (scaled)
				canvas.drawRect(position.x - halfSize, position.y - halfSize, size, size, color, alpha);
			}
		}
	}

	handleInput(inputManager: InputManager): void {
		if (!this.isActive) return;

		// Check for any key press - expanded detection
		const anyKeyPressed =
			inputManager.isMoveLeft() ||
			inputManager.isMoveRight() ||
			inputManager.isFire() ||
			inputManager.isPause() ||
			inputManager.isKeyPressed('Space') ||
			inputManager.isKeyPressed('Enter') ||
			inputManager.isKeyPressed('KeyA') ||
			inputManager.isKeyPressed('KeyD') ||
			inputManager.isKeyPressed('KeyW') ||
			inputManager.isKeyPressed('KeyS') ||
			inputManager.isKeyPressed('ArrowLeft') ||
			inputManager.isKeyPressed('ArrowRight') ||
			inputManager.isKeyPressed('ArrowUp') ||
			inputManager.isKeyPressed('ArrowDown') ||
			inputManager.isKeyPressed('KeyZ') ||
			inputManager.isKeyPressed('KeyX') ||
			inputManager.isKeyPressed('Escape');

		if (anyKeyPressed) {
			// User pressed key to start expansion animation (only handles initial trigger)
			console.log('User triggered expansion animation');
			this.startExpansionAnimation();
		}
	}

	isAnimationComplete(): boolean {
		return this.isComplete;
	}
}
