export class MathUtils {
    static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    static lerp(start: number, end: number, factor: number): number {
        return start + (end - start) * factor;
    }

    static distance(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static randomRange(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static degreesToRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    static radiansToDegrees(radians: number): number {
        return radians * (180 / Math.PI);
    }

    static normalize(value: number, min: number, max: number): number {
        return (value - min) / (max - min);
    }

    static smoothStep(edge0: number, edge1: number, x: number): number {
        const t = MathUtils.clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
        return t * t * (3.0 - 2.0 * t);
    }
}

export interface Vector2 {
    x: number;
    y: number;
}

export class Vector2Utils {
    static create(x: number, y: number): Vector2 {
        return { x, y };
    }

    static add(a: Vector2, b: Vector2): Vector2 {
        return { x: a.x + b.x, y: a.y + b.y };
    }

    static subtract(a: Vector2, b: Vector2): Vector2 {
        return { x: a.x - b.x, y: a.y - b.y };
    }

    static multiply(a: Vector2, scalar: number): Vector2 {
        return { x: a.x * scalar, y: a.y * scalar };
    }

    static magnitude(v: Vector2): number {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    }

    static normalize(v: Vector2): Vector2 {
        const mag = Vector2Utils.magnitude(v);
        if (mag === 0) return { x: 0, y: 0 };
        return { x: v.x / mag, y: v.y / mag };
    }

    static distance(a: Vector2, b: Vector2): number {
        return MathUtils.distance(a.x, a.y, b.x, b.y);
    }
}