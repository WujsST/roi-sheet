import { Plus, Calendar } from "lucide-react";
import Link from "next/link";
import { getDashboardData } from "./actions";
import { DashboardContent } from "@/components/DashboardContent";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { automations, savingsHistory, stats } = await getDashboardData();

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white font-display tracking-tight">
            Przegląd Agencji
          </h1>
          <p className="text-text-muted mt-2 font-mono text-xs uppercase tracking-widest">
            Witaj z powrotem. Oto twoje wyniki w tym miesiącu.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-full border border-white/20 px-4 py-2 text-sm text-white font-mono flex items-center gap-2">
            <Calendar className="h-4 w-4 text-text-muted" />
            Styczeń 2026
          </div>
          <Link
            href="/automations/new"
            className="rounded-full bg-white px-6 py-2 text-sm font-bold text-black hover:bg-gray-200 transition-colors flex items-center gap-2 font-mono uppercase"
          >
            <Plus className="h-4 w-4" />
            Nowa Automatyzacja
          </Link>
        </div>
      </div>

      <DashboardContent
        automations={automations}
        savingsHistory={savingsHistory}
        stats={stats}
      />
    </div>
  );
}
