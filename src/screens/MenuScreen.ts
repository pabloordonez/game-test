import { BaseScreen } from './Screen';
import { Canvas } from '../core/Canvas';
import { InputManager } from '../core/InputManager';
import { ScreenType } from './Screen';

export class MenuScreen extends BaseScreen {
    private selectedOption: number = 0;
    private menuOptions: string[] = ['Start Game', 'Options', 'Exit'];
    private menuPositions: Array<{x: number, y: number}> = [
        {x: 400, y: 250},
        {x: 400, y: 300},
        {x: 400, y: 350}
    ];

    update(deltaTime: number): void {
        if (!this.isActive) return;

        this.screenTime += deltaTime;
    }

    render(canvas: Canvas): void {
        if (!this.isActive) return;

        // Clear canvas
        canvas.clear();

        // Draw title
        canvas.drawText('Stellar Breach', 400, 150, '48px Arial', '#ffffff');

        // Draw menu options
        this.renderMenuOptions(canvas);

        // Draw instructions
        canvas.drawText('Use Arrow Keys to navigate, Enter to select', 400, 450, '16px Arial', '#cccccc');
    }

    private renderMenuOptions(canvas: Canvas): void {
        for (let i = 0; i < this.menuOptions.length; i++) {
            const option = this.menuOptions[i];
            const position = this.menuPositions[i];
            const isSelected = i === this.selectedOption;

            // Draw selection indicator
            if (isSelected) {
                canvas.drawText('>', position.x - 50, position.y, '24px Arial', '#ffff00');
            }

            // Draw option text
            const color = isSelected ? '#ffff00' : '#ffffff';
            canvas.drawText(option, position.x, position.y, '24px Arial', color);
        }
    }

    handleInput(inputManager: InputManager): void {
        if (!this.isActive) return;

        // Handle navigation
        if (inputManager.isMoveLeft() || inputManager.isMoveRight()) {
            // For now, just cycle through options
            this.selectedOption = (this.selectedOption + 1) % this.menuOptions.length;
        }

        // Handle selection
        if (inputManager.isFire()) {
            this.selectCurrentOption();
        }
    }

    private selectCurrentOption(): void {
        switch (this.selectedOption) {
            case 0: // Start Game
                this.requestScreenChange(ScreenType.GAME);
                break;
            case 1: // Options
                // TODO: Implement options screen
                console.log('Options selected');
                break;
            case 2: // Exit
                // TODO: Implement exit functionality
                console.log('Exit selected');
                break;
        }
    }

    private requestScreenChange(screenType: ScreenType): void {
        if (this.onScreenChangeRequest) {
            this.onScreenChangeRequest(screenType);
        }
    }

    // Callback to be set by Game class
    onScreenChangeRequest?: (screenType: ScreenType) => void;

    getSelectedOption(): number {
        return this.selectedOption;
    }
}