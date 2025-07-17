export class Viewport {
    private width: number;
    private height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    getWidth(): number {
        return this.width;
    }

    getHeight(): number {
        return this.height;
    }

    getCenterX(): number {
        return this.width / 2;
    }

    getCenterY(): number {
        return this.height / 2;
    }

    getCenter(): {x: number, y: number} {
        return {
            x: this.getCenterX(),
            y: this.getCenterY()
        };
    }

    // Helper methods for common positioning
    getTopLeft(): {x: number, y: number} {
        return {x: 0, y: 0};
    }

    getTopRight(): {x: number, y: number} {
        return {x: this.width, y: 0};
    }

    getBottomLeft(): {x: number, y: number} {
        return {x: 0, y: this.height};
    }

    getBottomRight(): {x: number, y: number} {
        return {x: this.width, y: this.height};
    }

    // Get position as percentage of viewport
    getPositionByPercent(xPercent: number, yPercent: number): {x: number, y: number} {
        return {
            x: (this.width * xPercent) / 100,
            y: (this.height * yPercent) / 100
        };
    }

    // Check if point is within viewport
    isWithinBounds(x: number, y: number): boolean {
        return x >= 0 && x <= this.width && y >= 0 && y <= this.height;
    }

    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }
}