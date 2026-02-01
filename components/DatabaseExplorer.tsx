"use client";

import { useState } from "react";
import { Database, Table as TableIcon, Search, MoreHorizontal, Filter, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatabaseExplorerProps {
  tables: Array<{ name: string; rows: number }>;
}

export function DatabaseExplorer({ tables }: DatabaseExplorerProps) {
  const [selectedTable, setSelectedTable] = useState(tables[0]?.name || "");

  return (
    <div className="flex flex-1 gap-6 overflow-hidden">
      {/* Left Sidebar: Tables List */}
      <div className="w-64 flex flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Szukaj tabeli..."
              className="w-full rounded-lg bg-[#151515] border border-white/5 pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-white/20"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-3 py-2 text-xs font-bold text-text-muted uppercase tracking-wider">Public</div>
          {tables.map((table) => (
            <button
              key={table.name}
              onClick={() => setSelectedTable(table.name)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                selectedTable === table.name
                  ? "bg-white/10 text-white font-medium"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex items-center gap-2">
                <TableIcon className="h-4 w-4 opacity-70" />
                {table.name}
              </div>
              <span className="text-[10px] text-text-muted font-mono">{table.rows}</span>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-white/5">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 p-2 text-xs text-text-muted hover:border-white/40 hover:text-white transition-colors">
            <Plus className="h-3.5 w-3.5" /> Nowa Tabela
          </button>
        </div>
      </div>

      {/* Right Content: Data Grid Placeholder */}
      <div className="flex-1 flex flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden relative">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0f0f0f]">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-brand-accent" />
              public.{selectedTable}
            </h2>
            <div className="h-4 w-[1px] bg-white/10"></div>
            <span className="text-xs text-text-muted">
              {tables.find((t) => t.name === selectedTable)?.rows ?? 0} rekordów
            </span>
          </div>
          <div className="flex gap-2">
            <button className="p-2 rounded hover:bg-white/5 text-text-muted hover:text-white transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/10 bg-[#151515] text-xs text-white hover:bg-[#202020] transition-colors">
              <Filter className="h-3.5 w-3.5" /> Filtruj
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-success/10 border border-brand-success/20 text-xs text-brand-success hover:bg-brand-success/20 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Dodaj Wiersz
            </button>
          </div>
        </div>

        {/* Table Grid Placeholder */}
        <div className="flex-1 overflow-auto custom-scrollbar bg-[#050505] p-1">
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <Database className="h-12 w-12 opacity-20 mb-4" />
            <p className="text-sm">Przejdź do Supabase Dashboard aby przeglądać dane.</p>
            <p className="text-xs mt-2 opacity-70">Tabela: {selectedTable}</p>
          </div>
        </div>

        {/* Footer Status Bar */}
        <div className="px-4 py-1.5 border-t border-white/5 bg-[#0f0f0f] text-[10px] text-text-muted font-mono flex justify-between">
          <span>Synced with Supabase</span>
          <span>Read-only view</span>
        </div>
      </div>
    </div>
  );
}
