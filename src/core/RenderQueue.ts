export interface RenderCommand {
    type: 'rect' | 'circle' | 'triangle' | 'line' | 'text';
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    color: string;
    alpha?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    text?: string;
    font?: string;
    entityId?: number;
    tags?: string[];
}

export interface RenderBatch {
    type: 'rect' | 'circle' | 'triangle' | 'line' | 'text';
    color: string;
    alpha: number;
    commands: RenderCommand[];
}

export class RenderQueue {
    private commands: RenderCommand[] = [];
    private batches: RenderBatch[] = [];
    private batchingEnabled: boolean = true;
    private maxBatchSize: number = 50;
    private performanceMonitor: any = null;

    constructor(enableBatching: boolean = true, maxBatchSize: number = 50) {
        this.batchingEnabled = enableBatching;
        this.maxBatchSize = maxBatchSize;
    }

    clear(): void {
        this.commands.length = 0;
        this.batches.length = 0;
    }

    addCommand(command: RenderCommand): void {
        this.commands.push(command);
    }

    addRect(x: number, y: number, width: number, height: number, color: string, alpha: number = 1.0): void {
        this.addCommand({
            type: 'rect',
            x, y, width, height, color, alpha
        });
    }

    addCircle(x: number, y: number, radius: number, color: string, alpha: number = 1.0): void {
        this.addCommand({
            type: 'circle',
            x, y, radius, color, alpha
        });
    }

    addTriangle(x: number, y: number, width: number, height: number, color: string, alpha: number = 1.0): void {
        this.addCommand({
            type: 'triangle',
            x, y, width, height, color, alpha
        });
    }

    addText(x: number, y: number, text: string, font: string, color: string, alpha: number = 1.0): void {
        this.addCommand({
            type: 'text',
            x, y, text, font, color, alpha
        });
    }

    prepareBatches(): void {
        if (!this.batchingEnabled) {
            return;
        }

        this.batches.length = 0;

        // Sort commands by type, color, and alpha to enable batching
        const sortedCommands = [...this.commands].sort((a, b) => {
            // First sort by type
            if (a.type !== b.type) {
                return a.type.localeCompare(b.type);
            }
            // Then by color
            if (a.color !== b.color) {
                return a.color.localeCompare(b.color);
            }
            // Then by alpha
            return (a.alpha || 1.0) - (b.alpha || 1.0);
        });

        // Create batches
        let currentBatch: RenderBatch | null = null;

        for (const command of sortedCommands) {
            const alpha = command.alpha || 1.0;

            // Check if we can add to current batch
            if (currentBatch &&
                currentBatch.type === command.type &&
                currentBatch.color === command.color &&
                currentBatch.alpha === alpha &&
                currentBatch.commands.length < this.maxBatchSize) {

                currentBatch.commands.push(command);
            } else {
                // Create new batch
                currentBatch = {
                    type: command.type,
                    color: command.color,
                    alpha: alpha,
                    commands: [command]
                };
                this.batches.push(currentBatch);
            }
        }
    }

    renderBatched(ctx: CanvasRenderingContext2D): number {
        if (!this.batchingEnabled) {
            return this.renderUnbatched(ctx);
        }

        this.prepareBatches();
        let renderCalls = 0;

        for (const batch of this.batches) {
            this.setupBatchRenderState(ctx, batch);

            switch (batch.type) {
                case 'rect':
                    this.renderRectBatch(ctx, batch);
                    break;
                case 'circle':
                    this.renderCircleBatch(ctx, batch);
                    break;
                case 'triangle':
                    this.renderTriangleBatch(ctx, batch);
                    break;
                case 'text':
                    this.renderTextBatch(ctx, batch);
                    break;
            }

            renderCalls++;
        }

        // Report render calls to performance monitor
        this.reportRenderCalls(renderCalls);
        return renderCalls;
    }

