# Ranged Combat System Design

## Overview
Add ranged weapons (bows, crossbows, throwing weapons) that use the existing projectile system for visual effects and collision detection.

---

## Weapon Categories

### 1. Bows
**Characteristics**: Fast firing, moderate damage, requires dexterity
- **Short Bow** 🏹
  - Attack: +4
  - Range: 6 tiles
  - Projectile: `→` (arrow)
  - Speed: 2
  - Requires: 8 Dexterity
  - Value: 30 gold
  
- **Long Bow** 🏹
  - Attack: +7
  - Range: 10 tiles
  - Projectile: `→` (arrow)
  - Speed: 2
  - Requires: 12 Dexterity
  - Value: 80 gold
  
- **Elven Bow** 🏹
  - Attack: +10
  - Range: 12 tiles
  - Projectile: `⟶` (elven arrow)
  - Speed: 3
  - Requires: 14 Dexterity
  - Rarity: Uncommon
  - Value: 150 gold

### 2. Crossbows
**Characteristics**: Slower firing, high damage, less dexterity required
- **Light Crossbow** 🎯
  - Attack: +8
  - Range: 8 tiles
  - Projectile: `▸` (bolt)
  - Speed: 1
  - Requires: 8 Strength
  - Value: 60 gold
  
- **Heavy Crossbow** 🎯
  - Attack: +12
  - Range: 10 tiles
  - Projectile: `▸` (bolt)
  - Speed: 1
  - Requires: 12 Strength
  - Value: 120 gold
  
- **Repeating Crossbow** 🎯
  - Attack: +9
  - Range: 7 tiles
  - Projectile: `▸` (bolt)
  - Speed: 2
  - Special: Can fire twice per turn
  - Requires: 10 Dexterity
  - Rarity: Rare
  - Value: 200 gold

### 3. Throwing Weapons
**Characteristics**: Short range, can be used in melee, no ammo needed
- **Throwing Knives** 🗡️
  - Attack: +5
  - Range: 4 tiles
  - Projectile: `✦` (knife)
  - Speed: 3
  - Melee: +3 (can be used as backup weapon)
  - Value: 25 gold
  
- **Throwing Axes** 🪓
  - Attack: +8
  - Range: 5 tiles
  - Projectile: `⚔` (axe)
  - Speed: 2
  - Melee: +6
  - Requires: 10 Strength
  - Value: 50 gold
  
- **Javelins** 🗡️
  - Attack: +9
  - Range: 6 tiles
  - Projectile: `⟩` (javelin)
  - Speed: 2
  - Melee: +5
  - Requires: 10 Strength
  - Value: 40 gold

### 4. Exotic Ranged Weapons
**Characteristics**: Unique mechanics, rare drops
- **Sling** 🎯
  - Attack: +3
  - Range: 8 tiles
  - Projectile: `•` (stone)
  - Speed: 2
  - Special: Uses rocks as ammo (infinite)
  - Value: 15 gold
  
- **Blowgun** 🎋
  - Attack: +2
  - Range: 6 tiles
  - Projectile: `·` (dart)
  - Speed: 3
  - Special: 30% chance to poison (3 turns, 2 dmg/turn)
  - Requires: 8 Dexterity
  - Rarity: Uncommon
  - Value: 75 gold
  
- **Chakram** ⭕
  - Attack: +10
  - Range: 7 tiles
  - Projectile: `◯` (chakram)
  - Speed: 3
  - Special: Pierces through enemies, returns
  - Requires: 14 Dexterity
  - Rarity: Rare
  - Value: 180 gold

---

## Technical Implementation

### 1. Weapon Class Extension
```javascript
export class Weapon extends Equipment {
    constructor(options = {}) {
        super({
            type: 'weapon',
            slot: 'weapon',
            ...options
        });
        this.damageType = options.damageType || 'physical';
        this.twoHanded = options.twoHanded || false;
        
        // NEW: Ranged weapon properties
        this.weaponType = options.weaponType || 'melee'; // 'melee' or 'ranged'
        this.range = options.range || 1; // 1 for melee, 4-12 for ranged
        this.projectile = options.projectile || null; // Projectile config
        this.meleeAttack = options.meleeAttack || null; // For throwing weapons
    }
    
    isRanged() {
        return this.weaponType === 'ranged';
    }
    
    canAttackAt(distance) {
        return distance <= this.range;
    }
}
```

