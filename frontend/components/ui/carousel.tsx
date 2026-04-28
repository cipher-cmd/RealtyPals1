"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React, { useRef, useState, useEffect } from "react";

export const Carousel = ({
    items,
    initialScroll = 0,
}: {
    items: React.ReactNode[];
    initialScroll?: number;
}) => {
    const carouselRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    useEffect(() => {
        if (carouselRef.current) {
            carouselRef.current.scrollLeft = initialScroll;
            checkScrollability();
        }
    }, [initialScroll]);

    const checkScrollability = () => {
        if (carouselRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
        }
    };

    const scrollLeft = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
        }
    };

    const scrollRight = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
        }
    };

    return (
        <div className="relative w-full">
            <div
                className="flex w-full overflow-x-scroll overscroll-x-auto py-10 md:py-20 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                ref={carouselRef}
                onScroll={checkScrollability}
            >
                <div className="flex flex-row justify-start gap-4 pl-4 max-w-7xl mx-auto">
                    {items.map((item, index) => (
                        <motion.div
                            initial={{
                                opacity: 0,
                                y: 20,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                    duration: 0.5,
                                    delay: 0.1 * index,
                                    ease: "easeOut",
                                },
                            }}
                            key={"card" + index}
                            className="last:pr-4 md:last:pr-8 rounded-3xl shrink-0 snap-center w-full min-w-[300px] md:min-w-[500px]"
                        >
                            {item}
                        </motion.div>
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-2 mr-10 mt-2">
                <button
                    className="relative z-40 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-50"
                    onClick={scrollLeft}
                    disabled={!canScrollLeft}
                >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                    className="relative z-40 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-50"
                    onClick={scrollRight}
                    disabled={!canScrollRight}
                >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>
    );
};
