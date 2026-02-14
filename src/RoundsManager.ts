/**
 * Manages game rounds with exponentially increasing zombie difficulty
 */

export const RoundState = {
    WAITING: 'waiting',      // Waiting for round to start
    SPAWNING: 'spawning',    // Spawning zombies
    ACTIVE: 'active',        // Round in progress
    COMPLETED: 'completed'   // All zombies dead
} as const;

export type RoundState = typeof RoundState[keyof typeof RoundState];

export interface RoundConfig {
    roundNumber: number;
    zombiesTotal: number;
    zombiesSpawned: number;
    zombiesRemaining: number;
    state: RoundState;
    startTime: number;
    completionTime?: number;
}

export class RoundsManager {
    private currentRound: number = 0;
    private state: RoundState = RoundState.WAITING;
    private zombiesTotal: number = 0;
    private zombiesSpawned: number = 0;
    private zombiesRemaining: number = 0;
    private startTime: number = 0;
    private completionTime?: number;
    
    // Round configuration
    private baseZombieCount: number = 5;
    private roundExponent: number = 1.5;  // Exponential growth factor
    private roundMultiplier: number = 1.0; // Additional linear scaling
    
    // Spawn timing
    private spawnInterval: number = 2.0; // seconds between spawns
    private lastSpawnTime: number = 0;
    
    // Callbacks
    private onSpawnZombieCallback?: (roundNumber: number, zombieIndex: number) => void;
    private onRoundStartCallback?: (roundNumber: number, zombieCount: number) => void;
    private onRoundCompleteCallback?: (roundNumber: number, duration: number) => void;
    private onSpawnItemsCallback?: (roundNumber: number, itemCount: number) => void;
    
    constructor() {
        this.reset();
    }
    
    /**
     * Reset to first round
     */
    reset(): void {
        this.currentRound = 0;
        this.state = RoundState.WAITING;
        this.zombiesTotal = 0;
        this.zombiesSpawned = 0;
        this.zombiesRemaining = 0;
        this.startTime = 0;
        this.completionTime = undefined;
    }
    
    /**
     * Calculate zombie count for a given round
     * Formula: base * (round ^ exponent) * multiplier
     */
    calculateZombieCount(round: number): number {
        const count = Math.floor(
            this.baseZombieCount * 
            Math.pow(round, this.roundExponent) * 
            this.roundMultiplier
        );
        return Math.max(count, this.baseZombieCount);
    }
    
    /**
     * Start the next round
     */
    startNextRound(): void {
        this.currentRound++;
        this.zombiesTotal = this.calculateZombieCount(this.currentRound);
        this.zombiesSpawned = 0;
        this.zombiesRemaining = this.zombiesTotal;
        this.state = RoundState.SPAWNING;
        this.startTime = Date.now();
        this.completionTime = undefined;
        this.lastSpawnTime = 0;
        
        console.log(`Round ${this.currentRound} started: ${this.zombiesTotal} zombies`);
        
        if (this.onRoundStartCallback) {
            this.onRoundStartCallback(this.currentRound, this.zombiesTotal);
        }
        
        // Spawn items at round start
        const itemCount = Math.floor(this.zombiesTotal / 3); // zombies / 3, rounded down
        if (itemCount > 0 && this.onSpawnItemsCallback) {
            this.onSpawnItemsCallback(this.currentRound, itemCount);
        }
    }
    
    /**
     * Update round state
     */
    update(dt: number, currentEnemyCount: number): void {
        switch (this.state) {
            case RoundState.WAITING:
                // Auto-start first round
                if (this.currentRound === 0) {
                    this.startNextRound();
                }
                break;
                
            case RoundState.SPAWNING:
                this.updateSpawning(dt);
                
                // Check if all spawned
                if (this.zombiesSpawned >= this.zombiesTotal) {
                    this.state = RoundState.ACTIVE;
                    console.log(`Round ${this.currentRound}: All zombies spawned, round active`);
                }
                break;
                
            case RoundState.ACTIVE:
                // Update remaining count based on actual enemies alive
                this.zombiesRemaining = currentEnemyCount;
                
                // Check if round complete
                if (this.zombiesRemaining <= 0) {
                    this.completeRound();
                }
                break;
                
            case RoundState.COMPLETED:
                // Auto-start next round after brief delay
                if (this.completionTime) {
                    const timeSinceComplete = Date.now() - this.completionTime;
                    if (timeSinceComplete > 3000) { // 3 second delay
                        this.startNextRound();
                    }
                }
                break;
        }
    }
    
    /**
     * Handle spawning phase
     */
    private updateSpawning(dt: number): void {
        this.lastSpawnTime += dt;
        
        // Spawn zombie if enough time passed
        if (this.lastSpawnTime >= this.spawnInterval && 
            this.zombiesSpawned < this.zombiesTotal) {
            
            this.spawnZombie();
            this.lastSpawnTime = 0;
        }
    }
    
