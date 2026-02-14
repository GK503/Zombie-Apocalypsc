/**
 * Weapon rarity system with color coding
 */
export const WeaponRarity = {
    COMMON: 'common',
    UNCOMMON: 'uncommon',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary'
} as const;

export type WeaponRarity = typeof WeaponRarity[keyof typeof WeaponRarity];

/**
 * Get radiant color for weapon rarity
 */
export function getRarityColor(rarity: WeaponRarity): string {
    switch (rarity) {
        case WeaponRarity.COMMON:
            return '#9d9d9d'; // Gray
        case WeaponRarity.UNCOMMON:
            return '#1eff00'; // Green
        case WeaponRarity.RARE:
            return '#0070dd'; // Blue
        case WeaponRarity.EPIC:
            return '#a335ee'; // Purple
        case WeaponRarity.LEGENDARY:
            return '#ff8000'; // Orange
        default:
            return '#ffffff';
    }
}

/**
 * Get radiant glow color (lighter version)
 */
export function getRarityGlow(rarity: WeaponRarity): string {
    switch (rarity) {
        case WeaponRarity.COMMON:
            return '#d0d0d0';
        case WeaponRarity.UNCOMMON:
            return '#5fff5f';
        case WeaponRarity.RARE:
            return '#4da6ff';
        case WeaponRarity.EPIC:
            return '#d896ff';
        case WeaponRarity.LEGENDARY:
            return '#ffb84d';
        default:
            return '#ffffff';
    }
}

export const WeaponType = {
    BAT: 'bat',
    PISTOL: 'pistol',
    GUN: 'gun',
    SHOTGUN: 'shotgun'
} as const;

export type WeaponType = typeof WeaponType[keyof typeof WeaponType];

/**
 * Weapon statistics and properties
 */
export interface WeaponStats {
    type: WeaponType;
    name: string;
    rarity: WeaponRarity;
    
    // Damage
    damage: number;
    damageRange: number; // Random variance (+/-)
    
    // Ammo
    magazineSize: number;
    reserveAmmo: number;
    infiniteAmmo: boolean; // For melee weapons
    
    // Fire rate
    fireRate: number; // shots per second
    reloadTime: number; // seconds
    
    // Projectile
    projectileSpeed: number;
    projectileCount: number; // For shotgun spread
    spread: number; // Degrees of spread
    knockback: number;
    
    // Range
    range: number; // Max lifetime in seconds
    
    // UI
    iconPath: string;
    bulletIconPath?: string;
}

/**
 * Predefined weapon templates
 */
