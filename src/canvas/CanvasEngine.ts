export class CanvasEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null = null;
    private backgroundImage: HTMLImageElement | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    initialize() {
        if (this.canvas && this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.backgroundImage) {
                this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }

    drawLine(x1: number, y1: number, x2: number, y2: number, color: string, size: number) {
        if (!this.ctx) return;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = size;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    drawImage(imageSrc: string) {
        if (!this.canvas || !this.ctx) return;
        const img = new Image();
        img.onload = () => {
            this.backgroundImage = img;
            this.ctx?.drawImage(img, 0, 0, this.canvas!.width, this.canvas!.height);
        };
        img.src = imageSrc;
    }

    clearCanvas() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.backgroundImage = null;
    }

    clearDrawingsOnly() {
        if (!this.canvas || !this.ctx) return;

        // Clear everything
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Redraw the background image if exists
        if (this.backgroundImage) {
            this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
        }
    }
}