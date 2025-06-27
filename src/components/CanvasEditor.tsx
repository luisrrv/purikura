import { useEffect, useRef } from 'react';
import { useCanvasEngine } from '../hooks/useCanvasEngine';

export function CanvasEditor() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engine = useCanvasEngine(canvasRef);

    useEffect(() => {
        if (engine) engine.initialize();
    }, [engine]);

    return (
        <canvas
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight - 80}
            className="bg-white border border-gray-300 touch-none"
        />
    );
}