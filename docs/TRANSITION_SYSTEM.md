# 🎬 Screen Transition System

A comprehensive transition system for smooth screen changes in the Stellar Breach game.

## 🏗 **Architecture Overview**

### **Hybrid Approach**
- **Game manages coordination**: Timing, state management, transition flow
- **Screens implement behavior**: Custom transition effects, rendering
- **Common interface**: Consistent API across all screen types

### **Core Components**

#### **1. TransitionCapable Interface**
```typescript
interface TransitionCapable {
    startTransitionOut(config: TransitionConfig): void;
    startTransitionIn(config: TransitionConfig): void;
    updateTransition(deltaTime: number): void;
    isTransitioning(): boolean;
    getTransitionState(): TransitionState;
    getTransitionProgress(): number;
    renderWithTransition(canvas: Canvas): void;
}
```

#### **2. TransitionConfig**
```typescript
interface TransitionConfig {
    type: TransitionType;
    duration: number; // in seconds
    delay?: number; // delay before starting
    easing?: string; // easing function name
    customRenderer?: (canvas: Canvas, progress: number) => void;
}
```

#### **3. Built-in Transition Types**
- `FADE` - Fade to black and back
- `SLIDE_LEFT/RIGHT/UP/DOWN` - Slide in direction
- `ZOOM_IN/OUT` - Scale effect
- `CUSTOM` - Use custom renderer function

## 🎮 **Usage Examples**

### **Basic Fade Transition**
```typescript
// From any screen
this.requestScreenChange(ScreenType.GAME, {
    type: TransitionType.FADE,
    duration: 0.8
});
```

### **Slide Transition with Delay**
```typescript
this.requestScreenChange(ScreenType.MENU, {
    type: TransitionType.SLIDE_LEFT,
    duration: 1.0,
    delay: 0.2
});
```

### **Custom Transition Effect**
```typescript
this.requestScreenChange(ScreenType.GAME, {
    type: TransitionType.CUSTOM,
    duration: 1.5,
    customRenderer: (canvas: Canvas, progress: number) => {
        // Custom hyperspace effect
        this.render(canvas);
        canvas.drawRect(0, 0, 800, 600, '#ffffff', progress * 0.8);
    }
});
```

## 🔄 **Transition Flow**

### **State Machine**
```
IDLE → TRANSITIONING_OUT → [Screen Switch] → TRANSITIONING_IN → IDLE
```

### **Detailed Process**
1. **Trigger**: Screen requests transition via `requestScreenChange()`
2. **Out Phase**: Current screen starts `TRANSITIONING_OUT`
3. **Coordination**: Game waits for out transition to complete
4. **Switch**: Game changes current screen, calls `onExit()`/`onEnter()`
5. **In Phase**: New screen starts `TRANSITIONING_IN`
6. **Complete**: New screen reaches `IDLE` state

## 🎨 **Custom Transition Implementation**

### **Screen-Specific Effects**
```typescript
class IntroScreen extends BaseScreen {
    protected applyTransitionEffect(canvas: Canvas): void {
        if (this.transitionConfig?.type === TransitionType.CUSTOM) {
            // Custom hyperspace-to-game effect
            this.applyHyperspaceTransition(canvas);
        } else {
            super.applyTransitionEffect(canvas);
        }
    }

    private applyHyperspaceTransition(canvas: Canvas): void {
        const progress = this.getTransitionProgress();

        // Render normal content
        this.render(canvas);

        // Add accelerating star streaks
        this.renderStarStreaks(canvas, progress);

        // White flash at the end
        if (progress > 0.8) {
            const flashAlpha = (progress - 0.8) / 0.2;
            canvas.drawRect(0, 0, 800, 600, '#ffffff', flashAlpha);
        }
    }
}
```

## 🛠 **Game Integration**

### **Screen Change with Transitions**
```typescript
// In Game class
changeScreenWithTransition(screenType: ScreenType, config: TransitionConfig): void {
    // 1. Start transition out on current screen
    currentScreen.startTransitionOut(config);

    // 2. Wait for completion (handled in update loop)
    // 3. Switch screens
    // 4. Start transition in on new screen
    newScreen.startTransitionIn(config);
}
```

### **Update Loop Integration**
```typescript
private update(deltaTime: number): void {
    if (this.currentScreen) {
        this.currentScreen.update(deltaTime);
        this.currentScreen.updateTransition(deltaTime);

        // Check for transition completion
        if (this.isTransitioning && this.shouldCompleteTransition()) {
            this.completeTransition();
        }
    }
}
```

### **Render Loop Integration**
```typescript
private render(): void {
    if (this.currentScreen) {
        this.currentScreen.renderWithTransition(this.canvas);
    }
}
```

## 📈 **Performance Considerations**

### **Optimization Tips**
1. **Avoid Heavy Effects**: Keep transition rendering lightweight
2. **Use Transform Caching**: Cache expensive calculations
3. **Limit Particle Count**: Reduce particles during transitions
4. **Profile Transitions**: Monitor frame rate during complex effects

### **Memory Management**
- Transitions automatically clean up when complete
- No manual cleanup required for built-in effects
- Custom renderers should avoid memory leaks

## 🎯 **Best Practices**

### **Transition Design**
1. **Keep It Short**: 0.3-0.8 seconds for most transitions
2. **Match Context**: Fade for mood, slide for navigation, zoom for impact
3. **Provide Feedback**: User should understand what's happening
4. **Maintain Consistency**: Use similar transitions for similar actions

### **Error Handling**
```typescript
// Always provide fallbacks
if (!this.isTransitionCapable(screen)) {
    this.changeScreen(screenType); // Immediate switch
}
```

### **Testing Transitions**
```typescript
// Add debug logging
private applyTransitionEffect(canvas: Canvas): void {
    const progress = this.getTransitionProgress();
    console.log(`Transition: ${this.transitionConfig?.type} at ${(progress * 100).toFixed(1)}%`);
    // ... apply effect
}
```

## 🔧 **Configuration Examples**

### **Game-Wide Defaults**
```typescript
class Game {
    private getDefaultTransition(from: ScreenType, to: ScreenType): TransitionConfig {
        switch (`${from}->${to}`) {
            case 'intro->game':
                return { type: TransitionType.CUSTOM, duration: 2.0 }; // Hyperspace
            case 'game->menu':
                return { type: TransitionType.FADE, duration: 0.5 };
            default:
                return { type: TransitionType.FADE, duration: 0.3 };
        }
    }
}
```

### **Context-Sensitive Transitions**
```typescript
// Different transitions based on game state
if (isGameComplete) {
    this.requestScreenChange(ScreenType.MENU, {
        type: TransitionType.ZOOM_OUT,
        duration: 1.5
    });
} else {
    this.requestScreenChange(ScreenType.MENU, {
        type: TransitionType.FADE,
        duration: 0.5
    });
}
```

## 🚀 **Future Enhancements**

### **Planned Features**
- **Easing Function Support**: Smooth acceleration/deceleration
- **Parallel Transitions**: Multiple effects simultaneously
- **Transition Chains**: Sequence of transitions
- **Audio Integration**: Sound effects during transitions
- **Save/Resume**: Pause transitions and resume later

### **Advanced Effects**
- **Particle Transitions**: Dissolve/materialize effects
- **Shader Support**: GPU-accelerated transitions
- **Interactive Transitions**: User-controlled transition speed
- **Motion Blur**: Speed-based visual effects

---

*This transition system provides a solid foundation for professional screen changes while maintaining flexibility for custom effects and future enhancements.*