"use client";

import { useState } from "react";
import { Search, CheckCircle2, XCircle, Clock, Activity, Workflow } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import type { ExecutionLog } from "@/app/actions";

interface LogsClientProps {
  initialLogs: ExecutionLog[];
}

export default function LogsClient({ initialLogs }: LogsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredLogs = initialLogs.filter((log) => {
    const matchesSearch =
      (log.workflow_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.n8n_workflow_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.n8n_execution_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || log.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, "dd MMM yyyy, HH:mm:ss", { locale: pl });
  };

  const formatDuration = (startedAt: string, stoppedAt: string | null) => {
    if (!stoppedAt) return "—";
    const start = new Date(startedAt).getTime();
    const stop = new Date(stoppedAt).getTime();
    const durationMs = stop - start;

    if (durationMs < 1000) return `${durationMs}ms`;
    if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
    return `${(durationMs / 60000).toFixed(1)}min`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 font-bold text-xs">
            <CheckCircle2 className="h-3 w-3" /> SUCCESS
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 font-bold text-xs">
            <XCircle className="h-3 w-3" /> ERROR
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-bold text-xs">
            <Activity className="h-3 w-3 animate-pulse" /> RUNNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-bold text-xs">
            <Clock className="h-3 w-3" /> {status.toUpperCase()}
          </span>
        );
    }
  };

  const successCount = initialLogs.filter(l => l.status === 'success').length;
  const errorCount = initialLogs.filter(l => l.status === 'error').length;

  return (
    <>
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
          <div className="text-xs text-text-muted font-mono uppercase mb-1">Łącznie Egzekucji</div>
          <div className="text-2xl font-bold text-white font-display">{initialLogs.length}</div>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="text-xs text-green-400/70 font-mono uppercase mb-1">Sukces</div>
          <div className="text-2xl font-bold text-green-400 font-display">{successCount}</div>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="text-xs text-red-400/70 font-mono uppercase mb-1">Błędy</div>
          <div className="text-2xl font-bold text-red-400 font-display">{errorCount}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Szukaj po nazwie workflow lub ID..."
            className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] pl-10 pr-4 py-3 text-sm text-white focus:border-white/30 outline-none font-mono"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-sm text-white focus:border-white/30 outline-none font-mono cursor-pointer"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Wszystkie statusy</option>
          <option value="success">SUCCESS</option>
          <option value="error">ERROR</option>
          <option value="running">RUNNING</option>
        </select>
      </div>

      {/* Executions Table */}
      <div className="flex-1 rounded-2xl border border-white/10 bg-[#050505] overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-[#0a0a0a] border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand-accent" />
            <span className="text-sm font-mono text-white font-bold">n8n Execution Logs</span>
          </div>
          <span className="text-[10px] font-mono text-text-muted">{filteredLogs.length} egzekucji</span>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
              <Workflow className="h-12 w-12 mb-4" />
              <p className="font-mono">Brak egzekucji do wyświetlenia.</p>
            </div>
          ) : (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="text-text-muted uppercase tracking-wider sticky top-0 bg-[#050505] z-10">
                <tr>
                  <th className="pb-4 pt-4 px-4 w-52">Czas</th>
                  <th className="pb-4 pt-4 px-4 w-28">Status</th>
                  <th className="pb-4 pt-4 px-4">Workflow</th>
                  <th className="pb-4 pt-4 px-4 w-24">Czas Trwania</th>
                  <th className="pb-4 pt-4 px-4 w-24">Źródło</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-4">
                      <div className="text-white text-sm">{formatTimestamp(log.started_at)}</div>
                      <div className="text-text-muted text-[10px]">
                        {formatDistanceToNow(new Date(log.started_at), { addSuffix: true, locale: pl })}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-white font-bold group-hover:text-brand-accent transition-colors">
                        {log.workflow_name || 'Nieznany workflow'}
                      </div>
                      <div className="text-text-muted text-[10px]">
                        ID: {log.n8n_workflow_id.substring(0, 12)}...
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-white font-bold">
                        {formatDuration(log.started_at, log.stopped_at)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 rounded bg-brand-accent/10 border border-brand-accent/20 text-brand-accent font-bold">
                        n8n
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
