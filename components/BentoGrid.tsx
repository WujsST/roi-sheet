"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BentoGridProps {
  className?: string;
  children: React.ReactNode;
}

interface BentoItemProps {
  className?: string;
  children: React.ReactNode;
  delay?: number;
  onClick?: () => void;
}

export const BentoGrid = ({ className, children }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoItem = ({ className, children, delay = 0, onClick }: BentoItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: delay,
        ease: "easeOut"
      }}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden card-base hover:card-hover",
        className
      )}
    >
      {children}
    </motion.div>
  );
};
