import { Component } from '../core/Component';

export enum AudioEventType {
    PLAY_SOUND = 'play_sound',
    PLAY_MUSIC = 'play_music',
    STOP_MUSIC = 'stop_music'
}

export interface AudioEvent {
    type: AudioEventType;
    soundId: string;
    volume?: number;
    loop?: boolean;
}

export class AudioComponent implements Component {
    public entityId: number;
    public events: AudioEvent[] = [];

    constructor(entityId: number) {
        this.entityId = entityId;
    }

    addEvent(event: AudioEvent): void {
        this.events.push(event);
    }

    getEvents(): AudioEvent[] {
        return this.events;
    }

    clearEvents(): void {
        this.events.length = 0;
    }

    hasEvents(): boolean {
        return this.events.length > 0;
    }
} 