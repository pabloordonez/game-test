        export interface PerformanceMetrics {
    fps: number;
    frameTime: number;
    memoryUsage: number;
    entityCount: number;
    collisionChecks: number;
    renderCalls: number;
    audioEvents: number;
}

export interface SystemTiming {
    systemName: string;
    executionTime: number;
    callCount: number;
    averageTime: number;
}

export class PerformanceMonitor {
    private lastFrameTime: number = performance.now();
    private frameTimes: number[] = [];
    private maxFrameHistory: number = 60;
    private metrics: PerformanceMetrics;
    private systemTimings: Map<string, SystemTiming> = new Map();
    private startTimes: Map<string, number> = new Map();
    
    // Performance counters
    private frameCount: number = 0;
    private lastFpsUpdate: number = performance.now();
    private currentFps: number = 60;

    constructor() {
        this.metrics = {
            fps: 60,
            frameTime: 16.67,
            memoryUsage: 0,
            entityCount: 0,
            collisionChecks: 0,
            renderCalls: 0,
            audioEvents: 0
        };
    }

    startFrame(): void {
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        
        // Update frame times
        this.frameTimes.push(deltaTime);
        if (this.frameTimes.length > this.maxFrameHistory) {
            this.frameTimes.shift();
        }

        // Calculate FPS every second
        this.frameCount++;
        if (now - this.lastFpsUpdate >= 1000) {
            this.currentFps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }

        // Update metrics
        this.metrics.frameTime = deltaTime;
        this.metrics.fps = this.currentFps;
        this.updateMemoryUsage();

        this.lastFrameTime = now;
    }

    endFrame(): void {
        // Reset per-frame counters
        this.metrics.collisionChecks = 0;
        this.metrics.renderCalls = 0;
        this.metrics.audioEvents = 0;
    }

    startSystemTiming(systemName: string): void {
        this.startTimes.set(systemName, performance.now());
    }

    endSystemTiming(systemName: string): void {
        const startTime = this.startTimes.get(systemName);
        if (startTime === undefined) return;

        const executionTime = performance.now() - startTime;
        
        let timing = this.systemTimings.get(systemName);
        if (!timing) {
            timing = {
                systemName,
                executionTime: 0,
                callCount: 0,
                averageTime: 0
            };
            this.systemTimings.set(systemName, timing);
        }

        timing.executionTime = executionTime;
        timing.callCount++;
        timing.averageTime = timing.averageTime * 0.9 + executionTime * 0.1; // Moving average

        this.startTimes.delete(systemName);
    }

    incrementCollisionChecks(count: number = 1): void {
        this.metrics.collisionChecks += count;
    }

    incrementRenderCalls(count: number = 1): void {
        this.metrics.renderCalls += count;
    }

    incrementAudioEvents(count: number = 1): void {
        this.metrics.audioEvents += count;
    }

    setEntityCount(count: number): void {
        this.metrics.entityCount = count;
    }

    private updateMemoryUsage(): void {
        if ('memory' in performance) {
            // @ts-ignore - Chrome-specific API
            this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
        } else {
            this.metrics.memoryUsage = 0;
        }
    }

    getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    getSystemTimings(): SystemTiming[] {
        return Array.from(this.systemTimings.values()).sort((a, b) => b.averageTime - a.averageTime);
    }

    getAverageFrameTime(): number {
        if (this.frameTimes.length === 0) return 16.67;
        return this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
    }

    getFrameTimeVariance(): number {
        if (this.frameTimes.length === 0) return 0;
        
        const avg = this.getAverageFrameTime();
        const variance = this.frameTimes.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / this.frameTimes.length;
        return Math.sqrt(variance);
    }

    getPerformanceStatus(): 'excellent' | 'good' | 'warning' | 'critical' {
        const fps = this.metrics.fps;
        const frameVariance = this.getFrameTimeVariance();
        
        if (fps >= 58 && frameVariance < 2) return 'excellent';
        if (fps >= 50 && frameVariance < 5) return 'good';
        if (fps >= 30) return 'warning';
        return 'critical';
    }

    logPerformance(): void {
        const metrics = this.getMetrics();
        const status = this.getPerformanceStatus();
        const variance = this.getFrameTimeVariance();
        
        console.group('🔍 Performance Report');
        console.log(`Status: ${status.toUpperCase()}`);
        console.log(`FPS: ${metrics.fps.toFixed(1)} (target: 60)`);
        console.log(`Frame Time: ${metrics.frameTime.toFixed(2)}ms (target: 16.67ms)`);
        console.log(`Frame Variance: ${variance.toFixed(2)}ms`);
        console.log(`Memory: ${metrics.memoryUsage.toFixed(1)}MB`);
        console.log(`Entities: ${metrics.entityCount}`);
        console.log(`Collision Checks: ${metrics.collisionChecks}/frame`);
        console.log(`Render Calls: ${metrics.renderCalls}/frame`);
        console.log(`Audio Events: ${metrics.audioEvents}/frame`);
        
        console.group('System Timings:');
        const timings = this.getSystemTimings();
        for (const timing of timings) {
            console.log(`${timing.systemName}: ${timing.averageTime.toFixed(3)}ms avg (${timing.callCount} calls)`);
        }
        console.groupEnd();
        console.groupEnd();
    }

    // Performance warnings
    checkPerformanceWarnings(): string[] {
        const warnings: string[] = [];
        const metrics = this.getMetrics();
        
        if (metrics.fps < 50) {
            warnings.push(`Low FPS: ${metrics.fps} (target: 60)`);
        }
        
        if (metrics.frameTime > 20) {
            warnings.push(`High frame time: ${metrics.frameTime.toFixed(1)}ms (target: <16.67ms)`);
        }
        
        if (this.getFrameTimeVariance() > 5) {
            warnings.push(`Unstable frame rate: ${this.getFrameTimeVariance().toFixed(1)}ms variance`);
        }
        
        if (metrics.memoryUsage > 100) {
            warnings.push(`High memory usage: ${metrics.memoryUsage.toFixed(1)}MB`);
        }
        
        if (metrics.collisionChecks > 1000) {
            warnings.push(`High collision checks: ${metrics.collisionChecks}/frame`);
        }
        
        return warnings;
    }

    reset(): void {
        this.frameTimes = [];
        this.systemTimings.clear();
        this.frameCount = 0;
        this.metrics = {
            fps: 60,
            frameTime: 16.67,
            memoryUsage: 0,
            entityCount: 0,
            collisionChecks: 0,
            renderCalls: 0,
            audioEvents: 0
        };
    }
} 