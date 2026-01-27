"use client";

import { useState } from "react";
import { Database, Table as TableIcon, Search, MoreHorizontal, Filter, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const tables = [
  { name: "users", rows: 1240 },
  { name: "automations", rows: 45 },
  { name: "logs", rows: 15430 },
  { name: "reports", rows: 12 },
  { name: "clients", rows: 8 },
];

const mockData = {
  users: [
    { id: 1, email: "john@acme.com", role: "admin", created_at: "2023-01-15" },
    { id: 2, email: "sarah@stark.com", role: "viewer", created_at: "2023-02-20" },
    { id: 3, email: "mike@tech.pl", role: "editor", created_at: "2023-03-10" },
  ],
  automations: [
    { id: "auto_1", name: "Invoice Parser", status: "active", cost_saved: 350 },
    { id: "auto_2", name: "Lead Scoring", status: "active", cost_saved: 120 },
    { id: "auto_3", name: "HR Onboarding", status: "error", cost_saved: 0 },
  ],
  logs: [
    { id: "log_1", level: "info", message: "Login success", timestamp: "14:30" },
    { id: "log_2", level: "error", message: "Timeout", timestamp: "14:35" },
  ],
  reports: [],
  clients: []
};

export default function DatabasePage() {
  const [selectedTable, setSelectedTable] = useState("users");
  const data = mockData[selectedTable as keyof typeof mockData] || [];
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

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
             {tables.map(table => (
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

        {/* Right Content: Data Grid */}
        <div className="flex-1 flex flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden relative">
           {/* Toolbar */}
           <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0f0f0f]">
              <div className="flex items-center gap-4">
                 <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                   <TableIcon className="h-4 w-4 text-brand-accent" />
                   public.{selectedTable}
                 </h2>
                 <div className="h-4 w-[1px] bg-white/10"></div>
                 <span className="text-xs text-text-muted">{data.length} rekordów</span>
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

           {/* Table Grid */}
           <div className="flex-1 overflow-auto custom-scrollbar bg-[#050505] p-1">
              {data.length > 0 ? (
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#0f0f0f]">
                    <tr>
                      <th className="w-10 border-r border-white/5 px-2 py-2 text-center text-text-muted">#</th>
                      {columns.map(col => (
                        <th key={col} className="border-r border-white/5 border-b border-white/10 px-4 py-2 text-xs font-mono font-medium text-text-muted uppercase tracking-wider min-w-[150px]">
                          <div className="flex items-center justify-between">
                            {col}
                            <MoreHorizontal className="h-3 w-3 opacity-50 hover:opacity-100 cursor-pointer" />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.map((row: any, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors group">
                        <td className="border-r border-white/5 px-2 py-2 text-center text-xs text-text-muted font-mono">{i + 1}</td>
                        {columns.map(col => (
                          <td key={`${i}-${col}`} className="border-r border-white/5 px-4 py-2.5 text-gray-300 font-mono text-xs whitespace-nowrap">
                             {row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-text-muted">
                   <Database className="h-12 w-12 opacity-20 mb-4" />
                   <p className="text-sm">Brak danych w tej tabeli.</p>
                </div>
              )}
           </div>
           
           {/* Footer Status Bar */}
           <div className="px-4 py-1.5 border-t border-white/5 bg-[#0f0f0f] text-[10px] text-text-muted font-mono flex justify-between">
              <span>Synched with Supabase</span>
              <span>Read-only view</span>
           </div>
        </div>
      </div>
    </div>
  );
}
