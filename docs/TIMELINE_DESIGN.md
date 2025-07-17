# Animation Timeline System Design

## Overview

The Animation Timeline system combines sequence-based animations with state machine rendering to create a more declarative and maintainable animation system.

## Core Components

### 1. AnimationTimeline

Main orchestrator that manages multiple named sequences and coordinates with state changes.

```typescript
class AnimationTimeline {
	private sequences: Map<string, AnimationSequencer> = new Map();
	private currentSequenceName: string | null = null;
	private isPaused: boolean = false;
	private isStopped: boolean = false;
	private elapsedTime: number = 0;

	sequence(name: string): AnimationSequencer;
	startSequence(name: string): void;
	pause(): void; // Freezes at current time
	resume(): void; // Continues from frozen time
	stop(): void; // Resets elapsed time to 0 and restarts from beginning

	getCurrentSequenceName(): string | null;
	getCurrentSequencer(): AnimationSequencer | null;
	update(deltaTime: number): void; // Handles pause/stop state internally
	isComplete(): boolean;
}
```

### 2. Enhanced AnimationSequencer

Your existing AnimationSequencer enhanced with lifecycle callbacks.

```typescript
class AnimationSequencer {
	// Existing methods (unchanged)
	at(time: number): AnimationSequencer;
	for(duration: number): AnimationSequencer;
	easeWith(easing: (t: number) => number): AnimationSequencer;
	fade(name: string, from: number, to: number): AnimationSequencer;
	move(name: string, from: Vector2, to: Vector2): AnimationSequencer;
	moveMultiple(baseName: string, fromPositions: Vector2[], toPositions: Vector2[]): AnimationSequencer;
	scale(name: string, from: number, to: number): AnimationSequencer;
	getValue(name: string): number;
	getAnimation(name: string): Animation;

	// Control methods with time tracking
	pause(): AnimationSequencer; // Freezes at current time
	resume(): AnimationSequencer; // Continues from frozen time
	stop(): AnimationSequencer; // Resets elapsed time to 0 and restarts from beginning
	isPaused(): boolean;
	isStopped(): boolean;

	// New lifecycle callback methods
	onStart(callback: () => void): AnimationSequencer;
	onEnd(callback: () => void): AnimationSequencer;
	onUpdate(callback: (progress: number) => void): AnimationSequencer;
}
```

### 3. State-Based Rendering System

Each screen defines states and corresponding render methods:

```typescript
type ScreenState = 'initial' | 'fadingIn' | 'waitingForInput' | 'expanding' | 'complete';

type StateRenderMethod = (canvas: Canvas) => void;

class IntroScreen extends BaseScreen {
	private state: ScreenState = 'initial';
	private timeline: AnimationTimeline;
	private stateRenderers: Partial<Record<ScreenState, StateRenderMethod>>;
}
```

## Usage Example

### IntroScreen Implementation

```typescript
type StateInputHandler = (inputManager: InputManager) => void;

class IntroScreen extends BaseScreen {
	private state: ScreenState = 'initial';
	private timeline: AnimationTimeline;
	private stateRenderers: Partial<Record<ScreenState, StateRenderMethod>>;
	private stateInputHandlers: Partial<Record<ScreenState, StateInputHandler>>;

	constructor() {
		super();
		this.timeline = new AnimationTimeline();
		this.initializeSequences();
		this.initializeRenderers();
		this.initializeInputHandlers();

		// Start the intro sequence immediately
		this.timeline.startSequence('fadingIn');
		this.state = 'fadingIn';
	}

	private initializeSequences(): void {
		this.timeline
			.sequence('fadingIn')
			.at(0)
			.for(2)
			.easeWith(EasingFunctions.easeIn)
			.fade('logoAlpha', 0, 1)
			.fade('titleAlpha', 0, 1)
			.at(2)
			.for(1)
			.fade('pressKeyAlpha', 0, 1)
			.onEnd(() => {
				this.state = 'waitingForInput';
			})

			.sequence('expanding')
			.at(0)
			.for(3)
			.easeWith(EasingFunctions.easeOut)
			.moveMultiple('boxMovement', this.getStartPositions(), this.getTargetPositions())
			.fade('logoAlpha', 1, 0)
			.scale('logoScale', 1, 2.5)
			.for(2)
			.fade('titleAlpha', 1, 0)
			.fade('pressKeyAlpha', 1, 0)
			.onStart(() => {
				this.state = 'expanding';
			})
			.onEnd(() => {
				this.state = 'complete';
				this.requestScreenChange(ScreenType.GAME, {
					type: TransitionType.FADE,
					duration: 1.5
				});
			});
	}

	private initializeRenderers(): void {
		this.stateRenderers = {
			// Only define renderers for states that need custom rendering
			fadingIn: this.renderFadingIn.bind(this),
			waitingForInput: this.renderWaitingForInput.bind(this),
			expanding: this.renderExpanding.bind(this)
			// 'initial' and 'complete' don't need custom rendering - just stars
		};
	}

	private initializeInputHandlers(): void {
		this.stateInputHandlers = {
			// Only define handlers for states that accept input
			waitingForInput: this.handleWaitingForInputInput.bind(this)
			// Other states don't need input handling
		};
	}

	update(deltaTime: number): void {
		if (!this.isActive) return;

		this.screenTime += deltaTime;
		this.timeline.update(deltaTime); // Timeline handles its own state internally
		this.starSystem.update(deltaTime);
	}

	render(canvas: Canvas): void {
		if (!this.isActive) return;

		canvas.clear();
		this.renderStarParticles(canvas);

		// State-based rendering - only call if handler exists
		if (this.stateRenderers[this.state]) {
			this.stateRenderers[this.state]!(canvas);
		}
	}

	handleInput(inputManager: InputManager): void {
		if (!this.isActive) return;

		// State-based input handling - only call if handler exists
		if (this.stateInputHandlers[this.state]) {
			this.stateInputHandlers[this.state]!(inputManager);
		}
	}

	// Expose current sequence for internal render methods to access animation values
	getCurrentSequencer(): AnimationSequencer | null {
		return this.timeline.getCurrentSequencer();
	}
}
```

