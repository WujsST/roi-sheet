"use client";

import { useState } from "react";
import { Search, AlertCircle, Info, AlertTriangle, Terminal } from "lucide-react";
import type { SystemLog } from "@/lib/supabase/types";

interface LogsClientProps {
  initialLogs: SystemLog[];
}

export default function LogsClient({ initialLogs }: LogsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");

  const filteredLogs = initialLogs.filter((log) => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterLevel === "all" || log.level === filterLevel;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      {/* Controls */}
      <div className="flex gap-4 p-1">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Szukaj w logach..."
            className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] pl-10 pr-4 py-3 text-sm text-white focus:border-white/30 outline-none font-mono"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-sm text-white focus:border-white/30 outline-none font-mono cursor-pointer"
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
        >
          <option value="all">Wszystkie poziomy</option>
          <option value="info">INFO</option>
          <option value="warn">WARN</option>
          <option value="error">ERROR</option>
        </select>
      </div>

      {/* Logs Table Console */}
      <div className="flex-1 rounded-2xl border border-white/10 bg-[#050505] overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-[#0a0a0a] border-b border-white/5 px-4 py-2 flex items-center gap-2">
           <div className="flex gap-1.5">
             <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
           </div>
           <span className="ml-2 text-[10px] font-mono text-text-muted">bash -- active session</span>
        </div>

        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          {initialLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
              <Terminal className="h-12 w-12 mb-4" />
              <p>Brak logów do wyświetlenia.</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
               <p>Brak wyników wyszukiwania.</p>
            </div>
          ) : (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="text-text-muted uppercase tracking-wider sticky top-0 bg-[#050505] z-10">
                <tr>
                  <th className="pb-4 pt-2 px-2 w-48">Timestamp</th>
                  <th className="pb-4 pt-2 px-2 w-24">Level</th>
                  <th className="pb-4 pt-2 px-2 w-32">Source</th>
                  <th className="pb-4 pt-2 px-2">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-3 px-2 text-text-muted opacity-70">{log.timestamp}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border ${
                        log.level === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                        log.level === 'warn' ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' :
                        'border-green-500/30 bg-green-500/10 text-green-400'
                      }`}>
                        {log.level === 'error' && <AlertCircle className="h-3 w-3" />}
                        {log.level === 'warn' && <AlertTriangle className="h-3 w-3" />}
                        {log.level === 'info' && <Info className="h-3 w-3" />}
                        {log.level.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-blue-400 font-bold">{log.source}</td>
                    <td className="py-3 px-2 text-gray-300 group-hover:text-white transition-colors">{log.message}</td>
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
