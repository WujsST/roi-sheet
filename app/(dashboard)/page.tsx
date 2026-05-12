import { getDashboardData, getErrorExecutions } from "@/app/actions";
import { DashboardContent } from "@/components/DashboardContent";
import { DateRangePicker } from "@/components/DateRangePicker";
import { parseRangeFromSearchParams, toRangeISO, formatRangeLabel, isStaleRange, defaultRange } from "@/lib/date-range";
import { parseISO } from "date-fns";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ from?: string; to?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const parsed = parseRangeFromSearchParams(sp);
  // If bookmarked params are stale (>60 days), fall back to this_month
  const range = isStaleRange(parsed) ? defaultRange() : parsed;
  const rangeISO = toRangeISO(range);

  const [dashboardData, errorExecutions] = await Promise.all([
    getDashboardData(rangeISO),
    getErrorExecutions().catch(() => []),
  ]);

  const { automations, savingsHistory, stats } = dashboardData;
  const headerLabel = formatRangeLabel({
    from: parseISO(rangeISO.from),
    to: parseISO(rangeISO.to),
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white font-display tracking-tight">
            Przegląd Agencji
          </h1>
          <p className="text-text-muted mt-2 font-mono text-xs uppercase tracking-widest">
            Zakres: {headerLabel}
          </p>
        </div>
        <div className="flex gap-3">
          <DateRangePicker initial={rangeISO} />
        </div>
      </div>

      <DashboardContent
        automations={automations}
        savingsHistory={savingsHistory}
        stats={stats}
        errorExecutions={errorExecutions}
      />
    </div>
  );
}
