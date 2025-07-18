import { BaseScreen } from './Screen';
import { Canvas } from '../core/Canvas';
import { InputManager } from '../core/InputManager';
import { ScreenType, TransitionType } from './Screen';
import { AnimationSequencer, AnimationTimeline, EasingFunctions } from '../animation';
import { StarParticleSystem } from '../particles';
import { Viewport } from '../utils/Viewport';
import { Vector2 } from '../utils/Math';

type ScreenState = 'initial' | 'fadingIn' | 'waitingForInput' | 'expanding' | 'complete';
type StateRenderMethod = (canvas: Canvas) => void;
type StateInputHandler = (inputManager: InputManager) => void;

export class IntroScreen extends BaseScreen {
	private state: ScreenState = 'initial';
	private timeline: AnimationTimeline;
	private starSystem: StarParticleSystem;
	private viewport: Viewport;
	private colors: string[];
	private stateRenderers: Partial<Record<ScreenState, StateRenderMethod>>;
	private stateInputHandlers: Partial<Record<ScreenState, StateInputHandler>>;

	constructor() {
		super();
		this.colors = ['#F14F21', '#7EB900', '#00A3EE', '#FEB800'];
		this.viewport = new Viewport(800, 600); // Standard game viewport
		this.timeline = new AnimationTimeline();
		this.starSystem = new StarParticleSystem(this.viewport.getCenterX(), this.viewport.getCenterY(), this.viewport.getWidth(), this.viewport.getHeight());
		this.stateRenderers = {};
		this.stateInputHandlers = {};
		this.state = 'fadingIn';
		this.initialize();
	}

	private initialize(): void {
		console.log('Initializing sequences...');

		this.timeline
			.sequence('fadingIn')
			.at(0)
			.for(2)
			.easeWith(EasingFunctions.easeIn)
			.fade('logoAlpha', 0, 1)
			.fade('titleAlpha', 0, 1)
			.at(2)
			.for(1)
			.fade('pressKeyAlpha', 0, 1)
			.onEnd(() => this.changeState('waitingForInput'));

		this.timeline
			.sequence('expanding')
			.at(0)
			.for(3)
			.easeWith(EasingFunctions.easeOut)
			.moveMultiple('boxMovement', this.getStartPositions(), this.getTargetPositions())
			.fade('logoAlpha', 1, 0)
			.scale('logoScale', 1, 2.5)
			.for(2)
			.fade('titleAlpha', 1, 0)
			.fade('pressKeyAlpha', 1, 0)
			.onStart(() => this.changeState('expanding'))
			.onEnd(() => {
				this.changeState('complete');
				this.requestScreenChange(ScreenType.GAME, {
					type: TransitionType.FADE,
		 			duration: 1.5
				});
			});

		this.stateRenderers = {
			fadingIn: this.renderFadingIn.bind(this),
			waitingForInput: this.renderWaitingForInput.bind(this),
			expanding: this.renderExpanding.bind(this)
		};

		this.stateInputHandlers = {
			waitingForInput: this.handleWaitingForInputInput.bind(this)
		};

		this.timeline.startSequence('fadingIn');
	}

	update(deltaTime: number): void {
		if (!this.isActive) return;

		this.screenTime += deltaTime;
		this.timeline.update(deltaTime);
		this.starSystem.update(deltaTime);
	}

	render(canvas: Canvas): void {
		if (!this.isActive) return;
		canvas.clear();
		this.renderStarParticles(canvas);
		if (this.stateRenderers[this.state]) {
			this.stateRenderers[this.state]!(canvas);
		}
	}

	handleInput(inputManager: InputManager): void {
		if (!this.isActive) return;
		if (this.stateInputHandlers[this.state]) {
			this.stateInputHandlers[this.state]!(inputManager);
		}
	}

	private changeState(state: ScreenState): void {
		console.log(`Changing state from ${this.state} to ${state}`);
		this.state = state;
	}

	private renderStarParticles(canvas: Canvas): void {
		const particles = this.starSystem.getParticles();

		for (const particle of particles) {
			if (particle.alpha > 0) {
				canvas.drawCircle(particle.x, particle.y, particle.radius, particle.color, particle.alpha);
			}
		}
	}

	private getStartPositions(): Vector2[] {
		const centerX = this.viewport.getCenterX();
		const centerY = this.viewport.getCenterY();
		const boxSize = 40;
		const separation = 2;
		const displacement = boxSize + separation;

		return [
			{ x: centerX - displacement, y: centerY - displacement }, // Top-left
			{ x: centerX + separation, y: centerY - displacement }, // Top-right
			{ x: centerX - displacement, y: centerY + separation }, // Bottom-left
			{ x: centerX + separation, y: centerY + separation } // Bottom-right
		];
	}

