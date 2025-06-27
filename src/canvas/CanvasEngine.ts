type Sticker = {
    id: string;
    img: HTMLImageElement;
    x: number;
    y: number;
    width: number;
    height: number;
    isSelected?: boolean;
};

export class CanvasEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null = null;

    private drawings: { x1: number; y1: number; x2: number; y2: number; color: string; size: number }[] = [];

    // Background image and positioning/scale for contain fit + dragging
    private backgroundImage: HTMLImageElement | null = null;
    private bgImageX = 0;
    private bgImageY = 0;
    private bgImageScale = 1;
    private isDraggingBgImage = false;
    private bgDragOffset = { x: 0, y: 0 };

    // Stickers
    private stickers: Sticker[] = [];
    private selectedStickerId: string | null = null;

    // Drawing state tracking
    // private lastDrawPoint: { x: number; y: number } | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    initialize() {
        this.clearCanvas();
        if (this.backgroundImage) {
            this.drawBackgroundImage();
        }
        this.drawStickers();
    }

    // Freehand drawing line
    drawLine(x1: number, y1: number, x2: number, y2: number, color: string, size: number) {
        if (!this.ctx) return;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = size;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        // Store the stroke for redraw
        this.drawings.push({ x1, y1, x2, y2, color, size });
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

    // Load and set background image, fit contained
    setBackgroundImage(imageSrc: string) {
        if (!this.ctx) return;
        const img = new Image();
        img.onload = () => {
            this.backgroundImage = img;
            this.calculateBgImageFit();
            this.draw();
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

        // Center image
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
            this.backgroundImage.height * this.bgImageScale
        );
    }

    // Stickers

    addSticker(imageSrc: string, x: number, y: number, width: number, height: number) {
        const img = new Image();
        img.onload = () => {
            const id = Math.random().toString(36).substr(2, 9);
            this.stickers.push({ id, img, x, y, width, height });
            this.draw();
        };
        img.src = imageSrc;
    }

    drawStickers() {
        if (!this.ctx) return;
        for (const sticker of this.stickers) {
            this.ctx.drawImage(sticker.img, sticker.x, sticker.y, sticker.width, sticker.height);
            // if (sticker.isSelected) {
            //     this.ctx.strokeStyle = 'blue';
            //     this.ctx.lineWidth = 2;
            //     this.ctx.strokeRect(sticker.x, sticker.y, sticker.width, sticker.height);
            // }
        }
    }

    // Draw full canvas
    draw() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.backgroundImage) {
            this.drawBackgroundImage();
        }

        this.drawUserDrawings();
        this.drawStickers();
    }

    clearCanvas() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.backgroundImage = null;
        this.stickers = [];
        this.selectedStickerId = null;
    }

    clearDrawingsOnly() {
        this.drawings = [];
        this.draw();
    }

    // Background image dragging

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

    // Stickers selection and moving

    selectStickerAt(x: number, y: number) {
        for (let i = this.stickers.length - 1; i >= 0; i--) {
            const s = this.stickers[i];
            if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) {
                this.selectedStickerId = s.id;
                this.stickers.forEach(st => (st.isSelected = st.id === s.id));
                this.draw();
                return s;
            }
        }
        this.selectedStickerId = null;
        this.stickers.forEach(st => (st.isSelected = false));
        this.draw();
        return null;
    }

    moveSelectedSticker(dx: number, dy: number) {
        if (!this.selectedStickerId) return;
        const sticker = this.stickers.find(s => s.id === this.selectedStickerId);
        if (!sticker) return;
        sticker.x += dx;
        sticker.y += dy;
        this.draw();
    }

    // Optional: methods for resizing/removing stickers can be added here
}