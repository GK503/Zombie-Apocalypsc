# Advanced Zombie Combat & Item System

## 🧟 Zombie Combat System

### Zombie Attacks
Zombies now actively attack the player:
- **Contact Damage**: Zombies deal damage when touching the player
- **Attack Cooldown**: 1 second between attacks (prevents instant death)
- **Damage Values**:
  - Normal Zombie: **10 damage**
  - Fast Zombie: **8 damage**

### Player Invincibility Frames
- **Duration**: 1 second after taking damage
- **Visual Indicator**: Player flashes red when invincible
- **Purpose**: Prevents getting hit multiple times instantly

---

## 🏃 Zombie Variants

### Normal Zombie (70% spawn rate)
- **Health**: 50 HP
- **Speed**: 50 (baseline)
- **Damage**: 10
- **Color**: Dark red `#ff0000`
- **Weapon Drop**: 10% chance

### Fast Zombie (30% spawn rate)
- **Health**: 30 HP (40% less)
- **Speed**: 100 (2x faster!)
- **Damage**: 8
- **Color**: Light red `#ff6666`
- **Weapon Drop**: 15% chance (higher!)

---

## 🎁 Item Drop System

### Drop Rates from Zombies

| Item Type | Drop Chance | Amount |
|-----------|-------------|--------|
| **Ammo** | 100% | 20-50 bullets |
| **Health** | 30% | 20-50 HP |
| **Weapon** | 10-15% | Random (based on rarity) |

### Weapon Drop Rarity Weights
When a weapon drops, rarity is determined by:
- **Common**: 50% (most frequent)
- **Uncommon**: 30%
- **Rare**: 15%
- **Epic**: 4%
- **Legendary**: 1% (very rare!)

---

## 🗺️ Item Spawning System

### Round Start Spawns
At the beginning of each round, items spawn on the map:

**Formula**: `itemCount = zombieCount / 3` (rounded down)

**Distribution**:
- 40% chance: **Weapon**
- 30% chance: **Ammo**
- 30% chance: **Health**

**Examples**:
- Round 1 (5 zombies) = 1 item
- Round 3 (10 zombies) = 3 items
- Round 5 (16 zombies) = 5 items
- Round 10 (47 zombies) = 15 items

### Item Properties
- **Spawn Location**: Random open tiles across map
- **Lifetime**: 30 seconds (then despawn)
- **Pickup Range**: 24 pixels
- **Visual Effect**: Bobbing animation with colored glow

---

## 🎨 Item Visual Design

### Colors
- **Weapon** (Orange `#ffaa00`): Large 'W' icon
- **Ammo** (Yellow `#ffff00`): Large 'A' icon
- **Health** (Red `#ff0000`): Large 'H' icon

### Effects
- **Glow**: Colored shadow blur matching item type
- **Bob**: Smooth up/down animation (sin wave)
- **Icon**: Centered letter identifying item type

---

## 🎯 Pickup Mechanics

### Weapon Pickup
- **Inventory Full**: Can't pick up (max 6 weapons)
- **Success**: Weapon added to next available slot
- **Switch**: Select with number keys 1-6

### Ammo Pickup
- **Target**: Current weapon only
- **Infinite Ammo Weapons**: Can't pick up ammo (melee)
- **Amount**: 20-50 bullets added to reserve

### Health Pickup
- **Max Health**: Can't pick up when at full health
- **Healing**: 20-50 HP restored
- **Cap**: Cannot exceed max health (100 HP)

---

## 🧱 Improved Spawn System

### Zombie Spawn Logic
- **Location**: Only at **map edges** (top/right/bottom/left)
- **Validation**: Must be on **open tiles** (not walls)
- **Max Attempts**: 50 tries to find valid edge spawn
- **Fallback**: If edge spawn fails, try any open tile
- **Safety Margin**: 1 tile from absolute edge

### Wall Collision Fix
If a zombie somehow spawns in a wall:
1. **Detection**: Check if entity is in solid tile
2. **Search Pattern**: Spiral outward in 8 directions
3. **Teleport**: Move to nearest open tile (up to 5 tiles away)
4. **Logging**: Console warns about stuck entities

**Directions Checked**:
```
Up, Right, Down, Left,
UpRight, DownRight, DownLeft, UpLeft
```

