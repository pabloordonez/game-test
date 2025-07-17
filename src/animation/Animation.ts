import { EasingFunction, EasingFunctions } from './EasingFunctions';

export abstract class Animation {
    protected startValue: number;
    protected endValue: number;
    protected duration: number;
    protected currentTime: number = 0;
    protected easing: EasingFunction;
    protected isActive: boolean = true;

    constructor(startValue: number, endValue: number, duration: number, easing: EasingFunction = EasingFunctions.linear) {
        this.startValue = startValue;
        this.endValue = endValue;
        this.duration = duration;
        this.easing = easing;
    }

    update(deltaTime: number): void {
        if (!this.isActive) return;

        this.currentTime += deltaTime;

        if (this.currentTime >= this.duration) {
            this.currentTime = this.duration;
            this.isActive = false;
        }
    }

    getValue(): number {
        const progress = this.currentTime / this.duration;
        const easedProgress = this.easing(progress);
        return this.startValue + (this.endValue - this.startValue) * easedProgress;
    }

    isComplete(): boolean {
        return !this.isActive;
    }

    reset(): void {
        this.currentTime = 0;
        this.isActive = true;
    }

    setActive(active: boolean): void {
        this.isActive = active;
    }

    getDuration(): number {
        return this.duration;
    }
}

export class ColorAnimation extends Animation {
    private startColor: string;
    private endColor: string;

    constructor(startColor: string, endColor: string, duration: number, easing: EasingFunction = EasingFunctions.linear) {
        super(0, 1, duration, easing);
        this.startColor = startColor;
        this.endColor = endColor;
    }

    getColor(): string {
        const progress = this.getValue();
        return this.interpolateColor(this.startColor, this.endColor, progress);
    }

    private interpolateColor(color1: string, color2: string, factor: number): string {
        // Simple color interpolation - can be enhanced for more complex colors
        const r1 = parseInt(color1.slice(1, 3), 16);
        const g1 = parseInt(color1.slice(3, 5), 16);
        const b1 = parseInt(color1.slice(5, 7), 16);

        const r2 = parseInt(color2.slice(1, 3), 16);
        const g2 = parseInt(color2.slice(3, 5), 16);
        const b2 = parseInt(color2.slice(5, 7), 16);

        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}

export class MovementAnimation extends Animation {
    private startX: number;
    private startY: number;
    private endX: number;
    private endY: number;

    constructor(startX: number, startY: number, endX: number, endY: number, duration: number, easing: EasingFunction = EasingFunctions.linear) {
        super(0, 1, duration, easing);
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
    }

    getPosition(): {x: number, y: number} {
        const progress = this.getValue();
        return {
            x: this.startX + (this.endX - this.startX) * progress,
            y: this.startY + (this.endY - this.startY) * progress
        };
    }
}

export class AlphaAnimation extends Animation {
    constructor(startAlpha: number, endAlpha: number, duration: number, easing: EasingFunction = EasingFunctions.linear) {
        super(startAlpha, endAlpha, duration, easing);
    }

    getAlpha(): number {
        return this.getValue();
    }
}

export class ScaleAnimation extends Animation {
    constructor(startScale: number, endScale: number, duration: number, easing: EasingFunction = EasingFunctions.linear) {
        super(startScale, endScale, duration, easing);
    }

    getScale(): number {
        return this.getValue();
    }
}