"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
    value: string;
    size?: number;
}

export function QRCodeDisplay({ value, size = 160 }: QRCodeDisplayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && value) {
            QRCode.toCanvas(
                canvasRef.current,
                value,
                {
                    width: size,
                    margin: 1,
                    color: {
                        dark: "#000000",
                        light: "#FFFFFF",
                    },
                },
                (error) => {
                    if (error) {
                        console.error("Error generating QR code:", error);
                    }
                }
            );
        }
    }, [value, size]);

    return (
        <div className="flex items-center justify-center">
            <canvas ref={canvasRef} className="rounded-2xl" />
        </div>
    );
}
