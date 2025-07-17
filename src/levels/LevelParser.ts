export interface LevelData {
    id: number;
    name: string;
    width: number;
    height: number;
    data: string[][];
    metadata: LevelMetadata;
}

export interface LevelMetadata {
    backgroundType: string;
    musicTrack: string;
    difficulty: number;
    targetScore: number;
}

export class LevelParser {
    private static readonly BLOCK_MAPPING: Record<string, string> = {
        '.': 'empty',
        '#': 'normal',
        'S': 'strong',
        'W': 'weak',
        'I': 'indestructible',
        'P': 'powerup'
    };

    static parseLevelFile(content: string): LevelData {
        const lines = content.trim().split('\n');
        const levelData: Partial<LevelData> = {};
        const metadata: Partial<LevelMetadata> = {};

        let dataStartIndex = -1;
        let dataEndIndex = -1;

        // Parse header information
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.startsWith('LEVEL:')) {
                levelData.id = parseInt(line.split(':')[1]);
            } else if (line.startsWith('NAME:')) {
                levelData.name = line.split(':')[1].trim();
            } else if (line.startsWith('WIDTH:')) {
                levelData.width = parseInt(line.split(':')[1]);
            } else if (line.startsWith('HEIGHT:')) {
                levelData.height = parseInt(line.split(':')[1]);
            } else if (line.startsWith('BACKGROUND:')) {
                metadata.backgroundType = line.split(':')[1].trim();
            } else if (line.startsWith('MUSIC:')) {
                metadata.musicTrack = line.split(':')[1].trim();
            } else if (line.startsWith('DIFFICULTY:')) {
                metadata.difficulty = parseInt(line.split(':')[1]);
            } else if (line.startsWith('TARGET_SCORE:')) {
                metadata.targetScore = parseInt(line.split(':')[1]);
            } else if (line === 'DATA:') {
                dataStartIndex = i + 1;
            } else if (dataStartIndex !== -1 && line === '') {
                dataEndIndex = i;
                break;
            }
        }

        // Parse level data
        if (dataStartIndex === -1) {
            throw new Error('No DATA section found in level file');
        }

        const dataEnd = dataEndIndex !== -1 ? dataEndIndex : lines.length;
        const dataLines = lines.slice(dataStartIndex, dataEnd);

        levelData.data = dataLines.map(line =>
            line.split('').map(char => this.BLOCK_MAPPING[char] || 'empty')
        );

        // Validate level data
        if (!levelData.width || !levelData.height) {
            throw new Error('Level width and height must be specified');
        }

        if (levelData.data.length !== levelData.height) {
            throw new Error(`Level height mismatch: expected ${levelData.height}, got ${levelData.data.length}`);
        }

        for (let i = 0; i < levelData.data.length; i++) {
            if (levelData.data[i].length !== levelData.width) {
                throw new Error(`Level width mismatch at row ${i}: expected ${levelData.width}, got ${levelData.data[i].length}`);
            }
        }

        levelData.metadata = metadata as LevelMetadata;

        return levelData as LevelData;
    }

    static createDefaultLevel(): LevelData {
        return {
            id: 1,
            name: "Default Level",
            width: 20,
            height: 30,
            data: this.createDefaultLevelData(20, 30),
            metadata: {
                backgroundType: "space",
                musicTrack: "level1",
                difficulty: 1,
                targetScore: 1000
            }
        };
    }

    private static createDefaultLevelData(width: number, height: number): string[][] {
        const data: string[][] = [];
        for (let y = 0; y < height; y++) {
            const row: string[] = [];
            for (let x = 0; x < width; x++) {
                // Create some blocks in the middle rows
                if (y >= 5 && y <= 15) {
                    if (x % 3 === 0) {
                        row.push('normal');
                    } else if (x % 7 === 0) {
                        row.push('weak');
                    } else if (x % 11 === 0) {
                        row.push('powerup');
                    } else {
                        row.push('empty');
                    }
                } else {
                    row.push('empty');
                }
            }
            data.push(row);
        }
        return data;
    }

    static validateLevel(levelData: LevelData): boolean {
        // Check if level has any blocks
        let hasBlocks = false;
        for (let y = 0; y < levelData.height; y++) {
            for (let x = 0; x < levelData.width; x++) {
                if (levelData.data[y][x] !== 'empty') {
                    hasBlocks = true;
                    break;
                }
            }
            if (hasBlocks) break;
        }

        if (!hasBlocks) {
            console.warn('Level has no blocks');
            return false;
        }

        return true;
    }
}