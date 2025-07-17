# Animation System

A comprehensive animation system for the Stellar Breach game with fluent interface for sequencing animations.

## Features

- **Base Animation Class**: Configurable duration, easing, and interpolation
- **Animation Types**: Alpha, Movement, Scale, Color animations
- **Easing Functions**: Linear, ease-in, ease-out, ease-in-out, bounce, elastic, back
- **Animation Sequencer**: Fluent interface for timing and sequencing
- **Star Particle System**: Continuous particle effects for deep space

## Usage Examples

### Basic Animation

```typescript
import { AlphaAnimation, EasingFunctions } from '../animation';

// Create a fade-in animation
const fadeIn = new AlphaAnimation(0, 1, 2, EasingFunctions.easeIn);
fadeIn.update(deltaTime);
const alpha = fadeIn.getAlpha();
```

### Fluent Animation Sequencer

```typescript
import { AnimationSequencer, AlphaAnimation, MovementAnimation, EasingFunctions } from '../animation';

const sequencer = new AnimationSequencer();

// Method 1: Chaining with .then()
sequencer
    .play(new AlphaAnimation(0, 1, 2, EasingFunctions.easeIn), 0)
    .then(new MovementAnimation(0, 0, 100, 100, 1, EasingFunctions.easeOut), 0.5)
    .then(new AlphaAnimation(1, 0, 1, EasingFunctions.easeOut));

// Method 2: Using .at() for precise timing
sequencer
    .at(0, new AlphaAnimation(0, 1, 2, EasingFunctions.easeIn))
    .at(2, new MovementAnimation(0, 0, 100, 100, 1, EasingFunctions.easeOut))
    .at(3, new AlphaAnimation(1, 0, 1, EasingFunctions.easeOut));

// Method 3: Parallel animations
sequencer
    .play(new AlphaAnimation(0, 1, 2, EasingFunctions.easeIn), 0)
    .parallel(new MovementAnimation(0, 0, 100, 100, 2, EasingFunctions.easeOut), 0)
    .parallel(new AlphaAnimation(1, 0, 2, EasingFunctions.easeOut), 0);

// Update the sequencer
sequencer.update(deltaTime);
```

### Star Particle System

```typescript
import { StarParticleSystem } from '../animation';

// Create particle system
const starSystem = new StarParticleSystem(400, 300, 800, 600);
starSystem.setSpawnRate(0.1); // Spawn every 0.1 seconds

// Update particles
starSystem.update(deltaTime);

// Get particles for rendering
const particles = starSystem.getParticles();
for (const particle of particles) {
    canvas.drawCircle(particle.x, particle.y, 1, particle.color, particle.alpha);
}
```

## IntroScreen Animation Example

The IntroScreen demonstrates a complex animation sequence:

```typescript
// Phase 1: Logo and text fade in (0-2 seconds)
// Phase 2: Boxes move to corners and fade out (2-5 seconds)
// Phase 3: Star particles start (5 seconds)
// Phase 4: Press key text fade in (7-8 seconds)

this.sequencer
    .play(logoFadeIn, 0)                    // Logo fade in at 0s
    .parallel(textFadeIn, 0)                // Text fade in at 0s (parallel)
    .at(2, boxAnimations[0])                // Box 1 move at 2s
    .parallel(boxAlphaAnimations[0], 2)     // Box 1 fade at 2s
    .at(2, boxAnimations[1])                // Box 2 move at 2s
    .parallel(boxAlphaAnimations[1], 2)     // Box 2 fade at 2s
    .at(2, boxAnimations[2])                // Box 3 move at 2s
    .parallel(boxAlphaAnimations[2], 2)     // Box 3 fade at 2s
    .at(2, boxAnimations[3])                // Box 4 move at 2s
    .parallel(boxAlphaAnimations[3], 2)     // Box 4 fade at 2s
    .at(5, starStart)                       // Stars start at 5s
    .at(7, pressKeyFadeIn);                 // Press key text at 7s
```

## Easing Functions

- `linear`: Constant speed
- `easeIn`: Slow start, fast end
- `easeOut`: Fast start, slow end
- `easeInOut`: Slow start and end, fast middle
- `easeBack`: Overshoots and returns
- `easeBounce`: Bounces at the end
- `easeElastic`: Elastic effect

## Performance

- Efficient delta-time based updates
- Automatic cleanup of completed animations
- Object pooling for particle systems
- Minimal memory allocation during updates