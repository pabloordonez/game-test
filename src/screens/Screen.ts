import { Canvas } from '../core/Canvas';
import { InputManager } from '../core/InputManager';

export interface Screen {
    update(deltaTime: number): void;
    render(canvas: Canvas): void;
    renderWithTransition(canvas: Canvas): void;
    onEnter(): void;
    onExit(): void;
    handleInput(inputManager: InputManager): void;
}

export enum ScreenType {
    INTRO = 'intro',
    MENU = 'menu',
    GAME = 'game',
    PAUSE = 'pause'
}

// Transition system interfaces
export enum TransitionState {
    IDLE = 'idle',
    TRANSITIONING_OUT = 'transitioning_out',
    TRANSITIONING_IN = 'transitioning_in'
}

export enum TransitionType {
    FADE = 'fade',
    SLIDE_LEFT = 'slide_left',
    SLIDE_RIGHT = 'slide_right',
    SLIDE_UP = 'slide_up',
    SLIDE_DOWN = 'slide_down',
    ZOOM_IN = 'zoom_in',
    ZOOM_OUT = 'zoom_out',
    CUSTOM = 'custom'
}

export interface TransitionConfig {
    type: TransitionType;
    duration: number; // in seconds
    delay?: number; // delay before starting transition
    easing?: string; // easing function name
    customRenderer?: (canvas: Canvas, progress: number) => void;
}

export interface TransitionCapable {
    // Transition lifecycle methods
    startTransitionOut(config: TransitionConfig): void;
    startTransitionIn(config: TransitionConfig): void;
    updateTransition(deltaTime: number): void;
    isTransitioning(): boolean;
    getTransitionState(): TransitionState;
    getTransitionProgress(): number; // 0.0 to 1.0

    // Override rendering during transitions
    renderWithTransition(canvas: Canvas): void;
}

// Screen change request callback
export type ScreenChangeRequest = (screenType: ScreenType, transitionConfig?: TransitionConfig) => void;

export abstract class BaseScreen implements Screen, TransitionCapable {
    protected isActive: boolean = false;
    protected screenTime: number = 0;
    protected onScreenChangeRequest?: ScreenChangeRequest;

    // Transition state
    protected transitionState: TransitionState = TransitionState.IDLE;
    protected transitionConfig?: TransitionConfig;
    protected transitionTime: number = 0;
    protected transitionProgress: number = 0;

    abstract update(deltaTime: number): void;
    abstract render(canvas: Canvas): void;
    abstract handleInput(inputManager: InputManager): void;

    onEnter(): void {
        this.isActive = true;
        this.screenTime = 0;
        console.log(`Entering screen: ${this.constructor.name}`);
    }

    onExit(): void {
        this.isActive = false;
        console.log(`Exiting screen: ${this.constructor.name}`);
    }

    isScreenActive(): boolean {
        return this.isActive;
    }

    getScreenTime(): number {
        return this.screenTime;
    }

    // Transition implementation
    startTransitionOut(config: TransitionConfig): void {
        this.transitionState = TransitionState.TRANSITIONING_OUT;
        this.transitionConfig = config;
        this.transitionTime = 0;
        this.transitionProgress = 0;
        console.log(`Starting transition out: ${config.type} (${config.duration}s)`);
    }

    startTransitionIn(config: TransitionConfig): void {
        this.transitionState = TransitionState.TRANSITIONING_IN;
        this.transitionConfig = config;
        this.transitionTime = 0;
        this.transitionProgress = 0;
        console.log(`Starting transition in: ${config.type} (${config.duration}s)`);
    }

    updateTransition(deltaTime: number): void {
        if (!this.isTransitioning() || !this.transitionConfig) return;

        this.transitionTime += deltaTime;
        this.transitionProgress = Math.min(this.transitionTime / this.transitionConfig.duration, 1.0);

        // Complete transition when progress reaches 1.0
        if (this.transitionProgress >= 1.0) {
            this.transitionState = TransitionState.IDLE;
            this.transitionConfig = undefined;
            this.transitionTime = 0;
            this.transitionProgress = 0;
        }
    }

