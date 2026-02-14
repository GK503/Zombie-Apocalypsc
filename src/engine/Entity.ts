import { TILE_SIZE, Coords, type TilePosition } from './constants';
import { Camera, type Followable } from './Camera'; // Fixed casing to match file
import { TileMap } from './TileMap'; // Fixed casing to match file
import { type Sprite } from './Sprite';
import { Pathfinder, CachedPath } from './Pathfinding';
import type { FlowField } from '../main';

// Animations are lists of Sprites
export type AnimationMap = Record<string, Sprite[]>; //Create your own variable types

export class Entity implements Followable {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    speed: number;
    gridX: number; // Map coordinate X
    gridY: number; // Map coordinate Y

    // Animation Support
    animations: AnimationMap = {};
    currentAnim: string = 'idle_down';
    frameIndex: number = 0;
    frameTimer: number = 0;
    animSpeed: number = 0.15;

    // Movement State
    protected lastDx: number = 0;
    protected lastDy: number = 0;

    // Pathfinding
    protected cachedPath: CachedPath = new CachedPath();

    constructor(gridX: number, gridY: number, color: string) {
        this.gridX = gridX;
        this.gridY = gridY;

        // Convert grid to pixels immediately
        this.x = gridX * TILE_SIZE;
        this.y = gridY * TILE_SIZE;

        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.color = color;
        this.speed = 150;
    }

    setAnimations(animations: AnimationMap) {
        this.animations = animations;
    }

    update(dt: number, _map?: TileMap): void {
        this.updateAnimation(dt);
    }

    syncGridCoords(): void {
        this.gridX = Math.floor(this.x / TILE_SIZE);
        this.gridY = Math.floor(this.y / TILE_SIZE);
    }

    /**
     * Set entity position using tile coordinates
     * Can be used to spawn entities outside visible bounds
     */
    setTilePosition(tile: TilePosition): void {
        this.gridX = tile.x;
        this.gridY = tile.y;
        const pos = Coords.tileToPixel(tile);
        this.x = pos.x;
        this.y = pos.y;
    }

    /**
     * Get the current tile position
     */
    getTilePosition(): TilePosition {
        return { x: this.gridX, y: this.gridY };
    }

    /**
     * Check if entity is within camera bounds
     */
    isInCameraBounds(camera: Camera): boolean {
        return !(
            this.x + this.width < camera.x ||
            this.x > camera.x + camera.width ||
            this.y + this.height < camera.y ||
            this.y > camera.y + camera.height
        );
    }

    /**
     * Static factory method to create an entity at tile coordinates
     * even if outside visible bounds
     */
    static createAtTile(tileX: number, tileY: number, color: string, EntityClass: typeof Entity = Entity): Entity {
        return new EntityClass(tileX, tileY, color);
    }

    /**
     * Find a path to a target tile position using A* algorithm
     * Returns the complete path or null if no path exists
     */
    findPathToTile(target: TilePosition, map: TileMap): TilePosition[] | null {
        this.syncGridCoords();
        return Pathfinder.findPath(this.gridX, this.gridY, target.x, target.y, map);
    }

    /**
     * Find a path to another entity using A* algorithm
     * Returns the complete path or null if no path exists
     */
    findPathToEntity(target: Entity, map: TileMap): TilePosition[] | null {
        const targetPos = target.getTilePosition();
        return this.findPathToTile(targetPos, map);
    }

    /**
     * Get the next step towards a target tile (most efficient for real-time use)
     * Returns null if no path, or tile coordinates of next step
     */
    getNextStepToTile(target: TilePosition, map: TileMap): TilePosition | null {
        this.syncGridCoords();
        return Pathfinder.getNextStep(this.gridX, this.gridY, target.x, target.y, map);
    }

    /**
     * Get the next step towards another entity (most efficient for real-time use)
     * Returns null if no path, or tile coordinates of next step
     */
    getNextStepToEntity(target: Entity, map: TileMap): TilePosition | null {
        const targetPos = target.getTilePosition();
        return this.getNextStepToTile(targetPos, map);
    }

    /**
     * Get next step using cached pathfinding (most efficient for continuous movement)
     * Automatically recalculates path when target moves or path becomes invalid
     */
    getCachedNextStepToTile(target: TilePosition, map: TileMap, forceRecalculate: boolean = false): TilePosition | null {
        this.syncGridCoords();
        return this.cachedPath.getNextStep(this.gridX, this.gridY, target.x, target.y, map, forceRecalculate);
    }

    /**
     * Get next step using cached pathfinding towards another entity
     */
    getCachedNextStepToEntity(target: Entity, map: TileMap, forceRecalculate: boolean = false): TilePosition | null {
        const targetPos = target.getTilePosition();
        return this.getCachedNextStepToTile(targetPos, map, forceRecalculate);
    }

    /**
     * Move towards a tile using pathfinding
     * Returns true if moved, false if no path or already at target
     * Call this in your update() function
     */
    moveTowardsTile(target: TilePosition, dt: number, map: TileMap, useCached: boolean = true): boolean {
        const nextStep = useCached
            ? this.getCachedNextStepToTile(target, map)
            : this.getNextStepToTile(target, map);

        if (!nextStep) {
            return false;
        }

        // Convert next step to pixel movement
        const targetPixelX = nextStep.x * TILE_SIZE;
        const targetPixelY = nextStep.y * TILE_SIZE;

        const dx = targetPixelX - this.x;
        const dy = targetPixelY - this.y;

        // Normalize and apply speed
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 1) {
            // Already at target tile
            return false;
        }