export const WEAPON_TEMPLATES: Record<string, WeaponStats> = {
    // MELEE
    'wooden_bat': {
        type: WeaponType.BAT,
        name: 'Wooden Bat',
        rarity: WeaponRarity.COMMON,
        damage: 25,
        damageRange: 5,
        magazineSize: 1,
        reserveAmmo: 0,
        infiniteAmmo: true,
        fireRate: 1.5,
        reloadTime: 0,
        projectileSpeed: 300,
        projectileCount: 1,
        spread: 0,
        knockback: 80,
        range: 0.3,
        iconPath: '/assets/UI/Inventory/Objects/Icon_Bat.png'
    },
    'reinforced_bat': {
        type: WeaponType.BAT,
        name: 'Reinforced Bat',
        rarity: WeaponRarity.UNCOMMON,
        damage: 40,
        damageRange: 8,
        magazineSize: 1,
        reserveAmmo: 0,
        infiniteAmmo: true,
        fireRate: 2,
        reloadTime: 0,
        projectileSpeed: 350,
        projectileCount: 1,
        spread: 0,
        knockback: 120,
        range: 0.35,
        iconPath: '/assets/UI/Inventory/Objects/Icon_Bat.png'
    },
    
    // PISTOLS
    'rusty_pistol': {
        type: WeaponType.PISTOL,
        name: 'Rusty Pistol',
        rarity: WeaponRarity.COMMON,
        damage: 20,
        damageRange: 3,
        magazineSize: 8,
        reserveAmmo: 32,
        infiniteAmmo: false,
        fireRate: 3,
        reloadTime: 1.5,
        projectileSpeed: 450,
        projectileCount: 1,
        spread: 5,
        knockback: 40,
        range: 1.5,
        iconPath: '/assets/UI/Inventory/Objects/Icon_Pistol.png',
        bulletIconPath: '/assets/UI/Bullet Indicators/Small/Pistol-Bullet_Small.png'
    },
    'pistol': {
        type: WeaponType.PISTOL,
        name: 'Pistol',
        rarity: WeaponRarity.UNCOMMON,
        damage: 30,
        damageRange: 5,
        magazineSize: 12,
        reserveAmmo: 48,
        infiniteAmmo: false,
        fireRate: 4,
        reloadTime: 1.2,
        projectileSpeed: 500,
        projectileCount: 1,
        spread: 3,
        knockback: 50,
        range: 2.0,
        iconPath: '/assets/UI/Inventory/Objects/Icon_Pistol.png',
        bulletIconPath: '/assets/UI/Bullet Indicators/Small/Pistol-Bullet_Small.png'
    },
    'tactical_pistol': {
        type: WeaponType.PISTOL,
        name: 'Tactical Pistol',
        rarity: WeaponRarity.RARE,
        damage: 45,
        damageRange: 5,
        magazineSize: 15,
        reserveAmmo: 60,
        infiniteAmmo: false,
        fireRate: 5,
        reloadTime: 1.0,
        projectileSpeed: 550,
        projectileCount: 1,
        spread: 2,
        knockback: 60,
        range: 2.5,
        iconPath: '/assets/UI/Inventory/Objects/Icon_Pistol.png',
        bulletIconPath: '/assets/UI/Bullet Indicators/Small/Pistol-Bullet_Small.png'
    },
    
    // RIFLES/GUNS
    'scrap_rifle': {
        type: WeaponType.GUN,
        name: 'Scrap Rifle',
        rarity: WeaponRarity.COMMON,
        damage: 35,
        damageRange: 5,
        magazineSize: 20,
        reserveAmmo: 60,
        infiniteAmmo: false,
        fireRate: 4,
        reloadTime: 2.0,
        projectileSpeed: 500,
        projectileCount: 1,
        spread: 4,
        knockback: 70,
        range: 2.0,
        iconPath: '/assets/UI/Inventory/Objects/Icon_Gun.png',
        bulletIconPath: '/assets/UI/Bullet Indicators/Small/Gun-Bullet_Small.png'
    },
    'assault_rifle': {
        type: WeaponType.GUN,
        name: 'Assault Rifle',
        rarity: WeaponRarity.RARE,
        damage: 50,
        damageRange: 8,
        magazineSize: 30,
        reserveAmmo: 120,
        infiniteAmmo: false,
        fireRate: 6,
        reloadTime: 1.8,
        projectileSpeed: 600,
        projectileCount: 1,
        spread: 3,
        knockback: 100,
        range: 2.5,
        iconPath: '/assets/UI/Inventory/Objects/Icon_Gun.png',
        bulletIconPath: '/assets/UI/Bullet Indicators/Small/Gun-Bullet_Small.png'
    },
    'military_rifle': {
        type: WeaponType.GUN,
        name: 'Military Rifle',
        rarity: WeaponRarity.EPIC,
        damage: 75,
        damageRange: 10,
        magazineSize: 30,
        reserveAmmo: 150,
        infiniteAmmo: false,
        fireRate: 7,
        reloadTime: 1.5,
        projectileSpeed: 650,
        projectileCount: 1,
        spread: 2,
        knockback: 120,
        range: 3.0,
        iconPath: '/assets/UI/Inventory/Objects/Icon_Gun.png',
        bulletIconPath: '/assets/UI/Bullet Indicators/Small/Gun-Bullet_Small.png'
    },
    'legendary_rifle': {
        type: WeaponType.GUN,
        name: 'Legendary Rifle',
        rarity: WeaponRarity.LEGENDARY,
        damage: 100,
        damageRange: 15,
        magazineSize: 40,
        reserveAmmo: 200,
        infiniteAmmo: false,
        fireRate: 8,
        reloadTime: 1.2,
        projectileSpeed: 700,
        projectileCount: 1,
        spread: 1,
        knockback: 150,
        range: 3.5,
        iconPath: '/assets/UI/Inventory/Objects/Icon_Gun.png',
        bulletIconPath: '/assets/UI/Bullet Indicators/Small/Gun-Bullet_Small.png'
    },
    
    // SHOTGUNS
    'pump_shotgun': {
        type: WeaponType.SHOTGUN,
        name: 'Pump Shotgun',
        rarity: WeaponRarity.UNCOMMON,
        damage: 25,
        damageRange: 5,
        magazineSize: 6,
        reserveAmmo: 24,
        infiniteAmmo: false,
        fireRate: 1.2,
        reloadTime: 2.5,
        projectileSpeed: 400,
        projectileCount: 6,
        spread: 15,
        knockback: 150,
        range: 1.5,
        iconPath: '/assets/UI/Inventory/Objects/Icon_Shotgun.png',
        bulletIconPath: '/assets/UI/Bullet Indicators/Small/Shotgun-Bullet_Small.png'
    },
    'combat_shotgun': {
        type: WeaponType.SHOTGUN,
        name: 'Combat Shotgun',
        rarity: WeaponRarity.RARE,
        damage: 35,
        damageRange: 7,
        magazineSize: 8,
        reserveAmmo: 32,
        infiniteAmmo: false,
        fireRate: 2,
        reloadTime: 2.0,
        projectileSpeed: 450,
        projectileCount: 7,
        spread: 12,
        knockback: 180,
        range: 1.8,
        iconPath: '/assets/UI/Inventory/Objects/Icon_Shotgun.png',
        bulletIconPath: '/assets/UI/Bullet Indicators/Small/Shotgun-Bullet_Small.png'
    },
    'tactical_shotgun': {
        type: WeaponType.SHOTGUN,
        name: 'Tactical Shotgun',
        rarity: WeaponRarity.EPIC,
        damage: 45,
        damageRange: 10,
        magazineSize: 10,
        reserveAmmo: 40,
        infiniteAmmo: false,
        fireRate: 2.5,
        reloadTime: 1.8,
        projectileSpeed: 500,
        projectileCount: 8,
        spread: 10,
        knockback: 200,
        range: 2.0,
        iconPath: '/assets/UI/Inventory/Objects/Icon_Shotgun.png',
        bulletIconPath: '/assets/UI/Bullet Indicators/Small/Shotgun-Bullet_Small.png'
    },
    'super_shotgun': {
        type: WeaponType.SHOTGUN,
        name: 'Super Shotgun',
        rarity: WeaponRarity.LEGENDARY,
        damage: 60,
        damageRange: 12,
        magazineSize: 2,
        reserveAmmo: 20,
        infiniteAmmo: false,
        fireRate: 1.5,
        reloadTime: 1.5,
        projectileSpeed: 450,
        projectileCount: 12,
        spread: 18,
        knockback: 250,
        range: 1.5,
        iconPath: '/assets/UI/Inventory/Objects/Icon_Shotgun.png',
        bulletIconPath: '/assets/UI/Bullet Indicators/Small/Shotgun-Bullet_Small.png'
    }
};

