import { database } from './firebase-config';
import { ref, onValue, set, push, onDisconnect, serverTimestamp, get, off } from 'firebase/database';
import type { Player } from './Player';
import { RemotePlayer } from './RemotePlayer';
import type { Enemy } from './Enemy';

export interface EnemyState {
    x: number;
    y: number;
    health: number;
    isDying: boolean;
}

/**
 * NetworkManager handles all Firebase multiplayer operations
 * Implements efficient state synchronization with throttling and delta updates
 */
export class NetworkManager {
    private roomId: string;
    private playerId: string;
    private isHost: boolean = false;
    
    private lastPositionUpdate: number = 0;
    private readonly POSITION_UPDATE_INTERVAL = 50; // 20 updates per second max
    
    private lastEnemyUpdate: number = 0;
    private readonly ENEMY_UPDATE_INTERVAL = 100; // 10 updates per second for enemies
    
    private remotePlayers: Map<string, RemotePlayer> = new Map();
    private listeners: Array<() => void> = [];
    
    private onRemotePlayerAddedCallback?: (player: RemotePlayer) => void;
    private onRemotePlayerRemovedCallback?: (playerId: string) => void;
    private onEnemiesUpdatedCallback?: (enemies: EnemyState[]) => void;
    
    constructor(roomId: string) {
        this.roomId = roomId;
        this.playerId = this.generatePlayerId();
    }
    
