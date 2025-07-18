import { Canvas } from './Canvas';
import { RenderQueue } from './RenderQueue';

export class RenderPipeline {
	private canvas: Canvas;

	constructor(canvas: Canvas) {
		this.canvas = canvas;
	}

	execute(renderQueue: RenderQueue): void {
		// Clear the canvas
		this.canvas.clear();

		// Use optimized batched rendering
		renderQueue.renderBatched(this.canvas.getContext());
		// Note: render call count is now tracked by OptimizedRenderQueue internally
	}

	updateCanvas(newCanvas: Canvas): void {
		this.canvas = newCanvas;
	}
}
