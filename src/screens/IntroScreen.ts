import { BaseScreen } from './Screen';
import { Canvas } from '../core/Canvas';
import { InputManager } from '../core/InputManager';
import { ScreenType, TransitionType } from './Screen';
import { AnimationSequencer, AlphaAnimation, MovementAnimation, ScaleAnimation, EasingFunctions } from '../animation';
import { StarParticleSystem } from '../particles';
import { Viewport } from '../utils/Viewport';

export class IntroScreen extends BaseScreen {
    private sequencer: AnimationSequencer;
    private starSystem: StarParticleSystem;
    private viewport: Viewport;
    private colors: string[] = ['#F14F21', '#7EB900', '#00A3EE', '#FEB800'];
    private isComplete: boolean = false;

    // Interactive state management
    private isWaitingForInput: boolean = false;
    private isAnimating: boolean = false;
    private logoCompleted: boolean = false;

    constructor() {
        super();
        this.viewport = new Viewport(800, 600); // Standard game viewport
        this.sequencer = new AnimationSequencer();
        this.starSystem = new StarParticleSystem(
            this.viewport.getCenterX(),
            this.viewport.getCenterY(),
            this.viewport.getWidth(),
            this.viewport.getHeight()
        );
        this.initializeAnimations();
    }

    private initializeAnimations(): void {
        console.log('Initializing initial logo animation...');

        // Phase 1: Logo and text fade in (0-2 seconds)
        const logoFadeIn = new AlphaAnimation(0, 1, 2, EasingFunctions.easeIn);
        const textFadeIn = new AlphaAnimation(0, 1, 2, EasingFunctions.easeIn);

        // Phase 1.5: Boxes fade in (1-2 seconds, overlapping with text)
        const boxFadeIns: AlphaAnimation[] = [];
        for (let i = 0; i < 4; i++) {
            boxFadeIns.push(new AlphaAnimation(0, 1, 1, EasingFunctions.easeIn));
        }

        // Phase 2: "Press any key" text appears after logo is complete (3 seconds)
        const pressKeyFadeIn = new AlphaAnimation(0, 1, 1, EasingFunctions.easeIn);

        // Create initial sequence - just logo appearance and "press key" prompt
        this.sequencer
            .play(logoFadeIn, 0)                    // Logo fade in at 0s
            .parallel(textFadeIn, 0)                // Text fade in at 0s (parallel)
            .at(1, boxFadeIns[0])                   // Box 1 fade in at 1s
            .parallel(boxFadeIns[1], 1)             // Box 2 fade in at 1s
            .parallel(boxFadeIns[2], 1)             // Box 3 fade in at 1s
            .parallel(boxFadeIns[3], 1)             // Box 4 fade in at 1s
            .at(3, pressKeyFadeIn);                 // "Press any key" at 3s

        console.log('Initial logo animation initialized successfully');
    }

    private startExpansionAnimation(): void {
        console.log('Starting expansion animation...');

        this.isAnimating = true;
        this.isWaitingForInput = false;

        const centerX = this.viewport.getCenterX();
        const centerY = this.viewport.getCenterY();

        // Create new sequencer for expansion animation
        this.sequencer = new AnimationSequencer();

        // Centered starting positions (current positions)
        const startPositions = [
            {x: centerX - 23, y: centerY - 23}, // Top-left square
            {x: centerX + 23, y: centerY - 23}, // Top-right square
            {x: centerX - 23, y: centerY + 23}, // Bottom-left square
            {x: centerX + 23, y: centerY + 23}  // Bottom-right square
        ];

        // Corner target positions
        const targetPositions = [
            {x: 50, y: 50},   // Top-left corner
            {x: 750, y: 50},  // Top-right corner
            {x: 50, y: 550},  // Bottom-left corner
            {x: 750, y: 550}  // Bottom-right corner
        ];

        // Create expansion animations
        const boxAnimations: MovementAnimation[] = [];
        const boxAlphaAnimations: AlphaAnimation[] = [];
        const boxScaleAnimations: ScaleAnimation[] = [];

        for (let i = 0; i < startPositions.length; i++) {
            const startPos = startPositions[i];
            const endPos = targetPositions[i];

            boxAnimations.push(new MovementAnimation(
                startPos.x, startPos.y, endPos.x, endPos.y,
                3, EasingFunctions.easeOut
            ));

            boxAlphaAnimations.push(new AlphaAnimation(1, 0, 3, EasingFunctions.easeOut));
            boxScaleAnimations.push(new ScaleAnimation(1.0, 2.5, 3, EasingFunctions.easeOut));
        }

        // Star particles start immediately with expansion
        const starStart = new AlphaAnimation(0, 1, 0.5, EasingFunctions.easeIn);

        // Create expansion sequence
        this.sequencer
            .play(boxAnimations[0], 0)                // All animations start immediately
            .parallel(boxAlphaAnimations[0], 0)
            .parallel(boxScaleAnimations[0], 0)
            .parallel(boxAnimations[1], 0)
            .parallel(boxAlphaAnimations[1], 0)
            .parallel(boxScaleAnimations[1], 0)
            .parallel(boxAnimations[2], 0)
            .parallel(boxAlphaAnimations[2], 0)
            .parallel(boxScaleAnimations[2], 0)
            .parallel(boxAnimations[3], 0)
            .parallel(boxAlphaAnimations[3], 0)
            .parallel(boxScaleAnimations[3], 0)
            .parallel(starStart, 0);                  // Stars start with expansion

        console.log('Expansion animation started');
    }

