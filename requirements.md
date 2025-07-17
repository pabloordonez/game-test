# Game Requirements Document

## 1. Project Overview

### 1.1 Game Concept

A vertical-scrolling shooter game that combines elements of Arkanoid and the NES game 1943. The game features a ship that moves horizontally while advancing upward through levels composed of destructible colored blocks in a sci-fi space setting.

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

- **Phase 1**: Microsoft logo and "Stellar Breach" text fade in
- **Phase 2**: Windows logo squares move to corners while fading out
- **Phase 3**: Background stars/particles move from center to corners (deep space effect)
- **Phase 4**: "Press any key" text fades in
- **Animation System**: Reusable animation framework for color, movement, and shape animations

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

### 6.6 Animation System

- **Animation Framework**: Reusable animation system with configurable duration and easing
- **Animation Types**: Color, movement, scale, rotation, and alpha animations
- **Easing Functions**: Linear, ease-in, ease-out, ease-in-out, bounce, elastic, and back interpolation
- **Animation Sequencer**: Fluent interface for timing and sequencing animations
- **Particle Systems**: Dedicated particle system with continuous star effects for deep space
- **Performance**: Efficient animation updates with delta time integration

### 6.7 Special Effects System

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

### 7.1 Screen-Based Architecture

- **Screen System**: Game acts as a container for different screens
- **Screen States**: Each screen represents a different game state (Intro, Menu, Game, Pause, etc.)
- **Screen Logic**: Each screen manages its own rendering and update logic
- **State Transitions**: Game manages transitions between screens
- **Screen Types**:
  - **Intro Screen**: Windows logo animation and level generation
  - **Menu Screen**: Title and options without ECS
  - **Game Screen**: Main gameplay with full ECS integration
  - **Pause Screen**: Overlay screen during gameplay
  - **Win/Lose Screens**: End game states

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
│   ├── GameLoop.ts
│   ├── Canvas.ts
│   ├── InputManager.ts
│   └── TimeSystem.ts
├── screens/
│   ├── Screen.ts
│   ├── IntroScreen.ts
│   ├── MenuScreen.ts
│   ├── GameScreen.ts
│   ├── PauseScreen.ts
│   ├── WinScreen.ts
│   └── LoseScreen.ts
├── ecs/
│   ├── Entity.ts
│   ├── Component.ts
│   ├── System.ts
│   ├── SystemRegistration.ts
│   └── World.ts
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
├── animation/
│   ├── Animation.ts
│   ├── AnimationSystem.ts
│   ├── AnimationSequencer.ts
│   ├── EasingFunctions.ts
│   └── AnimationSequence.ts
├── particles/
│   ├── StarParticleSystem.ts
│   └── index.ts
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

## 12. Recent Development Progress

### 12.1 Completed Implementation Phases

#### 12.1.1 Phase 1: Star Particle Visual Enhancements ✅ COMPLETED

**Objectives Achieved:**
- Enhanced star particle system with dynamic visual effects
- Implemented realistic space-flight particle behavior
- Added visual depth and immersion to intro screen

**Technical Implementations:**
- **Dynamic Particle Sizing**: Added `radius` property to StarParticle interface
- **Size Growth Algorithm**: `particle.radius = Math.min(1 * distanceGrowth * ageGrowth, 8)`
  - Distance growth: `1 + (distanceProgress * 2)` (up to 3x size)
  - Age growth: `1 + (lifeProgress * 1.5)` (up to 2.5x size)
- **Fade-in Effects**: Particles start dim (alpha 0.1) and brighten in first 30% of life
- **Distance-based Brightness**: Alpha range from 0.3 to 1.0 based on distance from center
- **Enhanced Spawning**: Particles start with 0.5px radius and very dim alpha for gradual appearance

#### 12.1.2 Phase 2: Interactive Logo System ✅ COMPLETED

**Objectives Achieved:**
- Converted automatic logo animation to user-triggered experience
- Implemented phased animation system for better user control
- Enhanced intro screen engagement

**Technical Implementations:**
- **Multi-phase Animation System**:
  - Phase 1: Static logo display (0-3s) with "Press any key to start"
  - Phase 2: User-triggered expansion animation
  - Phase 3: Automatic transition to game
- **State Management**: Added `isWaitingForInput`, `isAnimating`, `logoCompleted` flags
- **Event-driven Flow**: Modified `initializeAnimations()` and created `startExpansionAnimation()`
- **Input Handling**: Single input triggers expansion, then auto-transitions to game

#### 12.1.3 Phase 3: Bug Fixes ✅ COMPLETED

**Objectives Achieved:**
- Resolved star field rendering issues
- Fixed animation system errors
- Improved system stability

**Technical Implementations:**
- **Star Field Rendering**: Changed from conditional to continuous `starSystem.update(deltaTime)`
- **Animation Error Resolution**: Fixed `renderMovingBoxes()` sequencer usage
  - Initial phase: `sequencer.getAnimationValue(2 + i)` for fade-ins
  - Expansion phase: `sequencer.getAnimation(moveIndex)` with `getPosition()`
  - Added safety checks for `moveAnimation.getPosition`
- **Initial Particle Population**: Added 20 particles in constructor for immediate visibility

#### 12.1.4 Phase 4: Single-Click Optimization ✅ COMPLETED

**Objectives Achieved:**
- Streamlined user interaction from double-click to single-click
- Implemented automatic transition flow
- Enhanced user experience with seamless progression

**Technical Implementations:**
- **Auto-transition Logic**: Expansion completion automatically calls `requestScreenChange(ScreenType.GAME)`
- **Simplified Input Handling**: Removed secondary input requirements
- **Message Cleanup**: Removed "Press any key to continue..." for cleaner flow
- **Seamless Flow**: Press key once → expansion animation → automatic game transition

#### 12.1.5 Phase 5: Transition System Architecture Design ✅ COMPLETED

**Objectives Achieved:**
- Designed comprehensive screen transition system
- Established architecture patterns for future implementation
- Created hybrid approach balancing game coordination with screen autonomy

**Technical Architecture:**
- **Hybrid Approach**: Game manages coordination while screens handle their own transitions
- **Timing Control**: Game controls transition timing and state management
- **Screen Autonomy**: Individual screens manage their own transition effects
- **Future-ready**: Architecture supports fade, slide, zoom, and custom transition effects
- **Documentation**: Complete transition system specification created

### 12.2 Current Technical Status

#### 12.2.1 Animation System
- ✅ Core animation framework fully functional
- ✅ EasingFunctions library implemented
- ✅ AnimationSequencer with fluent interface
- ✅ Star particle system with advanced visual effects
- ✅ Intro screen animations working correctly

#### 12.2.2 Screen Architecture
- ✅ Base screen system implemented
- ✅ IntroScreen with interactive logo system
- ✅ Screen transition architecture designed
- 🔄 Full transition system implementation (ready for development)

#### 12.2.3 Particle Systems
- ✅ StarParticleSystem with dynamic sizing and fade effects
- ✅ Distance-based acceleration and brightness
- ✅ Performance-optimized particle spawning and lifecycle management

### 12.3 Next Development Priorities

1. **Transition System Implementation**: Implement the designed transition architecture
2. **Menu Screen Enhancement**: Add transition effects to menu navigation
3. **Game Screen Integration**: Connect intro sequence to actual gameplay
4. **Performance Optimization**: Fine-tune particle system performance
5. **Audio Integration**: Add sound effects for transitions and interactions
