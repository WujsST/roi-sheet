import { Activity, AlertCircle } from "lucide-react";
import { getLogsData, type ExecutionLog } from "@/app/actions";
import LogsClient from "./logs-client";

export default async function LogsPage() {
  let logs: ExecutionLog[] = [];
  let error: Error | null = null;

  try {
    logs = await getLogsData();
  } catch (e) {
    error = e as Error;
    console.error('Error fetching logs:', e);
  }

  return (
    <div className="space-y-6 pb-20 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white font-display tracking-tight flex items-center gap-3">
          <Activity className="h-8 w-8 text-text-muted" />
          Logi Egzekucji
        </h1>
        <p className="text-text-muted font-mono text-xs uppercase tracking-widest">
          Historia wykonań automatyzacji n8n
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-bold">Błąd ładowania danych</p>
              <p className="text-sm text-red-400/70">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Client component for interactive filtering */}
      {!error && <LogsClient initialLogs={logs} />}
    </div>
  );
}
