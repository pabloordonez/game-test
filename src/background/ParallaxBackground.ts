export interface ParallaxLayer {
    id: string;
    speed: number;
    offsetY: number;
    width: number;
    height: number;
    pattern: ParallaxPattern;
    color: string;
    alpha: number;
}

export enum ParallaxPattern {
    STARS = 'stars',
    NEBULA = 'nebula', 
    GRID = 'grid',
    DOTS = 'dots'
}

export interface ParallaxConfig {
    layerCount: number;
    baseSpeed: number;
    speedMultiplier: number;
    screenWidth: number;
    screenHeight: number;
}

export class ParallaxBackground {
    private layers: ParallaxLayer[] = [];
    private config: ParallaxConfig;

    constructor(config: ParallaxConfig) {
        this.config = config;
        this.initializeLayers();
    }

    private initializeLayers(): void {
        const { layerCount, baseSpeed, speedMultiplier, screenWidth, screenHeight } = this.config;

        for (let i = 0; i < layerCount; i++) {
            const layer: ParallaxLayer = {
                id: `layer_${i}`,
                speed: baseSpeed * Math.pow(speedMultiplier, i),
                offsetY: 0,
                width: screenWidth,
                height: screenHeight * 2, // Double height for seamless scrolling
                pattern: this.getPatternForLayer(i),
                color: this.getColorForLayer(i),
                alpha: this.getAlphaForLayer(i, layerCount)
            };
            this.layers.push(layer);
        }

        console.log(`Parallax background initialized with ${layerCount} layers`);
    }

    private getPatternForLayer(layerIndex: number): ParallaxPattern {
        const patterns = [ParallaxPattern.STARS, ParallaxPattern.NEBULA, ParallaxPattern.GRID, ParallaxPattern.DOTS];
        return patterns[layerIndex % patterns.length];
    }

    private getColorForLayer(layerIndex: number): string {
        const colors = ['#ffffff', '#aaaaff', '#ffaaaa', '#aaffaa', '#ffffaa', '#ffaaff'];
        return colors[layerIndex % colors.length];
    }

    private getAlphaForLayer(layerIndex: number, totalLayers: number): number {
        // Farther layers (higher index) are more transparent
        return 0.1 + (0.3 * (totalLayers - layerIndex) / totalLayers);
    }

    update(deltaTime: number): void {
        for (const layer of this.layers) {
            layer.offsetY += layer.speed * deltaTime;
            
            // Reset offset when it exceeds the layer height to create seamless scrolling
            if (layer.offsetY >= layer.height / 2) {
                layer.offsetY -= layer.height / 2;
            }
        }
    }

    getLayers(): ParallaxLayer[] {
        return [...this.layers];
    }

    setScrollSpeed(speedMultiplier: number): void {
        const { baseSpeed } = this.config;
        
        for (let i = 0; i < this.layers.length; i++) {
            this.layers[i].speed = baseSpeed * Math.pow(this.config.speedMultiplier, i) * speedMultiplier;
        }
    }

    getLayer(id: string): ParallaxLayer | undefined {
        return this.layers.find(layer => layer.id === id);
    }

    addLayer(layer: ParallaxLayer): void {
        this.layers.push(layer);
    }

    removeLayer(id: string): void {
        this.layers = this.layers.filter(layer => layer.id !== id);
    }

    resize(width: number, height: number): void {
        this.config.screenWidth = width;
        this.config.screenHeight = height;

        for (const layer of this.layers) {
            layer.width = width;
            layer.height = height * 2;
        }
    }
} 