	private getTargetPositions(): Vector2[] {
		const viewportWidth = this.viewport.getWidth();
		const viewportHeight = this.viewport.getHeight();
		const boxSize = 40 * 2.5;

		return [
			{ x: 0, y: 0 },
			{ x: viewportWidth - boxSize, y: 0 },
			{ x: 0, y: viewportHeight - boxSize },
			{ x: viewportWidth - boxSize, y: viewportHeight - boxSize }
		];
	}

	// State render methods
	private renderFadingIn(canvas: Canvas): void {
		const sequencer = this.timeline.getCurrentSequencer();
		if (!sequencer) return;

		const centerX = this.viewport.getCenterX();
		const centerY = this.viewport.getCenterY();
		const logoAlpha = sequencer.getValue('logoAlpha');
		const titleAlpha = sequencer.getValue('titleAlpha');
		const pressKeyAlpha = sequencer.getValue('pressKeyAlpha');

		if (pressKeyAlpha > 0) canvas.drawCenteredText('Press any key to start', centerX, 500, '24px Segoe UI', '#ffffff', pressKeyAlpha);
		if (logoAlpha > 0) this.renderWindowsBoxes(canvas, logoAlpha);
		if (titleAlpha > 0) {
			canvas.drawCenteredText('Stellar Breach', centerX, centerY - 120, '28px Segoe UI', '#cccccc', titleAlpha);
			canvas.drawCenteredText('Microsoft', centerX, centerY - 70, '24px Segoe UI', '#ffffff', logoAlpha);
		}
	}

	private renderExpanding(canvas: Canvas): void {
		const sequencer = this.timeline.getCurrentSequencer();
		if (!sequencer) return;

		const centerX = this.viewport.getCenterX();
		const centerY = this.viewport.getCenterY();
		const logoAlpha = sequencer.getValue('logoAlpha');
		const titleAlpha = sequencer.getValue('titleAlpha');

		// Draw scaled/fading title and logo
		if (titleAlpha > 0) {
			canvas.drawCenteredText('Stellar Breach', centerX, centerY - 120, '28px Segoe UI', '#cccccc', titleAlpha);
		}

		if (logoAlpha > 0) {
			canvas.drawCenteredText('Microsoft', centerX, centerY - 70, '24px Segoe UI', '#ffffff', logoAlpha);
		}

		// Draw moving boxes
		this.renderMovingBoxes(canvas, sequencer);
	}

	private renderWaitingForInput(canvas: Canvas): void {
		// Direct access to all internal properties and methods
		const centerX = this.viewport.getCenterX();
		const centerY = this.viewport.getCenterY();

		// Render static elements at full opacity
		canvas.drawCenteredText('Stellar Breach', centerX, centerY - 120, '28px Segoe UI', '#cccccc', 1.0);
		canvas.drawCenteredText('Microsoft', centerX, centerY - 70, '24px Segoe UI', '#ffffff', 1.0);
		this.renderWindowsBoxes(canvas, 1.0);
		canvas.drawCenteredText('Press any key to start', centerX, 500, '24px Segoe UI', '#ffffff', 1.0);
	}

	// State input handler
	private handleWaitingForInputInput(inputManager: InputManager): void {
		// Only accept input when waiting for user interaction
		if (this.anyKeyPressed(inputManager)) {
			this.timeline.startSequence('expanding');
			// State change happens automatically in sequence onStart callback
		}
	}

	// Helper methods with direct access to internal state
	private renderWindowsBoxes(canvas: Canvas, alpha: number): void {
		const positions = this.getStartPositions();
		const center = this.viewport.getCenter();

		canvas.drawRect(center.x, center.y, 40, 40, '#000000', alpha);

		// Direct access to this.colors array
		for (let i = 0; i < 4; i++) {
			canvas.drawRect(positions[i].x, positions[i].y, 40, 40, this.colors[i], alpha);
		}
	}

	private renderMovingBoxes(canvas: Canvas, sequencer: AnimationSequencer): void {
		// Access sequence animations directly
		for (let i = 0; i < 4; i++) {
			const movement = sequencer.getAnimation(`boxMovement.${i}`);
			const position = (movement as any).getPosition();
			const alpha = sequencer.getValue('logoAlpha');
			const scale = sequencer.getValue('logoScale');

			// Direct access to this.colors
			canvas.drawRect(position.x, position.y, 40 * scale, 40 * scale, this.colors[i], alpha);
		}
	}

	private anyKeyPressed(inputManager: InputManager): boolean {
		return (
			inputManager.isMoveLeft() ||
			inputManager.isMoveRight() ||
			inputManager.isFire() ||
			inputManager.isPause() ||
			inputManager.isKeyPressed('Space') ||
			inputManager.isKeyPressed('Enter')
		);
	}
}