    renderUnbatched(ctx: CanvasRenderingContext2D): number {
        let renderCalls = 0;

        for (const command of this.commands) {
            this.renderSingleCommand(ctx, command);
            renderCalls++;
        }

        // Report render calls to performance monitor
        this.reportRenderCalls(renderCalls);
        return renderCalls;
    }

    private setupBatchRenderState(ctx: CanvasRenderingContext2D, batch: RenderBatch): void {
        ctx.fillStyle = batch.color;
        ctx.strokeStyle = batch.color;
        ctx.globalAlpha = batch.alpha;
    }

    private renderRectBatch(ctx: CanvasRenderingContext2D, batch: RenderBatch): void {
        ctx.beginPath();
        for (const command of batch.commands) {
            ctx.rect(command.x, command.y, command.width || 0, command.height || 0);
        }
        ctx.fill();
    }

    private renderCircleBatch(ctx: CanvasRenderingContext2D, batch: RenderBatch): void {
        for (const command of batch.commands) {
            ctx.beginPath();
            ctx.arc(command.x, command.y, command.radius || 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private renderTriangleBatch(ctx: CanvasRenderingContext2D, batch: RenderBatch): void {
        for (const command of batch.commands) {
            const width = command.width || 0;
            const height = command.height || 0;

            ctx.beginPath();
            ctx.moveTo(command.x, command.y - height / 2);
            ctx.lineTo(command.x - width / 2, command.y + height / 2);
            ctx.lineTo(command.x + width / 2, command.y + height / 2);
            ctx.closePath();
            ctx.fill();
        }
    }

    private renderTextBatch(ctx: CanvasRenderingContext2D, batch: RenderBatch): void {
        for (const command of batch.commands) {
            if (command.text && command.font) {
                ctx.font = command.font;
                ctx.fillText(command.text, command.x, command.y);
            }
        }
    }

    private renderSingleCommand(ctx: CanvasRenderingContext2D, command: RenderCommand): void {
        ctx.fillStyle = command.color;
        ctx.strokeStyle = command.color;
        ctx.globalAlpha = command.alpha || 1.0;

        switch (command.type) {
            case 'rect':
                ctx.fillRect(command.x, command.y, command.width || 0, command.height || 0);
                break;
            case 'circle':
                ctx.beginPath();
                ctx.arc(command.x, command.y, command.radius || 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'triangle':
                const width = command.width || 0;
                const height = command.height || 0;
                ctx.beginPath();
                ctx.moveTo(command.x, command.y - height / 2);
                ctx.lineTo(command.x - width / 2, command.y + height / 2);
                ctx.lineTo(command.x + width / 2, command.y + height / 2);
                ctx.closePath();
                ctx.fill();
                break;
            case 'text':
                if (command.text && command.font) {
                    ctx.font = command.font;
                    ctx.fillText(command.text, command.x, command.y);
                }
                break;
        }
    }

    getCommands(): RenderCommand[] {
        return [...this.commands];
    }

    getBatches(): RenderBatch[] {
        return [...this.batches];
    }

    getStats(): {
        totalCommands: number,
        totalBatches: number,
        batchingEnabled: boolean,
        averageBatchSize: number
    } {
        const averageBatchSize = this.batches.length > 0
            ? this.batches.reduce((sum, batch) => sum + batch.commands.length, 0) / this.batches.length
            : 0;

        return {
            totalCommands: this.commands.length,
            totalBatches: this.batches.length,
            batchingEnabled: this.batchingEnabled,
            averageBatchSize
        };
    }

    setBatchingEnabled(enabled: boolean): void {
        this.batchingEnabled = enabled;
    }

    setMaxBatchSize(size: number): void {
        this.maxBatchSize = Math.max(1, size);
    }

    setPerformanceMonitor(monitor: any): void {
        this.performanceMonitor = monitor;
    }

    private reportRenderCalls(count: number): void {
        if (this.performanceMonitor && this.performanceMonitor.incrementRenderCalls) {
            this.performanceMonitor.incrementRenderCalls(count);
        }
    }
}