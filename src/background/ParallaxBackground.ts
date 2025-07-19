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
	theme?: 'space' | 'nebula' | 'grid' | 'stars';
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
				speed: Math.max(0.1, baseSpeed * Math.pow(speedMultiplier, i)),
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
		const theme = this.config.theme || 'space';

		switch (theme) {
			case 'space':
				return [ParallaxPattern.STARS, ParallaxPattern.NEBULA, ParallaxPattern.STARS, ParallaxPattern.DOTS][layerIndex % 4];
			case 'nebula':
				return [ParallaxPattern.NEBULA, ParallaxPattern.STARS, ParallaxPattern.NEBULA, ParallaxPattern.DOTS][layerIndex % 4];
			case 'grid':
				return [ParallaxPattern.GRID, ParallaxPattern.DOTS, ParallaxPattern.GRID, ParallaxPattern.STARS][layerIndex % 4];
			case 'stars':
				return [ParallaxPattern.STARS, ParallaxPattern.STARS, ParallaxPattern.DOTS, ParallaxPattern.STARS][layerIndex % 4];
			default:
				return [ParallaxPattern.STARS, ParallaxPattern.NEBULA, ParallaxPattern.GRID, ParallaxPattern.DOTS][layerIndex % 4];
		}
	}

	private getColorForLayer(layerIndex: number): string {
		const theme = this.config.theme || 'space';

		switch (theme) {
			case 'space':
				return ['#ffffff', '#aaaaff', '#ffaaaa', '#aaffaa', '#ffffaa', '#ffaaff'][layerIndex % 6];
			case 'nebula':
				return ['#ff88ff', '#88ffff', '#ffff88', '#ff8888', '#88ff88', '#8888ff'][layerIndex % 6];
			case 'grid':
				return ['#00ffff', '#ff00ff', '#ffff00', '#ff8800', '#8800ff', '#00ff88'][layerIndex % 6];
			case 'stars':
				return ['#ffffff', '#ffffaa', '#aaffff', '#ffaaff', '#aaffaa', '#ffaaaa'][layerIndex % 6];
			default:
				return ['#ffffff', '#aaaaff', '#ffaaaa', '#aaffaa', '#ffffaa', '#ffaaff'][layerIndex % 6];
		}
	}

	private getAlphaForLayer(layerIndex: number, totalLayers: number): number {
		// Farther layers (higher index) are more transparent
		return 0.1 + (0.3 * (totalLayers - layerIndex)) / totalLayers;
	}

	update(deltaTime: number): void {
		for (const layer of this.layers) {
			layer.offsetY -= layer.speed * deltaTime;

			// Reset offset when it goes below zero to create seamless scrolling
			if (layer.offsetY <= -layer.height / 2) {
				layer.offsetY += layer.height / 2;
			}
		}
	}

	getLayers(): ParallaxLayer[] {
		return [...this.layers];
	}

	setScrollSpeed(speedMultiplier: number): void {
		const { baseSpeed } = this.config;

		for (let i = 0; i < this.layers.length; i++) {
			// Ensure speed is always positive to prevent reverse scrolling
			const speed = Math.max(0.1, baseSpeed * Math.pow(this.config.speedMultiplier, i) * speedMultiplier);
			this.layers[i].speed = speed;
		}
	}

	getLayer(id: string): ParallaxLayer | undefined {
		return this.layers.find((layer) => layer.id === id);
	}

	addLayer(layer: ParallaxLayer): void {
		this.layers.push(layer);
	}

	removeLayer(id: string): void {
		this.layers = this.layers.filter((layer) => layer.id !== id);
	}

	resize(width: number, height: number): void {
		this.config.screenWidth = width;
		this.config.screenHeight = height;

		for (const layer of this.layers) {
			layer.width = width;
			layer.height = height * 2;
		}
	}

	setTheme(theme: 'space' | 'nebula' | 'grid' | 'stars'): void {
		this.config.theme = theme;

		// Update all layers with new theme
		for (let i = 0; i < this.layers.length; i++) {
			this.layers[i].pattern = this.getPatternForLayer(i);
			this.layers[i].color = this.getColorForLayer(i);
		}
	}

	getTheme(): string {
		return this.config.theme || 'space';
	}
}
