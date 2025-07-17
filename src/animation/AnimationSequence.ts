import { Animation } from './Animation';

export class AnimationSequence {
    private animations: Animation[] = [];
    private currentIndex: number = 0;
    private isActive: boolean = true;

    constructor() {
        this.animations = [];
        this.currentIndex = 0;
    }

    addAnimation(animation: Animation): void {
        this.animations.push(animation);
    }

    update(deltaTime: number): void {
        if (!this.isActive || this.currentIndex >= this.animations.length) return;

        const currentAnimation = this.animations[this.currentIndex];
        currentAnimation.update(deltaTime);

        if (currentAnimation.isComplete()) {
            this.currentIndex++;

            if (this.currentIndex >= this.animations.length) {
                this.isActive = false;
            }
        }
    }

    isComplete(): boolean {
        return !this.isActive || this.currentIndex >= this.animations.length;
    }

    reset(): void {
        this.currentIndex = 0;
        this.isActive = true;

        for (const animation of this.animations) {
            animation.reset();
        }
    }

    getCurrentAnimation(): Animation | null {
        if (this.currentIndex < this.animations.length) {
            return this.animations[this.currentIndex];
        }
        return null;
    }

    getProgress(): number {
        if (this.animations.length === 0) return 0;
        return this.currentIndex / this.animations.length;
    }
}