"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Animated Counter ---
interface CounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
}

const Counter = ({ value, suffix = "", prefix = "" }: CounterProps) => {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current) => 
        `${prefix}${Math.round(current).toLocaleString()}${suffix}`
    );

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    return <motion.span>{display}</motion.span>;
};


// --- Stat Card ---
interface StatCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon?: LucideIcon;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    variant?: "default" | "highlight" | "success" | "warning";
    className?: string;
}

export const StatCard = ({
    title,
    value,
    subtext,
    icon: Icon,
    trend,
    trendValue,
    variant = "default",
    className
}: StatCardProps) => {
    const isNumber = typeof value === 'number';

    const variants = {
        default: "bg-white text-foreground",
        highlight: "bg-gray-900 text-white border-none",
        success: "bg-success/10 text-success-dark border-success/20",
        warning: "bg-warning/10 text-warning-dark border-warning/20",
    };

    return (
        <div className={cn("flex flex-col h-full justify-between", className, variant === 'highlight' && 'text-white')}>
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                    <h3 className={cn("text-sm font-medium", variant === 'highlight' ? 'text-gray-400' : 'text-muted-foreground')}>
                        {title}
                    </h3>
                    <div className={cn("text-3xl md:text-4xl font-bold tracking-tight mt-1", 
                        variant === 'highlight' ? 'text-white' : 'text-foreground',
                        variant === 'success' && 'text-success'
                    )}>
                        {isNumber ? <Counter value={value as number} prefix={typeof value === 'number' && title.includes("PLN") ? "" : ""} /> : value}
                        {/* Simple handling for pure string values vs numbers */}
                    </div>
                </div>
                {Icon && (
                    <div className={cn("p-2 rounded-lg", 
                        variant === 'highlight' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                    )}>
                        <Icon size={20} />
                    </div>
                )}
            </div>
            
            {(subtext || trendValue) && (
                <div className="flex items-center gap-2 mt-4 text-sm">
                    {trendValue && (
                        <span className={cn("flex items-center font-medium px-2 py-0.5 rounded-full text-xs",
                            trend === 'up' ? "bg-green-100 text-green-700" :
                            trend === 'down' ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-700"
                        )}>
                            {trend === 'up' && "↑ "}
                            {trend === 'down' && "↓ "}
                            {trendValue}
                        </span>
                    )}
                    <span className={cn(variant === 'highlight' ? 'text-gray-400' : 'text-muted-foreground')}>
                        {subtext}
                    </span>
                </div>
            )}
        </div>
    );
};
