import { useEffect, useState } from 'react';
import { CanvasEngine } from '../canvas/CanvasEngine';

export function useCanvasEngine(ref: React.RefObject<HTMLCanvasElement | null>) {
    const [engine, setEngine] = useState<CanvasEngine | null>(null);

    useEffect(() => {
        if (ref.current && !engine) {
            setEngine(new CanvasEngine(ref.current));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ref]);

    return engine;
}