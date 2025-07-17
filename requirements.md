# Game Requirements Document

## 1. Project Overview

### 1.1 Game Concept

A vertical-scrolling shooter game that combines elements of Arkanoid and the NES game 1943. The game features a ship that moves horizontally while advancing upward through levels composed of destructible colored blocks.

### 1.2 Technical Stack

- **Language**: TypeScript
- **Platform**: HTML5 Canvas (vanilla APIs, no frameworks)
- **Architecture**: Object-Oriented Programming with Entity Component System (ECS)
- **Rendering**: Canvas Context2D API

## 2. Game Flow & Screens

### 2.1 Screen Sequence

1. **Intro Animation**: Windows logo with four colored boxes
2. **Title Screen**: Game title and main menu
3. **Start/Options Screen**: Game settings and controls
4. **Game Screen**: Main gameplay
5. **Win Screen**: Level completion
6. **Lose Screen**: Game over

### 2.2 Intro Animation

- Display Windows logo with four colored boxes
- Animate boxes moving to canvas corners
- Transition from intro to level generation based on box movement
- Create initial level layout from the animated transition

## 3. Core Gameplay Mechanics

### 3.1 Player Ship

- **Movement**: Horizontal movement (left/right) with vertical advancement
- **Perspective**: Top-down view giving illusion of upward flight
- **Controls**: Keyboard input for movement and firing
- **Abilities**: Primary weapon system with upgradeable firepower

### 3.2 Combat System

- **Weapon**: Ship can fire projectiles
- **Targeting**: Destructible blocks in the level
- **Block Strength**: Different blocks require varying numbers of shots to destroy
- **Upgrades**: Random power-ups dropped from destroyed blocks

### 3.3 Power-up System

Random upgrades dropped from destroyed blocks:

- Bigger guns (increased firepower)
- Stronger powers (enhanced abilities)
- Increased flying speed
- Shield protection
- Additional weapon types
- Time slowdown (temporary bullet time effect)
- Time speedup (accelerated gameplay)
- Time freeze (brief pause of enemy movement)

## 4. Level System

### 4.1 Level Structure

- **Format**: Text-based level files using ASCII character matrices
- **Interpretation**: Game engine parses ASCII characters to render proper tiles
- **Completion**: Level ends when ship reaches the top boundary
- **Progression**: Sequential level advancement

### 4.2 Level Editor

- **Format**: NxM matrix of ASCII characters
- **Characters**: Different ASCII symbols represent different block types
- **File Extension**: Custom level format (.lev or similar)
- **Real-time Loading**: Engine interprets and renders levels on load

## 5. Visual & Audio Design

### 5.1 Rendering System

- **Tile-based Rendering**: Optimized tile system for level blocks
- **Performance**: Only render new rows appearing on screen
- **Optimization**: Minimize draw calls and maximize efficiency
- **Mobile Rendering**: Optimized for handheld device screens
- **Dynamic Quality**: Adjust rendering quality based on device performance

### 5.2 Background Effects

- **Parallax Scrolling**: 6 vertically moving columns at different speeds
- **Depth Illusion**: Creates sense of Z-axis depth without transparency
- **Performance**: Avoid heavy transparency operations

### 5.3 UI Elements

- **Health Meter**: Ship health display at top of screen
- **Score Board**: Points gained during play session
- **Energy Display**: Visual representation of ship status

## 6. Technical Architecture

### 6.1 Entity Component System (ECS)

- **Entities**: Simple IDs that group components together
- **Components**: Pure data containers (Position, Movement, Health, Weapon, etc.)
- **Systems**: Logic processors that operate on pre-filtered entity lists
- **Component Filtering**: World maintains pre-filtered entity lists for each system, updated on component changes
- **Performance**: O(1) system entity access with automatic list maintenance

### 6.2 Time System

- **Global Time Scale**: Centralized time control affecting all game systems
- **Time Effects**: Slowdown, speedup, and freeze effects from power-ups
- **Pause System**: Complete game pause with time scale = 0
- **Visual Feedback**: Screen effects and particle systems for time changes
- **System Integration**: All systems respect time scale for movement and updates

### 6.3 Memory Management

- **Object Pooling**: Reuse entities and components to avoid garbage collection
- **Bullet Pool**: Recycle fired bullets for new shots
- **Component Pools**: Efficient memory allocation for frequently created objects
- **Performance**: Minimize heap allocations and GC pressure

### 6.4 Asset Management System

- **Sprite Loading**: Efficient texture atlas loading and management
- **Resource Pooling**: Reuse texture objects to minimize memory usage
- **Lazy Loading**: Load assets on-demand to reduce initial load time
- **Compression**: Optimize sprite sizes for handheld devices
- **Memory Management**: Monitor and limit texture memory usage

