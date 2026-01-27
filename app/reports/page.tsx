"use client";

import { FileText, Download, Printer, Search, Calendar, Filter, Plus } from "lucide-react";
import Link from "next/link";

const reports = [
  { id: 1, title: "ROI Report - Październik 2023", client: "TechCorp Sp. z o.o.", date: "2023-11-01", size: "1.2 MB", type: "pdf" },
  { id: 2, title: "Efficiency Audit Q3", client: "LogisticsPro", date: "2023-10-15", size: "2.4 MB", type: "pdf" },
  { id: 3, title: "Automation Health Check", client: "StartupHub", date: "2023-10-10", size: "0.8 MB", type: "pdf" },
  { id: 4, title: "Monthly Savings - Wrzesień", client: "GreenEnergy SA", date: "2023-10-01", size: "1.5 MB", type: "pdf" },
  { id: 5, title: "ROI Report - Wrzesień 2023", client: "TechCorp Sp. z o.o.", date: "2023-10-01", size: "1.1 MB", type: "pdf" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-display tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8 text-text-muted" />
            Raporty
          </h1>
          <p className="text-text-muted mt-2 font-mono text-xs uppercase tracking-widest">
            Archiwum wygenerowanych dokumentów i analiz
          </p>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white font-mono hover:bg-white/5 transition-colors uppercase tracking-wide">
             <Calendar className="h-4 w-4" /> Ten Miesiąc
          </button>
          <button className="flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-bold text-black hover:bg-gray-200 transition-colors font-mono uppercase tracking-wide">
             Generuj Nowy
          </button>
        </div>
      </div>

      {/* Reports Gallery Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {reports.map((report) => (
          <div key={report.id} className="group relative flex flex-col rounded-3xl border border-white/10 bg-[#0a0a0a] overflow-hidden transition-all hover:border-white/30 hover:shadow-2xl hover:shadow-white/5">
            
            {/* Document Preview Area */}
            <div className="relative h-64 w-full bg-[#0f0f0f] flex items-center justify-center p-8 overflow-hidden group-hover:bg-[#111] transition-colors">
               {/* Paper Mockup */}
               <div className="w-full h-full bg-white shadow-xl rounded-sm p-4 flex flex-col gap-2 transform group-hover:scale-105 group-hover:-rotate-1 transition-transform duration-300">
                  <div className="w-1/3 h-2 bg-gray-800 rounded mb-2"></div>
                  <div className="w-full h-1 bg-gray-200 rounded"></div>
                  <div className="w-full h-1 bg-gray-200 rounded"></div>
                  <div className="w-2/3 h-1 bg-gray-200 rounded mb-4"></div>
                  <div className="flex-1 border border-dashed border-gray-200 rounded bg-gray-50 flex items-center justify-center">
                     <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 mt-auto"></div>
               </div>

               {/* Overlay Actions */}
               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity backdrop-blur-sm">
                  <Link href="/reports/preview" className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-110 transition-transform">
                     <FileText className="h-5 w-5" />
                  </Link>
                  <button className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-110 transition-transform">
                     <Download className="h-5 w-5" />
                  </button>
               </div>
            </div>

            {/* Info Footer */}
            <div className="p-5 border-t border-white/5 bg-[#0a0a0a]">
              <h3 className="font-bold text-white text-sm font-display truncate mb-1">{report.title}</h3>
              <div className="flex items-center justify-between">
                 <span className="text-xs text-text-muted font-mono">{report.client}</span>
                 <span className="text-[10px] text-text-muted font-mono bg-white/5 px-2 py-1 rounded border border-white/5">{report.date}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Create New Placeholder */}
        <button className="group flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 bg-transparent p-6 transition-all hover:border-white/30 hover:bg-white/5 min-h-[300px]">
           <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white transition-colors border border-white/5">
              <Plus className="h-6 w-6" />
           </div>
           <span className="text-sm font-bold text-text-muted font-mono uppercase tracking-widest group-hover:text-white">
             Generuj Raport
           </span>
        </button>
      </div>
    </div>
  );
}
