"use client";

import { BentoGrid, BentoItem } from "@/components/BentoGrid";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { AutomationList } from "@/components/AutomationList";
import { AutomationConfiguratorWidget } from "@/components/AutomationConfiguratorWidget";
import { ReportPreviewWidget } from "@/components/ReportPreviewWidget";
import { Wallet, Clock, Zap, AlertTriangle } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import type { Automation, MonthlySavings, ComputedDashboardStats } from "@/lib/supabase/types";

interface DashboardContentProps {
  automations: Automation[];
  savingsHistory: MonthlySavings[];
  stats: ComputedDashboardStats | null;
}

export function DashboardContent({ automations, savingsHistory, stats }: DashboardContentProps) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted font-mono">Ładowanie statystyk...</p>
      </div>
    )
  }

  const totalSavings = stats.total_savings;
  const timeSaved = stats.time_saved_hours;
  const efficiencyScore = stats.efficiency_score;
  const inactionCost = stats.inaction_cost;

  const formatSavings = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  return (
    <BentoGrid>
      <AnimatePresence>
        {/* Row 1: KPI Cards */}
        <BentoItem key="hero" className="col-span-1 min-h-[280px]">
          <StatCard
            title="Oszczędności"
            value={formatSavings(totalSavings)}
            subValue="PLN Saved"
            variant="green"
            icon={Wallet}
          />
        </BentoItem>
        
        <BentoItem key="time" className="col-span-1 min-h-[280px]">
          <StatCard
            title="Zaoszczędzony Czas"
            value={`${timeSaved}h`}
            subValue="Hours Back"
            variant="purple"
            icon={Clock}
          />
        </BentoItem>

        <BentoItem key="score" className="col-span-1 min-h-[280px]">
          <div className="flex h-full flex-col items-center justify-center p-6 relative">
            <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-[0.03] pointer-events-none">
              <Zap strokeWidth={1} className="w-48 h-48 text-white" />
            </div>
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/5 bg-black/50">
              <div className="absolute h-full w-full rounded-full border-4 border-brand-accent border-t-transparent -rotate-45"></div>
              <span className="text-3xl font-bold text-white font-display">{efficiencyScore}%</span>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-text-muted uppercase tracking-widest font-mono">
              <Zap className="h-4 w-4" /> Efficiency Score
            </div>
          </div>
        </BentoItem>

        <BentoItem key="alert" className="col-span-1 min-h-[280px] border-red-500/20 bg-red-950/5">
          <StatCard
            title="Koszt Braku Działania"
            value={`${inactionCost.toLocaleString()} PLN`}
            subValueLabel="/msc"
            variant="alert"
            icon={AlertTriangle}
            actionLabel="Zidentyfikuj Luki"
          />
        </BentoItem>

        {/* Row 2: Charts & Lists */}
        <BentoItem key="chart" className="col-span-1 md:col-span-2 min-h-[400px]">
          <ChartCard data={savingsHistory} />
        </BentoItem>
        
        <BentoItem key="list" className="col-span-1 md:col-span-2 min-h-[400px]">
          <AutomationList automations={automations} />
        </BentoItem>

        {/* Row 3: Interactive Widgets */}
        <BentoItem key="config" className="col-span-1 md:col-span-2 min-h-[400px]">
          <AutomationConfiguratorWidget />
        </BentoItem>

        <BentoItem key="report" className="col-span-1 md:col-span-2 min-h-[400px]">
          <ReportPreviewWidget />
        </BentoItem>
      </AnimatePresence>
    </BentoGrid>
  );
}
