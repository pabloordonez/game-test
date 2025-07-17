import { Animation } from './Animation';
import { EasingFunctions } from './EasingFunctions';

export interface AnimationStep {
    animation: Animation;
    startTime: number;
    duration: number;
    isActive: boolean;
}

export class AnimationSequencer {
    private steps: AnimationStep[] = [];
    private currentTime: number = 0;
    private isActive: boolean = true;

    constructor() {
        this.steps = [];
    }

    // Fluent interface methods
    play(animation: Animation, startTime: number = 0): AnimationSequencer {
        this.steps.push({
            animation,
            startTime,
            duration: animation['duration'] || 1,
            isActive: false
        });
        return this;
    }

    then(animation: Animation, delay: number = 0): AnimationSequencer {
        const lastStep = this.steps[this.steps.length - 1];
        const startTime = lastStep ? lastStep.startTime + lastStep.duration + delay : 0;
        return this.play(animation, startTime);
    }

    parallel(animation: Animation, startTime: number = 0): AnimationSequencer {
        return this.play(animation, startTime);
    }

    at(startTime: number, animation: Animation): AnimationSequencer {
        return this.play(animation, startTime);
    }

    // Update method
    update(deltaTime: number): void {
        if (!this.isActive) return;

        this.currentTime += deltaTime;

        // Update all steps
        for (const step of this.steps) {
            if (this.currentTime >= step.startTime && !step.isActive) {
                step.isActive = true;
                step.animation.reset();
            }

            if (step.isActive) {
                step.animation.update(deltaTime);
            }
        }

        // Check if all animations are complete
        const allComplete = this.steps.every(step =>
            !step.isActive || step.animation.isComplete()
        );

        if (allComplete) {
            this.isActive = false;
        }
    }

    // Get current animation values
    getAnimationValue(animationIndex: number): number {
        if (animationIndex >= 0 && animationIndex < this.steps.length) {
            const step = this.steps[animationIndex];
            if (step.isActive) {
                return step.animation.getValue();
            }
        }
        return 0;
    }

    // Get animation by index
    getAnimation(animationIndex: number): Animation | null {
        if (animationIndex >= 0 && animationIndex < this.steps.length) {
            return this.steps[animationIndex].animation;
        }
        return null;
    }

    // Check if sequencer is complete
    isComplete(): boolean {
        return !this.isActive;
    }

    // Reset sequencer
    reset(): void {
        this.currentTime = 0;
        this.isActive = true;
        for (const step of this.steps) {
            step.isActive = false;
            step.animation.reset();
        }
    }

    // Get current time
    getCurrentTime(): number {
        return this.currentTime;
    }

    // Get active animations count
    getActiveCount(): number {
        return this.steps.filter(step => step.isActive && !step.animation.isComplete()).length;
    }
}