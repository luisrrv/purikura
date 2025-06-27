import { useEffect, useRef } from 'react';

interface CameraCaptureModalProps {
    onCapture: (dataUrl: string) => void;
    onClose: () => void;
}

export function CameraCaptureModal({ onCapture, onClose }: CameraCaptureModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        async function startWebcam() {
            if (!navigator.mediaDevices) {
                alert("Webcam not supported");
                onClose();
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (err) {
                alert("Could not access webcam");
                onClose();
            }
        }
        startWebcam();

        return () => {
            // Stop webcam on unmount
            if (videoRef.current) {
                const stream = videoRef.current.srcObject as MediaStream | null;
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                videoRef.current.srcObject = null;
            }
        };
    }, [onClose]);

    const takeSnapshot = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        onCapture(dataUrl);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center p-4 z-50">
            <video ref={videoRef} className="w-full max-w-md rounded-lg" />
            <div className="mt-4 flex gap-4">
                <button
                    onClick={takeSnapshot}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                >
                    Take Photo
                </button>
                <button
                    onClick={onClose}
                    className="bg-red-600 text-white px-4 py-2 rounded"
                >
                    Cancel
                </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}