import { Coords, type TilePosition, TILE_SIZE } from './engine/constants';
import { InputHandler } from './engine/InputHandler';
import { Camera } from './engine/Camera';
import { TileMap } from './engine/TileMap';

import { Player } from './Player';
import { Enemy } from './Enemy';
import { Entity } from './engine/Entity';
import { UIManager } from './UIManager';
import { NetworkManager, type EnemyState } from './NetworkManager';
import { RemotePlayer } from './RemotePlayer';
import { Projectile } from './Projectile';
import { RoundsManager } from './RoundsManager';
import { Item, createWeaponDrop, createAmmoDrop, createHealthDrop } from './Item';

const MAP_WIDTH = 50;
const MAP_HEIGHT = 50;

/**
 * Flow Field data structure for efficient pathfinding
 */
export interface FlowField {
    distances: Uint16Array; // Distance to target for each tile
    target: TilePosition;
    cols: number;
    rows: number;
    readonly MAX_DISTANCE: number;
}

/**
 * Calculate Flow Field (Dijkstra Map) from a target position
 * Uses Breadth-First Search to calculate distances from target
 * Edits the flow field in-place for efficiency
 */
export function calculateFlowField(flowField: FlowField, target: TilePosition, map: TileMap): void {
    console.log(`Calculating flow field to target tile (${target.x}, ${target.y})`);
    // Skip if target hasn't moved to a new tile
    if (flowField.target.x === target.x && flowField.target.y === target.y) {
        return;
    }

    // Clear the flow field
    flowField.distances.fill(flowField.MAX_DISTANCE);

    // Check if target is valid
    if (!map.isValidTile(target.x, target.y) || map.isSolid(target.x, target.y)) {
        return;
    }

    flowField.target = target;

    // BFS queue
    const queue: { x: number; y: number; dist: number }[] = [];
    queue.push({ x: target.x, y: target.y, dist: 0 });

    const index = target.y * flowField.cols + target.x;
    flowField.distances[index] = 0;

    let queueIndex = 0;

    while (queueIndex < queue.length) {
        const current = queue[queueIndex++];
        const currentDist = current.dist;

        // Check 4 neighbors (up, down, left, right)
        const neighbors = [
            { x: current.x, y: current.y - 1 }, // Up
            { x: current.x, y: current.y + 1 }, // Down
            { x: current.x - 1, y: current.y }, // Left
            { x: current.x + 1, y: current.y }  // Right
        ];

        for (const neighbor of neighbors) {
            // Skip if out of bounds or solid
            if (!map.isValidTile(neighbor.x, neighbor.y) || map.isSolid(neighbor.x, neighbor.y)) {
                continue;
            }

            const neighborIndex = neighbor.y * flowField.cols + neighbor.x;
            const newDist = currentDist + 1;

            // Only update if we found a shorter path
            if (newDist < flowField.distances[neighborIndex]) {
                flowField.distances[neighborIndex] = newDist;
                queue.push({ x: neighbor.x, y: neighbor.y, dist: newDist });
            }
        }
    }
}

/**
 * Get the flow field distance at a tile position
 * Returns MAX_DISTANCE if unreachable
 */
export function getFlowFieldDistance(flowField: FlowField, x: number, y: number): number {
    if (x < 0 || x >= flowField.cols || y < 0 || y >= flowField.rows) {
        return flowField.MAX_DISTANCE;
    }
    return flowField.distances[y * flowField.cols + x];
}

/**
 * Get the best neighbor tile to move towards the flow field target
 * Returns null if no valid move exists
 * This is the "greedy downhill" approach
 */
