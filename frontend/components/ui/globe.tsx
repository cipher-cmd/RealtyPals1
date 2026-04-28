"use client";

import React, { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import { useSpring } from "@react-spring/web";

export default function Globe() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointerInteracting = useRef<number | null>(null);
    const pointerInteractionMovement = useRef(0);
    const [{ r }, api] = useSpring(() => ({
        r: 0,
        config: {
            mass: 1,
            tension: 280,
            friction: 40,
            precision: 0.001,
        },
    }));
    const [width, setWidth] = useState(0);
    const onResize = () => {
        if (canvasRef.current) {
            setWidth(canvasRef.current.offsetWidth);
        }
    };

    useEffect(() => {
        window.addEventListener("resize", onResize);
        onResize();
        return () => window.removeEventListener("resize", onResize);
    }, []);

    useEffect(() => {
        let phi = 4.5; // Offset to roughly target India initially
        if (!canvasRef.current) return;

        // Define locations (Targeting Sector 150 Noida primarily)
        const locations = [
            { lat: 28.435, lng: 77.485, size: 0.15 }, // Sector 150, Noida (Target)
            { lat: 28.6139, lng: 77.2090, size: 0.04 }, // Delhi
            { lat: 28.4595, lng: 77.0266, size: 0.04 }, // Gurgaon
            { lat: 19.0760, lng: 72.8777, size: 0.05 }, // Mumbai
            { lat: 12.9716, lng: 77.5946, size: 0.05 }, // Bangalore
        ];

        const globe = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: width * 2,
            height: width * 2,
            phi: phi,
            theta: 0.25,
            dark: 1,
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: [0.1, 0.1, 0.2], // Dark Blue/Gray Base
            markerColor: [0.1, 0.8, 1], // Cyan/Blue Markers
            glowColor: [0, 0.2, 0.6], // Deep Blue Glow
            markers: locations.map((location) => ({
                location: [location.lat, location.lng],
                size: location.size,
            })),
            onRender: (state) => {
                if (!pointerInteracting.current) {
                    phi += 0.005;
                }
                state.phi = phi + r.get();
                state.width = width * 2;
                state.height = width * 2;
            },
        });

        return () => {
            globe.destroy();
        };
    }, [width, r]);

    return (
        <div
            className="relative w-full aspect-square max-w-[600px] mx-auto opacity-90 transition-opacity flex items-center justify-center cursor-grab active:cursor-grabbing"
            style={{
                width: "100%",
                cursor: "grab",
                contain: "layout paint size",
            }}
        >
            <canvas
                ref={canvasRef}
                onPointerDown={(e) => {
                    pointerInteracting.current =
                        e.clientX - pointerInteractionMovement.current;
                }}
                onPointerUp={() => {
                    pointerInteracting.current = null;
                    canvasRef.current!.style.cursor = "grab";
                }}
                onPointerOut={() => {
                    pointerInteracting.current = null;
                    canvasRef.current!.style.cursor = "grab";
                }}
                onMouseMove={(e) => {
                    if (pointerInteracting.current !== null) {
                        const delta = e.clientX - pointerInteracting.current;
                        pointerInteractionMovement.current = delta;
                        api.start({ r: delta / 200 });
                    }
                }}
                onTouchMove={(e) => {
                    if (pointerInteracting.current !== null && e.touches[0]) {
                        const delta = e.touches[0].clientX - pointerInteracting.current;
                        pointerInteractionMovement.current = delta;
                        api.start({ r: delta / 100 });
                    }
                }}
                style={{
                    width: "100%",
                    height: "100%",
                    contain: "layout paint size",
                    opacity: 1,
                    transition: "opacity 1s ease",
                }}
            />
        </div>
    );
}