### 6.5 Mobile Optimization

- **Touch Controls**: Responsive touch input with gesture recognition
- **Screen Adaptation**: Dynamic UI scaling for different screen sizes
- **Battery Optimization**: Efficient rendering to preserve battery life
- **Performance Scaling**: Adjust visual quality based on device capabilities
- **Orientation Support**: Landscape and portrait mode handling

### 6.6 Special Effects System

- **Pixel Shader Effects**: Post-processing effects for explosions and laser lights
- **Particle Systems**: Advanced particle effects with GPU acceleration
- **Screen Effects**: Bloom, blur, and distortion effects for time changes
- **Lighting System**: Dynamic lighting for laser beams and explosions
- **Visual Feedback**: Enhanced visual effects for power-ups and damage

### 6.7 Optimization Strategies

- **Spatial Partitioning**: Efficient collision detection
- **Culling**: Only render visible game objects
- **Batch Rendering**: Group similar draw operations
- **Delta Time**: Smooth frame-rate independent movement with time scale integration

## 7. Game States

### 7.1 State Management

- **Intro State**: Windows logo animation
- **Menu State**: Title and options screens
- **Play State**: Active gameplay
- **Pause State**: Game paused functionality
- **Win State**: Level completion celebration
- **Lose State**: Game over with restart options

### 7.2 Input Handling

- **Keyboard**: Movement and firing controls
- **Gamepad**: Full gamepad support for movement and firing
- **Touch**: Responsive touch controls with gesture recognition
- **Mouse**: Menu navigation (if applicable)
- **Input Abstraction**: Unified input system supporting multiple input methods
- **Mobile Gestures**: Swipe, tap, and multi-touch support for handheld devices

## 8. File Structure

### 8.1 Project Organization

```
src/
├── core/
│   ├── Game.ts
│   ├── GameState.ts
│   ├── InputManager.ts
│   └── TimeSystem.ts
├── ecs/
│   ├── Entity.ts
│   ├── Component.ts
│   ├── System.ts
│   └── ComponentPool.ts
├── entities/
│   ├── Ship.ts
│   ├── Bullet.ts
│   ├── Block.ts
│   └── PowerUp.ts
├── systems/
│   ├── MovementSystem.ts
│   ├── CollisionSystem.ts
│   ├── RenderingSystem.ts
│   ├── AudioSystem.ts
│   └── ParticleSystem.ts
├── assets/
│   ├── AssetManager.ts
│   ├── TextureAtlas.ts
│   └── assets/
├── mobile/
│   ├── TouchInputManager.ts
│   ├── MobileOptimizer.ts
│   └── ResponsiveUI.ts
├── effects/
│   ├── ShaderEffects.ts
│   ├── PostProcessing.ts
│   ├── LightingSystem.ts
│   └── ScreenEffects.ts
├── levels/
│   ├── LevelLoader.ts
│   └── levels/
├── ui/
│   ├── HUD.ts
│   ├── Menu.ts
│   └── Screens.ts
└── utils/
    ├── Math.ts
    └── Constants.ts
```

## 9. Performance Requirements

### 9.1 Target Performance

- **Frame Rate**: 60 FPS minimum
- **Memory**: Efficient memory usage with object pooling
- **Loading**: Fast level loading and parsing
- **Smoothness**: Consistent frame timing

### 9.2 Scalability

- **Level Size**: Support for large level matrices
- **Entity Count**: Handle hundreds of simultaneous entities
- **Bullet Count**: Efficient bullet management for rapid firing

## 10. Future Extensibility

### 10.1 ECS Benefits

- **Modularity**: Easy addition of new entity types
- **Components**: Flexible component system for new features
- **Systems**: Scalable system architecture
- **Plugins**: Easy integration of new gameplay mechanics

### 10.2 Planned Features

- **Multiplayer**: Potential for cooperative play
- **Level Editor**: Built-in level creation tools
- **Achievements**: Player progression system
- **Sound Effects**: Audio feedback system
- **Particle Effects**: Visual enhancement system

## 11. Development Phases

### 11.1 Phase 1: Core Foundation

- Basic ECS implementation
- Canvas rendering system
- Input handling
- Basic ship movement

### 11.2 Phase 2: Gameplay Mechanics

- Bullet system
- Block destruction
- Collision detection
- Power-up system

### 11.3 Phase 3: Level System

- Level file format
- Level loader
- Level progression
- Win/lose conditions

### 11.4 Phase 4: Polish

- UI implementation
- Screen transitions
- Intro animation
- Performance optimization

### 11.5 Phase 5: Enhancement

- Parallax backgrounds
- Sound effects
- Particle systems
- Additional features
