// Sprite can now hold an Image (standard) or ImageBitmap (optimized/GIF frame)
export interface Sprite {
    image: CanvasImageSource;
    x: number;
    y: number;
    w: number;
    h: number;
}

export class SpriteLoader {
    /**
     * Loads a single image as a Sprite.
     */
    static load(src: string): Sprite {
        const img = new Image();
        img.src = src;
        
        const sprite: Sprite = {
            image: img,
            x: 0, y: 0, w: 0, h: 0
        };

        img.onload = () => {
            sprite.w = img.width;
            sprite.h = img.height;
        };

        return sprite;
    }

    /**
     * Loads a list of images as a sequence.
     */
    static loadAnim(srcs: string[]): Sprite[] {
        return srcs.map(src => this.load(src));
    }

    /**
     * Loads a specific row from a spritesheet.
     */
    static load_spritesheet_row(src: string, row: number, cols: number, w: number, h: number): Sprite[] {
        const frames: Sprite[] = [];
        const img = new Image();
        img.src = src;
        
        img.onload = () => {
            for (let c = 0; c < cols; c++) {
                frames.push({
                    image: img,
                    x: c * w,
                    y: row * h,
                    w: w,
                    h: h
                });
            }
        };
        
        return frames;
    }

    /**
     * Loads an animated GIF and extracts its frames.
     * Uses the modern ImageDecoder API for performance.
     */
    static from_gif(src: string): Sprite[] {
        const frames: Sprite[] = [];

        // Check for WebCodecs support (Modern Browsers)
        if ('ImageDecoder' in window) {
            fetch(src).then(response => {
                if (!response.body) return;
                
                // @ts-ignore - ImageDecoder is part of WebCodecs API
                const decoder = new ImageDecoder({ data: response.body, type: 'image/gif' });
                
                const processFrames = async () => {
                    try {
                        // Decode all frames
                        for (let i = 0; ; i++) {
                            const result = await decoder.decode({ frameIndex: i });
                            
                            // Convert VideoFrame to ImageBitmap (GPU friendly)
                            const bmp = await createImageBitmap(result.image);
                            result.image.close(); // Release resource
                            
                            frames.push({
                                image: bmp,
                                x: 0, 
                                y: 0, 
                                w: bmp.width, 
                                h: bmp.height
                            });

                            if (result.complete) break;
                        }
                    } catch (err) {
                        console.log("Error decoding GIF");
                    }
                };
                processFrames();
            }).catch(e => console.error("Failed to load GIF:", src, e));
        } else {
            console.warn("ImageDecoder not supported. GIF will be static.");
            frames.push(this.load(src));
        }

        return frames;
    }
}