    update(deltaTime: number): void {
        if (!this.isActive) return;

        this.screenTime += deltaTime;
        this.sequencer.update(deltaTime);

        // Always update stars for continuous effect
        this.starSystem.update(deltaTime);

        // Check initial logo completion (ready for user input)
        if (!this.logoCompleted && this.sequencer.isComplete()) {
            this.logoCompleted = true;
            this.isWaitingForInput = true;
            console.log('Logo completed - waiting for user input');
        }

        // Check expansion animation completion (auto-transition to game)
        if (this.isAnimating && !this.isComplete && this.sequencer.isComplete()) {
            this.isComplete = true;
            this.isAnimating = false; // Stop animation state
            console.log('Expansion animation completed - auto-transitioning to game');
            // Automatically transition to game screen with fade effect
            this.requestScreenChange(ScreenType.GAME, {
                type: TransitionType.FADE,
                duration: 1.5
            });
        }
    }

    render(canvas: Canvas): void {
        if (!this.isActive) return;

        // Clear canvas
        canvas.clear();

        // Draw star particles (deep space effect)
        this.renderStarParticles(canvas);

        // Draw Windows logo
        this.renderWindowsLogo(canvas);

        // Draw moving boxes
        this.renderMovingBoxes(canvas);

        // Draw appropriate prompt text
        const centerX = this.viewport.getCenterX();
        if (this.isWaitingForInput) {
            // Show "press key to start" when waiting for user to trigger expansion
            const pressKeyAlpha = this.sequencer.getAnimationValue(4); // Animation index 4 is the press key fade-in
            if (pressKeyAlpha > 0) {
                canvas.drawCenteredText('Press any key to start', centerX, 500, '24px Arial', '#ffffff', pressKeyAlpha);
            }
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
        const logoY = this.viewport.getCenterY() - 70;   // Keep "Microsoft" above the squares

        // Get animation values from sequencer
        const logoAlpha = this.sequencer.getAnimationValue(0); // Logo fade animation
        const textAlpha = this.sequencer.getAnimationValue(1); // Text fade animation

        // Draw title first (well above logo)
        if (textAlpha > 0) {
            canvas.drawCenteredText('Stellar Breach', centerX, titleY, '28px Arial', '#cccccc', textAlpha);
        }

        // Draw logo below title but above squares
        if (logoAlpha > 0) {
            canvas.drawCenteredText('Microsoft', centerX, logoY, '24px Arial', '#ffffff', logoAlpha);
        }
    }

    private renderMovingBoxes(canvas: Canvas): void {
        // Don't render boxes after expansion is complete
        if (this.isComplete) {
            return;
        }

        const centerX = this.viewport.getCenterX();
        const centerY = this.viewport.getCenterY();

        // Centered box positions
        const centeredBoxPositions = [
            {x: centerX - 23, y: centerY - 23}, // Top-left square
            {x: centerX + 23, y: centerY - 23}, // Top-right square
            {x: centerX - 23, y: centerY + 23}, // Bottom-left square
            {x: centerX + 23, y: centerY + 23}  // Bottom-right square
        ];

        for (let i = 0; i < 4; i++) {
            const color = this.colors[i];

            let position = centeredBoxPositions[i];
            let alpha = 1;
            let scale = 1;

            if (!this.isAnimating && !this.isComplete) {
                // Initial phase - use fade-in animations (indices 2-5)
                const fadeInAlpha = this.sequencer.getAnimationValue(2 + i);
                alpha = fadeInAlpha;
            } else {
                // Expansion phase - use movement, fade-out, and scale animations
                // During expansion, all animations run in parallel groups of 3

                // Movement animations: indices 0, 3, 6, 9
                const moveIndex = i * 3;
                const moveAnimation = this.sequencer.getAnimation(moveIndex) as MovementAnimation;
                if (moveAnimation && moveAnimation.getPosition) {
                    position = moveAnimation.getPosition();
                }

                // Fade-out animations: indices 1, 4, 7, 10
                const fadeIndex = i * 3 + 1;
                alpha = this.sequencer.getAnimationValue(fadeIndex);

                // Scale animations: indices 2, 5, 8, 11
                const scaleIndex = i * 3 + 2;
                scale = this.sequencer.getAnimationValue(scaleIndex);
            }

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

        // Check for any key press
        const anyKeyPressed = inputManager.isMoveLeft() || inputManager.isMoveRight() ||
                             inputManager.isFire() || inputManager.isPause() ||
                             inputManager.isKeyPressed('Space') || inputManager.isKeyPressed('Enter');

        if (anyKeyPressed && this.isWaitingForInput) {
            // User pressed key to start expansion animation (only handles initial trigger)
            console.log('User triggered expansion animation');
            this.startExpansionAnimation();
        }
    }



    isAnimationComplete(): boolean {
        return this.isComplete;
    }
}