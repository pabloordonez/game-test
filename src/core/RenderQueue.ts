export interface RenderCommand {
    type: 'rect' | 'circle' | 'triangle' | 'text';
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

export class RenderQueue {
    private commands: RenderCommand[] = [];

    addCommand(command: RenderCommand): void {
        this.commands.push(command);
    }

    getCommands(): RenderCommand[] {
        return this.commands;
    }

    clear(): void {
        this.commands.length = 0;
    }

    getCommandCount(): number {
        return this.commands.length;
    }
} 