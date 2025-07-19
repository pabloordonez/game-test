import { Canvas } from '../core/Canvas';
import { ParallaxLayer, ParallaxPattern } from './ParallaxBackground';

export class ParallaxRenderer {
	private canvas: Canvas;

	constructor(canvas: Canvas) {
		this.canvas = canvas;
	}

	renderLayers(layers: ParallaxLayer[]): void {
		// Render layers from back to front (highest index first for depth)
		for (let i = layers.length - 1; i >= 0; i--) {
			this.renderLayer(layers[i]);
		}
	}

	private renderLayer(layer: ParallaxLayer): void {
		const context = this.canvas.getContext();

		// Save context state
		context.save();

		// Set layer alpha
		context.globalAlpha = layer.alpha;

		// Draw the pattern based on layer type
		switch (layer.pattern) {
			case ParallaxPattern.STARS:
				this.renderStars(layer);
				break;
			case ParallaxPattern.NEBULA:
				this.renderNebula(layer);
				break;
			case ParallaxPattern.GRID:
				this.renderGrid(layer);
				break;
			case ParallaxPattern.DOTS:
				this.renderDots(layer);
				break;
		}

		// Restore context state
		context.restore();
	}

	private renderStars(layer: ParallaxLayer): void {
		const context = this.canvas.getContext();
		const { width, height, offsetY, color } = layer;

		context.fillStyle = color;

		// Create a deterministic pattern of stars based on layer id
		const seed = this.hashCode(layer.id);
		const starCount = Math.floor((width * height) / 10000); // Density based on area

		for (let i = 0; i < starCount; i++) {
			const x = this.seededRandom(seed + i * 2) * width;
			const baseY = this.seededRandom(seed + i * 2 + 1) * height;

			// Apply vertical offset for scrolling with wrapping
			// Since offsetY is negative (downward scrolling), we subtract it to move stars down
			const y = (((baseY - offsetY) % height) + height) % height;

			const size = 0.5 + this.seededRandom(seed + i * 3) * 1.5;

			context.beginPath();
			context.arc(x, y, size, 0, Math.PI * 2);
			context.fill();
		}
	}

	private renderNebula(layer: ParallaxLayer): void {
		const context = this.canvas.getContext();
		const { width, height, offsetY, color } = layer;

		// Create a subtle nebula effect with gradient circles
		const cloudCount = 8;
		const seed = this.hashCode(layer.id);

		for (let i = 0; i < cloudCount; i++) {
			const x = this.seededRandom(seed + i * 4) * width;
			const baseY = this.seededRandom(seed + i * 4 + 1) * height;
			// Since offsetY is negative (downward scrolling), we subtract it to move nebula down
			const y = (((baseY - offsetY * 0.5) % height) + height) % height; // Slower than offset

			const radius = 50 + this.seededRandom(seed + i * 4 + 2) * 100;

			// Create radial gradient
			const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
			gradient.addColorStop(0, color);
			gradient.addColorStop(1, 'transparent');

			context.fillStyle = gradient;
			context.beginPath();
			context.arc(x, y, radius, 0, Math.PI * 2);
			context.fill();
		}
	}

	private renderGrid(layer: ParallaxLayer): void {
		const context = this.canvas.getContext();
		const { width, height, offsetY, color } = layer;

		context.strokeStyle = color;
		context.lineWidth = 0.5;

		const gridSize = 40;
		// Since offsetY is negative (downward scrolling), we need to subtract it for proper direction
		const adjustedOffsetY = ((offsetY % gridSize) + gridSize) % gridSize;

		// Vertical lines
		for (let x = 0; x < width; x += gridSize) {
			context.beginPath();
			context.moveTo(x, 0);
			context.lineTo(x, height);
			context.stroke();
		}

		// Horizontal lines with scrolling offset
		// Use negative adjustedOffsetY to make grid lines move downward
		for (let y = -adjustedOffsetY; y < height; y += gridSize) {
			context.beginPath();
			context.moveTo(0, y);
			context.lineTo(width, y);
			context.stroke();
		}
	}

	private renderDots(layer: ParallaxLayer): void {
		const context = this.canvas.getContext();
		const { width, height, offsetY, color } = layer;

		context.fillStyle = color;

		const dotSpacing = 60;
		const dotSize = 1;
		// Since offsetY is negative (downward scrolling), we need to subtract it for proper direction
		const adjustedOffsetY = ((offsetY % dotSpacing) + dotSpacing) % dotSpacing;

		for (let x = dotSpacing / 2; x < width; x += dotSpacing) {
			// Use negative adjustedOffsetY to make dots move downward
			for (let y = -adjustedOffsetY + dotSpacing / 2; y < height; y += dotSpacing) {
				context.beginPath();
				context.arc(x, y, dotSize, 0, Math.PI * 2);
				context.fill();
			}
		}
	}

	private hashCode(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash);
	}

	private seededRandom(seed: number): number {
		// Simple seeded random number generator
		const x = Math.sin(seed) * 10000;
		return x - Math.floor(x);
	}
}
