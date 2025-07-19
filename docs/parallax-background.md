# Parallax Background System

## Overview

The parallax background system provides a dynamic, multi-layered scrolling background that creates depth and movement in the game. It consists of two main components:

-   `ParallaxBackground`: Manages the background layers and their properties
-   `ParallaxRenderer`: Handles the actual rendering of the background patterns

## Features

### Multiple Themes

The system supports four different visual themes:

-   **Space**: Classic starfield with nebula effects
-   **Nebula**: Colorful nebula clouds with stars
-   **Grid**: Cyberpunk-style grid pattern
-   **Stars**: Dense starfield with various star sizes

### Dynamic Speed Control

-   Background scroll speed adjusts based on player movement
-   Different layers move at different speeds for depth effect
-   Speed can be controlled programmatically

### Responsive Design

-   Automatically adjusts to canvas size changes
-   Maintains proper aspect ratios
-   Seamless scrolling with proper wrapping

## Usage

### Basic Setup

```typescript
// Create parallax background configuration
const config: ParallaxConfig = {
	layerCount: 6,
	baseSpeed: 20,
	speedMultiplier: 1.5,
	screenWidth: 800,
	screenHeight: 600,
	theme: 'space'
};

// Initialize background and renderer
const parallaxBackground = new ParallaxBackground(config);
const parallaxRenderer = new ParallaxRenderer(canvas);
```

### Integration with Game Screen

The parallax background is automatically integrated into the GameScreen:

1. **Initialization**: Background is created with default dimensions
2. **Update**: Called every frame to update layer positions
3. **Rendering**: Rendered before all game objects for proper layering
4. **Responsive**: Automatically resizes when canvas dimensions change

### Dynamic Features

#### Speed Control

```typescript
// Adjust scroll speed based on player movement
const speedMultiplier = 1.0 + playerVelocity * 0.01;
parallaxBackground.setScrollSpeed(speedMultiplier);
```

#### Theme Changes

```typescript
// Change theme based on level progression
parallaxBackground.setTheme('nebula');
```

#### Layer Management

```typescript
// Add custom layers
const customLayer: ParallaxLayer = {
	id: 'custom_layer',
	speed: 15,
	offsetY: 0,
	width: 800,
	height: 1200,
	pattern: ParallaxPattern.STARS,
	color: '#ff0000',
	alpha: 0.5
};
parallaxBackground.addLayer(customLayer);
```

## Configuration Options

### ParallaxConfig

-   `layerCount`: Number of background layers (default: 6)
-   `baseSpeed`: Base scroll speed in pixels per second
-   `speedMultiplier`: Multiplier for layer speed differences
-   `screenWidth`: Canvas width
-   `screenHeight`: Canvas height
-   `theme`: Visual theme ('space', 'nebula', 'grid', 'stars')

### ParallaxLayer

-   `id`: Unique identifier for the layer
-   `speed`: Individual scroll speed
-   `offsetY`: Current vertical offset
-   `width`: Layer width
-   `height`: Layer height
-   `pattern`: Visual pattern type
-   `color`: Layer color
-   `alpha`: Layer transparency

## Performance Considerations

-   Uses seeded random generation for consistent patterns
-   Optimized rendering with minimal context state changes
-   Efficient layer management with proper cleanup
-   Responsive to performance monitoring

## Visual Patterns

### Stars Pattern

-   Randomly distributed stars of varying sizes
-   Deterministic placement using layer ID as seed
-   Smooth scrolling with proper wrapping

### Nebula Pattern

-   Radial gradient clouds for atmospheric effect
-   Slower movement than stars for depth
-   Multiple overlapping clouds per layer

### Grid Pattern

-   Cyberpunk-style grid lines
-   Horizontal lines scroll for movement effect
-   Vertical lines remain static

### Dots Pattern

-   Regular grid of small dots
-   Creates subtle background texture
-   Consistent spacing and scrolling

## Integration Points

The parallax background integrates with several game systems:

1. **GameScreen**: Main integration point for rendering and updates
2. **Canvas**: Responsive to canvas size changes
3. **Performance Monitor**: Monitored for performance impact
4. **Level Manager**: Theme changes based on level progression
5. **Player Movement**: Speed adjustments based on player velocity