### 2. Projectile Configuration
```javascript
// Example for Long Bow
projectile: {
    symbol: '→',
    color: '#8B4513', // Brown
    speed: 2,
    damageType: 'physical',
    piercing: false,
    effects: [] // Status effects on hit
}
```

### 3. Combat Manager Integration
```javascript
// In CombatManager.playerAttack()
playerAttack(targetX, targetY) {
    const weapon = this.game.player.inventory.getEquippedWeapon();
    
    if (weapon && weapon.isRanged()) {
        // Calculate distance
        const dx = targetX - this.game.player.x;
        const dy = targetY - this.game.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check range
        if (distance > weapon.range) {
            this.game.ui.addMessage('Target out of range!', '#f55');
            return false;
        }
        
        // Check line of sight
        if (!this.game.fov.isVisible(targetX, targetY)) {
            this.game.ui.addMessage('Cannot see target!', '#f55');
            return false;
        }
        
        // Fire projectile
        this.fireRangedWeapon(weapon, targetX, targetY);
    } else {
        // Existing melee attack logic
        this.meleeAttack(targetX, targetY);
    }
}

fireRangedWeapon(weapon, targetX, targetY) {
    const damage = this.game.player.calculateAttackPower();
    
    // Create projectile using existing system
    const projectileConfig = {
        sourceX: this.game.player.x,
        sourceY: this.game.player.y,
        targetX: targetX,
        targetY: targetY,
        damage: damage,
        damageType: weapon.damageType,
        symbol: weapon.projectile.symbol,
        color: weapon.projectile.color,
        speed: weapon.projectile.speed,
        piercing: weapon.projectile.piercing || false,
        effects: weapon.projectile.effects || [],
        name: weapon.name,
        caster: this.game.player
    };
    
    this.game.projectileManager.createProjectile(projectileConfig);
    
    // Message
    this.game.ui.addMessage(`You fire ${weapon.name}!`, '#ff0');
}
```

### 4. Input Handling
```javascript
// In InputManager
// Option A: Auto-target nearest enemy when attacking with ranged weapon
// Option B: Use Tab targeting system (already exists)
// Option C: Click to target (mouse support)

handleAttack() {
    const weapon = this.game.player.inventory.getEquippedWeapon();
    
    if (weapon && weapon.isRanged()) {
        // Start targeting mode
        this.game.targetingSystem.startTargeting(
            { range: weapon.range },
            (targetX, targetY) => {
                this.game.combat.playerAttack(targetX, targetY);
            }
        );
    } else {
        // Melee attack in movement direction
        // Existing logic
    }
}
```

---

## UI/UX Considerations

### 1. Range Indicator
- Show range circle when ranged weapon equipped
- Highlight tiles in range (green = in range, red = out of range)
- Display range in weapon tooltip

### 2. Targeting System
- Reuse existing Tab targeting for spells
- Show line-of-sight indicator
- Display distance to target
- Show hit chance based on distance

### 3. Weapon Switching
- Quick swap between melee and ranged (hotkey: W?)
- Show equipped weapon type in HUD
- Indicate when out of range for ranged attack

### 4. Visual Feedback
- Different projectile colors for different weapon types
- Trail effects for fast projectiles
- Impact animations on hit
- Miss indicators when projectile hits wall

---

## Balance Considerations

### Damage Scaling
- **Melee weapons**: Scale with Strength
- **Bows**: Scale with Dexterity (50%) + Strength (25%)
- **Crossbows**: Scale with Strength (50%) + Dexterity (25%)
- **Throwing weapons**: Scale with Strength (40%) + Dexterity (40%)

### Range vs Damage Trade-off
- Longer range = lower base damage
- Melee weapons have highest damage
- Ranged weapons provide safety but less DPS

### Stat Requirements
- Prevent low-level characters from using powerful ranged weapons
- Encourage build diversity (archer vs warrior vs mage)

### Ammo System (Optional - Future)
- Could add arrows/bolts as consumable items
- Throwing weapons could have durability
- Infinite ammo for now to keep it simple

---

## Monster AI Considerations

### Ranged Monsters (Future)
- Goblin Archers 🏹
- Skeleton Archers 💀
- Orc Crossbowmen 🎯
- Keep distance from player
- Retreat when player gets close
- Take cover behind walls

---

## Implementation Priority

### Phase 1: Core System (MVP)
1. ✅ Weapon class extension with ranged properties
2. ✅ Add 3-4 basic ranged weapons (Short Bow, Crossbow, Throwing Knife)
3. ✅ Integrate with existing projectile system
4. ✅ Basic targeting (Tab system)
5. ✅ Combat manager ranged attack logic

