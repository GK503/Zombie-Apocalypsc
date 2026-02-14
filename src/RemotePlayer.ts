import { Entity } from "./engine/Entity";
import type { TileMap } from "./engine/TileMap";
import { SpriteLoader } from "./engine/Sprite";

const idleFrames = SpriteLoader.from_gif("/assets/Character/Main/Idle/Gif/Character_down_idle_no-hands.gif");
const walkDownFrames = SpriteLoader.from_gif("/assets/Character/Main/Run/Gif/Character_down_run_no-hands.gif");
const walkLeftFrames = SpriteLoader.from_gif("/assets/Character/Main/Run/Gif/Character_side-left_run_no-hands.gif");
const walkRightFrames = SpriteLoader.from_gif("/assets/Character/Main/Run/Gif/Character_side_run_no-hands.gif");
const walkUpFrames = SpriteLoader.from_gif("/assets/Character/Main/Run/Gif/Character_up_run_no-hands.gif");

export interface RemotePlayerState {
    x: number;
    y: number;
    health: number;
    currentAnim: string;
    facingX: number;
    facingY: number;
    timestamp: number;
}

/**
 * RemotePlayer represents another player in the multiplayer game
 * Uses interpolation for smooth movement between network updates
 */
export class RemotePlayer extends Entity {
    playerId: string;
    health: number;
    maxHealth: number = 100;
    
    // Interpolation for smooth movement
    private targetX: number;
    private targetY: number;
    private previousX: number;
    private previousY: number;
    private interpolationProgress: number = 0;
    private interpolationSpeed: number = 10; // Higher = faster interpolation
    
    // Last update time
    private lastUpdateTime: number = 0;
    private readonly STALE_THRESHOLD = 3000; // 3 seconds
    
    constructor(playerId: string, x: number, y: number) {
        super(x, y, '#00aaff');
        this.playerId = playerId;
        this.health = this.maxHealth;
        
        this.targetX = x;
        this.targetY = y;
        this.previousX = x;
        this.previousY = y;
        
        // Use same animations as regular player
        this.setAnimations({
            'idle_down': idleFrames,
            'walk_down': walkDownFrames,
            'walk_left': walkLeftFrames,
            'walk_right': walkRightFrames,
            'walk_up': walkUpFrames,
            'idle_left': walkLeftFrames,
            'idle_right': walkRightFrames,
            'idle_up': walkUpFrames,
        });
        
        this.animSpeed = 0.1;
        this.lastUpdateTime = Date.now();
    }
    
    /**
     * Update remote player state from network
     */
    updateFromNetwork(state: RemotePlayerState): void {
        // Store previous position for interpolation
        this.previousX = this.x;
        this.previousY = this.y;
        
        // Set new target position
        this.targetX = state.x;
        this.targetY = state.y;
        
        // Reset interpolation
        this.interpolationProgress = 0;
        
        // Update other state
        this.health = state.health;
        this.currentAnim = state.currentAnim;
        
        this.lastUpdateTime = Date.now();
    }
    
    /**
     * Check if player data is stale (disconnected)
     */
    isStale(): boolean {
        return Date.now() - this.lastUpdateTime > this.STALE_THRESHOLD;
    }
    
    override update(dt: number, map: TileMap): void {
        // Smooth interpolation to target position
        if (this.interpolationProgress < 1) {
            this.interpolationProgress = Math.min(1, this.interpolationProgress + dt * this.interpolationSpeed);
            
            // Lerp between previous and target position
            const t = this.easeOutCubic(this.interpolationProgress);
            this.x = this.previousX + (this.targetX - this.previousX) * t;
            this.y = this.previousY + (this.targetY - this.previousY) * t;
        }
        
        // Update animations
        super.update(dt, map);
    }
    
    /**
     * Easing function for smoother interpolation
     */
    private easeOutCubic(t: number): number {
        return 1 - Math.pow(1 - t, 3);
    }
}
