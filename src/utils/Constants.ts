export const GAME_CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    TARGET_FPS: 60,
    TILE_SIZE: 32,
    SHIP_SPEED: 200,
    BULLET_SPEED: 400,
    GRAVITY: 0,
    MAX_BULLETS: 50,
    POWER_UP_DURATION: 10,
    TIME_SLOWDOWN_SCALE: 0.5,
    TIME_SPEEDUP_SCALE: 2.0,
    TIME_FREEZE_SCALE: 0.0
};

export const COLORS = {
    BACKGROUND: '#000000',
    SHIP: '#00ff00',
    BULLET: '#ffff00',
    BLOCK_WEAK: '#ff0000',
    BLOCK_NORMAL: '#ff8800',
    BLOCK_STRONG: '#ff0088',
    POWER_UP: '#00ffff',
    UI_TEXT: '#ffffff',
    UI_BACKGROUND: '#333333'
};

export const INPUT_KEYS = {
    MOVE_LEFT: ['ArrowLeft', 'KeyA'],
    MOVE_RIGHT: ['ArrowRight', 'KeyD'],
    FIRE: ['Space', 'KeyZ'],
    PAUSE: ['Escape']
};

export const GAMEPAD_BUTTONS = {
    FIRE: 0, // A button
    PAUSE: 9  // Start button
};

export const GAMEPAD_AXES = {
    LEFT_X: 0,
    LEFT_Y: 1,
    RIGHT_X: 2,
    RIGHT_Y: 3
};