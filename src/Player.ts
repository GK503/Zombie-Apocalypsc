import { TILE_SIZE } from "./engine/constants";
import { Entity } from "./engine/Entity";
import type { InputHandler } from "./engine/InputHandler";
import { SpriteLoader } from "./engine/Sprite";
import type { TileMap } from "./engine/TileMap";
import { Projectile } from "./Projectile";
import type { Camera } from "./engine/Camera";
import type { NetworkManager } from "./NetworkManager";
import { Weapon } from "./Weapon";

const idleFrames = SpriteLoader.from_gif("/assets/Character/Main/Idle/Gif/Character_down_idle_no-hands.gif");
const walkDownFrames = SpriteLoader.from_gif("/assets/Character/Main/Run/Gif/Character_down_run_no-hands.gif");
const walkLeftFrames = SpriteLoader.from_gif("/assets/Character/Main/Run/Gif/Character_side-left_run_no-hands.gif");
const walkRightFrames = SpriteLoader.from_gif("/assets/Character/Main/Run/Gif/Character_side_run_no-hands.gif");
const walkUpFrames = SpriteLoader. from_gif("/assets/Character/Main/Run/Gif/Character_up_run_no-hands.gif");

export class Player extends Entity {
    input: InputHandler;
    projectiles: Projectile[] = [];
    
    // Health
    health: number;
    maxHealth: number;
    
    // Weapon system
    weapons: Weapon[] = [];
    currentWeaponIndex: number = 0;
    lastShotTime: number = 0;
    isReloading: boolean = false;
    reloadStartTime: number = 0;
    
    // Facing direction (for spacebar shooting)
    facingX: number = 0;
    facingY: number = 1;
    
    // Damage immunity
    invincibilityTime: number = 0;
    invincibilityDuration: number = 1.0; // 1 second of invincibility after hit
    
    // Network manager for multiplayer
    network?: NetworkManager;

    constructor(x: number, y: number, input: InputHandler) {
        super(x, y, '#00ff00');
        this.input = input;
        
        // Initialize health
        this.maxHealth = 100;
        this.health = this.maxHealth;
        
        // Initialize starting weapons
        this.weapons = [
            new Weapon('wooden_bat'),    // Slot 0 (key 1)
            new Weapon('rusty_pistol'),  // Slot 1 (key 2)
            new Weapon('scrap_rifle')    // Slot 2 (key 3)
        ];
        this.currentWeaponIndex = 0;
        this.speed = 100;

        // Use animated sprites from assets
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
    }

    override update(dt: number, map: TileMap, camera?: Camera): void {
        let dx = 0;
        let dy = 0;

        if (this.input.isDown('KeyW')) dy -= this.speed * dt;
        if (this.input.isDown('KeyS')) dy += this.speed * dt;
        if (this.input.isDown('KeyA')) dx -= this.speed * dt;
        if (this.input.isDown('KeyD')) dx += this.speed * dt;

        const nextX = this.x + dx;
        const nextY = this.y + dy;

        // Collision Check
        const col = Math.floor((nextX + this.width / 2) / TILE_SIZE);
        const row = Math.floor((nextY + this.height / 2) / TILE_SIZE);

        if (!map.isSolid(col, row)) {
            this.x = nextX;
            this.y = nextY;
        }

        // Update facing direction based on movement
        if (dx !== 0 || dy !== 0) {
            if (Math.abs(dx) > Math.abs(dy)) {
                this.facingX = dx > 0 ? 1 : -1;
                this.facingY = 0;
            } else {
                this.facingX = 0;
                this.facingY = dy > 0 ? 1 : -1;
            }
        }

        // Handle weapon switching (keys 1-6)
        this.handleWeaponSwitching();
        
        // Handle reloading
        this.handleReloading(dt);
        
        // Update invincibility timer
        if (this.invincibilityTime > 0) {
            this.invincibilityTime -= dt;
        }

        // Handle shooting
        if (camera && !this.isReloading) {
            this.handleShooting(dt, camera);
        }

        // Update projectiles
        this.projectiles = this.projectiles.filter(p => !p.dead);

        this.updateAnimationState(dx, dy);
        super.update(dt, map);
    }
    
    /**
     * Handle weapon switching with number keys
     */
    private handleWeaponSwitching(): void {
        const keys = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'];
        
        for (let i = 0; i < keys.length; i++) {
            if (this.input.isDown(keys[i]) && i < this.weapons.length) {
                if (this.currentWeaponIndex !== i) {
                    this.currentWeaponIndex = i;
                    this.isReloading = false; // Cancel reload when switching
                    console.log(`Switched to ${this.getCurrentWeapon().stats.name}`);
                }
                break;
            }
        }
        
        // R key to reload
        if (this.input.isDown('KeyR') && !this.isReloading) {
            this.startReload();
        }
    }
    
    /**
     * Handle reload timing
     */
    private handleReloading(_dt: number): void {
        if (!this.isReloading) return;
        
        const weapon = this.getCurrentWeapon();
        const elapsed = (Date.now() / 1000) - this.reloadStartTime;
        
        if (elapsed >= weapon.stats.reloadTime) {
            weapon.reload();
            this.isReloading = false;
            console.log(`${weapon.stats.name} reloaded: ${weapon.currentAmmo}/${weapon.stats.magazineSize}`);
        }
    }
    
