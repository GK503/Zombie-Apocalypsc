import { Entity } from "./engine/Entity";
import type { Camera } from "./engine/Camera";
import type { Player } from "./Player";
import { Weapon, getRandomWeapon, WeaponRarity } from "./Weapon";

export const ItemType = {
    WEAPON: 'weapon',
    AMMO: 'ammo',
    HEALTH: 'health'
} as const;

export type ItemType = typeof ItemType[keyof typeof ItemType];

/**
 * Item that can be picked up by the player
 */
export class Item extends Entity {
    itemType: ItemType;
    weaponKey?: string; // For weapon items
    ammoAmount?: number; // For ammo items
    healthAmount?: number; // For health items
    lifetime: number = 0;
    maxLifetime: number = 30; // Items despawn after 30 seconds
    bobOffset: number = 0; // For visual bobbing effect
    dead: boolean = false;
    
    constructor(x: number, y: number, itemType: ItemType, data?: { weaponKey?: string; ammoAmount?: number; healthAmount?: number }) {
        super(x, y, '#ffffff');
        this.itemType = itemType;
        this.weaponKey = data?.weaponKey;
        this.ammoAmount = data?.ammoAmount;
        this.healthAmount = data?.healthAmount;
        
        // Set size based on type
        this.width = 16;
        this.height = 16;
        
        // Set color based on type
        switch (itemType) {
            case ItemType.WEAPON:
                this.color = '#ffaa00'; // Orange
                break;
            case ItemType.AMMO:
                this.color = '#ffff00'; // Yellow
                break;
            case ItemType.HEALTH:
                this.color = '#ff0000'; // Red
                break;
        }
    }
    
    update(dt: number): void {
        this.lifetime += dt;
        this.bobOffset = Math.sin(this.lifetime * 3) * 3; // Bob up and down
        
        if (this.lifetime > this.maxLifetime) {
            this.dead = true;
        }
    }
    
    render(ctx: CanvasRenderingContext2D, camera: Camera): void {
        if (this.dead) return;
        
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y + this.bobOffset;
        
        // Draw item with glow effect
        ctx.save();
        
        // Outer glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX, screenY, this.width, this.height);
        
        // Inner highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(screenX + 4, screenY + 4, this.width - 8, this.height - 8);
        
        // Draw icon/text
        ctx.fillStyle = '#000000';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        
        switch (this.itemType) {
            case ItemType.WEAPON:
                ctx.fillText('W', screenX + this.width / 2, screenY + this.height / 2 + 4);
                break;
            case ItemType.AMMO:
                ctx.fillText('A', screenX + this.width / 2, screenY + this.height / 2 + 4);
                break;
            case ItemType.HEALTH:
                ctx.fillText('H', screenX + this.width / 2, screenY + this.height / 2 + 4);
                break;
        }
        
        ctx.restore();
    }
    
    /**
     * Check if player can pick up this item
     */
    canPickup(player: Player): boolean {
        if (this.dead) return false;
        
        // Check distance
        const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
        const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < 24; // Pickup range
    }
    
    /**
     * Apply item effect to player
     */
    pickup(player: Player): boolean {
        switch (this.itemType) {
            case ItemType.WEAPON:
                if (this.weaponKey) {
                    const weapon = new Weapon(this.weaponKey);
                    if (player.addWeapon(weapon)) {
                        console.log(`Picked up ${weapon.stats.name}!`);
                        this.dead = true;
                        return true;
                    } else {
                        console.log(`Inventory full! Can't pick up ${weapon.stats.name}`);
                        return false;
                    }
                }
                break;
                
            case ItemType.AMMO:
                if (this.ammoAmount && player.weapons.length > 0) {
                    // Add ammo to current weapon
                    const weapon = player.getCurrentWeapon();
                    if (!weapon.stats.infiniteAmmo) {
                        weapon.addAmmo(this.ammoAmount);
                        console.log(`Picked up ${this.ammoAmount} ammo!`);
                        this.dead = true;
                        return true;
                    }
                }
                break;
                
            case ItemType.HEALTH:
                if (this.healthAmount && player.health < player.maxHealth) {
                    const oldHealth = player.health;
                    player.health = Math.min(player.maxHealth, player.health + this.healthAmount);
                    const actualHealed = player.health - oldHealth;
                    console.log(`Healed ${actualHealed} HP!`);
                    this.dead = true;
                    return true;
                }
                break;
        }
        
        return false;
    }
}

/**
 * Create a random weapon item based on drop chances
 */
export function createWeaponDrop(x: number, y: number): Item {
    // Weight drop chances by rarity (common drops more often)
    const rarityWeights = {
        [WeaponRarity.COMMON]: 50,
        [WeaponRarity.UNCOMMON]: 30,
        [WeaponRarity.RARE]: 15,
        [WeaponRarity.EPIC]: 4,
        [WeaponRarity.LEGENDARY]: 1
    };
    
    const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalWeight;
    
    let selectedRarity: WeaponRarity = WeaponRarity.COMMON;
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
        roll -= weight;
        if (roll <= 0) {
            selectedRarity = rarity as WeaponRarity;
            break;
        }
    }
    
    const weaponKey = getRandomWeapon(selectedRarity);
    return new Item(x, y, ItemType.WEAPON, { weaponKey });
}

/**
 * Create an ammo pickup
 */
export function createAmmoDrop(x: number, y: number, amount?: number): Item {
    const ammoAmount = amount || (20 + Math.floor(Math.random() * 30)); // 20-50 ammo
    return new Item(x, y, ItemType.AMMO, { ammoAmount });
}

/**
 * Create a health pickup
 */
export function createHealthDrop(x: number, y: number, amount?: number): Item {
    const healthAmount = amount || (20 + Math.floor(Math.random() * 30)); // 20-50 HP
    return new Item(x, y, ItemType.HEALTH, { healthAmount });
}
