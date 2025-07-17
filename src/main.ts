import { Game } from './core/Game';
import { GameLoop } from './core/GameLoop';
import { Canvas } from './core/Canvas';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const loadingScreen = document.getElementById('loadingScreen');

    if (!canvas) {
        throw new Error('Canvas element not found');
    }

    // Initialize core systems
    const gameCanvas = new Canvas(canvas);
    const gameLoop = new GameLoop();
    const game = new Game(gameCanvas, gameLoop);

    // Hide loading screen
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }

    // Start the game
    game.start();
});