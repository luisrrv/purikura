import { useRef, useState, useEffect, useCallback } from 'react';
import { useCanvasEngine } from '../hooks/useCanvasEngine';
import { FaFileImage, FaStickyNote, FaTrash, FaSave, FaPen, FaMousePointer } from 'react-icons/fa';

const STICKER_EMOJIS = ['😀', '😍', '👍', '🔥', '🐱', '🌟', '🎉'];

export function CanvasEditor() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engine = useCanvasEngine(canvasRef);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [drawMode, setDrawMode] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
    const [brushColor, setBrushColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(3);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [isDraggingSticker, setIsDraggingSticker] = useState(false);
    const [lastPointerPos, setLastPointerPos] = useState<{ x: number; y: number } | null>(null);
    const [showStickerPicker, setShowStickerPicker] = useState(false);

    // Resize canvas and reset background on window resize or bg image change
    useEffect(() => {
        function resizeCanvas() {
            const padding = 32;
            const width = Math.min(window.innerWidth - padding, 800);
            const height = (width * 4) / 3;
            setCanvasSize({ width, height });

            if (canvasRef.current) {
                canvasRef.current.width = width;
                canvasRef.current.height = height;
                canvasRef.current.style.width = `${width}px`;
                canvasRef.current.style.height = `${height}px`;

                if (backgroundImage) {
                    engine?.setBackgroundImage(backgroundImage);
                } else {
                    engine?.clearCanvas();
                }
            }
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [engine, backgroundImage]);

    // Initialize canvas engine on size or bg image change
    useEffect(() => {
        if (engine && canvasRef.current) {
            canvasRef.current.width = canvasSize.width;
            canvasRef.current.height = canvasSize.height;
            engine.initialize();

            if (backgroundImage) {
                engine.setBackgroundImage(backgroundImage);
            }
        }
    }, [canvasSize, engine, backgroundImage]);

    // Utility: get pointer position relative to canvas
    const getPointerPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }, []);

    // Pointer down event handler
    const handleDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        const pos = getPointerPos(e);
        if (!drawMode) {
            const selectedSticker = engine?.selectStickerAt(pos.x, pos.y);
            if (selectedSticker) {
                setIsDraggingSticker(true);
                setLastPointerPos(pos);
            }
            return;
        }
        setIsDrawing(true);
        setLastPoint(pos);
    }, [drawMode, engine, getPointerPos]);

    // Pointer move event handler
    const handleMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        const pos = getPointerPos(e);
        if (!drawMode && isDraggingSticker && lastPointerPos) {
            const dx = pos.x - lastPointerPos.x;
            const dy = pos.y - lastPointerPos.y;
            engine?.moveSelectedSticker(dx, dy);
            setLastPointerPos(pos);
            return;
        }

        if (drawMode && isDrawing && lastPoint && engine) {
            engine.drawLine(lastPoint.x, lastPoint.y, pos.x, pos.y, brushColor, brushSize);
            setLastPoint(pos);
        }
    }, [drawMode, isDraggingSticker, lastPointerPos, isDrawing, lastPoint, brushColor, brushSize, engine, getPointerPos]);

    // Pointer up & leave event handler
    const handleUp = useCallback(() => {
        setIsDrawing(false);
        setLastPoint(null);
        setIsDraggingSticker(false);
        setLastPointerPos(null);
    }, []);

    // Handle image file input
    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const imgSrc = reader.result as string;
            setBackgroundImage(imgSrc);
            engine?.clearCanvas();
            engine?.setBackgroundImage(imgSrc);
        };
        reader.readAsDataURL(file);
    }, [engine]);

    // Open file picker
    const openFilePicker = () => {
        fileInputRef.current?.click();
    };

    // Add emoji sticker to center
    const addEmojiSticker = (emoji: string) => {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        ctx.font = '48px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, size / 2, size / 2);

        const img = new Image();
        img.onload = () => {
            engine?.addSticker(img.src, canvasSize.width / 2 - size / 2, canvasSize.height / 2 - size / 2, size, size);
        };
        img.src = canvas.toDataURL();
        setShowStickerPicker(false);
    };

    return (
        <div className="w-full h-full flex flex-col">
            {/* Toolbar row 1 */}
            <div className="p-2 bg-white shadow flex flex-wrap justify-between items-center gap-2">
                {/* Left controls */}
                <div className="flex gap-2 items-center flex-wrap">
                    {/* Mode tabs */}
                    <div className="flex rounded overflow-hidden">
                        <button
                            className={`px-3 py-2 flex items-center gap-1 text-sm ${!drawMode ? 'bg-gray-300 text-gray-800' : 'bg-gray-100 text-gray-800'}`}
                            onClick={() => setDrawMode(false)}
                        >
                            <FaMousePointer />
                            Move
                        </button>
                        <button
                            className={`px-3 py-2 flex items-center gap-1 text-sm ${drawMode ? 'bg-gray-300 text-gray-800' : 'bg-gray-100 text-gray-800'}`}
                            onClick={() => setDrawMode(true)}
                        >
                            <FaPen />
                            Draw
                        </button>
                    </div>

                    <button
                        className="px-3 py-2 text-sm bg-green-600 text-white rounded inline-flex items-center gap-2"
                        onClick={() => setShowStickerPicker(prev => !prev)}
                    >
                        <FaStickyNote />
                        Sticker
                    </button>

                    {showStickerPicker && (
                        <div
                            className="absolute z-10 mt-2 bg-white shadow border rounded p-2 w-64 grid grid-cols-5 gap-2"
                            style={{ left: '50%', transform: 'translateX(-50%)', top: '42px' }}
                        >
                            {STICKER_EMOJIS.map((emoji, idx) => (
                                <button
                                    key={idx}
                                    className="text-2xl hover:scale-110 transition"
                                    onClick={() => addEmojiSticker(emoji)}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Image controls */}
                    <div className="relative">
                        {backgroundImage ? (
                            <button
                                className="px-3 py-2 text-sm bg-red-100 text-red-800 rounded inline-flex items-center gap-2"
                                onClick={() => {
                                    setBackgroundImage(null);
                                    engine?.clearCanvas();
                                }}
                            >
                                <FaTrash />
                                Image
                            </button>
                        ) : (
                            <button
                                className="px-3 py-2 text-sm bg-blue-500 text-white rounded inline-flex items-center gap-2"
                                onClick={openFilePicker}
                            >
                                <FaFileImage />
                                Image
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </button>
                        )}
                    </div>
                </div>

                {/* Save button */}
                <button
                    className="px-3 py-2 bg-gray-800 text-white text-sm rounded flex items-center gap-2"
                    onClick={() => {
                        if (!canvasRef.current) return;
                        const link = document.createElement('a');
                        link.download = 'purikura.png';
                        link.href = canvasRef.current.toDataURL('image/png');
                        link.click();
                    }}
                >
                    <FaSave />
                    Save
                </button>
            </div>

            {/* Toolbar row 2: Drawing controls */}
            {drawMode && (
                <div className="p-2 bg-gray-50 border-t border-gray-200 shadow-inner flex flex-wrap gap-4 items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                        Color:
                        <input
                            type="color"
                            value={brushColor}
                            onChange={e => setBrushColor(e.target.value)}
                        />
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                        Size:
                        <input
                            type="range"
                            min={1}
                            max={20}
                            value={brushSize}
                            onChange={e => setBrushSize(Number(e.target.value))}
                        />
                    </label>

                    <button
                        className="px-2 py-2 text-sm bg-red-100 text-red-800 rounded"
                        onClick={() => engine?.clearDrawingsOnly()}
                    >
                        Clear
                    </button>
                </div>
            )}

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                className="bg-white touch-none border border-gray-300 rounded-md mx-auto my-3"
                width={canvasSize.width}
                height={canvasSize.height}
                onPointerDown={handleDown}
                onPointerMove={handleMove}
                onPointerUp={handleUp}
                onPointerLeave={handleUp}
            />
        </div>
    );
}