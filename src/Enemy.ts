import { TILE_SIZE } from "./engine/constants";
import { Entity } from "./engine/Entity";
import { SpriteLoader } from "./engine/Sprite";
import type { TileMap } from "./engine/TileMap";
import type { FlowField } from "./main";
import { getBestFlowFieldNeighbor } from "./main";
import type { Player } from "./Player";
import type { Item } from "./Item";
import { createWeaponDrop, createAmmoDrop, createHealthDrop } from "./Item";

export const ZombieType = {
    NORMAL: 'normal',
    FAST: 'fast'
} as const;

export type ZombieType = typeof ZombieType[keyof typeof ZombieType];

export class Enemy extends Entity {
    direction: number;
    timer: number;
    moveTimer: number;
    useFlowField: boolean = true; // Use flow field by default
    health: number;
    maxHealth: number;
    isDying: boolean = false;
    deathTimer: number = 0;
    zombieType: ZombieType;
    damage: number;
    attackCooldown: number = 0;
    attackRate: number = 1.0; // seconds between attacks
    droppedItems: Item[] = [];

    constructor(x: number, y: number, zombieType?: ZombieType) {
        super(x, y, '#ff0000');
        this.direction = 1;
        this.timer = 0;
        this.moveTimer = 0;
        
        // Determine zombie type (random if not specified)
        this.zombieType = zombieType || (Math.random() < 0.3 ? ZombieType.FAST : ZombieType.NORMAL);
        
        // Set stats based on type
        if (this.zombieType === ZombieType.FAST) {
            this.maxHealth = 30; // Less health
            this.speed = 100; // Much faster
            this.damage = 8;
            this.color = '#ff6666'; // Lighter red
        } else {
            this.maxHealth = 50; // Normal health
            this.speed = 50; // Normal speed
            this.damage = 10;
            this.color = '#ff0000'; // Normal red
        }
        
        this.health = this.maxHealth;

        // Load zombie animations (using Small Zombie)
        this.setAnimations({
            'idle_down': SpriteLoader.from_gif('/assets/Enemies/Zombie_Small/Gif/Zombie_Small_Down_Idle.gif'),
            'walk_down': SpriteLoader.from_gif('/assets/Enemies/Zombie_Small/Gif/Zombie_Small_Down_walk.gif'),
            'walk_left': SpriteLoader.from_gif('/assets/Enemies/Zombie_Small/Gif/Zombie_Small_Side-left_Walk.gif'),
            'walk_right': SpriteLoader.from_gif('/assets/Enemies/Zombie_Small/Gif/Zombie_Small_Side_Walk.gif'),
            'walk_up': SpriteLoader.from_gif('/assets/Enemies/Zombie_Small/Gif/Zombie_Small_Up_Walk.gif'),
            'idle_left': SpriteLoader.from_gif('/assets/Enemies/Zombie_Small/Gif/Zombie_Small_Side-left_Idle.gif'),
            'idle_right': SpriteLoader.from_gif('/assets/Enemies/Zombie_Small/Gif/Zombie_Small_Side_Idle.gif'),
            'idle_up': SpriteLoader.from_gif('/assets/Enemies/Zombie_Small/Gif/Zombie_Small_Up_Idle.gif'),
            'death': SpriteLoader.from_gif('/assets/Enemies/Zombie_Small/Gif/Zombie_Small_Side_First-Death.gif'),
        });
        
        this.animSpeed = 0.1; // Faster animation for zombies
    }

    /**
     * Apply damage to the zombie
     */
    takeDamage(amount: number): void {
        if (this.isDying || this.health <= 0) return;
        
        this.health -= amount;
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    /**
     * Apply knockback force
     */
    applyKnockback(dx: number, dy: number, map: TileMap): void {
        if (this.isDying) return;

        const nextX = this.x + dx;
        const nextY = this.y + dy;

        // Check collision before applying knockback
        const col = Math.floor((nextX + this.width / 2) / TILE_SIZE);
        const row = Math.floor((nextY + this.height / 2) / TILE_SIZE);

        if (!map.isSolid(col, row)) {
            this.x = nextX;
            this.y = nextY;
        }
    }

    /**
     * Kill the zombie and drop items
     */
    private die(): void {
        this.isDying = true;
        this.currentAnim = 'death';
        this.frameIndex = 0;
        this.speed = 0;
        
        // Drop items
        this.dropItems();
    }
    
    /**
     * Drop items when zombie dies
     */
    private dropItems(): void {
        const dropX = this.x + this.width / 2 - 8;
        const dropY = this.y + this.height / 2 - 8;
        
        // 100% chance to drop ammo
        this.droppedItems.push(createAmmoDrop(dropX, dropY));
        
        // 30% chance to drop health
        if (Math.random() < 0.3) {
            this.droppedItems.push(createHealthDrop(dropX + 20, dropY));
        }
        
        // Weapon drop chances based on zombie type
        const weaponDropChance = this.zombieType === ZombieType.FAST ? 0.15 : 0.10;
        if (Math.random() < weaponDropChance) {
            this.droppedItems.push(createWeaponDrop(dropX - 20, dropY));
        }
    }
    
    /**
     * Get dropped items and clear the list
     */
    getDroppedItems(): Item[] {
        const items = this.droppedItems;
        this.droppedItems = [];
        return items;
    }
    
    /**
     * Deal damage to player if in range
     */
    attackPlayer(player: Player, dt: number): void {
        if (this.isDying) return;
        
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
            return;
        }
        
        // Check collision with player
        if (this.checkCollisionWithPlayer(player)) {
            player.takeDamage(this.damage);
            this.attackCooldown = this.attackRate;
            console.log(`Zombie attacked player for ${this.damage} damage!`);
        }
    }
    
    /**
     * Check if zombie is colliding with player
     */
    private checkCollisionWithPlayer(player: Player): boolean {
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }

    override update(dt: number, map: TileMap, flowField?: FlowField, player?: Player): void {
        // Handle death animation
        if (this.isDying) {
            this.deathTimer += dt;
            // Keep showing death animation for 1 second before marking as truly dead
            if (this.deathTimer > 1.0) {
                this.health = -1; // Mark as truly dead for removal
            }
            super.update(dt, map);
            return;
        }
        
        // Attack player if nearby
        if (player) {
            this.attackPlayer(player, dt);
        }

        // Use Flow Field pathfinding (greedy downhill approach)
        if (this.useFlowField && flowField) {
            const moved = this.moveUsingFlowField(dt, map, flowField, getBestFlowFieldNeighbor);
            
            // If can't move, try simple movement as fallback
            if (!moved) {
                this.fallbackMovement(dt, map);
            }
        } else {
            // Fall back to old behavior (simple back-and-forth)
            this.fallbackMovement(dt, map);
        }

        super.update(dt, map);
    }

    /**
     * Simple back-and-forth movement when flow field not available
     */
    private fallbackMovement(dt: number, map: TileMap): void {
        this.moveTimer += dt;
        if (this.moveTimer > 2.0) {
            this.direction *= -1;
            this.moveTimer = 0;
        }

        const dx = (this.speed * this.direction) * dt;

        const nextX = this.x + dx;
        const col = Math.floor((nextX + this.width / 2) / TILE_SIZE);
        const row = Math.floor((this.y + this.height / 2) / TILE_SIZE);

        if (map.isSolid(col, row)) {
            this.direction *= -1;
        } else {
            this.x = nextX;
        }

        this.updateAnimationState(dx, 0);
    }
}