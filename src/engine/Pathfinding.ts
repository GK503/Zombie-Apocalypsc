import type { TileMap } from './TileMap';
import type { TilePosition } from './constants';

interface PathNode {
    x: number;
    y: number;
    g: number; // Cost from start
    h: number; // Heuristic to goal
    f: number; // Total cost (g + h)
    parent: PathNode | null;
}

/**
 * Efficient A* pathfinding implementation for tile-based movement
 */
export class Pathfinder {
    /**
     * Manhattan distance heuristic (for 4-directional movement)
     */
    private static heuristic(x1: number, y1: number, x2: number, y2: number): number {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    /**
     * Find path from start to goal using A* algorithm
     * Returns the complete path or null if no path exists
     */
    static findPath(
        startX: number,
        startY: number,
        goalX: number,
        goalY: number,
        map: TileMap,
        maxIterations: number = 1000
    ): TilePosition[] | null {
        // Quick check: if goal is solid, no path exists
        if (map.isSolid(goalX, goalY)) {
            return null;
        }

        // If already at goal
        if (startX === goalX && startY === goalY) {
            return [{ x: startX, y: goalY }];
        }

        const openSet: PathNode[] = [];
        const closedSet = new Set<string>();

        const startNode: PathNode = {
            x: startX,
            y: startY,
            g: 0,
            h: this.heuristic(startX, startY, goalX, goalY),
            f: 0,
            parent: null
        };
        startNode.f = startNode.g + startNode.h;
        openSet.push(startNode);

        const getKey = (x: number, y: number) => `${x},${y}`;

        let iterations = 0;

        while (openSet.length > 0 && iterations < maxIterations) {
            iterations++;

            // Find node with lowest f score (using simple sort for now, could optimize with binary heap)
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift()!;

            // Goal reached
            if (current.x === goalX && current.y === goalY) {
                return this.reconstructPath(current);
            }

            closedSet.add(getKey(current.x, current.y));

            // Check 4 directions (up, down, left, right)
            const neighbors = [
                { x: current.x, y: current.y - 1 }, // Up
                { x: current.x, y: current.y + 1 }, // Down
                { x: current.x - 1, y: current.y }, // Left
                { x: current.x + 1, y: current.y }  // Right
            ];

            for (const neighbor of neighbors) {
                const key = getKey(neighbor.x, neighbor.y);

                // Skip if out of bounds, solid, or already evaluated
                if (!map.isValidTile(neighbor.x, neighbor.y) ||
                    map.isSolid(neighbor.x, neighbor.y) ||
                    closedSet.has(key)) {
                    continue;
                }

                const g = current.g + 1; // Cost is 1 per tile
                const h = this.heuristic(neighbor.x, neighbor.y, goalX, goalY);
                const f = g + h;

                // Check if this neighbor is already in open set
                const existingIndex = openSet.findIndex(n => n.x === neighbor.x && n.y === neighbor.y);

                if (existingIndex === -1) {
                    // Add to open set
                    openSet.push({
                        x: neighbor.x,
                        y: neighbor.y,
                        g,
                        h,
                        f,
                        parent: current
                    });
                } else if (g < openSet[existingIndex].g) {
                    // Update if we found a better path
                    openSet[existingIndex].g = g;
                    openSet[existingIndex].f = f;
                    openSet[existingIndex].parent = current;
                }
            }
        }

        // No path found
        return null;
    }

    /**
     * Reconstruct the path from goal to start
     */
    private static reconstructPath(node: PathNode): TilePosition[] {
        const path: { x: number; y: number }[] = [];
        let current: PathNode | null = node;

        while (current !== null) {
            path.unshift({ x: current.x, y: current.y });
            current = current.parent;
        }

        return path;
    }

    /**
     * Get just the next step towards the goal (most efficient for real-time use)
     * Returns null if no path exists, or the next tile position to move to
     */
    static getNextStep(
        startX: number,
        startY: number,
        goalX: number,
        goalY: number,
        map: TileMap
    ): TilePosition | null {
        const path = this.findPath(startX, startY, goalX, goalY, map, 500);
        if (!path || path.length < 2) {
            return null;
        }
        // Return second element (first is current position)
        return path[1];
    }
}

/**
 * Cached pathfinding for entities that need to follow paths over multiple frames
 */
export class CachedPath {
    path: TilePosition[] | null = null;
    currentIndex: number = 0;
    targetX: number = -1;
    targetY: number = -1;
    
    /**
     * Get the next step in the cached path, recalculating if necessary
     */
    getNextStep(
        currentX: number,
        currentY: number,
        targetX: number,
        targetY: number,
        map: TileMap,
        forceRecalculate: boolean = false
    ): TilePosition | null {
        // Recalculate if target changed or path invalid or forced
        if (forceRecalculate ||
            this.targetX !== targetX ||
            this.targetY !== targetY ||
            !this.path ||
            this.currentIndex >= this.path.length) {
            
            this.path = Pathfinder.findPath(currentX, currentY, targetX, targetY, map, 500);
            this.currentIndex = 0;
            this.targetX = targetX;
            this.targetY = targetY;
        }

        if (!this.path || this.path.length < 2) {
            return null;
        }

        // Find current position in path
        while (this.currentIndex < this.path.length - 1) {
            const node = this.path[this.currentIndex];
            if (node.x === currentX && node.y === currentY) {
                // Return next node
                return this.path[this.currentIndex + 1];
            }
            this.currentIndex++;
        }

        // If we're at the end or lost, recalculate
        if (this.currentIndex >= this.path.length - 1) {
            return this.getNextStep(currentX, currentY, targetX, targetY, map, true);
        }

        return null;
    }

    /**
     * Clear the cached path
     */
    clear(): void {
        this.path = null;
        this.currentIndex = 0;
        this.targetX = -1;
        this.targetY = -1;
    }
}
