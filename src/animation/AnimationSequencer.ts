import { Animation, AlphaAnimation, MovementAnimation, ScaleAnimation } from './Animation';
import { EasingFunctions } from './EasingFunctions';
import { Vector2 } from '../utils/Math';

export interface AnimationStep {
	animation: Animation;
	startTime: number;
	isActive: boolean;
}

export class AnimationSequencer {
	private steps: AnimationStep[] = [];
	private names: Map<string, AnimationStep> = new Map(); // name -> step indices
	private currentTime: number = 0;
	private isActive: boolean = true;

	constructor() {
		this.steps = [];
		this.names = new Map();
	}

	/**
	 * Play animations together at the same time
	 * @param animations Single animation, array of animations, or named group
	 * @param startTime When to start (default: 0)
	 */
	play(name: string, animations: Animation | Animation[], startTime: number = 0): AnimationSequencer {
		if (Array.isArray(animations)) {
			animations.forEach((anim) => this.addStep(name, anim, startTime));
		} else if (animations instanceof Animation) {
			this.addStep(name, animations, startTime);
		}

		return this;
	}

	/**
	 * Combine with additional animations. It uses the last start time configured.
	 * @param animations What to combine with
	 * @param startTime When to start (default: same as last group)
	 */
	combineWith(name: string, animations: Animation | Animation[]): AnimationSequencer {
		return this.play(name, animations, this.getLastStartTime());
	}

	/**
	 * Play animations in sequence (one after another)
	 * @param animations Array of animations or named group
	 * @param delay Optional delay between animations
	 */
	sequence(name: string, animations: Animation[], delay: number = 0): AnimationSequencer {
		let currentTime = this.getLastStartTime();
		animations.forEach((anim, i) => {
			this.addStep(`${name}.${i}`, anim, currentTime);
			currentTime += anim.getDuration() + delay;
		});

		return this;
	}

	/**
	 * Chain animations sequentially
	 */
	then(name: string, animation: Animation, delay: number = 0): AnimationSequencer {
		if (this.steps.length === 0) throw new Error('No animations to sequence');
		const lastStep = this.steps[this.steps.length - 1];
		const startTime = lastStep.startTime + lastStep.animation.getDuration() + delay;
		return this.play(name, animation, startTime);
	}

	/**
	 * Create and play alpha animation
	 * @param name Animation name
	 * @param from Starting alpha (0-1)
	 * @param to Ending alpha (0-1)
	 * @param duration Duration in seconds
	 * @param startTime When to start (default: 0)
	 * @param easing Easing function (default: linear)
	 */
	fade(name: string, from: number, to: number, duration: number, startTime: number = 0, easing: (t: number) => number = EasingFunctions.linear): AnimationSequencer {
		if (from < 0 || from > 1 || to < 0 || to > 1) throw new Error('Alpha values must be between 0 and 1');
		const animation = new AlphaAnimation(from, to, duration, easing);
		this.addStep(name, animation, startTime);
		return this;
	}

	/**
	 * Create and play movement animation using Vector2 objects
	 * @param name Animation name
	 * @param from Starting position
	 * @param to Ending position
	 * @param duration Duration in seconds
	 * @param startTime When to start (default: 0)
	 * @param easing Easing function (default: linear)
	 */
	move(name: string, from: Vector2, to: Vector2, duration: number, startTime: number = 0, easing: (t: number) => number = EasingFunctions.linear): AnimationSequencer {
		const animation = new MovementAnimation(from.x, from.y, to.x, to.y, duration, easing);
		this.addStep(name, animation, startTime);
		return this;
	}

	/**
	 * Create multiple movement animations at once
	 * @param baseName Base name for animations (will be named baseName0, baseName1, etc.)
	 * @param fromPositions Array of starting positions
	 * @param toPositions Array of ending positions
	 * @param duration Duration in seconds
	 * @param startTime When to start (default: 0)
	 * @param easing Easing function (default: linear)
	 */
	moveMultiple(
		baseName: string,
		fromPositions: Vector2[],
		toPositions: Vector2[],
		duration: number,
		startTime: number = 0,
		easing: (t: number) => number = EasingFunctions.linear
	): AnimationSequencer {
		for (let i = 0; i < fromPositions.length; i++) {
			const name = `${baseName}.${i}`;
			const animation = new MovementAnimation(fromPositions[i].x, fromPositions[i].y, toPositions[i].x, toPositions[i].y, duration, easing);
			this.addStep(name, animation, startTime);
		}

		return this;
	}

	/**
	 * Create and play scale animation
	 * @param name Animation name
	 * @param from Starting scale
	 * @param to Ending scale
	 * @param duration Duration in seconds
	 * @param startTime When to start (default: 0)
	 * @param easing Easing function (default: linear)
	 */
	scale(name: string, from: number, to: number, duration: number, startTime: number = 0, easing: (t: number) => number = EasingFunctions.linear): AnimationSequencer {
		const animation = new ScaleAnimation(from, to, duration, easing);
		this.addStep(name, animation, startTime);
		return this;
	}

	/**
	 * Get animation value by name
	 * @param name Animation name or "group.index" for arrays
	 */
	getValue(name: string): number {
        if (!this.names.has(name)) throw new Error(`Animation ${name} not found`);
		const step = this.names.get(name);
        if (!step) throw new Error(`Animation ${name} is null`);
		return step?.isActive ? step.animation.getValue() : 0;
	}

	/**
	 * Get animation object by name
	 * @param name Animation name
	 */
	getAnimation(name: string): Animation  {
		if (!this.names.has(name)) throw new Error(`Animation ${name} not found`);
		const step = this.names.get(name);
        if (!step) throw new Error(`Animation ${name} is null`);
		return step.animation;
	}

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
		const allComplete = this.steps.every((step) => !step.isActive || step.animation.isComplete());

		if (allComplete) {
			this.isActive = false;
		}
	}

	isComplete(): boolean {
		return !this.isActive;
	}

	reset(): void {
		this.currentTime = 0;
		this.isActive = true;
		this.steps.forEach((step) => {
			step.isActive = false;
			step.animation.reset();
		});
	}

	private addStep(name: string, animation: Animation, startTime: number): void {
		const animationStep: AnimationStep = {
			animation,
			startTime,
			isActive: false
		};

		this.steps.push(animationStep);
		this.names.set(name, animationStep);
	}

	private getLastStartTime(): number {
		return this.steps.length > 0 ? this.steps[this.steps.length - 1].startTime : 0;
	}
}
