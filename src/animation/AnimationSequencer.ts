import { Animation, AlphaAnimation, MovementAnimation, ScaleAnimation } from './Animation';
import { EasingFunctions } from './EasingFunctions';
import { Vector2 } from '../utils/Math';

export class AnimationSequencer {
	private name: string;
	private animations: Animation[] = [];
	private names: Map<string, Animation> = new Map(); // name -> animation
	private startedAnimations: Set<Animation> = new Set(); // Track which animations have been started
	private currentTime: number = 0;
	private isActive: boolean = true;
	private isPaused: boolean = false;
	private isStopped: boolean = false;
	private lastStartTime: number = 0;
	private lastDuration: number = 0;
	private lastEasing: (t: number) => number = EasingFunctions.linear;

	// Lifecycle callbacks
	private onStartCallback?: () => void;
	private onEndCallback?: () => void;
	private onUpdateCallback?: (progress: number) => void;

	constructor(name: string) {
		this.name = name;
		this.animations = [];
		this.names = new Map();
		this.startedAnimations = new Set();
	}

	/**
	 * Get the name of the sequencer
	 * @returns Name of the sequencer
	 */
	getName(): string {
		return this.name;
	}

	/**
	 * Set the start time of the sequencer
	 * @param startTime When to start (default: 0)
	 */
	at(startTime: number): AnimationSequencer {
		this.lastStartTime = startTime;
		return this;
	}

	/**
	 * Set the duration of the sequencer
	 * @param duration Duration in seconds
	 */
	for(duration: number): AnimationSequencer {
		this.lastDuration = duration;
		return this;
	}

	/**
	 * Set the easing function of the sequencer
	 * @param easing Easing function
	 */
	easeWith(easing: (t: number) => number): AnimationSequencer {
		this.lastEasing = easing;
		return this;
	}

	/**
	 * Play animations together at the same time
	 * @param animations Single animation, array of animations, or named group
	 * @param startTime When to start (default: 0)
	 */
	play(name: string, animations: Animation | Animation[]): AnimationSequencer {
		if (Array.isArray(animations)) {
			animations.forEach((anim) => this.addAnimation(name, anim, this.lastStartTime));
		} else if (animations instanceof Animation) {
			this.addAnimation(name, animations, this.lastStartTime);
		}

		return this;
	}

	/**
	 * Combine with additional animations. It uses the last start time configured.
	 * @param animations What to combine with
	 * @param startTime When to start (default: same as last group)
	 */
	combineWith(name: string, animations: Animation | Animation[]): AnimationSequencer {
		return this.play(name, animations);
	}

	/**
	 * Play animations in sequence (one after another)
	 * @param animations Array of animations or named group
	 * @param delay Optional delay between animations
	 */
	sequence(name: string, animations: Animation[], delay: number = 0): AnimationSequencer {
		let currentTime = this.lastStartTime;
		animations.forEach((anim, i) => {
			this.addAnimation(`${name}.${i}`, anim, currentTime);
			currentTime += anim.getDuration() + delay;
		});

		return this;
	}

	/**
	 * Chain animations sequentially
	 * @param name Animation name
	 * @param animation Animation to chain
	 * @param delay Delay between animations
	 */
	then(name: string, animation: Animation, delay: number = 0): AnimationSequencer {
		if (this.animations.length === 0) throw new Error('No animations to sequence');
		const lastAnimation = this.animations[this.animations.length - 1];
		const startTime = (lastAnimation as any).startTime + lastAnimation.getDuration() + delay;
		return this.at(startTime).play(name, animation);
	}

	/**
	 * Create and play alpha animation
	 * @param name Animation name
	 * @param from Starting alpha (0-1)
	 * @param to Ending alpha (0-1)
	 */
	fade(name: string, from: number, to: number): AnimationSequencer {
		if (from < 0 || from > 1 || to < 0 || to > 1) throw new Error('Alpha values must be between 0 and 1');
		const animation = new AlphaAnimation(from, to, this.lastDuration, this.lastEasing);
		this.addAnimation(name, animation, this.lastStartTime);
		return this;
	}

	/**
	 * Create and play movement animation using Vector2 objects
	 * @param name Animation name
	 * @param from Starting position
	 * @param to Ending position
	 */
	move(name: string, from: Vector2, to: Vector2): AnimationSequencer {
		const animation = new MovementAnimation(from.x, from.y, to.x, to.y, this.lastDuration, this.lastEasing);
		this.addAnimation(name, animation, this.lastStartTime);
		return this;
	}

	/**
	 * Create multiple movement animations at once
	 * @param baseName Base name for animations (will be named baseName0, baseName1, etc.)
	 * @param fromPositions Array of starting positions
	 * @param toPositions Array of ending positions
	 */
	moveMultiple(
		baseName: string,
		fromPositions: Vector2[],
		toPositions: Vector2[],
	): AnimationSequencer {
		for (let i = 0; i < fromPositions.length; i++) {
			const name = `${baseName}.${i}`;
			const animation = new MovementAnimation(fromPositions[i].x, fromPositions[i].y, toPositions[i].x, toPositions[i].y, this.lastDuration, this.lastEasing);
			this.addAnimation(name, animation, this.lastStartTime);
		}

		return this;
	}

