"use client";

import { useState } from "react";
import { Mail, Database } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { id: "email", name: "Email Marketing", desc: "~2h zaoszczędzone", icon: Mail },
  { id: "data", name: "Data Entry", desc: "~5h zaoszczędzone", icon: Database },
];

export function AutomationConfiguratorWidget() {
  const [selected, setSelected] = useState("email");

  return (
    <div className="flex h-full flex-col p-8 relative">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-xs font-mono text-white">
          2
        </div>
        <h3 className="font-display font-medium text-lg text-white font-mono">
          Konfigurator Automatyzacji
        </h3>
      </div>

      {/* Main Content Area - Inner Border */}
      <div className="flex-1 rounded-3xl border border-white/20 p-6 flex flex-col justify-center gap-4 relative">
        {/* Corner Accents for technical look */}
        <div className="absolute top-0 left-0 h-4 w-4 border-t border-l border-white/40 rounded-tl-xl -translate-x-[1px] -translate-y-[1px]"></div>
        <div className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-white/40 rounded-br-xl translate-x-[1px] translate-y-[1px]"></div>

        <p className="text-sm text-text-muted font-mono mb-2">
          Wybierz kategorię procesu do optymalizacji:
        </p>

        {categories.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelected(item.id)}
            className={cn(
              "flex items-center gap-4 rounded-xl border p-4 text-left transition-all group",
              selected === item.id
                ? "border-white bg-white/5"
                : "border-white/10 bg-transparent hover:border-white/30"
            )}
          >
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg border transition-colors",
              selected === item.id ? "border-white text-white" : "border-white/10 text-text-muted"
            )}>
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <div className={cn("font-bold font-mono text-sm", selected === item.id ? "text-white" : "text-text-muted group-hover:text-white")}>
                {item.name}
              </div>
              <div className="text-xs text-text-muted font-mono mt-0.5">
                {item.desc}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex items-center justify-between px-2">
        <button className="text-sm font-medium text-text-muted hover:text-white transition-colors font-mono uppercase tracking-wide">
          Wstecz
        </button>
        <button className="rounded-xl bg-white px-8 py-3 text-sm font-bold text-black hover:bg-gray-200 transition-colors font-mono uppercase tracking-wide shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          Dalej
        </button>
      </div>
    </div>
  );
}
