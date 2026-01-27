"use client";

import { FileText, Download } from "lucide-react";

export function ReportPreviewWidget() {
  return (
    <div className="flex h-full flex-col p-8 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="font-display font-medium text-lg text-white font-mono">
            Podgląd Raportu
          </h3>
        </div>
        
        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-all">
          <Download className="h-4 w-4" />
        </button>
      </div>

      {/* Main Content Area - Inner Border with Document Preview */}
      <div className="flex-1 rounded-3xl border border-white/20 p-8 flex flex-col items-center justify-center relative overflow-hidden bg-white/5">
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 h-4 w-4 border-t border-l border-white/40 rounded-tl-xl -translate-x-[1px] -translate-y-[1px]"></div>
        <div className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-white/40 rounded-bl-xl -translate-x-[1px] translate-y-[1px]"></div>
        <div className="absolute top-0 right-0 h-4 w-4 border-t border-r border-white/40 rounded-tr-xl translate-x-[1px] -translate-y-[1px]"></div>
        <div className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-white/40 rounded-br-xl translate-x-[1px] translate-y-[1px]"></div>

        {/* Document Paper Mockup */}
        <div className="relative w-48 h-64 bg-white rounded-lg shadow-2xl p-4 flex flex-col gap-3 transform transition-transform hover:scale-105 duration-300">
           {/* Header Skeleton */}
           <div className="w-12 h-3 bg-gray-800 rounded mb-2"></div>
           <div className="w-full h-1 bg-gray-200 rounded"></div>
           <div className="w-2/3 h-1 bg-gray-200 rounded"></div>
           
           {/* Grid Skeleton */}
           <div className="grid grid-cols-2 gap-2 mt-2">
             <div className="h-8 bg-green-50 rounded border border-green-100"></div>
             <div className="h-8 bg-indigo-50 rounded border border-indigo-100"></div>
           </div>
           
           {/* Chart Skeleton */}
           <div className="flex-1 bg-gray-50 rounded border border-gray-100 mt-2 relative overflow-hidden flex items-end px-2 pb-2">
              <svg className="w-full h-16" viewBox="0 0 100 40" preserveAspectRatio="none">
                 <path d="M0 40 L0 30 L20 20 L40 35 L60 15 L80 25 L100 5 L100 40 Z" fill="rgba(34, 197, 94, 0.1)" />
                 <path d="M0 30 L20 20 L40 35 L60 15 L80 25 L100 5" fill="none" stroke="#22c55e" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
           </div>
        </div>

        <div className="absolute bottom-4 left-0 right-0 text-center">
           <span className="text-[10px] font-mono text-text-muted bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
             Wygenerowano 14.11.2023
           </span>
        </div>
      </div>
    </div>
  );
}
