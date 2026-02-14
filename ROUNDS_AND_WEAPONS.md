# Rounds & Weapons System

## Overview
The game now features a **rounds-based progression system** with **exponentially increasing zombies** and a **diverse weapon system** with **rarity tiers**.

---

## 🎮 Rounds System

### How It Works
- **Round 1** starts automatically with a small number of zombies
- **Zombies spawn gradually** over time (every 2 seconds)
- Once **all zombies are eliminated**, the next round starts after a 3-second countdown
- **Zombie count increases exponentially** using the formula:
  ```
  zombies = baseCount * (round ^ 1.5) * multiplier
  ```
  - Round 1: ~5 zombies
  - Round 2: ~7 zombies
  - Round 3: ~10 zombies
  - Round 4: ~14 zombies
  - And so on...

### UI Display
- **Top center of screen** shows:
  - Current round number
  - Zombies remaining / total
  - Round state (Spawning/Active/Complete)

---

## 🔫 Weapon System

### Weapon Types
| Type | Description | Special Feature |
|------|-------------|----------------|
| **Bat** | Melee weapon | Infinite ammo, high knockback |
| **Pistol** | Light firearm | Fast fire rate, moderate damage |
| **Gun/Rifle** | Standard firearm | Balanced stats |
| **Shotgun** | Spread weapon | Multiple projectiles per shot |

### Rarity System
Each weapon has a rarity that affects its stats and visual appearance:

| Rarity | Color | Stats |
|--------|-------|-------|
| **Common** | Gray `#9d9d9d` | Basic stats |
| **Uncommon** | Green `#1eff00` | Improved stats |
| **Rare** | Blue `#0070dd` | Strong stats |
| **Epic** | Purple `#a335ee` | Very strong stats |
| **Legendary** | Orange `#ff8000` | Maximum stats |

### Weapon Stats
Each weapon has unique characteristics:
- **Damage**: Base damage + random variance
- **Fire Rate**: Shots per second
- **Magazine Size**: Bullets per magazine
- **Reserve Ammo**: Total backup ammunition
- **Projectile Speed**: How fast bullets travel
- **Spread**: Accuracy (lower is better)
- **Knockback**: Enemy pushback strength
- **Range**: Max projectile lifetime

### Starting Weapons
You begin with:
1. **Wooden Bat** (Common) - Melee backup
2. **Rusty Pistol** (Common) - Starting firearm
3. **Scrap Rifle** (Common) - Primary weapon

---

## 🎯 Controls

### Weapon Switching
- **1-6 Number Keys**: Switch between your 6 weapon slots
- **R**: Reload current weapon

### Shooting
- **Left Mouse Button**: Shoot towards mouse cursor
- **Spacebar**: Shoot in facing direction

### UI Indicators
- **Bottom center**: Weapon inventory with rarity borders
  - Selected weapon has a glow effect
  - Rarity-colored borders around weapon icons
- **Bottom right**: 
  - Weapon name with rarity color
  - Ammo count (current / reserve)
  - Bullet indicators
  - "RELOADING..." when reloading

---

## 📊 Weapon Examples

### Bats (Melee)
- **Wooden Bat** (Common): 25 damage, 1.5 attacks/sec, infinite ammo
- **Reinforced Bat** (Uncommon): 40 damage, 2 attacks/sec, infinite ammo

### Pistols
- **Rusty Pistol** (Common): 20 damage, 3 shots/sec, 8 mag / 32 reserve
- **Pistol** (Uncommon): 30 damage, 4 shots/sec, 12 mag / 48 reserve
- **Tactical Pistol** (Rare): 45 damage, 5 shots/sec, 15 mag / 60 reserve

### Rifles/Guns
- **Scrap Rifle** (Common): 35 damage, 4 shots/sec, 20 mag / 60 reserve
- **Assault Rifle** (Rare): 50 damage, 6 shots/sec, 30 mag / 120 reserve
- **Military Rifle** (Epic): 75 damage, 7 shots/sec, 30 mag / 150 reserve
- **Legendary Rifle** (Legendary): 100 damage, 8 shots/sec, 40 mag / 200 reserve

### Shotguns (Multi-projectile)
- **Pump Shotgun** (Uncommon): 25 dmg × 6 pellets, 1.2 shots/sec, 6 mag / 24 reserve
- **Combat Shotgun** (Rare): 35 dmg × 7 pellets, 2 shots/sec, 8 mag / 32 reserve
- **Tactical Shotgun** (Epic): 45 dmg × 8 pellets, 2.5 shots/sec, 10 mag / 40 reserve
- **Super Shotgun** (Legendary): 60 dmg × 12 pellets, 1.5 shots/sec, 2 mag / 20 reserve

---

## 🎨 Visual Features

### Rarity Glow Effects
- Selected weapons display a **glowing border** in their rarity color
- Weapon names show **shadow/glow effects** matching rarity
- Inventory slots show **colored borders** around weapon icons

### Shotgun Spread
- Shotguns fire multiple projectiles in a spread pattern
- Higher-tier shotguns have more pellets and tighter spread

### Auto-Reload
- Weapons automatically start reloading when you try to shoot with empty magazine
- Manual reload with **R** key anytime

---

## 🔧 Technical Details

### Round Scaling Formula
```typescript
zombieCount = baseCount (5) * (round ^ 1.5) * multiplier (1.0)
Round 1:  5 zombies
Round 2:  7 zombies
Round 3: 10 zombies
Round 5: 16 zombies
Round 10: 47 zombies
```

### Spawn System
- Zombies spawn at **random edges** of the map
- Spawn interval: **2 seconds** between each zombie
- Round state: `WAITING → SPAWNING → ACTIVE → COMPLETED`

### Weapon Inventory
- **Maximum 6 weapons** at once
- Weapons can be added/removed dynamically
- Can't drop your last weapon

---

## 🚀 Future Enhancements
Possible additions:
- Weapon pickups/drops in game world
- Ammo pickups
- Weapon crafting/upgrading
- Different zombie types for higher rounds
- Boss rounds
- Multiplayer weapon sync

---

## 🐛 Developer Notes

### Files Modified
- `src/Weapon.ts` - Complete weapon system (400+ lines)
- `src/RoundsManager.ts` - Rounds logic (250+ lines)
- `src/Player.ts` - Weapon switching, shotgun spread
- `src/UIManager.ts` - Round display, weapon rarity UI
- `src/main.ts` - Integration with game loop

### Key Classes
```typescript
Weapon - Individual weapon instance
  .stats: WeaponStats
  .currentAmmo: number
  .reserveAmmo: number
  .getDamage(): number // With variance
  .canShoot(): boolean
  .shoot(): boolean
  .reload(): boolean

RoundsManager - Round progression
  .update(dt, enemyCount)
  .startNextRound()
  .notifyZombieDeath()
  .onSpawnZombie(callback)
  .getRoundInfo()
```

### Constants
```typescript
WEAPON_TEMPLATES - 14 pre-defined weapons
WeaponRarity - Color constants
WeaponType - Type constants
```
