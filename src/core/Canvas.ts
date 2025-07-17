export class Canvas {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private width: number;
    private height: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d')!;
        this.width = canvas.width;
        this.height = canvas.height;

        if (!this.context) {
            throw new Error('Could not get 2D context from canvas');
        }
    }

    getContext(): CanvasRenderingContext2D {
        return this.context;
    }

    getWidth(): number {
        return this.width;
    }

    getHeight(): number {
        return this.height;
    }

    clear(): void {
        this.context.clearRect(0, 0, this.width, this.height);
    }

    drawRect(x: number, y: number, width: number, height: number, color: string, alpha?: number): void {
        this.context.save();
        if (alpha !== undefined) {
            this.context.globalAlpha = alpha;
        }
        this.context.fillStyle = color;
        this.context.fillRect(x, y, width, height);
        this.context.restore();
    }

    drawCircle(x: number, y: number, radius: number, color: string, alpha?: number): void {
        this.context.save();
        if (alpha !== undefined) {
            this.context.globalAlpha = alpha;
        }
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, 2 * Math.PI);
        this.context.fill();
        this.context.restore();
    }

    drawText(text: string, x: number, y: number, font: string, color: string, alpha?: number): void {
        this.context.save();
        if (alpha !== undefined) {
            this.context.globalAlpha = alpha;
        }
        this.context.font = font;
        this.context.fillStyle = color;
        // Removed textAlign and textBaseline - keeping default behavior
        this.context.fillText(text, x, y);
        this.context.restore();
    }

    // Add string measurement method
    measureText(text: string, font: string): TextMetrics {
        this.context.save();
        this.context.font = font;
        const metrics = this.context.measureText(text);
        this.context.restore();
        return metrics;
    }

    // Add helper method for centered text positioning
    getCenteredTextPosition(text: string, font: string, centerX: number, centerY: number): {x: number, y: number} {
        const metrics = this.measureText(text, font);
        const textWidth = metrics.width;

        // For height, we can use the font size (approximate) or actualBoundingBoxAscent + actualBoundingBoxDescent
        const fontSize = parseInt(font.match(/\d+/)?.[0] || '16');
        const textHeight = fontSize;

        return {
            x: centerX - (textWidth / 2),
            y: centerY + (textHeight / 4) // Slight adjustment for baseline
        };
    }

    // Add helper method for drawing centered text
    drawCenteredText(text: string, centerX: number, centerY: number, font: string, color: string, alpha?: number): void {
        const position = this.getCenteredTextPosition(text, font, centerX, centerY);
        this.drawText(text, position.x, position.y, font, color, alpha);
    }

    drawSprite(sprite: HTMLImageElement, x: number, y: number, width?: number, height?: number): void {
        if (width && height) {
            this.context.drawImage(sprite, x, y, width, height);
        } else {
            this.context.drawImage(sprite, x, y);
        }
    }

    resize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
    }

    // Canvas transformation methods for transitions
    save(): void {
        this.context.save();
    }

    restore(): void {
        this.context.restore();
    }

    translate(x: number, y: number): void {
        this.context.translate(x, y);
    }

    scale(x: number, y: number): void {
        this.context.scale(x, y);
    }

    rotate(angle: number): void {
        this.context.rotate(angle);
    }

    setGlobalAlpha(alpha: number): void {
        this.context.globalAlpha = alpha;
    }
}