    /**
     * Spawn a zombie
     */
    private spawnZombie(): void {
        if (this.zombiesSpawned >= this.zombiesTotal) return;
        
        this.zombiesSpawned++;
        this.zombiesRemaining++;
        
        if (this.onSpawnZombieCallback) {
            this.onSpawnZombieCallback(this.currentRound, this.zombiesSpawned);
        }
    }
    
    /**
     * Complete the current round
     */
    private completeRound(): void {
        this.state = RoundState.COMPLETED;
        this.completionTime = Date.now();
        
        const duration = (this.completionTime - this.startTime) / 1000;
        console.log(`Round ${this.currentRound} completed in ${duration.toFixed(1)}s`);
        
        if (this.onRoundCompleteCallback) {
            this.onRoundCompleteCallback(this.currentRound, duration);
        }
    }
    
    /**
     * Manually decrement zombie count (when a zombie dies)
     */
    notifyZombieDeath(): void {
        if (this.zombiesRemaining > 0) {
            this.zombiesRemaining--;
        }
    }
    
    /**
     * Get current round info
     */
    getRoundInfo(): RoundConfig {
        return {
            roundNumber: this.currentRound,
            zombiesTotal: this.zombiesTotal,
            zombiesSpawned: this.zombiesSpawned,
            zombiesRemaining: this.zombiesRemaining,
            state: this.state,
            startTime: this.startTime,
            completionTime: this.completionTime
        };
    }
    
    /**
     * Register callback for when a zombie should be spawned
     */
    onSpawnZombie(callback: (roundNumber: number, zombieIndex: number) => void): void {
        this.onSpawnZombieCallback = callback;
    }
    
    /**
     * Register callback for when a round starts
     */
    onRoundStart(callback: (roundNumber: number, zombieCount: number) => void): void {
        this.onRoundStartCallback = callback;
    }
    
    /**
     * Register callback for when items should be spawned
     */
    onSpawnItems(callback: (roundNumber: number, itemCount: number) => void): void {
        this.onSpawnItemsCallback = callback;
    }
    
    /**
     * Get progress percentage for current round
     */
    getProgress(): number {
        if (this.zombiesTotal === 0) return 0;
        const killed = this.zombiesTotal - this.zombiesRemaining;
        return (killed / this.zombiesTotal) * 100;
    }
    
    /**
     * Check if we're between rounds
     */
    isBetweenRounds(): boolean {
        return this.state === RoundState.COMPLETED || 
               this.state === RoundState.WAITING;
    }
    
    /**
     * Force start next round (for testing/debugging)
     */
    forceNextRound(): void {
        if (this.state === RoundState.COMPLETED || 
            this.state === RoundState.WAITING) {
            this.startNextRound();
        }
    }
    
    /**
     * Register callback for when a round completes
     */
    onRoundComplete(callback: (roundNumber: number, duration: number) => void): void {
        this.onRoundCompleteCallback = callback;
    }
    
    /**
     * Get zombie spawn locations at edges of map on open tiles
     */
    getSpawnPosition(mapWidth: number, mapHeight: number, isOpenTile: (x: number, y: number) => boolean): { x: number; y: number } {
        const maxAttempts = 50;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            // Spawn at random edge of map
            const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
            
            let x = 0;
            let y = 0;
            
            const margin = 1; // tiles from edge
            
            switch (edge) {
                case 0: // Top
                    x = Math.floor(margin + Math.random() * (mapWidth - 2 * margin));
                    y = margin;
                    break;
                case 1: // Right
                    x = mapWidth - margin - 1;
                    y = Math.floor(margin + Math.random() * (mapHeight - 2 * margin));
                    break;
                case 2: // Bottom
                    x = Math.floor(margin + Math.random() * (mapWidth - 2 * margin));
                    y = mapHeight - margin - 1;
                    break;
                case 3: // Left
                    x = margin;
                    y = Math.floor(margin + Math.random() * (mapHeight - 2 * margin));
                    break;
            }
            
            // Check if tile is open
            if (isOpenTile(x, y)) {
                return { x, y };
            }
            
            attempts++;
        }
        
        // Fallback: try to find any open tile near edges
        for (let i = 0; i < maxAttempts; i++) {
            const x = Math.floor(Math.random() * mapWidth);
            const y = Math.floor(Math.random() * mapHeight);
            
            if (isOpenTile(x, y)) {
                return { x, y };
            }
        }
        
        // Ultimate fallback (shouldn't happen)
        console.warn('No open spawn position found, using fallback');
        return { x: Math.floor(mapWidth / 2), y: Math.floor(mapHeight / 2) };
    }
}
