"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="relative flex items-center justify-between w-full mb-12">
      {/* Connector Line */}
      <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-white/10 -z-10 rounded-full"></div>
      <div 
        className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-in-out -z-10 rounded-full box-shadow-[0_0_10px_rgba(99,102,241,0.5)]"
        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
      ></div>

      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step} className="flex flex-col items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 relative bg-bg-app",
                isCompleted
                  ? "border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                  : isCurrent
                  ? "border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  : "border-white/10 text-white/30"
              )}
            >
               {isCompleted && <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-pulse"></div>}
               
              {isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-bold">{index + 1}</span>
              )}
            </div>
            <span
              className={cn(
                "text-xs font-semibold tracking-wide uppercase transition-colors duration-300",
                isCurrent ? "text-white" : isCompleted ? "text-indigo-300" : "text-text-muted"
              )}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
