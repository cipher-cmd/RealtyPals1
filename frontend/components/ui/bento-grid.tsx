"use client";

import { cn } from "@/lib/utils";

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "grid md:auto-rows-[16rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ",
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
    children,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "row-span-1 rounded-2xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-gray-800 dark:border-gray-700 bg-white border border-[#E8E8E8] justify-between flex flex-col space-y-4 relative overflow-hidden",
                className
            )}
        >
            {header}
            {children}
            <div className="group-hover/bento:translate-x-2 transition duration-200 z-10">
                {icon}
                <div className="font-sans font-bold text-gray-900 dark:text-neutral-200 mb-2 mt-2">
                    {title}
                </div>
                <div className="font-sans font-normal text-gray-500 text-xs dark:text-neutral-400">
                    {description}
                </div>
            </div>
        </div>
    );
};