    /**
     * Generate unique player ID
     */
    private generatePlayerId(): string {
        return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Join a multiplayer room
     */
    async joinRoom(): Promise<void> {
        console.log(`Joining room: ${this.roomId} as ${this.playerId}`);
        
        // Check if this is the first player (becomes host)
        const roomRef = ref(database, `rooms/${this.roomId}/players`);
        const snapshot = await get(roomRef);
        this.isHost = !snapshot.exists() || Object.keys(snapshot.val()).length === 0;
        
        if (this.isHost) {
            console.log('You are the host! Managing enemies.');
        }
        
        // Register this player
        const playerRef = ref(database, `rooms/${this.roomId}/players/${this.playerId}`);
        await set(playerRef, {
            id: this.playerId,
            joinedAt: serverTimestamp(),
            x: 0,
            y: 0,
            health: 100,
            currentAnim: 'idle_down',
            facingX: 0,
            facingY: 1
        });
        
        // Clean up on disconnect
        onDisconnect(playerRef).remove();
        
        // Listen for other players
        this.listenForPlayers();
        
        // Listen for enemy updates if not host
        if (!this.isHost) {
            this.listenForEnemies();
        }
    }
    
    /**
     * Listen for other players joining/leaving
     */
    private listenForPlayers(): void {
        const playersRef = ref(database, `rooms/${this.roomId}/players`);
        
        onValue(playersRef, (snapshot) => {
            if (!snapshot.exists()) return;
            
            const players = snapshot.val();
            const currentPlayerIds = new Set<string>();
            
            // Update or add remote players
            for (const [id, data] of Object.entries(players)) {
                if (id === this.playerId) continue; // Skip self
                
                currentPlayerIds.add(id);
                const playerData = data as any;
                
                if (this.remotePlayers.has(id)) {
                    // Update existing player
                    const remotePlayer = this.remotePlayers.get(id)!;
                    remotePlayer.updateFromNetwork({
                        x: playerData.x,
                        y: playerData.y,
                        health: playerData.health,
                        currentAnim: playerData.currentAnim || 'idle_down',
                        facingX: playerData.facingX || 0,
                        facingY: playerData.facingY || 1,
                        timestamp: Date.now()
                    });
                } else {
                    // Add new player
                    const remotePlayer = new RemotePlayer(id, playerData.x, playerData.y);
                    this.remotePlayers.set(id, remotePlayer);
                    
                    if (this.onRemotePlayerAddedCallback) {
                        this.onRemotePlayerAddedCallback(remotePlayer);
                    }
                    
                    console.log(`Player ${id} joined`);
                }
            }
            
            // Remove disconnected players
            for (const [id] of this.remotePlayers.entries()) {
                if (!currentPlayerIds.has(id)) {
                    this.remotePlayers.delete(id);
                    
                    if (this.onRemotePlayerRemovedCallback) {
                        this.onRemotePlayerRemovedCallback(id);
                    }
                    
                    console.log(`Player ${id} left`);
                }
            }
        });
        
        this.listeners.push(() => off(playersRef));
    }
    
    /**
     * Update local player state to Firebase (throttled)
     */
    updatePlayer(player: Player): void {
        const now = Date.now();
        
        // Throttle updates to reduce Firebase writes
        if (now - this.lastPositionUpdate < this.POSITION_UPDATE_INTERVAL) {
            return;
        }
        
        this.lastPositionUpdate = now;
        
        const playerRef = ref(database, `rooms/${this.roomId}/players/${this.playerId}`);
        set(playerRef, {
            id: this.playerId,
            x: Math.round(player.x * 10) / 10, // Round to 1 decimal to reduce data size
            y: Math.round(player.y * 10) / 10,
            health: player.health,
            currentAnim: player.currentAnim,
            facingX: player.facingX,
            facingY: player.facingY,
            timestamp: serverTimestamp()
        });
    }
    
    /**
     * Get all remote players
     */
    getRemotePlayers(): RemotePlayer[] {
        return Array.from(this.remotePlayers.values());
    }
    
    /**
     * Update enemies state to Firebase (host only, throttled)
     */
    updateEnemies(enemies: Enemy[]): void {
        if (!this.isHost) return;
        
        const now = Date.now();
        
        // Throttle enemy updates
        if (now - this.lastEnemyUpdate < this.ENEMY_UPDATE_INTERVAL) {
            return;
        }
        
        this.lastEnemyUpdate = now;
        
        // Only sync essential enemy data
        const enemyStates: EnemyState[] = enemies
            .filter(e => e.health > 0 || e.isDying) // Only sync living or dying enemies
            .map(e => ({
                x: Math.round(e.x * 10) / 10,
                y: Math.round(e.y * 10) / 10,
                health: e.health,
                isDying: e.isDying
            }));
        
        const enemiesRef = ref(database, `rooms/${this.roomId}/enemies`);
        set(enemiesRef, {
            states: enemyStates,
            timestamp: serverTimestamp()
        });
    }
    
    /**
     * Listen for enemy updates (non-host clients)
     */
    private listenForEnemies(): void {
        const enemiesRef = ref(database, `rooms/${this.roomId}/enemies`);
        
        onValue(enemiesRef, (snapshot) => {
            if (!snapshot.exists()) return;
            
            const data = snapshot.val();
            if (data.states && this.onEnemiesUpdatedCallback) {
                this.onEnemiesUpdatedCallback(data.states);
            }
        });
        
        this.listeners.push(() => off(enemiesRef));
    }
    
    /**
     * Sync projectile fired event
     */
    sendProjectile(x: number, y: number, dx: number, dy: number): void {
        const projectilesRef = ref(database, `rooms/${this.roomId}/projectiles`);
        const newProjectileRef = push(projectilesRef);
        
        set(newProjectileRef, {
            playerId: this.playerId,
            x: Math.round(x * 10) / 10,
            y: Math.round(y * 10) / 10,
            dx: Math.round(dx * 100) / 100,
            dy: Math.round(dy * 100) / 100,
            timestamp: serverTimestamp()
        });
    }
    
    /**
     * Listen for projectiles from other players
     */
    listenForProjectiles(callback: (x: number, y: number, dx: number, dy: number, playerId: string) => void): void {
        const projectilesRef = ref(database, `rooms/${this.roomId}/projectiles`);
        
        onValue(projectilesRef, (snapshot) => {
            if (!snapshot.exists()) return;
            
            const projectiles = snapshot.val();
            const now = Date.now();
            
            for (const data of Object.values(projectiles)) {
                const projectile = data as any;
                
                // Only process recent projectiles from other players
                if (projectile.playerId !== this.playerId && 
                    now - (projectile.timestamp || 0) < 1000) {
                    callback(projectile.x, projectile.y, projectile.dx, projectile.dy, projectile.playerId);
                }
            }
        });
        
        this.listeners.push(() => off(projectilesRef));
    }
    
    /**
     * Register callback for when remote players are added
     */
    onRemotePlayerAdded(callback: (player: RemotePlayer) => void): void {
        this.onRemotePlayerAddedCallback = callback;
    }
    
    /**
     * Register callback for when remote players are removed
     */
    onRemotePlayerRemoved(callback: (playerId: string) => void): void {
        this.onRemotePlayerRemovedCallback = callback;
    }
    
    /**
     * Register callback for enemy updates
     */
    onEnemiesUpdated(callback: (enemies: EnemyState[]) => void): void {
        this.onEnemiesUpdatedCallback = callback;
    }
    
    /**
     * Check if this client is the host
     */
    getIsHost(): boolean {
        return this.isHost;
    }
    
    /**
     * Get player ID
     */
    getPlayerId(): string {
        return this.playerId;
    }
    
    /**
     * Leave the room and clean up
     */
    async leaveRoom(): Promise<void> {
        console.log('Leaving room...');
        
        // Remove player from Firebase
        const playerRef = ref(database, `rooms/${this.roomId}/players/${this.playerId}`);
        await set(playerRef, null);
        
        // Clean up listeners
        for (const cleanup of this.listeners) {
            cleanup();
        }
        
        this.listeners = [];
        this.remotePlayers.clear();
    }
}
