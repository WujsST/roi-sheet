"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, ArrowUpRight, ArrowRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  subValueLabel?: string;
  icon?: LucideIcon;
  variant?: "default" | "alert" | "purple" | "green";
  className?: string;
  actionLabel?: string;
}

export function StatCard({
  title,
  value,
  subValue,
  subValueLabel,
  icon: Icon,
  variant = "default",
  className,
  actionLabel,
}: StatCardProps) {
  
  const isAlert = variant === "alert";
  
  // Dynamic styles based on variant
  const accentColor = isAlert ? "text-red-500" : "text-brand-success";
  const iconColor = isAlert ? "text-red-500" : variant === "purple" ? "text-purple-500" : "text-white/20";

  return (
    <div className={cn("flex flex-col h-full relative p-8", className)}>
      
      {/* Background Watermark Icon */}
      {Icon && !isAlert && (
        <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-[0.03] pointer-events-none">
          <Icon strokeWidth={1} className="w-48 h-48 text-white" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between relative z-10">
        {isAlert && Icon && (
          <div className="mb-4 rounded-full bg-red-500/10 p-3 border border-red-500/20">
            <Icon className="h-6 w-6 text-red-500" />
          </div>
        )}
        
        {isAlert && (
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white">
            Warning
          </span>
        )}
      </div>

      <div className={cn("flex-1 flex flex-col justify-center", isAlert ? "items-start" : "")}>
        {!isAlert && (
          <h3 className="text-5xl font-bold tracking-tight text-white font-display mb-2">
            {value}
          </h3>
        )}

        {isAlert && (
          <div className="mt-2">
            <p className="text-sm font-medium text-text-muted mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-white font-display">{value}</h3>
            {subValueLabel && <p className="text-text-muted text-sm mt-1">{subValueLabel}</p>}
          </div>
        )}

        {!isAlert && (
           <div className="mt-4 flex items-center gap-3">
            {subValue && (
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase flex items-center gap-1", 
                variant === "green" ? "bg-green-500/10 text-green-500" :
                variant === "purple" ? "bg-purple-500/10 text-purple-500" :
                "bg-white/10 text-white"
              )}>
                {variant === "green" && <ArrowUpRight className="h-3 w-3" />}
                {subValue}
              </span>
            )}
           </div>
        )}

        {actionLabel && (
          <button className="mt-8 flex items-center justify-between w-full rounded-full bg-white px-5 py-3 text-sm font-bold text-black hover:bg-gray-200 transition-colors">
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