### State Render Methods (Internal to IntroScreen)

```typescript
  private renderFadingIn(canvas: Canvas): void {
    const sequencer = this.timeline.getCurrentSequencer();
    if (!sequencer) return;

    const centerX = this.viewport.getCenterX();
    const centerY = this.viewport.getCenterY();
    const logoAlpha = sequencer.getValue('logoAlpha');
    const titleAlpha = sequencer.getValue('titleAlpha');
    const pressKeyAlpha = sequencer.getValue('pressKeyAlpha');

    // Draw title
    if (titleAlpha > 0) {
      canvas.drawCenteredText('Stellar Breach', centerX, centerY - 120,
        '28px Segoe UI', '#cccccc', titleAlpha);
    }

    // Draw logo
    if (logoAlpha > 0) {
      canvas.drawCenteredText('Microsoft', centerX, centerY - 70,
        '24px Segoe UI', '#ffffff', logoAlpha);
      this.renderWindowsBoxes(canvas, logoAlpha);
    }

    // Draw prompt
    if (pressKeyAlpha > 0) {
      canvas.drawCenteredText('Press any key to start', centerX, 500,
        '24px Segoe UI', '#ffffff', pressKeyAlpha);
    }
  }

  private renderExpanding(canvas: Canvas): void {
    const sequencer = this.timeline.getCurrentSequencer();
    if (!sequencer) return;

    const centerX = this.viewport.getCenterX();
    const centerY = this.viewport.getCenterY();
    const logoAlpha = sequencer.getValue('logoAlpha');
    const logoScale = sequencer.getValue('logoScale');
    const titleAlpha = sequencer.getValue('titleAlpha');

    // Draw scaled/fading title and logo
    if (titleAlpha > 0) {
      canvas.drawCenteredText('Stellar Breach', centerX, centerY - 120,
        '28px Segoe UI', '#cccccc', titleAlpha);
    }

    if (logoAlpha > 0) {
      canvas.drawCenteredText('Microsoft', centerX, centerY - 70,
        '24px Segoe UI', '#ffffff', logoAlpha);
    }

    // Draw moving boxes - direct access to internal methods and properties
    this.renderMovingBoxes(canvas, sequence);
  }

  private renderWaitingForInput(canvas: Canvas): void {
    // Direct access to all internal properties and methods
    const centerX = this.viewport.getCenterX();
    const centerY = this.viewport.getCenterY();

    // Render static elements at full opacity
    canvas.drawCenteredText('Stellar Breach', centerX, centerY - 120,
      '28px Segoe UI', '#cccccc', 1.0);
    canvas.drawCenteredText('Microsoft', centerX, centerY - 70,
      '24px Segoe UI', '#ffffff', 1.0);
    this.renderWindowsBoxes(canvas, 1.0);
    canvas.drawCenteredText('Press any key to start', centerX, 500,
      '24px Segoe UI', '#ffffff', 1.0);
  }



  // Helper methods with direct access to internal state
  private renderWindowsBoxes(canvas: Canvas, alpha: number): void {
    const centerX = this.viewport.getCenterX();
    const centerY = this.viewport.getCenterY();

    // Direct access to this.colors array
    for (let i = 0; i < 4; i++) {
      const color = this.colors[i];
      // Box positioning logic...
      canvas.drawRect(x, y, 40, 40, color, alpha);
    }
  }

    private renderMovingBoxes(canvas: Canvas, sequencer: AnimationSequencer): void {
    // Access sequence animations directly
    for (let i = 0; i < 4; i++) {
      const movement = sequencer.getAnimation(`boxMovement.${i}`);
      const position = (movement as any).getPosition();
      const alpha = sequencer.getValue('logoAlpha');
      const scale = sequencer.getValue('logoScale');

      // Direct access to this.colors
      canvas.drawRect(position.x, position.y, 40 * scale, 40 * scale,
                     this.colors[i], alpha);
    }
  }

  // State-based Input Handler (Only for states that need input)
  private handleWaitingForInputInput(inputManager: InputManager): void {
    // Only accept input when waiting for user interaction
    if (this.anyKeyPressed(inputManager)) {
      this.timeline.startSequence('expanding');
      // State change happens automatically in sequence onStart callback
    }
  }



  private anyKeyPressed(inputManager: InputManager): boolean {
    return inputManager.isMoveLeft() ||
           inputManager.isMoveRight() ||
           inputManager.isFire() ||
           inputManager.isPause() ||
           inputManager.isKeyPressed('Space') ||
           inputManager.isKeyPressed('Enter');
  }
```

