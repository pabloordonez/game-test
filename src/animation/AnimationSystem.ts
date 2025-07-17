import { Animation } from './Animation';
import { AnimationSequence } from './AnimationSequence';

export class AnimationSystem {
    private animations: Animation[] = [];
    private sequences: AnimationSequence[] = [];
    private isActive: boolean = true;

    constructor() {
        this.animations = [];
        this.sequences = [];
    }

    addAnimation(animation: Animation): void {
        this.animations.push(animation);
    }

    addSequence(sequence: AnimationSequence): void {
        this.sequences.push(sequence);
    }

    update(deltaTime: number): void {
        if (!this.isActive) return;

        // Update individual animations
        this.animations = this.animations.filter(animation => {
            animation.update(deltaTime);
            return !animation.isComplete();
        });

        // Update sequences
        this.sequences = this.sequences.filter(sequence => {
            sequence.update(deltaTime);
            return !sequence.isComplete();
        });
    }

    clear(): void {
        this.animations = [];
        this.sequences = [];
    }

    pause(): void {
        this.isActive = false;
    }

    resume(): void {
        this.isActive = true;
    }

    getActiveAnimationCount(): number {
        return this.animations.length + this.sequences.length;
    }

    isIdle(): boolean {
        return this.animations.length === 0 && this.sequences.length === 0;
    }
}