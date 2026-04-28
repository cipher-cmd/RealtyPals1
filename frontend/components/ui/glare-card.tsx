"use client";

import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";

export const GlareCard = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    const boundingRef = useRef<DOMRect | null>(null);
    const [state, setState] = useState({
        x: 0,
        y: 0,
        opacity: 0,
    });

    return (
        <div
            className={cn(
                "relative flex items-center justify-center overflow-hidden rounded-3xl group bg-white dark:bg-zinc-900 border border-transparent dark:border-white/[0.1] shadow-2xl",
                className
            )}
            onMouseEnter={(ev) => {
                boundingRef.current = ev.currentTarget.getBoundingClientRect();
                setState({ x: ev.clientX, y: ev.clientY, opacity: 1 });
            }}
            onMouseMove={(ev) => {
                if (!boundingRef.current) return;
                setState({ x: ev.clientX, y: ev.clientY, opacity: 1 });
            }}
            onMouseLeave={() => {
                setState((prev) => ({ ...prev, opacity: 0 }));
            }}
            style={
                {
                    "--x": `${boundingRef.current ? state.x - boundingRef.current.left : 0
                        }px`,
                    "--y": `${boundingRef.current ? state.y - boundingRef.current.top : 0
                        }px`,
                    transformStyle: "preserve-3d",
                    transform: `perspective(1000px) rotateX(${boundingRef.current
                            ? ((state.y - boundingRef.current.top) /
                                boundingRef.current.height -
                                0.5) *
                            -10
                            : 0
                        }deg) rotateY(${boundingRef.current
                            ? ((state.x - boundingRef.current.left) /
                                boundingRef.current.width -
                                0.5) *
                            10
                            : 0
                        }deg)`,
                    transition: "transform 0.1s ease",
                } as React.CSSProperties
            }
        >
            {/* Glare effect */}
            <div
                className="pointer-events-none absolute inset-0 z-50 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(1000px circle at var(--x) var(--y), rgba(255,255,255,0.4), transparent 40%)`,
                }}
            />
            {children}
        </div>
    );
};
