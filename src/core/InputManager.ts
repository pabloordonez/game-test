export class InputManager {
    private keys: Map<string, boolean> = new Map();
    private gamepadState: Map<string, boolean> = new Map();
    private gamepadAxes: Map<string, number> = new Map();

    constructor() {
        this.setupEventListeners();
    }

    initialize(): void {
        console.log('Input manager initialized');
    }

    private setupEventListeners(): void {
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            this.keys.set(event.code, true);
        });

        document.addEventListener('keyup', (event) => {
            this.keys.set(event.code, false);
        });

        // Gamepad events
        window.addEventListener('gamepadconnected', (event) => {
            console.log('Gamepad connected:', event.gamepad);
        });

        window.addEventListener('gamepaddisconnected', (event) => {
            console.log('Gamepad disconnected:', event.gamepad);
        });
    }

    update(): void {
        // Update gamepad state
        this.updateGamepadState();
    }

    private updateGamepadState(): void {
        const gamepads = navigator.getGamepads();

        for (const gamepad of gamepads) {
            if (gamepad) {
                // Update button states
                gamepad.buttons.forEach((button, index) => {
                    const buttonName = `button_${index}`;
                    this.gamepadState.set(buttonName, button.pressed);
                });

                // Update axes
                gamepad.axes.forEach((axis, index) => {
                    const axisName = `axis_${index}`;
                    this.gamepadAxes.set(axisName, axis);
                });
            }
        }
    }

    isKeyPressed(key: string): boolean {
        return this.keys.get(key) || false;
    }

    isKeyHeld(key: string): boolean {
        return this.keys.get(key) || false;
    }

    isKeyReleased(key: string): boolean {
        // For now, same as pressed - can be enhanced for release detection
        return this.keys.get(key) || false;
    }

    isGamepadButtonPressed(button: string): boolean {
        return this.gamepadState.get(button) || false;
    }

    isGamepadButtonHeld(button: string): boolean {
        return this.gamepadState.get(button) || false;
    }

    getGamepadAxis(axis: string): number {
        return this.gamepadAxes.get(axis) || 0;
    }

    // Input mapping helpers
    isMoveLeft(): boolean {
        return this.isKeyPressed('ArrowLeft') ||
               this.isKeyPressed('KeyA') ||
               this.getGamepadAxis('axis_0') < -0.5;
    }

    isMoveRight(): boolean {
        return this.isKeyPressed('ArrowRight') ||
               this.isKeyPressed('KeyD') ||
               this.getGamepadAxis('axis_0') > 0.5;
    }

    isFire(): boolean {
        return this.isKeyPressed('Space') ||
               this.isKeyPressed('KeyZ') ||
               this.isGamepadButtonPressed('button_0');
    }

    isPause(): boolean {
        return this.isKeyPressed('Escape') ||
               this.isGamepadButtonPressed('button_9');
    }
}