### Phase 2: Polish
1. Range indicators in UI
2. Better targeting visuals
3. Add more weapon variety
4. Weapon switching hotkey
5. Hit chance based on distance

### Phase 3: Advanced
1. Ranged monsters
2. Cover system
3. Ammo system (if desired)
4. Special weapon abilities
5. Weapon enchantments

---

## Icon Reference

### Weapon Icons
- 🏹 Bow
- 🎯 Crossbow
- 🗡️ Throwing Knife/Dagger
- 🪓 Throwing Axe
- ⚔️ Javelin/Spear
- 🎋 Blowgun
- ⭕ Chakram

### Projectile Symbols
- `→` Arrow (horizontal)
- `↗` Arrow (diagonal)
- `▸` Bolt
- `✦` Knife
- `⚔` Axe
- `⟩` Javelin
- `•` Stone/Bullet
- `·` Dart
- `◯` Chakram

### Alternative Projectile Symbols
- `⟶` Long arrow
- `➤` Heavy arrow
- `⇀` Light arrow
- `⟿` Wavy arrow
- `⤏` Curved arrow

---

## Code Files to Create/Modify

### New Files
- None needed! Use existing projectile system

### Modified Files
1. `/src/js/modules/items/equipment.js` - Add ranged weapon properties
2. `/src/js/modules/items/itemDatabase.js` - Add ranged weapon definitions
3. `/src/js/modules/combatManager.js` - Add ranged attack logic
4. `/src/js/modules/inputManager.js` - Add ranged attack input handling
5. `/src/js/modules/ui/gameUI.js` - Add range indicators (optional)

---

## Example Weapon Definitions

```javascript
// In itemDatabase.js

// SHORT BOW
this.registerItem(new Weapon({
    id: 'short_bow',
    name: 'Short Bow',
    description: 'A simple wooden bow for hunting.',
    icon: '🏹',
    rarity: 'common',
    value: 30,
    weaponType: 'ranged',
    range: 6,
    stats: { attackPower: 4 },
    damageType: 'physical',
    twoHanded: true,
    projectile: {
        symbol: '→',
        color: '#8B4513',
        speed: 2,
        piercing: false
    }
}));

// THROWING KNIVES
this.registerItem(new Weapon({
    id: 'throwing_knives',
    name: 'Throwing Knives',
    description: 'Balanced knives for throwing. Can be used in melee.',
    icon: '🗡️',
    rarity: 'common',
    value: 25,
    weaponType: 'ranged',
    range: 4,
    stats: { attackPower: 5 },
    damageType: 'physical',
    meleeAttack: 3, // Backup melee damage
    projectile: {
        symbol: '✦',
        color: '#C0C0C0',
        speed: 3,
        piercing: false
    }
}));

// BLOWGUN (with poison)
this.registerItem(new Weapon({
    id: 'blowgun',
    name: 'Blowgun',
    description: 'Silent weapon that fires poisoned darts.',
    icon: '🎋',
    rarity: 'uncommon',
    value: 75,
    weaponType: 'ranged',
    range: 6,
    stats: { attackPower: 2 },
    damageType: 'physical',
    projectile: {
        symbol: '·',
        color: '#00FF00',
        speed: 3,
        piercing: false,
        effects: [{
            type: 'dot',
            name: 'Poisoned',
            duration: 3,
            power: 2,
            damageType: 'poison',
            icon: '☠️',
            color: '#00FF00',
            message: '{target} is poisoned!',
            tickMessage: '{target} takes poison damage!'
        }]
    }
}));
```

---

## Benefits of This Design

1. **Reuses Existing Systems**: Leverages projectile system already built for spells
2. **Build Diversity**: Enables archer/ranger character builds
3. **Tactical Depth**: Range management adds strategic layer to combat
4. **Visual Appeal**: Animated projectiles make ranged combat satisfying
5. **Scalable**: Easy to add new ranged weapons and effects
6. **Balanced**: Trade-offs between range, damage, and requirements

---

## Next Steps

1. Review this design document
2. Decide on Phase 1 weapon list (3-4 weapons)
3. Implement Weapon class extensions
4. Add weapon definitions to itemDatabase
5. Implement ranged attack logic in CombatManager
6. Test and balance
7. Add UI polish (range indicators, etc.)
