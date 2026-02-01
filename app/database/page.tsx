import { Database, Table as TableIcon, Search, MoreHorizontal, Filter, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { DatabaseExplorer } from "@/components/DatabaseExplorer";

export default async function DatabasePage() {
  const supabase = await createClient();

  // Fetch real row counts from each table
  const [
    automationsCount,
    executionsCount,
    clientsCount,
    reportsCount,
    logsCount,
    savingsCount,
    statsCount
  ] = await Promise.all([
    supabase.from('automations').select('*', { count: 'exact', head: true }),
    supabase.from('workflow_executions').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('reports').select('*', { count: 'exact', head: true }),
    supabase.from('system_logs').select('*', { count: 'exact', head: true }),
    supabase.from('savings_history').select('*', { count: 'exact', head: true }),
    supabase.from('dashboard_stats').select('*', { count: 'exact', head: true })
  ]);

  const tables = [
    { name: "workflow_executions", rows: executionsCount.count ?? 0 },
    { name: "automations", rows: automationsCount.count ?? 0 },
    { name: "clients", rows: clientsCount.count ?? 0 },
    { name: "reports", rows: reportsCount.count ?? 0 },
    { name: "system_logs", rows: logsCount.count ?? 0 },
    { name: "savings_history", rows: savingsCount.count ?? 0 },
    { name: "dashboard_stats", rows: statsCount.count ?? 0 }
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white font-display tracking-tight flex items-center gap-3">
          <Database className="h-8 w-8 text-text-muted" />
          Baza Danych
        </h1>
        <p className="text-text-muted font-mono text-xs uppercase tracking-widest mt-2">
          Eksplorator tabel Supabase (public schema)
        </p>
      </div>

      <DatabaseExplorer tables={tables} />
    </div>
  );
}