        const moveAmount = this.speed * dt;
        const moveX = (dx / distance) * moveAmount;
        const moveY = (dy / distance) * moveAmount;

        // Don't overshoot
        if (Math.abs(moveX) > Math.abs(dx)) {
            this.x = targetPixelX;
        } else {
            this.x += moveX;
        }

        if (Math.abs(moveY) > Math.abs(dy)) {
            this.y = targetPixelY;
        } else {
            this.y += moveY;
        }

        this.updateAnimationState(moveX, moveY);
        return true;
    }

    /**
     * Move towards another entity using pathfinding
     */
    moveTowardsEntity(target: Entity, dt: number, map: TileMap, useCached: boolean = true): boolean {
        const targetPos = target.getTilePosition();
        return this.moveTowardsTile(targetPos, dt, map, useCached);
    }

    /**
     * Clear cached pathfinding data
     */
    clearPath(): void {
        this.cachedPath.clear();
    }

    /**
     * Move towards target using Flow Field (most efficient for hordes)
     * Uses the provided flow field to determine next move
     * Returns true if moved, false if no path or already at target
     */
    moveUsingFlowField(dt: number, map: TileMap, flowField: FlowField, getBestNeighbor: (flowField: FlowField, pos: TilePosition, map: TileMap) => TilePosition | null): boolean {
        this.syncGridCoords();
        
        // Get best neighbor from flow field
        const nextTile = getBestNeighbor(flowField, { x: this.gridX, y: this.gridY }, map);
        
        if (!nextTile) {
            return false;
        }

        // Convert to pixel coordinates
        const targetPixelX = nextTile.x * TILE_SIZE;
        const targetPixelY = nextTile.y * TILE_SIZE;

        const dx = targetPixelX - this.x;
        const dy = targetPixelY - this.y;

        // Calculate movement
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 1) {
            return false;
        }

        const moveAmount = this.speed * dt;
        const moveX = (dx / distance) * moveAmount;
        const moveY = (dy / distance) * moveAmount;

        // Don't overshoot
        if (Math.abs(moveX) > Math.abs(dx)) {
            this.x = targetPixelX;
        } else {
            this.x += moveX;
        }

        if (Math.abs(moveY) > Math.abs(dy)) {
            this.y = targetPixelY;
        } else {
            this.y += moveY;
        }

        this.updateAnimationState(moveX, moveY);
        return true;
    }

    protected updateAnimationState(dx: number, dy: number): void {
        this.lastDx = dx;
        this.lastDy = dy;

        let action = 'idle';
        let direction = 'down';

        if (dx !== 0 || dy !== 0) {
            action = 'walk';
            if (Math.abs(dx) > Math.abs(dy)) {
                direction = dx > 0 ? 'right' : 'left';
            } else {
                direction = dy > 0 ? 'down' : 'up';
            }
        }
        else if (this.lastDx !== 0 || this.lastDy !== 0) {
            if (Math.abs(this.lastDx) > Math.abs(this.lastDy)) {
                direction = this.lastDx > 0 ? 'right' : 'left';
            } else {
                direction = this.lastDy > 0 ? 'down' : 'up';
            }
        }

        const key = `${action}_${direction}`;

        if (this.animations[key] && this.currentAnim !== key) {
            this.currentAnim = key;
            this.frameIndex = 0;
        }
    }

    private updateAnimation(dt: number) {
        if (!this.animations[this.currentAnim] || this.animations[this.currentAnim].length === 0) return;

        this.frameTimer += dt;
        if (this.frameTimer >= this.animSpeed) {
            this.frameTimer = 0;
            const frames = this.animations[this.currentAnim];
            this.frameIndex = (this.frameIndex + 1) % frames.length;
        }
    }

    render(ctx: CanvasRenderingContext2D, camera: Camera): void {
        // Culling
        if (
            this.x + this.width < camera.x ||
            this.x > camera.x + camera.width ||
            this.y + this.height < camera.y ||
            this.y > camera.y + camera.height
        ) return;

        const renderX = Math.floor(this.x - camera.x);
        const renderY = Math.floor(this.y - camera.y);

        const frames = this.animations[this.currentAnim];

        if (frames && frames.length > 0) {
            // Ensure index is valid
            const sprite = frames[this.frameIndex % frames.length];

            // FIXED: Check sprite.w > 0. 
            // The loader ensures w is set only when the image/frame is fully loaded.
            // This works for both HTMLImageElement and ImageBitmap.
            if (sprite && sprite.w > 0) {
                ctx.drawImage(
                    sprite.image,
                    sprite.x, sprite.y, sprite.w, sprite.h,
                    renderX, renderY, this.width, this.height
                );
            } else {
                // Fallback while loading
                ctx.fillStyle = this.color;
                ctx.fillRect(renderX, renderY, this.width, this.height);
            }
        } else {
            // No animation found
            ctx.fillStyle = this.color;
            ctx.fillRect(renderX, renderY, this.width, this.height);
        }
    }
}
