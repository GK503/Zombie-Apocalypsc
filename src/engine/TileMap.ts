import { TILE_SIZE } from './constants';
import { Camera } from './Camera';
import { SpriteLoader, type Sprite } from './Sprite';

export interface TileDef {
    id: number;
    solid: boolean;
    color?: string;
    sprite?: Sprite;
    
}

export class TileMap {
    cols: number;
    rows: number;
    tiles: Uint8Array;
    tileDefs: Map<number, TileDef>;

    constructor(cols: number, rows: number) {
        this.cols = cols;
        this.rows = rows;
        this.tiles = new Uint8Array(cols * rows);
        this.tileDefs = new Map();

        this.defineTile(0, { id: 0, solid: false, color: '#34433' });
    }

    defineTile(id: number, def: TileDef): void {
        this.tileDefs.set(id, def);
    }

    defineTileImage(id: number, solid: boolean, src: string) {
        this.tileDefs.set(id, {
            id,
            solid,
            sprite: SpriteLoader.load(src)
        });
    }

    getTile(col: number, row: number): number {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return -1;
        return this.tiles[row * this.cols + col];
    }

    isSolid(col: number, row: number): boolean {
        const id = this.getTile(col, row);
        const def = this.tileDefs.get(id);
        return def ? def.solid : true;
    }

    /**
     * Check if tile coordinates are within map bounds
     */
    isValidTile(col: number, row: number): boolean {
        return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
    }

    /**
     * Get the map dimensions in tile coordinates
     */
    getDimensions(): { cols: number; rows: number } {
        return { cols: this.cols, rows: this.rows };
    }



    render(ctx: CanvasRenderingContext2D, camera: Camera): void {
        const startCol = Math.floor(camera.x / TILE_SIZE);
        const endCol = startCol + (camera.width / TILE_SIZE) + 1;
        const startRow = Math.floor(camera.y / TILE_SIZE);
        const endRow = startRow + (camera.height / TILE_SIZE) + 1;

        const cLeft = Math.max(0, startCol);
        const cRight = Math.min(this.cols, endCol);
        const rTop = Math.max(0, startRow);
        const rBottom = Math.min(this.rows, endRow);

        for (let r = rTop; r < rBottom; r++) {
            for (let c = cLeft; c < cRight; c++) {
                let tileId = this.tiles[r * this.cols + c];
                let def = this.tileDefs.get(tileId);

                if (!def) continue;

                let x = (c * TILE_SIZE) - camera.x;
                let y = (r * TILE_SIZE) - camera.y;

                const s = def.sprite;

                // Check if sprite exists and has valid dimensions (loaded)
                if (s && s.w > 0) {
                    ctx.drawImage(
                        s.image,
                        s.x, s.y, s.w, s.h,
                        Math.floor(x), Math.floor(y), TILE_SIZE, TILE_SIZE
                    );
                } else {
                    ctx.fillStyle = def.color || '#f0f';
                    ctx.fillRect(Math.floor(x), Math.floor(y), TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
}