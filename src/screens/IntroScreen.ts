import { BaseScreen } from './Screen';
import { Canvas } from '../core/Canvas';
import { InputManager } from '../core/InputManager';
import { ScreenType } from './Screen';
import { AnimationSequencer, AlphaAnimation, MovementAnimation, ScaleAnimation, EasingFunctions } from '../animation';
import { StarParticleSystem } from '../particles';
import { Viewport } from '../utils/Viewport';

export class IntroScreen extends BaseScreen {
    private sequencer: AnimationSequencer;
    private starSystem: StarParticleSystem;
    private viewport: Viewport;
    private logoAlpha: number = 0;
    private textAlpha: number = 0;
    private pressKeyAlpha: number = 0;
    private boxPositions: Array<{x: number, y: number}> = [
        {x: 380, y: 280}, // Top-left square (closer together)
        {x: 420, y: 280}, // Top-right square
        {x: 380, y: 320}, // Bottom-left square
        {x: 420, y: 320}  // Bottom-right square
    ];
    private boxAlphas: number[] = [1, 1, 1, 1];
    private colors: string[] = ['#F14F21', '#7EB900', '#00A3EE', '#FEB800'];
    private isComplete: boolean = false;

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
        console.log('Initializing animations with sequencer...');

        const centerX = this.viewport.getCenterX();
        const centerY = this.viewport.getCenterY();

        // Phase 1: Logo and text fade in (0-2 seconds)
        const logoFadeIn = new AlphaAnimation(0, 1, 2, EasingFunctions.easeIn);
        const textFadeIn = new AlphaAnimation(0, 1, 2, EasingFunctions.easeIn);

        // Phase 1.5: Boxes fade in (1-2 seconds, overlapping with text)
        const boxFadeIns: AlphaAnimation[] = [];
        for (let i = 0; i < 4; i++) {
            boxFadeIns.push(new AlphaAnimation(0, 1, 1, EasingFunctions.easeIn));
        }

        // Phase 2: Boxes move to corners, grow, and fade out (2-5 seconds)
        const boxAnimations: MovementAnimation[] = [];
        const boxAlphaAnimations: AlphaAnimation[] = [];
        const boxScaleAnimations: ScaleAnimation[] = []; // NEW: Scale animations

        // Centered starting positions
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

        for (let i = 0; i < startPositions.length; i++) {
            const startPos = startPositions[i];
            const endPos = targetPositions[i];

            boxAnimations.push(new MovementAnimation(
                startPos.x, startPos.y, endPos.x, endPos.y,
                3, EasingFunctions.easeOut
            ));

            boxAlphaAnimations.push(new AlphaAnimation(1, 0, 3, EasingFunctions.easeOut));

            // NEW: Scale from 1.0 to 2.5 (growing effect)
            boxScaleAnimations.push(new ScaleAnimation(1.0, 2.5, 3, EasingFunctions.easeOut));
        }

        // Phase 3: Star particles start (2 seconds - when boxes start moving)
        const starStart = new AlphaAnimation(0, 1, 0.5, EasingFunctions.easeIn);

        // Phase 4: Press key text fade in (7-8 seconds)
        const pressKeyFadeIn = new AlphaAnimation(0, 1, 1, EasingFunctions.easeIn);

