import { TILE_SIZE, Coords, type TilePosition } from './constants';

export interface Followable {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class Camera {
    x: number;
    y: number;
    width: number;
    height: number;
    maxX: number;
    maxY: number;

    constructor(width: number, height: number, mapWidth: number, mapHeight: number) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.maxX = mapWidth * TILE_SIZE - width;
        this.maxY = mapHeight * TILE_SIZE - height;
    }

    follow(target: Followable): void {
        this.x = (target.x + target.width / 2) - this.width / 2;
        this.y = (target.y + target.height / 2) - this.height / 2;

        this.x = Math.max(0, Math.min(this.x, this.maxX));
        this.y = Math.max(0, Math.min(this.y, this.maxY));
        
        this.x = this.x | 0;
        this.y = this.y | 0;
    }

    /**
     * Get the camera's center position in tile coordinates
     */
    getCenterTile(): TilePosition {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        return Coords.pixelToTile(centerX, centerY);
    }

    /**
     * Get the camera's top-left tile position
     */
    getTopLeftTile(): TilePosition {
        return Coords.pixelToTile(this.x, this.y);
    }

    /**
     * Check if a tile coordinate is visible in the camera
     */
    isTileVisible(tile: TilePosition): boolean {
        const pos = Coords.tileToPixel(tile);
        return !(
            pos.x + TILE_SIZE < this.x ||
            pos.x > this.x + this.width ||
            pos.y + TILE_SIZE < this.y ||
            pos.y > this.y + this.height
        );
    }

    /**
     * Center camera on a specific tile coordinate
     * Useful for spawning player at camera location
     */
    centerOnTile(tile: TilePosition): void {
        const pos = Coords.tileToPixel(tile);
        this.x = pos.x + TILE_SIZE / 2 - this.width / 2;
        this.y = pos.y + TILE_SIZE / 2 - this.height / 2;

        this.x = Math.max(0, Math.min(this.x, this.maxX));
        this.y = Math.max(0, Math.min(this.y, this.maxY));
        
        this.x = this.x | 0;
        this.y = this.y | 0;
    }
}