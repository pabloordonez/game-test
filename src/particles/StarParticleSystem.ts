export interface StarParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    speed: number;
    color: string;
    life: number;
    maxLife: number;
    initialSpeed: number; // Add this to track initial speed
    direction: number; // Add this to store the initial direction angle
}

export class StarParticleSystem {
    private particles: StarParticle[] = [];
    private centerX: number;
    private centerY: number;
    private screenWidth: number;
    private screenHeight: number;
    // Conservative spawn rate for steady visible particles (in seconds)
    private spawnRate: number = 0.1; // Every 0.1 seconds (10 particles per second)
    private spawnTimer: number = 0;
    private maxParticles: number = 60; // Reasonable number for smooth performance
    private starColors: string[] = ['#ffffff', '#ffff00', '#00ffff', '#ff00ff', '#00ff00', '#ff8800'];

    constructor(centerX: number, centerY: number, screenWidth: number, screenHeight: number) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;

        // Spawn some initial particles for immediate visibility
        for (let i = 0; i < 10; i++) {
            this.spawnParticle();
        }
    }

    update(deltaTime: number): void {
        // DEBUG: Track particle lifecycle
        const particlesBefore = this.particles.length;

        // Spawn new particles very frequently
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnRate && this.particles.length < this.maxParticles) {
            // Spawn reasonable number of particles for steady effect
            const spawnCount = 1 + Math.floor(Math.random() * 2); // 1-2 particles per cycle
            for (let i = 0; i < spawnCount && this.particles.length < this.maxParticles; i++) {
                this.spawnParticle();
            }
            this.spawnTimer = 0;
        }

        // Update existing particles
        let removedCount = 0;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            // Update life
            particle.life += deltaTime;

            // Calculate distance from center for acceleration
            const dx = particle.x - this.centerX;
            const dy = particle.y - this.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Much more conservative acceleration
            const accelerationFactor = 1 + (distance / 200); // Reduced from 75 to 200 for gentle acceleration

            // Apply acceleration to velocity using stored direction (not recalculated angle)
            const currentSpeed = particle.initialSpeed * accelerationFactor;
            particle.vx = Math.cos(particle.direction) * currentSpeed;
            particle.vy = Math.sin(particle.direction) * currentSpeed;

            // Update position
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;

            // Calculate distance from center for fog effect
            const distanceFromCenter = Math.sqrt(
                (particle.x - this.centerX) ** 2 + (particle.y - this.centerY) ** 2
            );

            // Calculate maximum distance to screen edge (with buffer)
            const maxDistance = Math.sqrt(
                (this.screenWidth / 2) ** 2 + (this.screenHeight / 2) ** 2
            ) * 1.5; // Even longer visibility

            // Calculate alpha based on distance - keep more visible
            const distanceProgress = Math.min(distanceFromCenter / maxDistance, 1);

            // Keep particles very visible for most of their life
            const baseAlpha = 1.0 - (distanceProgress * 0.3); // Only fade to 0.7 at max distance

            // Life-based fading (only fade out in final 20% of life)
            const lifeProgress = particle.life / particle.maxLife;
            let lifeFade = 1.0;
            if (lifeProgress > 0.8) {
                lifeFade = 1.0 - ((lifeProgress - 0.8) / 0.2);
            }

            // Final alpha is combination of distance and life
            particle.alpha = Math.max(baseAlpha * lifeFade, 0.1); // Minimum alpha of 0.1

            // Remove particles when they're well outside viewport OR life expired
            const buffer = 200; // Larger buffer
            if (particle.life >= particle.maxLife ||
                particle.x < -buffer || particle.x > this.screenWidth + buffer ||
                particle.y < -buffer || particle.y > this.screenHeight + buffer) {
                this.particles.splice(i, 1);
                removedCount++;
            }
        }

        // DEBUG: Log particle counts occasionally
        if (Math.random() < 0.01) { // 1% chance
            console.log(`Particles: ${particlesBefore} -> ${this.particles.length}, Removed: ${removedCount}, Timer: ${this.spawnTimer.toFixed(3)}s`);
        }
    }

    private spawnParticle(): void {
        // Random position closer to center but with some spread for better acceleration
        const radius = Math.random() * 15; // Reduced spawn radius
        const angle = Math.random() * Math.PI * 2;

        // Much more conservative speeds for visible movement
        const initialSpeed = 100 + Math.random() * 200; // 100-300 pixels per second (much slower)
        const vx = Math.cos(angle) * initialSpeed;
        const vy = Math.sin(angle) * initialSpeed;

        const particle: StarParticle = {
            x: this.centerX + Math.cos(angle) * radius,
            y: this.centerY + Math.sin(angle) * radius,
            vx: vx,
            vy: vy,
            alpha: 1.0, // Start fully visible
            speed: initialSpeed,
            color: this.starColors[Math.floor(Math.random() * this.starColors.length)],
            life: 0,
            maxLife: 4 + Math.random() * 2, // 4-6 seconds (converted from milliseconds to seconds)
            initialSpeed: initialSpeed,
            direction: angle
        };

        this.particles.push(particle);
    }

    getParticles(): StarParticle[] {
        return this.particles;
    }

    setSpawnRate(rate: number): void {
        this.spawnRate = rate;
    }

    clear(): void {
        this.particles = [];
    }
}