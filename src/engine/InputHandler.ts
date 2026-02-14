export class InputHandler {
    keys: Record<string, boolean>;
    mouseX: number = 0;
    mouseY: number = 0;
    mouseDown: boolean = false;
    mouseJustPressed: boolean = false;
    canvas: HTMLCanvasElement | null = null;

    constructor() {
        this.keys = {};
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e: KeyboardEvent) => {
            this.keys[e.code] = false;
        });
    }

    /**
     * Initialize mouse tracking on a canvas
     */
    initMouse(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        
        canvas.addEventListener('mousemove', (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        
        canvas.addEventListener('mousedown', (e: MouseEvent) => {
            if (e.button === 0) { // Left click
                this.mouseDown = true;
                this.mouseJustPressed = true;
            }
        });
        
        canvas.addEventListener('mouseup', (e: MouseEvent) => {
            if (e.button === 0) {
                this.mouseDown = false;
            }
        });
        
        canvas.addEventListener('mouseleave', () => {
            this.mouseDown = false;
        });
    }

    /**
     * Get world coordinates from mouse position
     */
    getWorldMouse(cameraX: number, cameraY: number): { x: number, y: number } {
        return {
            x: this.mouseX + cameraX,
            y: this.mouseY + cameraY
        };
    }

    /**
     * Clear just-pressed flag (call this after processing input)
     */
    clearMouseJustPressed(): void {
        this.mouseJustPressed = false;
    }

    isDown(code: string): boolean {
        return this.keys[code] === true;
    }

    /**
     * Check if a key was just pressed this frame
     */
    wasJustPressed(code: string): boolean {
        // This is a simple implementation - you might want to track key states per frame
        return this.keys[code] === true;
    }
}