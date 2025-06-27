type Sticker = {
    id: string;
    img: HTMLImageElement;
    x: number;
    y: number;
    width: number;
    height: number;
};

type Mode = 'draw' | 'select';

interface ExportStrategy {
    export(canvas: HTMLCanvasElement): void;
}

export class CanvasEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null = null;

    // State: current tool mode
    private mode: Mode = 'draw';

    // Observer: listeners
    private listeners = new Set<() => void>();

    // Drawing storage
    private drawings: { x1: number; y1: number; x2: number; y2: number; color: string; size: number }[] = [];

    // Background image + positioning
    private backgroundImage: HTMLImageElement | null = null;
    private bgImageX = 0;
    private bgImageY = 0;
    private bgImageScale = 1;
    private isDraggingBgImage = false;
    private bgDragOffset = { x: 0, y: 0 };

    // Stickers
    private stickers: Sticker[] = [];
    private selectedStickerId: string | null = null;

    // Strategy placeholder for export (no implementation)
    private exportStrategy?: ExportStrategy;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    initialize() {
        this.clearCanvas();
        if (this.backgroundImage) {
            this.drawBackgroundImage();
        }
        this.drawUserDrawings();
        this.drawStickers();
        this.notify();
    }

    // Observer: subscribe to changes
    onChange(callback: () => void) {
        this.listeners.add(callback);
    }
    offChange(callback: () => void) {
        this.listeners.delete(callback);
    }
    private notify() {
        this.listeners.forEach((fn) => fn());
    }

    // State: change current mode
    setMode(mode: Mode) {
        this.mode = mode;
        this.notify();
    }
    getMode(): Mode {
        return this.mode;
    }

    // Drawing methods
    drawLine(x1: number, y1: number, x2: number, y2: number, color: string, size: number) {
        if (!this.ctx || this.mode !== 'draw') return;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = size;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        this.drawings.push({ x1, y1, x2, y2, color, size });
        this.notify();
    }
    private drawUserDrawings() {
        if (!this.ctx) return;
        for (const d of this.drawings) {
            this.ctx.strokeStyle = d.color;
            this.ctx.lineWidth = d.size;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(d.x1, d.y1);
            this.ctx.lineTo(d.x2, d.y2);
            this.ctx.stroke();
        }
    }

    // Background image (set, fit, draw)
    setBackgroundImage(imageSrc: string) {
        if (!this.ctx) return;
        const img = new Image();
        img.onload = () => {
            this.backgroundImage = img;
            this.calculateBgImageFit();
            this.draw();
            this.notify();
        };
        img.src = imageSrc;
    }
    private calculateBgImageFit() {
        if (!this.backgroundImage) return;
        const canvasW = this.canvas.width;
        const canvasH = this.canvas.height;
        const imgW = this.backgroundImage.width;
        const imgH = this.backgroundImage.height;

        const scaleX = canvasW / imgW;
        const scaleY = canvasH / imgH;
        this.bgImageScale = Math.min(scaleX, scaleY);

        this.bgImageX = (canvasW - imgW * this.bgImageScale) / 2;
        this.bgImageY = (canvasH - imgH * this.bgImageScale) / 2;
    }
    private drawBackgroundImage() {
        if (!this.ctx || !this.backgroundImage) return;
        this.ctx.drawImage(
            this.backgroundImage,
            this.bgImageX,
            this.bgImageY,
            this.backgroundImage.width * this.bgImageScale,
            this.backgroundImage.height * this.bgImageScale,
        );
    }

    // Factory: sticker creation encapsulated here
    private createSticker(imageSrc: string, x: number, y: number, width: number, height: number): Sticker {
        const id = Math.random().toString(36).substr(2, 9);
        const img = new Image();
        img.src = imageSrc;
        return { id, img, x, y, width, height };
    }

    addSticker(imageSrc: string, x: number, y: number, width: number, height: number) {
        const sticker = this.createSticker(imageSrc, x, y, width, height);
        sticker.img.onload = () => {
            this.stickers.push(sticker);
            this.draw();
            this.notify();
        };
    }

    drawStickers() {
        if (!this.ctx) return;
        for (const sticker of this.stickers) {
            this.ctx.drawImage(sticker.img, sticker.x, sticker.y, sticker.width, sticker.height);
            // No border on selection for now
        }
    }

    draw() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.backgroundImage) this.drawBackgroundImage();
        this.drawUserDrawings();
        this.drawStickers();
    }

    clearCanvas() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.backgroundImage = null;
        this.stickers = [];
        this.selectedStickerId = null;
        this.drawings = [];
        this.notify();
    }

    clearDrawingsOnly() {
        this.drawings = [];
        this.draw();
        this.notify();
    }

    // Background image dragging methods (only update internal state here)
    isBgImageHit(pos: { x: number; y: number }) {
        if (!this.backgroundImage) return false;
        const w = this.backgroundImage.width * this.bgImageScale;
        const h = this.backgroundImage.height * this.bgImageScale;
        return pos.x >= this.bgImageX && pos.x <= this.bgImageX + w && pos.y >= this.bgImageY && pos.y <= this.bgImageY + h;
    }
    startDraggingBgImage(pos: { x: number; y: number }) {
        this.bgDragOffset.x = pos.x - this.bgImageX;
        this.bgDragOffset.y = pos.y - this.bgImageY;
        this.isDraggingBgImage = true;
    }
    dragBgImageTo(pos: { x: number; y: number }) {
        if (!this.isDraggingBgImage) return;
        this.bgImageX = pos.x - this.bgDragOffset.x;
        this.bgImageY = pos.y - this.bgDragOffset.y;
    }
    stopDraggingBgImage() {
        this.isDraggingBgImage = false;
    }

    // Stickers selection and movement
    selectStickerAt(x: number, y: number) {
        for (let i = this.stickers.length - 1; i >= 0; i--) {
            const s = this.stickers[i];
            if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) {
                this.selectedStickerId = s.id;
                this.draw();
                this.notify();
                return s;
            }
        }
        this.selectedStickerId = null;
        this.draw();
        this.notify();
        return null;
    }
    moveSelectedSticker(dx: number, dy: number) {
        if (!this.selectedStickerId) return;
        const sticker = this.stickers.find(s => s.id === this.selectedStickerId);
        if (!sticker) return;
        sticker.x += dx;
        sticker.y += dy;
        this.draw();
        this.notify();
    }

    // Export strategy setter (no implementation, just placeholder)
    setExportStrategy(strategy: ExportStrategy) {
        this.exportStrategy = strategy;
    }
    export() {
        if (!this.exportStrategy) throw new Error('No export strategy set');
        this.exportStrategy.export(this.canvas);
    }
}