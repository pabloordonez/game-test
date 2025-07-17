import { AnimationSequencer } from './AnimationSequencer';

export class AnimationTimeline {
	private sequences: Map<string, AnimationSequencer> = new Map();
	private currentSequenceName: string | null = null;
	private isPaused: boolean = false;
	private isStopped: boolean = false;
	private elapsedTime: number = 0;

	constructor() {
		this.sequences = new Map();
		this.currentSequenceName = null;
		this.isPaused = false;
		this.isStopped = false;
		this.elapsedTime = 0;
	}

	/**
	 * Create or get a sequence by name
	 * @param name Sequence name
	 * @returns AnimationSequencer instance
	 */
	sequence(name: string): AnimationSequencer {
		if (!this.sequences.has(name)) {
			this.sequences.set(name, new AnimationSequencer(name));
		}
		return this.sequences.get(name)!;
	}

	/**
	 * Start a sequence by name
	 * @param name Sequence name to start
	 */
	startSequence(name: string): void {
		if (!this.sequences.has(name)) {
			throw new Error(`Sequence "${name}" not found`);
		}

		this.currentSequenceName = name;
		const sequencer = this.sequences.get(name)!;
		sequencer.reset(); // Reset the sequencer to start from beginning
		this.isPaused = false;
		this.isStopped = false;
		this.elapsedTime = 0;
	}

	/**
	 * Pause the current sequence (freezes at current time)
	 */
	pause(): void {
		this.isPaused = true;
		const currentSequencer = this.getCurrentSequencer();
		if (currentSequencer) {
			currentSequencer.pause();
		}
	}

	/**
	 * Resume the current sequence (continues from frozen time)
	 */
	resume(): void {
		this.isPaused = false;
		const currentSequencer = this.getCurrentSequencer();
		if (currentSequencer) {
			currentSequencer.resume();
		}
	}

	/**
	 * Stop the current sequence (resets elapsed time to 0 and restarts from beginning)
	 */
	stop(): void {
		this.isStopped = true;
		this.elapsedTime = 0;
		const currentSequencer = this.getCurrentSequencer();
		if (currentSequencer) {
			currentSequencer.stop();
		}
	}

	/**
	 * Get the name of the currently active sequence
	 * @returns Current sequence name or null
	 */
	getCurrentSequenceName(): string | null {
		return this.currentSequenceName;
	}

	/**
	 * Get the currently active sequencer
	 * @returns Current AnimationSequencer or null
	 */
	getCurrentSequencer(): AnimationSequencer | null {
		if (!this.currentSequenceName) return null;
		return this.sequences.get(this.currentSequenceName) || null;
	}

	/**
	 * Update the timeline (handles pause/stop state internally)
	 * @param deltaTime Time since last update
	 */
	update(deltaTime: number): void {
		// Handle own state internally
		if (this.isPaused || this.isStopped) return;

		this.elapsedTime += deltaTime;

		const currentSequencer = this.getCurrentSequencer();
		if (currentSequencer) {
			currentSequencer.update(deltaTime);
		}
	}

	/**
	 * Check if the current sequence is complete
	 * @returns True if current sequence is complete
	 */
	isComplete(): boolean {
		const currentSequencer = this.getCurrentSequencer();
		return currentSequencer ? currentSequencer.isComplete() : true;
	}

	/**
	 * Check if timeline is paused
	 * @returns True if paused
	 */
	isTimelinePaused(): boolean {
		return this.isPaused;
	}

	/**
	 * Check if timeline is stopped
	 * @returns True if stopped
	 */
	isTimelineStopped(): boolean {
		return this.isStopped;
	}

	/**
	 * Get elapsed time for the current sequence
	 * @returns Elapsed time in seconds
	 */
	getElapsedTime(): number {
		return this.elapsedTime;
	}
}