## Benefits

1. **Clear State Flow**: Each screen state has a clear purpose, rendering logic, and input handling
2. **Declarative Sequences**: Animation sequences are defined declaratively with explicit names
3. **Separation of Concerns**: Animation logic, state management, rendering, and input are cleanly separated
4. **No Manual Flags**: State machine eliminates `isComplete`, `isExpanding`, `enableUserInput` type flags
5. **Explicit Animation Names**: `'logoAlpha'`, `'logoScale'`, `'boxMovement'` prevent naming collisions
6. **Consistent State Management**: Both rendering AND input handling use the same state-based pattern
7. **Minimal Handler Definition**: Only define handlers for states that actually need them - no empty methods
8. **Easy Testing**: Each component can be tested independently
9. **Better Readability**: Code reads like a story of what happens when
10. **Internal Control**: Timeline control is internal to screens - no dangerous public APIs
11. **Proper Encapsulation**: Timeline handles its own update state - screen doesn't need to know internal timeline state

## Implementation Priority

1. **AnimationTimeline** class
2. **SequenceBuilder** class (extends current AnimationSequencer functionality)
3. **StateRenderer** interface and base implementations
4. **Integrate with IntroScreen** as proof of concept
5. **Create helper methods** for common rendering patterns

This system maintains the fluent API you already have while adding the state management and callback system that eliminates manual flag tracking.

## Time Tracking Behavior

### Timeline Time Tracking

```typescript
class AnimationTimeline {
	private elapsedTime: number = 0;

	update(deltaTime: number): void {
		if (this.isPaused || this.isStopped) return;
		this.elapsedTime += deltaTime; // Track elapsed time
		// ... update current sequencer
	}

	pause(): void {
		this.isPaused = true;
		// elapsedTime stays frozen at current value
	}

	resume(): void {
		this.isPaused = false;
		// elapsedTime continues from frozen value
	}

	stop(): void {
		this.isStopped = true;
		this.elapsedTime = 0; // Reset timer
		this.getCurrentSequencer()?.stop(); // Stop and reset current sequencer
	}
}
```

### Sequencer Time Tracking

```typescript
class AnimationSequencer {
	private currentTime: number = 0;

	update(deltaTime: number): void {
		if (this.isPaused || this.isStopped) return;
		this.currentTime += deltaTime; // Track own elapsed time
		// ... update animations
	}

	pause(): void {
		this.isPaused = true;
		// currentTime stays frozen
	}

	resume(): void {
		this.isPaused = false;
		// currentTime continues from frozen value
	}

	stop(): void {
		this.isStopped = true;
		this.currentTime = 0; // Reset timer
		this.resetAllAnimations(); // Reset all animations to initial state
	}
}
```

### Behavior Summary

-   **pause()**: Freezes time at current value - animations stop but maintain position
-   **resume()**: Continues from frozen time - animations resume from where they stopped
-   **stop()**: Resets time to 0 and restarts animations from beginning
