import { Canvas } from './Canvas';
import { GameLoop } from './GameLoop';
import { World } from '../ecs/World';
import { InputManager } from './InputManager';
import { Screen, ScreenType } from '../screens/Screen';
import { IntroScreen } from '../screens/IntroScreen';
import { MenuScreen } from '../screens/MenuScreen';
import { GameScreen } from '../screens/GameScreen';

export class Game {
    private canvas: Canvas;
    private gameLoop: GameLoop;
    private world: World;
    private inputManager: InputManager;
    private currentScreen: Screen | null = null;
    private screens: Map<ScreenType, Screen> = new Map();
    private isInitialized: boolean = false;

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
        const menuScreen = new MenuScreen();
        const gameScreen = new GameScreen(this.world, this.inputManager);

        // Set up screen change callbacks
        introScreen.onScreenChangeRequest = this.handleScreenChange.bind(this);
        menuScreen.onScreenChangeRequest = this.handleScreenChange.bind(this);
        gameScreen.onScreenChangeRequest = this.handleScreenChange.bind(this);

        // Store screens
        this.screens.set(ScreenType.INTRO, introScreen);
        this.screens.set(ScreenType.MENU, menuScreen);
        this.screens.set(ScreenType.GAME, gameScreen);
    }

    private handleScreenChange(screenType: ScreenType): void {
        this.changeScreen(screenType);
    }

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

    private update(deltaTime: number): void {
        // Update input
        this.inputManager.update();

        // Update current screen
        if (this.currentScreen) {
            this.currentScreen.update(deltaTime);
            this.currentScreen.handleInput(this.inputManager);
        }
    }

    private render(): void {
        // Render current screen
        if (this.currentScreen) {
            this.currentScreen.render(this.canvas);
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
}