/**
 * Weapon class - wraps weapon stats for a specific instance
 */
export class Weapon {
    stats: WeaponStats;
    currentAmmo: number;
    reserveAmmo: number;
    
    constructor(weaponKey: string) {
        const template = WEAPON_TEMPLATES[weaponKey];
        if (!template) {
            throw new Error(`Unknown weapon: ${weaponKey}`);
        }
        
        // Deep copy stats
        this.stats = { ...template };
        this.currentAmmo = this.stats.magazineSize;
        this.reserveAmmo = this.stats.reserveAmmo;
    }
    
    /**
     * Get actual damage with random variance
     */
    getDamage(): number {
        const variance = (Math.random() * 2 - 1) * this.stats.damageRange;
        return Math.round(this.stats.damage + variance);
    }
    
    /**
     * Can we shoot?
     */
    canShoot(timeSinceLastShot: number): boolean {
        const minInterval = 1 / this.stats.fireRate;
        return timeSinceLastShot >= minInterval && 
               (this.currentAmmo > 0 || this.stats.infiniteAmmo);
    }
    
    /**
     * Consume ammo
     */
    shoot(): boolean {
        if (this.stats.infiniteAmmo) {
            return true;
        }
        
        if (this.currentAmmo > 0) {
            this.currentAmmo--;
            return true;
        }
        
        return false;
    }
    
    /**
     * Reload weapon
     */
    reload(): boolean {
        if (this.currentAmmo >= this.stats.magazineSize || this.reserveAmmo <= 0) {
            return false;
        }
        
        const ammoNeeded = this.stats.magazineSize - this.currentAmmo;
        const ammoToReload = Math.min(ammoNeeded, this.reserveAmmo);
        
        this.currentAmmo += ammoToReload;
        this.reserveAmmo -= ammoToReload;
        
        return true;
    }
    
    /**
     * Add ammo to reserves
     */
    addAmmo(amount: number): void {
        this.reserveAmmo += amount;
    }
}

/**
 * Get random weapon for loot drops
 */
export function getRandomWeapon(minRarity: WeaponRarity = WeaponRarity.COMMON): string {
    const keys = Object.keys(WEAPON_TEMPLATES);
    const rarityOrder = [
        WeaponRarity.COMMON,
        WeaponRarity.UNCOMMON,
        WeaponRarity.RARE,
        WeaponRarity.EPIC,
        WeaponRarity.LEGENDARY
    ];
    
    const minRarityIndex = rarityOrder.indexOf(minRarity);
    
    // Filter weapons by rarity
    const eligibleKeys = keys.filter(key => {
        const rarity = WEAPON_TEMPLATES[key].rarity;
        return rarityOrder.indexOf(rarity) >= minRarityIndex;
    });
    
    if (eligibleKeys.length === 0) return keys[0];
    
    return eligibleKeys[Math.floor(Math.random() * eligibleKeys.length)];
}
