"use client";

import * as React from "react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedTextProps extends React.HTMLAttributes<HTMLDivElement> {
    text: string;
    gradientColors?: string;
    gradientAnimationDuration?: number;
    hoverEffect?: boolean;
    className?: string;
    textClassName?: string;
}

const AnimatedText = React.forwardRef<HTMLDivElement, AnimatedTextProps>(
    (
        {
            text,
            gradientColors = "linear-gradient(90deg, currentcolor, #9ca3af, currentcolor)",
            gradientAnimationDuration = 2.5,
            hoverEffect = false,
            className,
            textClassName,
            ...props
        },
        ref
    ) => {
        const [isHovered, setIsHovered] = React.useState(false);

        const textVariants: Variants = {
            initial: {
                backgroundPosition: "0 0",
            },
            animate: {
                backgroundPosition: "200% 0",
                transition: {
                    duration: gradientAnimationDuration,
                    ease: "linear",
                    repeat: Infinity,
                },
            },
        };

        return (
            <div
                ref={ref}
                className={cn("flex items-center", className)}
                {...props}
            >
                <motion.span
                    className={cn("leading-normal", textClassName)}
                    style={{
                        background: gradientColors,
                        backgroundSize: "200% auto",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textShadow: isHovered ? "0 0 8px rgba(255,255,255,0.3)" : "none",
                    }}
                    variants={textVariants}
                    initial="initial"
                    animate="animate"
                    onHoverStart={() => hoverEffect && setIsHovered(true)}
                    onHoverEnd={() => hoverEffect && setIsHovered(false)}
                >
                    {text}
                </motion.span>
            </div>
        );
    }
);

AnimatedText.displayName = "AnimatedText";

export { AnimatedText };