export function getBestFlowFieldNeighbor(flowField: FlowField, pos: TilePosition, map: TileMap): TilePosition | null {
    const x = pos.x;
    const y = pos.y;
    if (!map.isValidTile(x, y)) {
        return null;
    }

    const currentDist = getFlowFieldDistance(flowField, x, y);

    // If unreachable, no path
    if (currentDist === flowField.MAX_DISTANCE) {
        return null;
    }

    // If at target, don't move
    if (currentDist === 0) {
        return null;
    }

    let bestTile: { x: number; y: number } | null = null;
    let bestDist = currentDist;

    // Check 4 neighbors
    const neighbors = [
        { x: x, y: y - 1 }, // Up
        { x: x, y: y + 1 }, // Down
        { x: x - 1, y: y }, // Left
        { x: x + 1, y: y }  // Right
    ];

    for (const neighbor of neighbors) {
        if (!map.isValidTile(neighbor.x, neighbor.y) || map.isSolid(neighbor.x, neighbor.y)) {
            continue;
        }

        const dist = getFlowFieldDistance(flowField, neighbor.x, neighbor.y);

        // Move towards lower distance (downhill)
        if (dist < bestDist) {
            bestDist = dist;
            bestTile = neighbor;
        }
    }

    return bestTile;
}

/**
 * MAIN GAME LOOP
 */