	/**
	 * Create and play scale animation
	 * @param name Animation name
	 * @param from Starting scale
	 * @param to Ending scale
	*/
	scale(name: string, from: number, to: number): AnimationSequencer {
		const animation = new ScaleAnimation(from, to, this.lastDuration, this.lastEasing);
		this.addAnimation(name, animation, this.lastStartTime);
		return this;
	}

	/**
	 * Get animation value by name
	 * @param name Animation name or "group.index" for arrays
	 */
	getValue(name: string): number {
        if (!this.names.has(name)) throw new Error(`Animation ${name} not found`);
		const animation = this.names.get(name);
        if (!animation) throw new Error(`Animation ${name} is null`);
		return animation.getValue();
	}

	/**
	 * Get animation object by name
	 * @param name Animation name
	 */
	getAnimation(name: string): Animation  {
		if (!this.names.has(name)) throw new Error(`Animation ${name} not found`);
		const animation = this.names.get(name);
        if (!animation) throw new Error(`Animation ${name} is null`);
		return animation;
	}

	update(deltaTime: number): void {
		if (!this.isActive || this.isPaused || this.isStopped) return;

		this.currentTime += deltaTime;

		// Call onStart callback when first animation starts
		if (this.onStartCallback && this.currentTime > 0 && this.startedAnimations.size > 0) {
			this.onStartCallback();
			this.onStartCallback = undefined; // Only call once
		}

		// Update all animations
		for (const animation of this.animations) {
			const startTime = (animation as any).startTime;

			// Start animation if it's time and it hasn't been started yet
			if (this.currentTime >= startTime && !this.startedAnimations.has(animation)) {
				animation.reset();
				this.startedAnimations.add(animation);
			}

			// Update animation if it's started and not complete
			if (this.startedAnimations.has(animation) && !animation.isComplete()) {
				animation.update(deltaTime);
			}
		}

		// Call onUpdate callback with progress
		if (this.onUpdateCallback) {
			const totalDuration = Math.max(...this.animations.map(anim => (anim as any).startTime + anim.getDuration()));
			const progress = Math.min(this.currentTime / totalDuration, 1);
			this.onUpdateCallback(progress);
		}

		// Check if all animations are complete
		const allComplete = this.animations.every((animation) => animation.isComplete());

		if (allComplete) {
			this.isActive = false;
			// Call onEnd callback when all animations complete
			if (this.onEndCallback) {
				this.onEndCallback();
			}
		}
	}

	isComplete(): boolean {
		return !this.isActive;
	}

	reset(): void {
		this.currentTime = 0;
		this.isActive = true;
		this.isPaused = false;
		this.isStopped = false;
		this.startedAnimations.clear();
		this.animations.forEach((animation) => {
			animation.setActive(false);
			animation.reset();
		});
	}

	/**
	 * Pause the sequencer (freezes at current time)
	 */
	pause(): AnimationSequencer {
		this.isPaused = true;
		return this;
	}

	/**
	 * Resume the sequencer (continues from frozen time)
	 */
	resume(): AnimationSequencer {
		this.isPaused = false;
		return this;
	}

	/**
	 * Stop the sequencer (resets elapsed time to 0 and restarts from beginning)
	 */
	stop(): AnimationSequencer {
		this.isStopped = true;
		this.currentTime = 0;
		this.resetAllAnimations();
		return this;
	}

	/**
	 * Check if sequencer is paused
	 */
	isSequencerPaused(): boolean {
		return this.isPaused;
	}

	/**
	 * Check if sequencer is stopped
	 */
	isSequencerStopped(): boolean {
		return this.isStopped;
	}

	/**
	 * Set onStart callback
	 */
	onStart(callback: () => void): AnimationSequencer {
		this.onStartCallback = callback;
		return this;
	}

	/**
	 * Set onEnd callback
	 */
	onEnd(callback: () => void): AnimationSequencer {
		this.onEndCallback = callback;
		return this;
	}

	/**
	 * Set onUpdate callback
	 */
	onUpdate(callback: (progress: number) => void): AnimationSequencer {
		this.onUpdateCallback = callback;
		return this;
	}

	/**
	 * Reset all animations to initial state
	 */
	private resetAllAnimations(): void {
		this.startedAnimations.clear();
		this.animations.forEach((animation) => {
			animation.setActive(false);
			animation.reset();
		});
	}

	private addAnimation(name: string, animation: Animation, startTime: number): void {
		// Add startTime property to the animation instance
		(animation as any).startTime = startTime;

		this.animations.push(animation);
		this.names.set(name, animation);
	}
}
