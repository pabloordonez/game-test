import { Canvas } from './Canvas';
import { GameLoop } from './GameLoop';
import { Screen, ScreenType, TransitionConfig, TransitionCapable, TransitionType } from '../screens/Screen';
import { IntroScreen } from '../screens/IntroScreen';
import { GameScreen } from '../screens/GameScreen';
import { World } from '../ecs/World';
import { InputManager } from './InputManager';

export class Game {
    private canvas: Canvas;
    private gameLoop: GameLoop;
    private world: World;
    private inputManager: InputManager;
    private currentScreen: Screen | null = null;
    private screens: Map<ScreenType, Screen> = new Map();
    private isInitialized: boolean = false;

    // Transition management
    private isTransitioning: boolean = false;
    private transitionFromScreen: Screen | null = null;
    private transitionToScreen: Screen | null = null;
    private pendingScreenType: ScreenType | null = null;

    constructor(canvas: Canvas, gameLoop: GameLoop) {
        this.canvas = canvas;
        this.gameLoop = gameLoop;
        this.world = new World();
        this.inputManager = new InputManager();

        // Override game loop methods
        this.gameLoop.update = this.update.bind(this);
        this.gameLoop.render = this.render.bind(this);
    }

    start(): void {
        if (!this.isInitialized) {
            this.initialize();
        }

        // Start with intro screen
        this.changeScreen(ScreenType.INTRO);
        this.gameLoop.start();
    }

    stop(): void {
        this.gameLoop.stop();
    }

    private initialize(): void {
        console.log('Initializing game...');

        // Initialize systems
        this.world.initialize();
        this.inputManager.initialize();

        // Initialize screens
        this.initializeScreens();

        this.isInitialized = true;
        console.log('Game initialized successfully');
    }

    private initializeScreens(): void {
        // Create screens
        const introScreen = new IntroScreen();
        const gameScreen = new GameScreen(this.world, this.inputManager);

        // Set up screen change callbacks with transition support
        introScreen.setScreenChangeCallback(this.handleScreenChangeWithTransition.bind(this));
        gameScreen.setScreenChangeCallback(this.handleScreenChangeWithTransition.bind(this));

        // Store screens
        this.screens.set(ScreenType.INTRO, introScreen);
        this.screens.set(ScreenType.GAME, gameScreen);
    }

    private handleScreenChangeWithTransition(screenType: ScreenType, transitionConfig?: TransitionConfig): void {
        if (this.isTransitioning) {
            console.warn('Transition already in progress, ignoring screen change request');
            return;
        }

        const defaultTransition: TransitionConfig = {
            type: TransitionType.FADE,
            duration: 0.5
        };

        this.changeScreenWithTransition(screenType, transitionConfig || defaultTransition);
    }

    // Legacy method for direct screen changes (no transition)
    changeScreen(screenType: ScreenType): void {
        // Exit current screen
        if (this.currentScreen) {
            this.currentScreen.onExit();
        }

        // Get new screen
        const newScreen = this.screens.get(screenType);
        if (newScreen) {
            this.currentScreen = newScreen;
            this.currentScreen.onEnter();
            console.log(`Changed to screen: ${screenType}`);
        } else {
            console.error(`Screen not found: ${screenType}`);
        }
    }

    changeScreenWithTransition(screenType: ScreenType, transitionConfig: TransitionConfig): void {
        if (this.isTransitioning) {
            console.warn('Transition already in progress');
            return;
        }

        const targetScreen = this.screens.get(screenType);
        if (!targetScreen) {
            console.error(`Screen not found: ${screenType}`);
            return;
        }

        this.isTransitioning = true;
        this.transitionFromScreen = this.currentScreen;
        this.transitionToScreen = targetScreen;
        this.pendingScreenType = screenType;

        // Start transition out on current screen
        if (this.currentScreen && this.isTransitionCapable(this.currentScreen)) {
            (this.currentScreen as unknown as TransitionCapable).startTransitionOut(transitionConfig);
            console.log(`Starting transition from ${this.getCurrentScreenType()} to ${screenType}`);
        } else {
            // If current screen doesn't support transitions, immediately switch
            this.completeTransition();
        }
    }

    private completeTransition(): void {
        if (!this.transitionToScreen || !this.pendingScreenType) {
            console.error('No pending transition to complete');
            return;
        }

        // Exit old screen
        if (this.transitionFromScreen) {
            this.transitionFromScreen.onExit();
        }

        // Switch to new screen
        this.currentScreen = this.transitionToScreen;
        this.currentScreen.onEnter();

        // Start transition in on new screen
        if (this.isTransitionCapable(this.currentScreen)) {
            const config: TransitionConfig = {
                type: TransitionType.FADE,
                duration: 1.0  // Increase duration to see the fade in effect
            };
            (this.currentScreen as unknown as TransitionCapable).startTransitionIn(config);
            this.isTransitioning = true;  // Keep transition state active for fade in
            console.log('Starting transition in on new screen...');
        }

        console.log(`Completed transition to: ${this.pendingScreenType}`);

        // Reset transition state (but only if not doing fade in)
        if (!this.isTransitionCapable(this.currentScreen) ||
            !(this.currentScreen as unknown as TransitionCapable).isTransitioning()) {
            this.isTransitioning = false;
        }
        this.transitionFromScreen = null;
        this.transitionToScreen = null;
        this.pendingScreenType = null;
    }

    private getCurrentScreenType(): string {
        for (const [type, screen] of this.screens.entries()) {
            if (screen === this.currentScreen) {
                return type;
            }
        }
        return 'unknown';
    }

    private update(deltaTime: number): void {
        // Update input
        this.inputManager.update();

        // Update current screen
        if (this.currentScreen) {
            this.currentScreen.update(deltaTime);
            this.currentScreen.handleInput(this.inputManager);
        }

        // Monitor transition progress
        if (this.isTransitioning && this.currentScreen) {
            if (this.isTransitionCapable(this.currentScreen)) {
                const transitionCapableScreen = this.currentScreen as unknown as TransitionCapable;
                transitionCapableScreen.updateTransition(deltaTime);

                // Check if transition is complete
                if (!transitionCapableScreen.isTransitioning()) {
                    if (this.transitionToScreen && this.pendingScreenType) {
                        // Transition OUT is complete, switch to new screen
                        console.log('Transition out completed, completing transition...');
                        this.completeTransition();
                    } else {
                        // Transition IN is complete, just reset transition state
                        console.log('Transition in completed, resetting state...');
                        this.isTransitioning = false;
                    }
                }
            }
        }
    }

    private render(): void {
        // Render current screen with transition effects
        if (this.currentScreen) {
            this.currentScreen.renderWithTransition(this.canvas);
        } else {
            // Fallback render
            this.canvas.clear();
            this.canvas.drawText('No screen active', 400, 300, '24px Arial', '#ffffff');
        }
    }

    getCurrentScreen(): Screen | null {
        return this.currentScreen;
    }

    getWorld(): World {
        return this.world;
    }

    getInputManager(): InputManager {
        return this.inputManager;
    }

    private isTransitionCapable(screen: Screen): boolean {
        // Check if the screen has transition methods (implements TransitionCapable)
        return typeof (screen as any).startTransitionOut === 'function' &&
               typeof (screen as any).startTransitionIn === 'function' &&
               typeof (screen as any).updateTransition === 'function' &&
               typeof (screen as any).isTransitioning === 'function';
    }
}