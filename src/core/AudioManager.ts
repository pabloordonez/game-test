export interface AudioSettings {
	masterVolume: number;
	musicVolume: number;
	sfxVolume: number;
	muted: boolean;
}

export interface SoundPool {
	[key: string]: HTMLAudioElement[];
}

export class AudioManager {
	private audioContext: AudioContext | null = null;
	private settings: AudioSettings;
	private soundPool: SoundPool = {};
	private currentMusic: HTMLAudioElement | null = null;
	private musicGainNode: GainNode | null = null;
	private sfxGainNode: GainNode | null = null;
	private isInitialized: boolean = false;

	constructor() {
		this.settings = {
			masterVolume: 0.7,
			musicVolume: 0.5,
			sfxVolume: 0.8,
			muted: false
		};
	}

	async initialize(): Promise<void> {
		if (this.isInitialized) return;

		try {
			// Initialize Web Audio API
			this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

			// Create gain nodes for volume control
			this.musicGainNode = this.audioContext.createGain();
			this.sfxGainNode = this.audioContext.createGain();

			this.musicGainNode.connect(this.audioContext.destination);
			this.sfxGainNode.connect(this.audioContext.destination);

			this.updateGainNodes();
			this.isInitialized = true;

			console.log('AudioManager initialized successfully');
		} catch (error) {
			console.warn('Web Audio API not available, falling back to HTML5 audio:', error);
			this.isInitialized = true; // Still mark as initialized for HTML5 audio fallback
		}
	}

	private updateGainNodes(): void {
		if (!this.audioContext || !this.musicGainNode || !this.sfxGainNode) return;

		const masterVolume = this.settings.muted ? 0 : this.settings.masterVolume;
		this.musicGainNode.gain.value = masterVolume * this.settings.musicVolume;
		this.sfxGainNode.gain.value = masterVolume * this.settings.sfxVolume;
	}

	preloadSound(soundId: string, audioPath: string, poolSize: number = 3): Promise<void> {
		return new Promise((resolve, reject) => {
			this.soundPool[soundId] = [];
			let loadedCount = 0;

			for (let i = 0; i < poolSize; i++) {
				const audio = new Audio(audioPath);
				audio.preload = 'auto';

				audio.addEventListener('canplaythrough', () => {
					loadedCount++;
					if (loadedCount === poolSize) {
						console.log(`Sound pool '${soundId}' loaded with ${poolSize} instances`);
						resolve();
					}
				});

				audio.addEventListener('error', (error) => {
					console.error(`Failed to load sound '${soundId}':`, error);
					reject(error);
				});

				this.soundPool[soundId].push(audio);
			}
		});
	}

	playSound(soundId: string, volume: number = 1.0): void {
		if (!this.isInitialized || this.settings.muted) return;

		const soundPool = this.soundPool[soundId];
		if (!soundPool || soundPool.length === 0) {
			console.warn(`Sound '${soundId}' not found in pool`);
			return;
		}

		// Find an available audio instance
		let audio = soundPool.find((a) => a.paused || a.ended);
		if (!audio) {
			// All instances are playing, use the first one (interrupt)
			audio = soundPool[0];
		}

		try {
			audio.currentTime = 0;
			audio.volume = Math.min(1.0, volume * this.settings.sfxVolume * this.settings.masterVolume);
			audio.play().catch((error) => {
				console.warn(`Failed to play sound '${soundId}':`, error);
			});
		} catch (error) {
			console.warn(`Error playing sound '${soundId}':`, error);
		}
	}

	async playMusic(musicId: string, volume: number = 1.0, loop: boolean = true): Promise<void> {
		if (!this.isInitialized) return;

		// Stop current music if playing
		this.stopMusic();

		const musicPool = this.soundPool[musicId];
		if (!musicPool || musicPool.length === 0) {
			console.warn(`Music '${musicId}' not found in pool`);
			return;
		}

		this.currentMusic = musicPool[0];
		this.currentMusic.loop = loop;
		this.currentMusic.volume = Math.min(1.0, volume * this.settings.musicVolume * this.settings.masterVolume);

		try {
			await this.currentMusic.play();
			console.log(`Playing music: ${musicId}`);
		} catch (error) {
			console.warn(`Failed to play music '${musicId}':`, error);
		}
	}

	stopMusic(): void {
		if (this.currentMusic) {
			this.currentMusic.pause();
			this.currentMusic.currentTime = 0;
			this.currentMusic = null;
		}
	}

	pauseMusic(): void {
		if (this.currentMusic && !this.currentMusic.paused) {
			this.currentMusic.pause();
		}
	}

	resumeMusic(): void {
		if (this.currentMusic && this.currentMusic.paused) {
			this.currentMusic.play().catch((error) => {
				console.warn('Failed to resume music:', error);
			});
		}
	}

	setMasterVolume(volume: number): void {
		this.settings.masterVolume = Math.max(0, Math.min(1, volume));
		this.updateGainNodes();
		this.updateCurrentMusicVolume();
	}

	setMusicVolume(volume: number): void {
		this.settings.musicVolume = Math.max(0, Math.min(1, volume));
		this.updateGainNodes();
		this.updateCurrentMusicVolume();
	}

	setSfxVolume(volume: number): void {
		this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
		this.updateGainNodes();
	}

	setMuted(muted: boolean): void {
		this.settings.muted = muted;
		this.updateGainNodes();
		this.updateCurrentMusicVolume();
	}

	private updateCurrentMusicVolume(): void {
		if (this.currentMusic) {
			const volume = this.settings.muted ? 0 : this.settings.masterVolume * this.settings.musicVolume;
			this.currentMusic.volume = Math.min(1.0, volume);
		}
	}

	getSettings(): AudioSettings {
		return { ...this.settings };
	}

	isMuted(): boolean {
		return this.settings.muted;
	}

	getInitializationStatus(): boolean {
		return this.isInitialized;
	}
}
