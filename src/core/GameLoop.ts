export class GameLoop {
    private isRunning: boolean = false;
    private lastTime: number = 0;
    private fps: number = 60;
    private frameInterval: number = 1000 / this.fps;
    private accumulator: number = 0;

    constructor() {
        this.lastTime = performance.now();
    }

    start(): void {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop();
    }

    stop(): void {
        this.isRunning = false;
    }

    private loop(): void {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Fixed time step for consistent physics
        this.accumulator += deltaTime;

        while (this.accumulator >= this.frameInterval) {
            this.update(this.frameInterval / 1000);
            this.accumulator -= this.frameInterval;
        }

        this.render();

        requestAnimationFrame(() => this.loop());
    }

    update(_deltaTime: number): void {
        // This method is overridden by the Game class
    }

    render(): void {
        // This will be overridden by the Game class
    }

    setFPS(fps: number): void {
        this.fps = fps;
        this.frameInterval = 1000 / fps;
    }

    getFPS(): number {
        return this.fps;
    }
}