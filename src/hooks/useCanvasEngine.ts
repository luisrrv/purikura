import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { CanvasEngine } from '../canvas/CanvasEngine';

export function useCanvasEngine(ref: RefObject<HTMLCanvasElement | null>) {
    const [engine, setEngine] = useState<CanvasEngine | null>(null);

    useEffect(() => {
        if (ref.current) {
            const e = new CanvasEngine(ref.current);
            setEngine(e);
        }
    }, [ref]);

    return engine;
}