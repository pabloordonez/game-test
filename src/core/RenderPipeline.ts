import { Canvas } from './Canvas';
import { RenderQueue, RenderCommand } from './RenderQueue';

export class RenderPipeline {
    private canvas: Canvas;

    constructor(canvas: Canvas) {
        this.canvas = canvas;
    }

    execute(renderQueue: RenderQueue): void {
        // Clear the canvas
        this.canvas.clear();

        // Process all queued render commands
        const commands = renderQueue.getCommands();

        for (const command of commands) {
            this.executeCommand(command);
        }
    }

    private executeCommand(command: RenderCommand): void {
        // Save context state
        this.canvas.save();

        // Apply transformations
        this.canvas.translate(command.x, command.y);

        if (command.rotation !== undefined) {
            this.canvas.rotate(command.rotation);
        }

        if (command.scaleX !== undefined && command.scaleY !== undefined) {
            this.canvas.scale(command.scaleX, command.scaleY);
        }

        // Set alpha
        if (command.alpha !== undefined) {
            this.canvas.setGlobalAlpha(command.alpha);
        }

        // Execute the specific render command
        this.renderByType(command);

        // Restore context state
        this.canvas.restore();
    }

    private renderByType(command: RenderCommand): void {
        switch (command.type) {
            case 'rect':
                this.renderRect(command);
                break;
            case 'circle':
                this.renderCircle(command);
                break;
            case 'triangle':
                this.renderTriangle(command);
                break;
            case 'text':
                this.renderText(command);
                break;
            default:
                this.renderRect(command); // Fallback to rectangle
        }
    }

    private renderRect(command: RenderCommand): void {
        if (!command.width || !command.height) return;

        this.canvas.drawRect(
            -command.width / 2,
            -command.height / 2,
            command.width,
            command.height,
            command.color
        );

        // Add border for blocks
        if (command.tags?.includes('block')) {
            const context = this.canvas.getContext();
            context.strokeStyle = '#000000';
            context.lineWidth = 1;
            context.strokeRect(-command.width / 2, -command.height / 2, command.width, command.height);
        }
    }

    private renderCircle(command: RenderCommand): void {
        const radius = command.radius || (command.width ? command.width / 2 : 10);

        if (command.tags?.includes('powerup')) {
            // Render power-up as a diamond shape with sparkle effect
            const context = this.canvas.getContext();
            const size = radius;

            context.beginPath();
            context.moveTo(0, -size);
            context.lineTo(size, 0);
            context.lineTo(0, size);
            context.lineTo(-size, 0);
            context.closePath();
            context.fillStyle = command.color;
            context.fill();

            // Add sparkle effect
            context.strokeStyle = '#ffffff';
            context.lineWidth = 2;
            context.stroke();
        } else {
            // Regular circle
            this.canvas.drawCircle(0, 0, radius, command.color);
        }
    }

    private renderTriangle(command: RenderCommand): void {
        if (!command.width || !command.height) return;

        // Render triangle pointing upward (for ships)
        const context = this.canvas.getContext();
        context.beginPath();
        context.moveTo(0, -command.height / 2);
        context.lineTo(-command.width / 2, command.height / 2);
        context.lineTo(command.width / 2, command.height / 2);
        context.closePath();
        context.fillStyle = command.color;
        context.fill();
    }

    private renderText(command: RenderCommand): void {
        if (!command.text) return;

        const context = this.canvas.getContext();
        context.fillStyle = command.color;
        context.font = command.font || '16px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(command.text, 0, 0);
    }

    updateCanvas(newCanvas: Canvas): void {
        this.canvas = newCanvas;
    }
}