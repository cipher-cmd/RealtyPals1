"use client";

import { cn } from "@/lib/utils";
import React, { useState, useRef, useCallback, useEffect } from "react";

interface CompareSliderProps extends React.HTMLAttributes<HTMLDivElement> {
    itemOne: React.ReactNode;
    itemTwo: React.ReactNode;
    initialPosition?: number;
}

export const CompareSlider = ({
    itemOne,
    itemTwo,
    initialPosition = 50,
    className,
    ...props
}: CompareSliderProps) => {
    const [position, setPosition] = useState(initialPosition);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handlePointerDown = (e: React.PointerEvent) => {
        isDragging.current = true;
        updatePosition(e.clientX);
    };

    const handlePointerUp = () => {
        isDragging.current = false;
    };

    const handlePointerMove = useCallback(
        (e: PointerEvent | React.PointerEvent) => {
            if (!isDragging.current) return;
            updatePosition(e.clientX);
        },
        []
    );

    const updatePosition = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = (x / rect.width) * 100;
        setPosition(percentage);
    };

    useEffect(() => {
        document.addEventListener("pointerup", handlePointerUp);
        document.addEventListener("pointermove", handlePointerMove);
        return () => {
            document.removeEventListener("pointerup", handlePointerUp);
            document.removeEventListener("pointermove", handlePointerMove);
        };
    }, [handlePointerMove]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full h-[400px] overflow-hidden rounded-3xl select-none cursor-ew-resize",
                className
            )}
            onPointerDown={handlePointerDown}
            {...props}
        >
            <div className="absolute inset-0 pointer-events-none">{itemTwo}</div>
            <div
                className="absolute inset-y-0 left-0 pointer-events-none overflow-hidden"
                style={{ width: `${position}%` }}
            >
                <div className="absolute inset-y-0 left-0" style={{ width: "100vw" }}>
                    {itemOne}
                </div>
            </div>
            <div
                className="absolute inset-y-0 w-1 bg-white cursor-ew-resize flex items-center justify-center pointer-events-none shadow-xl"
                style={{ left: `calc(${position}% - 2px)` }}
            >
                <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-200">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-600"
                    >
                        <polyline points="15 18 9 12 15 6" />
                        <polyline points="9 6 15 12 9 18" />
                    </svg>
                </div>
            </div>
        </div>
    );
};
