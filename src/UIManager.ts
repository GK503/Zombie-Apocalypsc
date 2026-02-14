import type { Player } from "./Player";
import { getRarityColor, getRarityGlow } from "./Weapon";
import type { RoundsManager } from "./RoundsManager";

interface InventoryItem {
    name: string;
    icon: HTMLImageElement | null;
    count: number;
}

export class UIManager {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    scale: number = 2; // UI scale factor
    
    // Health UI
    heartFull: HTMLImageElement;
    heartHalf: HTMLImageElement;
    heartEmpty: HTMLImageElement;
    
    // Inventory UI
    inventoryBar: HTMLImageElement;
    inventoryCell: HTMLImageElement;
    inventoryChosen: HTMLImageElement;
    
    // Bullet indicators
    gunBullet: HTMLImageElement;
    gunBulletEmpty: HTMLImageElement;
    
    // Icons
    gunIcon: HTMLImageElement;
    pistolIcon: HTMLImageElement;
    shotgunIcon: HTMLImageElement;
    
    selectedSlot: number = 0;
    inventory: InventoryItem[] = [];

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        
        // Load UI assets
        this.heartFull = this.loadImage('/assets/UI/HP/Small/Heart_Small_Full.png');
        this.heartHalf = this.loadImage('/assets/UI/HP/Small/Heart_Small_Half.png');
        this.heartEmpty = this.loadImage('/assets/UI/HP/Small/Heart_Small_Empty.png');
        
        this.inventoryBar = this.loadImage('/assets/UI/Inventory/Quick-Access-Inventory.png');
        this.inventoryCell = this.loadImage('/assets/UI/Inventory/Inventory-Cell.png');
        this.inventoryChosen = this.loadImage('/assets/UI/Inventory/Inventory-Chosen.png');
        
        this.gunBullet = this.loadImage('/assets/UI/Bullet Indicators/Small/Gun-Bullet_Small.png');
        this.gunBulletEmpty = this.loadImage('/assets/UI/Bullet Indicators/Small/Gun-Bullet_Small_Empty.png');
        
        this.gunIcon = this.loadImage('/assets/UI/Inventory/Objects/Icon_Gun.png');
        this.pistolIcon = this.loadImage('/assets/UI/Inventory/Objects/Icon_Pistol.png');
        this.shotgunIcon = this.loadImage('/assets/UI/Inventory/Objects/Icon_Shotgun.png');
        