class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    lastTime: number;

    input!: InputHandler;
    map!: TileMap;
    camera!: Camera;
    player!: Player;
    npcs!: Enemy[];
    lastPlayerTile: TilePosition = { x: -1, y: -1 };
    ui!: UIManager;
    flowField!: FlowField;
    roundsManager!: RoundsManager;
    items: Item[] = [];
    
    // Multiplayer
    network?: NetworkManager;
    remotePlayers: RemotePlayer[] = [];
    multiplayerEnabled: boolean = true; // Set to false to disable multiplayer

    constructor() {
        const canvasEl = document.getElementById('gameCanvas') as HTMLCanvasElement;
        if (!canvasEl) throw new Error("Canvas not found");

        this.canvas = canvasEl;
        this.ctx = this.canvas.getContext('2d', { alpha: false })!;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.lastTime = 0;
        this.init();
    }

    init(): void {
        this.input = new InputHandler();
        this.input.initMouse(this.canvas); // Initialize mouse input
        this.ui = new UIManager(this.canvas);
        this.map = new TileMap(MAP_WIDTH, MAP_HEIGHT);
        this.camera = new Camera(this.canvas.width, this.canvas.height, MAP_WIDTH, MAP_HEIGHT);

        // Initialize flow field for efficient pathfinding
        this.flowField = {
            distances: new Uint16Array(MAP_WIDTH * MAP_HEIGHT),
            target: { x: -1, y: -1 },
            cols: MAP_WIDTH,
            rows: MAP_HEIGHT,
            MAX_DISTANCE: 65535
        };
        this.flowField.distances.fill(this.flowField.MAX_DISTANCE);

        this.map.defineTileImage(0, false, '/assets/Objects/Nature/Green/Grass_4_Green.png');
        this.map.defineTileImage(1, true, '/assets/Objects/Container/Container_1_Gray_Vertical.png');

        // FIX: Fill the entire map with walls (ID 1) before carving the maze
        for (let i = 0; i < this.map.tiles.length; i++) {
            this.map.tiles[i] = 1;
        }

        // Now generateMaze will find walls to carve through
        this.generateMaze(1, 1);

        // Spawn the player at a random open tile
        const spawnTile = this.findRandomOpenTile();
        this.player = new Player(spawnTile.x, spawnTile.y, this.input);
        console.log(`Player spawned at random tile (${spawnTile.x}, ${spawnTile.y})`);

        // Immediately center camera on player
        this.camera.follow(this.player);

        // Initialize flow field for enemies to chase player
        const playerTile = this.player.getTilePosition();
        calculateFlowField(this.flowField, playerTile, this.map);
        this.lastPlayerTile = playerTile;

        this.npcs = [];

        // Initialize rounds manager
        this.roundsManager = new RoundsManager();
        
        // Set up callback for spawning zombies
        this.roundsManager.onSpawnZombie((roundNumber, _zombieIndex) => {
            const spawnPos = this.roundsManager.getSpawnPosition(
                MAP_WIDTH, 
                MAP_HEIGHT,
                (x, y) => !this.map.isSolid(x, y)
            );
            this.spawnEntityAtTile(spawnPos, Enemy);
            
            // Fix wall collision if zombie spawned in wall somehow
            const zombie = this.npcs[this.npcs.length - 1];
            this.fixWallCollision(zombie);
            
            console.log(`Spawned zombie for round ${roundNumber} at tile (${spawnPos.x}, ${spawnPos.y})`);
        });
        
        // Set up callback for round start
        this.roundsManager.onRoundStart((roundNumber, zombieCount) => {
            console.log(`=== ROUND ${roundNumber} STARTED ===`);
            console.log(`  Zombies to spawn: ${zombieCount}`);
        });
        
        // Set up callback for round complete
        this.roundsManager.onRoundComplete((roundNumber, duration) => {
            console.log(`=== ROUND ${roundNumber} COMPLETED ===`);
            console.log(`  Time: ${duration.toFixed(1)}s`);
            console.log(`  Next round starting soon...`);
        });
        
        // Set up callback for spawning items
        this.roundsManager.onSpawnItems((roundNumber, itemCount) => {
            console.log(`Spawning ${itemCount} items for round ${roundNumber}`);
            
            // Spawn weapons, ammo, and health randomly
            for (let i = 0; i < itemCount; i++) {
                const randomTile = this.findRandomOpenTile();
                const pixelPos = Coords.tileToPixel(randomTile);
                
                const itemType = Math.random();
                if (itemType < 0.4) {
                    // 40% weapon
                    this.items.push(createWeaponDrop(pixelPos.x, pixelPos.y));
                } else if (itemType < 0.7) {
                    // 30% ammo
                    this.items.push(createAmmoDrop(pixelPos.x, pixelPos.y));
                } else {
                    // 30% health
                    this.items.push(createHealthDrop(pixelPos.x, pixelPos.y));
                }
            }
        });

        // Initialize multiplayer
        if (this.multiplayerEnabled) {
            this.initMultiplayer();
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    /**
     * Spawn an entity at specific tile coordinates
     * Works even if the tile is outside camera bounds
     */
    spawnEntityAtTile(tile: TilePosition, EntityClass: typeof Enemy): void {
        // Validate tile is within map bounds
        if (tile.x < 0 || tile.x >= MAP_WIDTH || tile.y < 0 || tile.y >= MAP_HEIGHT) {
            console.warn(`Cannot spawn entity at (${tile.x}, ${tile.y}) - outside map bounds`);
            return;
        }

        // Entity constructor expects tile coordinates, not pixels
        const entity = new EntityClass(tile.x, tile.y);
        this.npcs.push(entity);

        console.log(`Spawned ${EntityClass.name} at tile (${tile.x}, ${tile.y}) = pixel (${entity.x}, ${entity.y})`);
        console.log(`Entity is ${entity.isInCameraBounds(this.camera) ? 'visible' : 'outside visible bounds'}`);
    }

    /**
     * Spawn player at the camera's current center position
     * Useful when tracking an entity outside visible bounds
     */
    spawnPlayerAtCamera(): void {
        const centerTile = this.camera.getCenterTile();
        const pixelPos = Coords.tileToPixel(centerTile);
        this.player = new Player(pixelPos.x, pixelPos.y, this.input);
        console.log(`Player spawned at camera center: tile (${centerTile.x}, ${centerTile.y})`);
    }

    /**
     * Find a random open (non-solid) tile in the map
     */
    trackEntityAndSpawnPlayer(entity: Entity): void {
        // Focus camera on the entity
        this.camera.follow(entity);

        // If entity was outside original visible bounds, spawn player at camera location
        if (!entity.isInCameraBounds(this.camera)) {
            this.spawnPlayerAtCamera();
        }
    }

    generateMaze(col: number, row: number): void {
        const complexity = 2;
        const directions = [
            [0, -complexity], [0, complexity], [-complexity, 0], [complexity, 0] // Up, Down, Left, Right (2 tiles at a time)
        ].sort(() => Math.random() - 0.5); // Randomize order

        // Set current tile to grass (path)
        this.map.tiles[row * this.map.cols + col] = 0;

        for (const [dc, dr] of directions) {
            const nextCol = col + dc;
            const nextRow = row + dr;

            // Check bounds and if the destination is still a wall
            if (nextCol > 0 && nextCol < this.map.cols - 1 &&
                nextRow > 0 && nextRow < this.map.rows - 1 &&
                this.map.getTile(nextCol, nextRow) === 1) {

                // Carve through the wall between the current tile and the next tile
                this.map.tiles[(row + dr / 2) * this.map.cols + (col + dc / 2)] = 0;

                // Recurse
                this.generateMaze(nextCol, nextRow);
            }
        }
    }

    /**
     * Fix zombie stuck in wall by teleporting to nearby open tile
     */
    fixWallCollision(entity: Entity): void {
        const col = Math.floor((entity.x + entity.width / 2) / TILE_SIZE);
        const row = Math.floor((entity.y + entity.height / 2) / TILE_SIZE);
        
        if (this.map.isSolid(col, row)) {
            console.warn(`Entity stuck in wall at (${col}, ${row}), teleporting...`);
            
            // Try to find open tile in spiral pattern
            const directions = [
                {dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0},
                {dx: 1, dy: -1}, {dx: 1, dy: 1}, {dx: -1, dy: 1}, {dx: -1, dy: -1}
            ];
            
            for (let radius = 1; radius <= 5; radius++) {
                for (const dir of directions) {
                    const newCol = col + dir.dx * radius;
                    const newRow = row + dir.dy * radius;
                    
                    if (this.map.isValidTile(newCol, newRow) && !this.map.isSolid(newCol, newRow)) {
                        const newPos = Coords.tileToPixel({x: newCol, y: newRow});
                        entity.x = newPos.x;
                        entity.y = newPos.y;
                        console.log(`Teleported entity to (${newCol}, ${newRow})`);
                        return;
                    }
                }
            }
            
            console.error(`Could not find open tile to teleport entity!`);
        }
    }
    findRandomOpenTile(): TilePosition {
        const maxAttempts = 1000;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);

            if (!this.map.isSolid(x, y)) {
                return { x, y };
            }
            attempts++;
        }

        // Fallback: search systematically for first open tile
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (!this.map.isSolid(x, y)) {
                    return { x, y };
                }
            }
        }

        // Ultimate fallback (shouldn't happen)
        console.warn('No open tiles found, defaulting to (1, 1)');
        return { x: 1, y: 1 };
    }
    
    /**
     * Initialize multiplayer networking
     */
    async initMultiplayer(): Promise<void> {
        try {
            // Use a room ID (could be from URL parameter or prompt user)
            const urlParams = new URLSearchParams(window.location.search);
            const roomId = urlParams.get('room') || 'default-room';
            
            console.log(`Initializing multiplayer for room: ${roomId}`);
            this.network = new NetworkManager(roomId);
            
            // Set up callbacks
            this.network.onRemotePlayerAdded((player) => {
                console.log(`Remote player added: ${player.playerId}`);
                this.remotePlayers.push(player);
            });
            
            this.network.onRemotePlayerRemoved((playerId) => {
                console.log(`Remote player removed: ${playerId}`);
                this.remotePlayers = this.remotePlayers.filter(p => p.playerId !== playerId);
            });
            
            // Non-host clients sync enemies from host
            this.network.onEnemiesUpdated((enemyStates) => {
                this.syncEnemiesFromNetwork(enemyStates);
            });
            
            // Listen for projectiles from other players
            this.network.listenForProjectiles((x, y, dx, dy) => {
                const projectile = new Projectile(x, y, dx, dy, 400, 250, 150);
                this.player.projectiles.push(projectile);
            });
            
            // Join the room
            await this.network.joinRoom();
            
            // Set network manager on player
            this.player.network = this.network;
            
            console.log(`Multiplayer initialized. Host: ${this.network.getIsHost()}`);
        } catch (error) {
            console.error('Failed to initialize multiplayer:', error);
            console.log('Continuing in single-player mode');
            this.multiplayerEnabled = false;
        }
    }
    
    /**
     * Sync enemies from network (non-host clients)
     */
    syncEnemiesFromNetwork(enemyStates: EnemyState[]): void {
        // Simple approach: Update existing enemies or create new ones
        // For production, you'd want more sophisticated state reconciliation
        
        // Remove excess enemies
        while (this.npcs.length > enemyStates.length) {
            this.npcs.pop();
        }
        
        // Update or create enemies
        for (let i = 0; i < enemyStates.length; i++) {
            const state = enemyStates[i];
            
            if (i < this.npcs.length) {
                // Update existing enemy
                const enemy = this.npcs[i];
                enemy.x = state.x;
                enemy.y = state.y;
                enemy.health = state.health;
                enemy.isDying = state.isDying;
            } else {
                // Create new enemy
                const enemy = new Enemy(Math.floor(state.x / TILE_SIZE), Math.floor(state.y / TILE_SIZE));
                enemy.x = state.x;
                enemy.y = state.y;
                enemy.health = state.health;
                enemy.isDying = state.isDying;
                this.npcs.push(enemy);
            }
        }
    }

    update(dt: number): void {
        this.player.update(dt, this.map, this.camera);

        // Update flow field only when player moves to a new tile (threshold-based update)
        const playerTile = this.player.getTilePosition();
        if (playerTile.x !== this.lastPlayerTile.x || playerTile.y !== this.lastPlayerTile.y) {
            calculateFlowField(this.flowField, playerTile, this.map);
            this.lastPlayerTile = playerTile;
        }

        this.npcs.forEach(npc => npc.update(dt, this.map, this.flowField, this.player));
        
        // Update all projectiles
        this.player.projectiles.forEach(p => p.update(dt, this.map, this.npcs));
        
        // Count enemies before removal
        const enemiesBeforeRemoval = this.npcs.length;
        
        // Collect dropped items from dead enemies
        this.npcs.forEach(npc => {
            if (npc.health <= -1) {
                const drops = npc.getDroppedItems();
                this.items.push(...drops);
            }
        });
        
        // Remove dead enemies
        this.npcs = this.npcs.filter(npc => npc.health > -1);
        
        // Notify rounds manager of zombie deaths
        const enemiesKilled = enemiesBeforeRemoval - this.npcs.length;
        if (enemiesKilled > 0) {
            for (let i = 0; i < enemiesKilled; i++) {
                this.roundsManager.notifyZombieDeath();
            }
        }
        
        // Update rounds manager
        this.roundsManager.update(dt, this.npcs.length);
        
        // Update items
        this.items.forEach(item => item.update(dt));
        this.items = this.items.filter(item => !item.dead);
        
        // Check item pickups
        this.items.forEach(item => {
            if (item.canPickup(this.player)) {
                item.pickup(this.player);
            }
        });
        
        // Update remote players
        this.remotePlayers.forEach(rp => rp.update(dt, this.map));
        
        // Update multiplayer state
        if (this.network) {
            this.network.updatePlayer(this.player);
            
            // Sync enemies if host
            if (this.network.getIsHost()) {
                this.network.updateEnemies(this.npcs);
            }
        }
        
        this.camera.follow(this.player);
    }

    render(): void {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.map.render(this.ctx, this.camera);
        
        // Render items
        this.items.forEach(item => item.render(this.ctx, this.camera));
        
        this.npcs.forEach(npc => npc.render(this.ctx, this.camera));
        
        // Render remote players
        this.remotePlayers.forEach(rp => rp.render(this.ctx, this.camera));
        
        this.player.render(this.ctx, this.camera);
        
        // Render projectiles
        this.player.projectiles.forEach(p => p.render(this.ctx, this.camera));
        
        // Render UI on top with rounds info
        this.ui.render(this.player, this.roundsManager);
    }

    loop(timestamp: number): void {
        let dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (dt > 0.1) dt = 0.1;

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }
}

window.onload = () => new Game();