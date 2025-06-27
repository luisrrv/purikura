import { useRef, useState, useEffect } from 'react';
import { useCanvasEngine } from '../hooks/useCanvasEngine';
import { CameraCaptureModal } from './CameraCaptureModal';
import { FaCamera, FaFileUpload, FaTrash, FaSave, FaPen, FaMousePointer } from 'react-icons/fa';

export function CanvasEditor() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engine = useCanvasEngine(canvasRef);

    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawMode, setDrawMode] = useState(false);
    const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
    const [brushColor, setBrushColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(3);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [showImageOptions, setShowImageOptions] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);

    useEffect(() => {
        const resizeCanvas = () => {
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
                    engine?.drawImage(backgroundImage);
                } else {
                    engine?.clearCanvas();
                }
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [engine, backgroundImage]);

    useEffect(() => {
        if (engine && canvasRef.current) {
            canvasRef.current.width = canvasSize.width;
            canvasRef.current.height = canvasSize.height;
            engine.initialize();
            if (backgroundImage) engine.drawImage(backgroundImage);
        }
    }, [canvasSize, engine, backgroundImage]);

    const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const handleDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawMode) return;
        const pos = getPointerPos(e);
        setIsDrawing(true);
        setLastPoint(pos);
    };

    const handleMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawMode || !isDrawing || !lastPoint || !engine) return;
        const newPos = getPointerPos(e);
        engine.drawLine(lastPoint.x, lastPoint.y, newPos.x, newPos.y, brushColor, brushSize);
        setLastPoint(newPos);
    };

    const handleUp = () => {
        setIsDrawing(false);
        setLastPoint(null);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const imgSrc = reader.result as string;
            setBackgroundImage(imgSrc);
            engine?.clearCanvas();
            engine?.drawImage(imgSrc);
        };
        reader.readAsDataURL(file);
    };

    const handleCaptureFromCamera = (dataUrl: string) => {
        setBackgroundImage(dataUrl);
        engine?.clearCanvas();
        engine?.drawImage(dataUrl);
        setShowCameraModal(false);
    };

    const isWebcamSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    return (
        <div className="w-full h-full flex flex-col">

            {/* Toolbar row 1 */}
            <div className="p-2 bg-white shadow flex flex-wrap justify-between items-center gap-2">

                {/* Left controls: Mode tabs + image dropdown */}
                <div className="flex gap-2 items-center flex-wrap">
                    {/* Mode tabs */}
                    <div className="flex rounded overflow-hidden">
                        <button
                            className={`px-3 py-2 flex items-center gap-1 text-sm ${!drawMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                                }`}
                            onClick={() => setDrawMode(false)}
                        >
                            <FaMousePointer />
                            Select
                        </button>
                        <button
                            className={`px-3 py-2 flex items-center gap-1 text-sm ${drawMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                                }`}
                            onClick={() => setDrawMode(true)}
                        >
                            <FaPen />
                            Draw
                        </button>
                    </div>

                    {/* Image dropdown or remove button */}
                    <div className="relative">
                        {backgroundImage ? (
                            <button
                                className="px-3 py-2 text-sm bg-gray-500 text-white rounded inline-flex items-center gap-2"
                                onClick={() => {
                                    setBackgroundImage(null);
                                    engine?.clearCanvas();
                                }}
                            >
                                <FaTrash />
                                Remove Image
                            </button>
                        ) : (
                            <>
                                <button
                                    className="px-3 py-2 text-sm bg-blue-500 text-white rounded inline-flex items-center gap-2"
                                    onClick={() => setShowImageOptions(prev => !prev)}
                                >
                                    <FaFileUpload />
                                    Add Photo
                                </button>

                                {showImageOptions && (
                                    <div className="absolute z-10 mt-2 bg-white shadow border rounded text-sm p-2 flex flex-col gap-2 w-48">
                                        <label className="cursor-pointer flex items-center gap-2 hover:bg-gray-100 px-2 py-2 rounded">
                                            <FaFileUpload />
                                            Upload from Files
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    setShowImageOptions(false);
                                                    handleImageUpload(e);
                                                }}
                                            />
                                        </label>

                                        {isWebcamSupported ? (
                                            <button
                                                onClick={() => {
                                                    setShowCameraModal(true);
                                                    setShowImageOptions(false);
                                                }}
                                                className="flex items-center gap-2 hover:bg-gray-100 px-2 py-2 rounded"
                                            >
                                                <FaCamera />
                                                Take with Camera
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2 px-2 py-2 rounded opacity-50">
                                                <FaCamera />
                                                Camera Unavailable
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Save Button */}
                <button
                    className="px-3 py-2 bg-gray-700 text-white text-sm rounded flex items-center gap-2"
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
                            onChange={(e) => setBrushColor(e.target.value)}
                        />
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                        Size:
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={brushSize}
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                        />
                    </label>

                    <button
                        className="px-2 py-2 text-sm bg-red-500 text-white rounded"
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

            {/* Webcam modal */}
            {showCameraModal && (
                <CameraCaptureModal
                    onCapture={handleCaptureFromCamera}
                    onClose={() => setShowCameraModal(false)}
                />
            )}
        </div>
    );
}