    /**
     * Start reloading current weapon
     */
    private startReload(): void {
        const weapon = this.getCurrentWeapon();
        if (weapon.currentAmmo < weapon.stats.magazineSize && weapon.reserveAmmo > 0) {
            this.isReloading = true;
            this.reloadStartTime = Date.now() / 1000;
            console.log(`Reloading ${weapon.stats.name}...`);
        }
    }
    
    /**
     * Get current weapon
     */
    getCurrentWeapon(): Weapon {
        if (this.weapons.length === 0) {
            throw new Error('Player has no weapons');
        }
        return this.weapons[this.currentWeaponIndex];
    }

    /**
     * Handle shooting input (mouse or spacebar)
     */
    private handleShooting(_dt: number, camera: Camera): void {
        const weapon = this.getCurrentWeapon();
        const timeSinceLastShot = Date.now() / 1000 - this.lastShotTime;
        
        if (!weapon.canShoot(timeSinceLastShot)) {
            // Auto-reload if out of ammo
            if (weapon.currentAmmo === 0 && weapon.reserveAmmo > 0 && !this.isReloading) {
                this.startReload();
            }
            return;
        }
        
        // Check for mouse shooting
        if (this.input.mouseJustPressed) {
            const worldMouse = this.input.getWorldMouse(camera.x, camera.y);
            const playerCenterX = this.x + this.width / 2;
            const playerCenterY = this.y + this.height / 2;
            
            const dirX = worldMouse.x - playerCenterX;
            const dirY = worldMouse.y - playerCenterY;
            
            this.shoot(dirX, dirY);
            this.input.clearMouseJustPressed();
        }
        // Check for spacebar shooting
        else if (this.input.isDown('Space')) {
            this.shoot(this.facingX, this.facingY);
        }
    }

    /**
     * Shoot a projectile in the given direction
     */
    private shoot(dirX: number, dirY: number): void {
        const weapon = this.getCurrentWeapon();
        
        if (!weapon.shoot()) return;
        
        const playerCenterX = this.x + this.width / 2;
        const playerCenterY = this.y + this.height / 2;
        
        // Handle multiple projectiles (shotgun spread)
        for (let i = 0; i < weapon.stats.projectileCount; i++) {
            let finalDirX = dirX;
            let finalDirY = dirY;
            
            // Apply spread for multiple projectiles
            if (weapon.stats.projectileCount > 1) {
                const angle = Math.atan2(dirY, dirX);
                const spreadRadians = (weapon.stats.spread * Math.PI) / 180;
                
                // Distribute projectiles evenly across spread angle
                const spreadOffset = (i / (weapon.stats.projectileCount - 1) - 0.5) * spreadRadians;
                const finalAngle = angle + spreadOffset;
                
                finalDirX = Math.cos(finalAngle);
                finalDirY = Math.sin(finalAngle);
            }
            
            const projectile = new Projectile(
                playerCenterX,
                playerCenterY,
                finalDirX,
                finalDirY,
                weapon.stats.projectileSpeed,
                weapon.getDamage(),
                weapon.stats.knockback
            );
            
            // Set projectile lifetime based on weapon range
            projectile.maxLifetime = weapon.stats.range;
            
            this.projectiles.push(projectile);
            
            // Notify network of projectile
            if (this.network) {
                this.network.sendProjectile(playerCenterX, playerCenterY, finalDirX, finalDirY);
            }
        }
        
        this.lastShotTime = Date.now() / 1000;
    }

    /**
     * Reload weapon (manually called)
     */
    reload(): void {
        if (!this.isReloading) {
            this.startReload();
        }
    }
    
    /**
     * Add a weapon to inventory
     */
    addWeapon(weapon: Weapon): boolean {
        if (this.weapons.length >= 6) {
            return false; // Inventory full
        }
        this.weapons.push(weapon);
        return true;
    }
    
    /**
     * Drop current weapon
     */
    dropWeapon(): Weapon | null {
        if (this.weapons.length <= 1) {
            return null; // Can't drop last weapon
        }
        
        const weapon = this.weapons.splice(this.currentWeaponIndex, 1)[0];
        
        // Adjust current index if needed
        if (this.currentWeaponIndex >= this.weapons.length) {
            this.currentWeaponIndex = this.weapons.length - 1;
        }
        
        return weapon;
    }

    /**
     * Take damage
     */
    takeDamage(amount: number): void {
        // Check invincibility
        if (this.invincibilityTime > 0) return;
        
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        
        // Grant invincibility after hit
        this.invincibilityTime = this.invincibilityDuration;
        
        console.log(`Player took ${amount} damage! Health: ${this.health}/${this.maxHealth}`);
        
        if (this.health <= 0) {
            console.log('Player died!');
        }
    }
    
    /**
     * Override render to show invincibility flashing
     */
    override render(ctx: CanvasRenderingContext2D, camera: Camera): void {
        if (this.invincibilityTime > 0) {
            // Flash red when invincible
            const flash = Math.floor(this.invincibilityTime * 10) % 2 === 0;
            if (flash) {
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#ff0000';
                const screenX = this.x - camera.x;
                const screenY = this.y - camera.y;
                ctx.fillRect(screenX, screenY, this.width, this.height);
                ctx.restore();
            }
        }
        
        super.render(ctx, camera);
    }
}