    isTransitioning(): boolean {
        return this.transitionState !== TransitionState.IDLE;
    }

    getTransitionState(): TransitionState {
        return this.transitionState;
    }

    getTransitionProgress(): number {
        return this.transitionProgress;
    }

    renderWithTransition(canvas: Canvas): void {
        if (!this.isTransitioning() || !this.transitionConfig) {
            // No transition, render normally
            this.render(canvas);
            return;
        }

        // Apply transition effect based on type
        this.applyTransitionEffect(canvas);
    }

    protected applyTransitionEffect(canvas: Canvas): void {
        if (!this.transitionConfig) return;

        const { type } = this.transitionConfig;
        const progress = this.transitionProgress;

        // Adjust progress based on transition direction
        const effectProgress = this.transitionState === TransitionState.TRANSITIONING_OUT
            ? progress  // 0 to 1 (fade out)
            : 1 - progress; // 1 to 0 (fade in)

        switch (type) {
            case TransitionType.FADE:
                this.applyFadeTransition(canvas, effectProgress);
                break;
            case TransitionType.SLIDE_LEFT:
            case TransitionType.SLIDE_RIGHT:
            case TransitionType.SLIDE_UP:
            case TransitionType.SLIDE_DOWN:
                this.applySlideTransition(canvas, effectProgress, type);
                break;
            case TransitionType.ZOOM_IN:
            case TransitionType.ZOOM_OUT:
                this.applyZoomTransition(canvas, effectProgress, type);
                break;
            case TransitionType.CUSTOM:
                if (this.transitionConfig.customRenderer) {
                    this.transitionConfig.customRenderer(canvas, effectProgress);
                } else {
                    this.render(canvas);
                }
                break;
            default:
                this.render(canvas);
        }
    }

    protected applyFadeTransition(canvas: Canvas, progress: number): void {
        // Render normal content
        this.render(canvas);

        // Apply fade overlay
        const alpha = progress;
        if (alpha > 0) {
            canvas.drawRect(0, 0, canvas.getWidth(), canvas.getHeight(), '#000000', alpha);
        }
    }

    protected applySlideTransition(canvas: Canvas, progress: number, type: TransitionType): void {
        const width = canvas.getWidth();
        const height = canvas.getHeight();

        let offsetX = 0;
        let offsetY = 0;

        switch (type) {
            case TransitionType.SLIDE_LEFT:
                offsetX = -width * progress;
                break;
            case TransitionType.SLIDE_RIGHT:
                offsetX = width * progress;
                break;
            case TransitionType.SLIDE_UP:
                offsetY = -height * progress;
                break;
            case TransitionType.SLIDE_DOWN:
                offsetY = height * progress;
                break;
        }

        // Save canvas state, apply translation, render, restore
        canvas.save();
        canvas.translate(offsetX, offsetY);
        this.render(canvas);
        canvas.restore();
    }

    protected applyZoomTransition(canvas: Canvas, progress: number, type: TransitionType): void {
        const scale = type === TransitionType.ZOOM_IN
            ? 1 - progress  // Zoom out (shrink to 0)
            : 1 + progress; // Zoom in (grow from 1)

        const centerX = canvas.getWidth() / 2;
        const centerY = canvas.getHeight() / 2;

        // Save canvas state, apply zoom, render, restore
        canvas.save();
        canvas.translate(centerX, centerY);
        canvas.scale(scale, scale);
        canvas.translate(-centerX, -centerY);
        this.render(canvas);
        canvas.restore();
    }

    // Helper method for screens to request transitions
    protected requestScreenChange(screenType: ScreenType, transitionConfig?: TransitionConfig): void {
        if (this.onScreenChangeRequest) {
            this.onScreenChangeRequest(screenType, transitionConfig);
        }
    }

    // Set the callback for screen change requests
    setScreenChangeCallback(callback: ScreenChangeRequest): void {
        this.onScreenChangeRequest = callback;
    }
}