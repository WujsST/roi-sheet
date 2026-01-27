"use client";

import { Mail, FileText, UserPlus, AlertCircle, Zap, Send, RefreshCw, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Automation } from "@/lib/supabase/types";

const iconMap: Record<string, LucideIcon> = {
  Mail,
  FileText,
  UserPlus,
  Zap,
  Send,
  RefreshCw,
};

interface AutomationListProps {
  automations?: Automation[];
}

const fallbackAutomations = [
  { id: "1", name: "Lead Scoring AI", client_name: "TechCorp Sp. z o.o.", saved_today: 120, status: "healthy" as const, icon: "Mail", created_at: "" },
  { id: "2", name: "Invoice Parser", client_name: "LogisticsPro", saved_today: 350, status: "healthy" as const, icon: "FileText", created_at: "" },
  { id: "3", name: "HR Onboarding", client_name: "StartupHub", saved_today: 0, status: "error" as const, icon: "UserPlus", created_at: "" },
];

export function AutomationList({ automations }: AutomationListProps) {
  const items = automations && automations.length > 0 ? automations : fallbackAutomations;
  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-6 flex items-center gap-2">
        <div className="h-4 w-4 text-white">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20" /></svg>
        </div>
        <h3 className="font-display font-medium text-lg text-white font-mono">Aktywne Automatyzacje</h3>
      </div>

      <div className="flex-1 space-y-3">
        {items.map((item) => {
          const IconComponent = iconMap[item.icon] || Zap;
          return (
            <div 
              key={item.id} 
              className="group relative flex items-center justify-between rounded-xl border border-white/20 bg-transparent p-4 transition-all hover:bg-white/5 hover:border-white/40"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-white border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-colors">
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-white font-mono text-sm tracking-wide">{item.name}</div>
                  <div className="text-xs text-text-muted font-mono">{item.client_name}</div>
                </div>
              </div>
              
              <div className="text-right">
                {item.status === "healthy" ? (
                  <>
                    <div className="text-sm font-bold text-brand-success font-mono">{Number(item.saved_today)} PLN</div>
                    <div className="text-[10px] text-text-muted font-mono uppercase">Saved today</div>
                  </>
                ) : item.status === "paused" ? (
                  <>
                    <div className="text-sm font-bold text-yellow-500 font-mono">Paused</div>
                    <div className="text-[10px] text-yellow-500/70 font-mono uppercase">On hold</div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-bold text-brand-warning flex items-center gap-1 justify-end font-mono">
                      <AlertCircle className="h-3 w-3" /> Error
                    </div>
                    <div className="text-[10px] text-brand-warning/70 font-mono uppercase">Check logs</div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