        // Initialize inventory with gun
        this.inventory = [
            { name: 'Gun', icon: this.gunIcon, count: 1 },
            { name: 'Empty', icon: null, count: 0 },
            { name: 'Empty', icon: null, count: 0 },
            { name: 'Empty', icon: null, count: 0 },
            { name: 'Empty', icon: null, count: 0 },
            { name: 'Empty', icon: null, count: 0 },
        ];
    }

    private loadImage(src: string): HTMLImageElement {
        const img = new Image();
        img.src = src;
        return img;
    }

    /**
     * Render health bar at top of screen
     */
    renderHealth(player: Player): void {
        const spacing = 14 * this.scale;
        const startX = 20 * this.scale;
        const startY = 20 * this.scale;
        
        const heartsToShow = Math.ceil(player.maxHealth / 20); // 20 health per heart
        const healthPerHeart = player.maxHealth / heartsToShow;
        
        for (let i = 0; i < heartsToShow; i++) {
            const heartHealth = Math.max(0, Math.min(healthPerHeart, player.health - i * healthPerHeart));
            const heartPercent = heartHealth / healthPerHeart;
            
            const x = startX + i * spacing;
            const y = startY;
            
            const heartWidth = this.heartFull.width * this.scale;
            const heartHeight = this.heartFull.height * this.scale;
            
            if (heartPercent > 0.75) {
                this.ctx.drawImage(this.heartFull, x, y, heartWidth, heartHeight);
            } else if (heartPercent > 0.25) {
                this.ctx.drawImage(this.heartHalf, x, y, heartWidth, heartHeight);
            } else {
                this.ctx.drawImage(this.heartEmpty, x, y, heartWidth, heartHeight);
            }
        }
        
        // Draw health text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${Math.floor(12 * this.scale)}px monospace`;
        this.ctx.fillText(`${Math.ceil(player.health)}/${player.maxHealth}`, startX + heartsToShow * spacing + 10 * this.scale, startY + 16 * this.scale);
    }

    /**
     * Render inventory bar at bottom of screen
     */
    renderInventory(player: Player): void {
        const inventoryWidth = 124 * this.scale;
        const inventoryHeight = 19 * this.scale;
        const startX = (this.canvas.width - inventoryWidth) / 2;
        const startY = this.canvas.height - inventoryHeight - 20 * this.scale;
        
        // Draw inventory bar background
        this.ctx.drawImage(this.inventoryBar, startX, startY, inventoryWidth, inventoryHeight);
        
        // Draw inventory cells and items
        const cellSize = 19 * this.scale;
        const cellSpacing = 1 * this.scale;
        
        for (let i = 0; i < 6; i++) {
            const x = startX + 2 * this.scale + i * (cellSize + cellSpacing);
            const y = startY;
            
            // Draw selected highlight
            if (i === player.currentWeaponIndex) {
                this.ctx.drawImage(this.inventoryChosen, x, y, cellSize, cellSize);
                
                // Add rarity glow for selected weapon
                if (i < player.weapons.length) {
                    const weapon = player.weapons[i];
                    const glowColor = getRarityGlow(weapon.stats.rarity);
                    this.ctx.strokeStyle = glowColor;
                    this.ctx.lineWidth = 2 * this.scale;
                    this.ctx.strokeRect(x, y, cellSize, cellSize);
                }
            }
            
            // Draw weapon icon if exists
            if (i < player.weapons.length) {
                const weapon = player.weapons[i];
                
                // Try to find loaded icon based on weapon type
                let icon: HTMLImageElement | null = null;
                if (weapon.stats.type === 'pistol') icon = this.pistolIcon;
                else if (weapon.stats.type === 'gun') icon = this.gunIcon;
                else if (weapon.stats.type === 'shotgun') icon = this.shotgunIcon;
                
                if (icon && icon.complete) {
                    const iconWidth = icon.width * this.scale;
                    const iconHeight = icon.height * this.scale;
                    const iconX = x + (cellSize - iconWidth) / 2;
                    const iconY = y + (cellSize - iconHeight) / 2;
                    this.ctx.drawImage(icon, iconX, iconY, iconWidth, iconHeight);
                    
                    // Draw rarity border around icon
                    const rarityColor = getRarityColor(weapon.stats.rarity);
                    this.ctx.strokeStyle = rarityColor;
                    this.ctx.lineWidth = 1 * this.scale;
                    this.ctx.strokeRect(iconX - 1, iconY - 1, iconWidth + 2, iconHeight + 2);
                }
            }
        }
    }

    /**
     * Render ammo count for current weapon
     */
    renderAmmo(player: Player): void {
        if (player.weapons.length === 0) return;
        
        const weapon = player.getCurrentWeapon();
        const startX = this.canvas.width - 200 * this.scale;
        const startY = this.canvas.height - 80 * this.scale;
        
        // Draw weapon name with rarity color
        const rarityColor = getRarityColor(weapon.stats.rarity);
        this.ctx.fillStyle = rarityColor;
        this.ctx.font = `bold ${Math.floor(16 * this.scale)}px monospace`;
        this.ctx.shadowColor = getRarityGlow(weapon.stats.rarity);
        this.ctx.shadowBlur = 4 * this.scale;
        this.ctx.fillText(weapon.stats.name, startX, startY);
        this.ctx.shadowBlur = 0;
        
        // Draw ammo count
        if (weapon.stats.infiniteAmmo) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${Math.floor(14 * this.scale)}px monospace`;
            this.ctx.fillText('∞', startX, startY + 20 * this.scale);
        } else {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${Math.floor(14 * this.scale)}px monospace`;
            this.ctx.fillText(`${weapon.currentAmmo} / ${weapon.reserveAmmo}`, startX, startY + 20 * this.scale);
            
            // Draw reload indicator
            if (player.isReloading) {
                this.ctx.fillStyle = '#ffaa00';
                this.ctx.fillText('RELOADING...', startX, startY + 35 * this.scale);
            }
            
            // Draw bullet indicators
            const bulletSpacing = 6 * this.scale;
            let bulletX = startX;
            const bulletY = startY + 40 * this.scale;
            
            const bulletsFull = weapon.currentAmmo;
            const bulletsToShow = Math.min(weapon.stats.magazineSize, 15);
            
            for (let i = 0; i < bulletsToShow; i++) {
                const bullet = i < bulletsFull ? this.gunBullet : this.gunBulletEmpty;
                if (bullet.complete) {
                    const bulletWidth = bullet.width * this.scale;
                    const bulletHeight = bullet.height * this.scale;
                    this.ctx.drawImage(bullet, bulletX, bulletY, bulletWidth, bulletHeight);
                    bulletX += bulletSpacing;
                }
            }
            
            // Show "+X" if more bullets than displayed
            if (weapon.stats.magazineSize > bulletsToShow) {
                this.ctx.fillStyle = '#888888';
                this.ctx.font = `${Math.floor(10 * this.scale)}px monospace`;
                this.ctx.fillText(`+${weapon.stats.magazineSize - bulletsToShow}`, bulletX + 5 * this.scale, bulletY + 8 * this.scale);
            }
        }
    }

    /**
     * Render round information at top center of screen
     */
    renderRound(roundsManager: RoundsManager): void {
        const roundInfo = roundsManager.getRoundInfo();
        
        const centerX = this.canvas.width / 2;
        const startY = 20 * this.scale;
        
        // Draw round number
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${Math.floor(24 * this.scale)}px monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 4 * this.scale;
        this.ctx.fillText(`ROUND ${roundInfo.roundNumber}`, centerX, startY);
        this.ctx.shadowBlur = 0;
        
        // Draw zombie count
        this.ctx.font = `${Math.floor(14 * this.scale)}px monospace`;
        this.ctx.fillStyle = roundInfo.zombiesRemaining > 0 ? '#ff4444' : '#44ff44';
        this.ctx.fillText(`Zombies: ${roundInfo.zombiesRemaining}/${roundInfo.zombiesTotal}`, centerX, startY + 25 * this.scale);
        
        // Draw round state
        if (roundInfo.state === 'completed') {
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = `bold ${Math.floor(18 * this.scale)}px monospace`;
            this.ctx.fillText('ROUND COMPLETE!', centerX, startY + 45 * this.scale);
        } else if (roundInfo.state === 'spawning') {
            this.ctx.fillStyle = '#ffaa00';
            this.ctx.fillText(`Spawning... (${roundInfo.zombiesSpawned}/${roundInfo.zombiesTotal})`, centerX, startY + 45 * this.scale);
        }
        
        // Reset text align
        this.ctx.textAlign = 'left';
    }
    
    /**
     * Main render function
     */
    render(player: Player, roundsManager?: RoundsManager): void {
        this.renderHealth(player);
        this.renderInventory(player);
        this.renderAmmo(player);
        
        if (roundsManager) {
            this.renderRound(roundsManager);
        }
    }

    /**
     * Handle inventory slot selection (1-6 keys)
     */
    selectSlot(slot: number): void {
        if (slot >= 0 && slot < this.inventory.length) {
            this.selectedSlot = slot;
        }
    }
}
