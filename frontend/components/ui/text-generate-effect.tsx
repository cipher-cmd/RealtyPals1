"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
    words,
    className,
    filter = true,
    duration = 0.5,
}: {
    words: string;
    className?: string;
    filter?: boolean;
    duration?: number;
}) => {
    const [scope, animate] = useAnimate();
    let wordsArray = words.split(" ");
    useEffect(() => {
        animate(
            "span",
            {
                opacity: 1,
                filter: filter ? "blur(0px)" : "none",
            },
            {
                duration: duration ? duration : 1,
                delay: stagger(0.02),
            }
        );
    }, [scope.current, words]);

    const renderWords = () => {
        return (
            <motion.div ref={scope} className="space-y-1">
                {words.split(/(\r?\n)/).map((line, lIdx) => {
                    if (line === "\n" || line === "\r\n") return <div key={lIdx} className="h-2" />;
                    if (!line.trim()) return null;

                    // Detect Project Headers (starts with ** or #)
                    const isHeader = line.trim().startsWith('**') || line.trim().startsWith('#');
                    
                    // Clean line: remove **, #, and leading -
                    let cleanLine = line.trim()
                        .replace(/^\*\*|\*\*$/g, '') // Remove ** at start/end
                        .replace(/^#+\s*/, '')      // Remove # header marks
                        .replace(/^-\s*/, '')       // Remove leading bullet -
                        .replace(/\*\*/g, '');      // Remove any other **

                    // If it was a header, style it distinctly
                    if (isHeader) {
                        return (
                            <motion.div key={lIdx} className="mb-2 mt-4 first:mt-0">
                                {cleanLine.split(" ").map((word, wIdx) => (
                                    <motion.span
                                        key={wIdx}
                                        className="opacity-0 text-lg font-bold text-blue-600 dark:text-blue-400 tracking-tight mr-1 inline-block"
                                    >
                                        {word}
                                    </motion.span>
                                ))}
                            </motion.div>
                        );
                    }

                    // For regular lines, handle Key: Value bolding
                    return (
                        <div key={lIdx} className="flex flex-wrap items-baseline gap-1 py-0.5">
                            {cleanLine.split(" ").map((word, wIdx) => {
                                const isKey = word.endsWith(':');
                                return (
                                    <motion.span
                                        key={wIdx}
                                        className={cn(
                                            "opacity-0 text-[14px] leading-relaxed inline-block",
                                            isKey ? "font-bold text-gray-900 dark:text-white" : "text-gray-800 font-medium dark:text-gray-100"
                                        )}
                                    >
                                        {word}
                                    </motion.span>
                                );
                            })}
                        </div>
                    );
                })}
            </motion.div>
        );
    };

    return (
        <div className={cn("font-normal", className)}>
            <div className="mt-0">
                <div className="">
                    {renderWords()}
                </div>
            </div>
        </div>
    );
};
