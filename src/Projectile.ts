import { Camera } from "./engine/Camera";
import { TILE_SIZE } from "./engine/constants";
import type { TileMap } from "./engine/TileMap";
import type { Enemy } from "./Enemy";

export class Projectile {
    x: number;
    y: number;
    vx: number;
    vy: number;
    damage: number;
    knockback: number;
    lifetime: number;
    maxLifetime: number;
    width: number;
    height: number;
    color: string;
    dead: boolean = false;
    

    constructor(x: number, y: number, dirX: number, dirY: number, speed: number = 400, damage: number = 10, knockback: number = 100) {
        this.x = x;
        this.y = y;
        
        // Normalize direction vector
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        this.vx = (dirX / length) * speed;
        this.vy = (dirY / length) * speed;
        
        this.damage = damage;
        this.knockback = knockback;
        this.lifetime = 0;
        this.maxLifetime = 2; // seconds
        this.width = 4;
        this.height = 4;
        this.color = '#ffff00';
    }

    update(dt: number, map: TileMap, enemies: Enemy[]): void {
        if (this.dead) return;

        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Update lifetime
        this.lifetime += dt;
        if (this.lifetime > this.maxLifetime) {
            this.dead = true;
            return;
        }

        // Check wall collision
        const col = Math.floor(this.x / TILE_SIZE);
        const row = Math.floor(this.y / TILE_SIZE);
        if (map.isSolid(col, row)) {
            this.dead = true;
            return;
        }

        // Check enemy collision (efficient AABB check)
        for (const enemy of enemies) {
            if (enemy.health <= 0) continue;
            
            if (this.checkCollision(enemy)) {
                // Apply damage
                enemy.takeDamage(this.damage);
                
                // Apply knockback
                const knockbackX = (this.vx / Math.abs(this.vx || 1)) * this.knockback * dt;
                const knockbackY = (this.vy / Math.abs(this.vy || 1)) * this.knockback * dt;
                enemy.applyKnockback(knockbackX, knockbackY, map);
                
                this.dead = true;
                return;
            }
        }
    }

    private checkCollision(enemy: Enemy): boolean {
        return !(
            this.x + this.width < enemy.x ||
            this.x > enemy.x + enemy.width ||
            this.y + this.height < enemy.y ||
            this.y > enemy.y + enemy.height
        );
    }

    render(ctx: CanvasRenderingContext2D, camera: Camera): void {
        if (this.dead) return;

        // Culling
        if (
            this.x + this.width < camera.x ||
            this.x > camera.x + camera.width ||
            this.y + this.height < camera.y ||
            this.y > camera.y + camera.height
        ) return;

        const renderX = Math.floor(this.x - camera.x);
        const renderY = Math.floor(this.y - camera.y);

        ctx.fillStyle = this.color;
        ctx.fillRect(renderX, renderY, this.width, this.height);
    }
}
