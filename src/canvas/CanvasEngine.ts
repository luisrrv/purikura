export class CanvasEngine {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2D context");
        this.ctx = ctx;
    }

    initialize() {
        this.clearCanvas();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawLine(fromX: number, fromY: number, toX: number, toY: number, color = 'black', width = 3) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();
    }
}