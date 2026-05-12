"use client";

import { useState } from "react";
import { ChevronDown, Users, AlertCircle } from "lucide-react";
import type { Automation } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  automations: Automation[];
  defaultOpen?: boolean;
  variant?: "default" | "unassigned";
  renderCard: (automation: Automation) => React.ReactNode;
}

export function ClientAutomationsAccordion({
  title,
  automations,
  defaultOpen = true,
  variant = "default",
  renderCard,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const totalSavings = automations.reduce((s, a) => s + (a.money_saved_pln || 0), 0);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-[#0a0a0a] overflow-hidden",
        variant === "unassigned" ? "border-yellow-500/20" : "border-white/10"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {variant === "unassigned" ? (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          ) : (
            <Users className="h-5 w-5 text-text-muted" />
          )}
          <h2 className="font-bold text-white font-display text-lg tracking-tight">{title}</h2>
          <span className="text-xs font-mono text-text-muted px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
            {automations.length}{" "}
            {automations.length === 1 ? "automatyzacja" : "automatyzacji"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {variant === "default" && totalSavings > 0 && (
            <span className="text-sm font-mono text-brand-success">
              {totalSavings.toFixed(0)} PLN
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-5 w-5 text-text-muted transition-transform",
              open && "rotate-180"
            )}
          />
        </div>
      </button>
      {open && (
        <div className="border-t border-white/5 p-3 space-y-3 bg-black/20">
          {automations.length === 0 ? (
            <p className="text-text-muted text-sm font-mono py-4 text-center">
              Brak automatyzacji.
            </p>
          ) : (
            automations.map((a) => renderCard(a))
          )}
        </div>
      )}
    </div>
  );
}
