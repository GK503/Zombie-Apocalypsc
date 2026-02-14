export const TILE_SIZE = 32;

/**
 * Tile coordinate position type
 */
export type TilePosition = { x: number; y: number };

/**
 * Coordinate conversion utilities for tile-based positioning
 */
export const Coords = {
    /**
     * Convert tile coordinates to pixel coordinates
     */
    tileToPixel(tile: TilePosition): { x: number; y: number } {
        return {
            x: tile.x * TILE_SIZE,
            y: tile.y * TILE_SIZE
        };
    },

    /**
     * Convert pixel coordinates to tile coordinates
     */
    pixelToTile(x: number, y: number): TilePosition {
        return {
            x: Math.floor(x / TILE_SIZE),
            y: Math.floor(y / TILE_SIZE)
        };
    },

    /**
     * Get pixel position centered within a tile
     */
    tileCenterToPixel(tile: TilePosition): { x: number; y: number } {
        return {
            x: tile.x * TILE_SIZE + TILE_SIZE / 2,
            y: tile.y * TILE_SIZE + TILE_SIZE / 2
        };
    }
};