        // Create fluent sequence with scale animations
        this.sequencer
            .play(logoFadeIn, 0)                    // Logo fade in at 0s
            .parallel(textFadeIn, 0)                // Text fade in at 0s (parallel)
            .at(1, boxFadeIns[0])                   // Box 1 fade in at 1s
            .parallel(boxFadeIns[1], 1)             // Box 2 fade in at 1s
            .parallel(boxFadeIns[2], 1)             // Box 3 fade in at 1s
            .parallel(boxFadeIns[3], 1)             // Box 4 fade in at 1s
            .at(2, boxAnimations[0])                // Box 1 move at 2s
            .parallel(boxAlphaAnimations[0], 2)     // Box 1 fade out at 2s
            .parallel(boxScaleAnimations[0], 2)     // Box 1 scale at 2s
            .at(2, boxAnimations[1])                // Box 2 move at 2s
            .parallel(boxAlphaAnimations[1], 2)     // Box 2 fade out at 2s
            .parallel(boxScaleAnimations[1], 2)     // Box 2 scale at 2s
            .at(2, boxAnimations[2])                // Box 3 move at 2s
            .parallel(boxAlphaAnimations[2], 2)     // Box 3 fade out at 2s
            .parallel(boxScaleAnimations[2], 2)     // Box 3 scale at 2s
            .at(2, boxAnimations[3])                // Box 4 move at 2s
            .parallel(boxAlphaAnimations[3], 2)     // Box 4 fade out at 2s
            .parallel(boxScaleAnimations[3], 2)     // Box 4 scale at 2s
            .at(2, starStart)                       // Stars start at 2s (when boxes start moving)
            .at(7, pressKeyFadeIn);                 // Press key text at 7s

        console.log('Animations initialized successfully');
    }

    update(deltaTime: number): void {
        if (!this.isActive) return;

        this.screenTime += deltaTime;
        this.sequencer.update(deltaTime);

        // Always update star system for testing (no delay)
        this.starSystem.update(deltaTime);

        // Check if animation is complete
        if (this.sequencer.isComplete()) {
            this.isComplete = true;
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

        // Draw completion text
        if (this.isComplete) {
            const centerX = this.viewport.getCenterX();
            canvas.drawCenteredText('Press any key to continue...', centerX, 500, '24px Arial', '#ffffff');
        }
    }

    private renderStarParticles(canvas: Canvas): void {
        const particles = this.starSystem.getParticles();

        for (const particle of particles) {
            if (particle.alpha > 0) {
                // Make particles more visible with larger radius
                const radius = 4; // Increased from 3 to 4 pixels for better visibility
                canvas.drawCircle(particle.x, particle.y, radius, particle.color, particle.alpha);
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

            // Get fade-in animation (indices 2-5)
            const fadeInAnimation = this.sequencer.getAnimation(2 + i) as AlphaAnimation;
            // Get movement animation (indices 6, 10, 14, 18)
            const moveAnimation = this.sequencer.getAnimation(6 + i * 3) as MovementAnimation;
            // Get fade-out animation (indices 7, 11, 15, 19)
            const fadeOutAnimation = this.sequencer.getAnimation(7 + i * 3) as AlphaAnimation;
            // Get scale animation (indices 8, 12, 16, 20)
            const scaleAnimation = this.sequencer.getAnimation(8 + i * 3) as ScaleAnimation;

            let position = centeredBoxPositions[i];
            let alpha = 1;
            let scale = 1;

            // Use fade-in animation if active
            if (fadeInAnimation && !fadeInAnimation.isComplete()) {
                alpha = fadeInAnimation.getAlpha();
            }
            // Use movement, fade-out, and scale animations if active
            else if (moveAnimation && fadeOutAnimation && scaleAnimation) {
                if (moveAnimation && !moveAnimation.isComplete()) {
                    position = moveAnimation.getPosition();
                }
                if (fadeOutAnimation && !fadeOutAnimation.isComplete()) {
                    alpha = fadeOutAnimation.getAlpha();
                }
                if (scaleAnimation && !scaleAnimation.isComplete()) {
                    scale = scaleAnimation.getScale();
                }
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

        // Check for any key press to continue
        if (this.isComplete && (inputManager.isMoveLeft() || inputManager.isMoveRight() ||
                               inputManager.isFire() || inputManager.isPause() ||
                               inputManager.isKeyPressed('Space') || inputManager.isKeyPressed('Enter'))) {
            // Transition to menu screen
            this.requestScreenChange(ScreenType.MENU);
        }
    }

    private requestScreenChange(screenType: ScreenType): void {
        // This will be set by the Game class
        if (this.onScreenChangeRequest) {
            this.onScreenChangeRequest(screenType);
        }
    }

    // Callback to be set by Game class
    onScreenChangeRequest?: (screenType: ScreenType) => void;

    isAnimationComplete(): boolean {
        return this.isComplete;
    }
}