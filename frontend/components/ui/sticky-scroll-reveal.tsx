"use client";
import React, { useRef, useState, useEffect } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const StickyScroll = ({
    content,
    contentClassName,
}: {
    content: {
        title: string;
        description: string | React.ReactNode;
        content?: React.ReactNode | any;
    }[];
    contentClassName?: string;
}) => {
    const [activeCard, setActiveCard] = useState(0);
    const ref = useRef<any>(null);
    const { scrollYProgress } = useScroll({
        // uncomment line 22 and comment line 23 if you DONT want the scroll
        // to be contained within the element
        // container: ref,
        target: ref,
        offset: ["start start", "end end"],
    });

    const cardLength = content.length;

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        const cardsBreakpoints = content.map((_, index) => index / cardLength);
        const closestBreakpointIndex = cardsBreakpoints.reduce(
            (acc, breakpoint, index) => {
                const distance = Math.abs(latest - breakpoint);
                if (distance < Math.abs(latest - cardsBreakpoints[acc])) {
                    return index;
                }
                return acc;
            },
            0
        );
        setActiveCard(closestBreakpointIndex);
    });

    return (
        <div
            className="h-full flex flex-col md:flex-row justify-center relative space-y-10 md:space-y-0 rounded-md p-2 md:p-10 w-full"
            ref={ref}
        >
            <div className="div relative flex items-start px-4 w-full md:w-1/2">
                <div className="max-w-2xl w-full">
                    {content.map((item, index) => (
                        <div key={item.title + index} className="my-20">
                            <motion.h2
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: activeCard === index ? 1 : 0.6,
                                }}
                                className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-gray-100 transition-opacity duration-300"
                            >
                                {item.title}
                            </motion.h2>
                            <motion.div
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: activeCard === index ? 1 : 0.6,
                                }}
                                className="text-xl text-gray-800 dark:text-gray-200 mt-10 w-full transition-opacity duration-300"
                            >
                                {item.description}
                            </motion.div>
                        </div>
                    ))}
                    <div className="h-40" />
                </div>
            </div>
            <div
                className={cn(
                    "hidden md:block h-60 w-[400px] md:h-96 w-full md:w-1/2 sticky top-20 overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-2xl mx-auto shadow-xl ring-1 ring-black/5 dark:ring-white/10",
                    contentClassName
                )}
            >
                {content[activeCard].content ?? null}
            </div>
        </div>
    );
};
