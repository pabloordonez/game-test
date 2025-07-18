import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { World } from '../core/World';
import { AudioComponent, AudioEvent, AudioEventType } from '../components/AudioComponent';
import { AudioManager } from '../../core/AudioManager';

export class AudioSystem implements System {
    private entities: Entity[] = [];
    private world: World;
    private audioManager: AudioManager;

    constructor(world: World, audioManager: AudioManager) {
        this.world = world;
        this.audioManager = audioManager;
    }

    update(_deltaTime: number): void {
        for (const entity of this.entities) {
            const audioComponent = this.world.getComponent(entity.id, 'AudioComponent') as AudioComponent;
            if (audioComponent && audioComponent.hasEvents()) {
                this.processAudioEvents(audioComponent);
                audioComponent.clearEvents();
            }
        }
    }

    private processAudioEvents(audioComponent: AudioComponent): void {
        const events = audioComponent.getEvents();
        
        for (const event of events) {
            this.processAudioEvent(event);
        }
    }

    private processAudioEvent(event: AudioEvent): void {
        switch (event.type) {
            case AudioEventType.PLAY_SOUND:
                this.audioManager.playSound(event.soundId, event.volume);
                break;
            case AudioEventType.PLAY_MUSIC:
                this.audioManager.playMusic(event.soundId, event.volume, event.loop);
                break;
            case AudioEventType.STOP_MUSIC:
                this.audioManager.stopMusic();
                break;
            default:
                console.warn(`Unknown audio event type: ${event.type}`);
        }
    }

    getEntities(): Entity[] {
        return this.entities;
    }

    getRequiredComponents(): string[] {
        return ['AudioComponent'];
    }

    setEntities(entities: Entity[]): void {
        this.entities = entities;
    }
} 