---

## 🎮 Gameplay Loop

### Early Rounds (1-3)
- Few zombies, few items
- Mostly normal zombies
- Build weapon arsenal
- Stock up on ammo

### Mid Rounds (4-7)
- More mixed zombie types
- More items spawning
- Need better weapons
- Health management important

### Late Rounds (8+)
- Zombie swarms
- Many fast zombies
- Item spawns everywhere
- Survival becomes challenging

---

## 📊 Technical Details

### Item System Classes
```typescript
Item extends Entity
  .itemType: ItemType
  .weaponKey?: string
  .ammoAmount?: number
  .healthAmount?: number
  .lifetime: number
  .dead: boolean
  .canPickup(player): boolean
  .pickup(player): boolean
```

### Enemy Enhancements
```typescript
Enemy
  .zombieType: ZombieType
  .damage: number
  .attackCooldown: number
  .droppedItems: Item[]
  .attackPlayer(player, dt)
  .dropItems()
  .getDroppedItems(): Item[]
```

### Player Improvements
```typescript
Player
  .invincibilityTime: number
  .invincibilityDuration: 1.0 seconds
  .takeDamage(amount) // with i-frames
  .render() // with flash effect
```

---

## 🔧 Configuration Constants

### Zombie Stats
```typescript
NORMAL_ZOMBIE = {
    health: 50,
    speed: 50,
    damage: 10,
    weaponDrop: 0.10
}

FAST_ZOMBIE = {
    health: 30,
    speed: 100,
    damage: 8,
    weaponDrop: 0.15
}
```

### Drop Rates
```typescript
AMMO_DROP = 1.0 (100%)
HEALTH_DROP = 0.3 (30%)
WEAPON_DROP = 0.10-0.15 (10-15%)
```

### Spawn Settings
```typescript
ITEMS_PER_ROUND = zombieCount / 3
ITEM_LIFETIME = 30 seconds
PICKUP_RANGE = 24 pixels
SPAWN_EDGE_MARGIN = 1 tile
```

---

## 🚀 Strategy Tips

### Weapon Management
1. Keep a **melee weapon** for emergencies (infinite ammo)
2. Save **high-tier weapons** for tough rounds
3. **Switch weapons** during reload cooldown

### Survival Tactics
1. **Kite zombies** - keep moving in circles
2. **Prioritize fast zombies** - they're dangerous
3. **Collect ammo first** - weapons are useless without it

### Health Management
1. Pick up health **before engaging** large groups
2. Watch for **invincibility flash** after taking damage
3. Don't let **zombies surround you**

### Item Collection
1. **Grab weapons early** - more options = better
2. **Ammo drops are everywhere** - don't worry
3. **Health is precious** - get it when you see it

---

## 🐛 Known Behaviors

### Wall Collision Fix
- Zombies occasionally spawn in walls on complex mazes
- Automatic teleportation fixes this within 1 frame
- Console logs help debug spawn issues

### Item Density
- Late rounds can have 10+ items on screen
- Items despawn after 30 seconds to prevent clutter
- Color coding helps identify items quickly

### Zombie Behavior
- Fast zombies can be overwhelming in groups
- Normal zombies provide steady pressure
- Mix of both creates dynamic difficulty

---

## 📈 Progression Curve

| Round | Zombies | Items | Fast % | Difficulty |
|-------|---------|-------|--------|------------|
| 1 | 5 | 1 | ~2 | Easy |
| 2 | 7 | 2 | ~2 | Easy |
| 3 | 10 | 3 | ~3 | Medium |
| 5 | 16 | 5 | ~5 | Medium |
| 7 | 25 | 8 | ~8 | Hard |
| 10 | 47 | 15 | ~14 | Very Hard |
| 15 | 87 | 29 | ~26 | Extreme |

*Fast % = Expected number of fast zombies (30% of total)*

---

## 🎯 Future Enhancements

Possible additions:
- Boss zombies with special abilities
- Explosive zombies that damage on death
- Armor pickups for extra protection
- Special ammo types (incendiary, explosive)
- Zombie spawn indicators before they appear
- Item magnets/auto-pickup at close range
- Weapon durability system
- Zombie AI improvements (flanking, grouping)
