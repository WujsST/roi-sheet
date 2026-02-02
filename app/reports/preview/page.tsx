"use client";

import { useRef } from "react";
import { Download, Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useReactToPrint } from "react-to-print";

const data = [
  { name: "Tydzień 1", saved: 1200 },
  { name: "Tydzień 2", saved: 1900 },
  { name: "Tydzień 3", saved: 1500 },
  { name: "Tydzień 4", saved: 2400 },
];

export default function ReportPreviewPage() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Raport_ROI",
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
  });

  return (
    <div className="min-h-screen bg-bg-app pb-20 pt-8 relative font-sans">

      {/* Header Actions - hidden in print */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-white/10 bg-bg-app/90 px-8 py-4 backdrop-blur-md print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-text-muted hover:bg-white/10 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">Raport ROI - Październik 2023</h1>
            <p className="text-xs text-text-muted">TechCorp Sp. z o.o.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-2 rounded-full bg-white/5 px-6 py-2 text-xs font-bold uppercase tracking-wider text-white border border-white/10 hover:bg-white/10 transition-colors"
          >
            <Printer className="h-4 w-4" /> Drukuj
          </button>
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-2 rounded-full bg-white text-black px-6 py-2 text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors"
          >
            <Download className="h-4 w-4" />
            Pobierz PDF
          </button>
        </div>
      </div>

      {/* A4 Paper Container - This is what gets printed */}
      <div
        ref={printRef}
        className="mx-auto mt-24 max-w-[210mm] overflow-hidden rounded-sm bg-white shadow-2xl relative z-10 min-h-[297mm] print:mt-0 print:shadow-none print:rounded-none"
      >
        <div className="flex flex-col p-[20mm]">

          {/* Report Header */}
          <div className="mb-12 flex items-start justify-between border-b border-gray-100 pb-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 flex items-center justify-center bg-black text-white font-bold text-xl rounded-lg">R</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-display">ROI Sheet</h2>
                <p className="text-sm text-gray-500 font-mono uppercase tracking-wide">Automation Analytics</p>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold text-gray-900">TechCorp Sp. z o.o.</h3>
              <p className="text-sm text-gray-500">Data: 25 Paź, 2023</p>
              <p className="text-sm text-gray-500">Okres: 1 Paź - 31 Paź</p>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="mb-10">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Podsumowanie</h4>
            <p className="text-gray-700 leading-relaxed text-sm">
              W tym miesiącu twoje automatyzacje przetworzyły łącznie <span className="font-bold text-gray-900">14,500 elementów</span>,
              co przełożyło się na bezpośrednią oszczędność <span className="font-bold text-green-600">7,500 PLN</span>.
              Nowy proces "Invoice Parser" odpowiadał za 40% tych oszczędności. Czas pracy systemu (Uptime) wyniósł 99.9%.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="mb-12 grid grid-cols-3 gap-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-2 text-xs font-bold uppercase text-gray-500 tracking-wider">Oszczędności</div>
              <div className="text-4xl font-bold text-gray-900 font-display">7.5k</div>
              <div className="mt-2 text-xs font-medium text-green-600 bg-green-100 inline-block px-2 py-1 rounded">+12% vs last month</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-2 text-xs font-bold uppercase text-gray-500 tracking-wider">Godziny</div>
              <div className="text-4xl font-bold text-gray-900 font-display">45h</div>
              <div className="mt-2 text-xs text-gray-500">~1.5 etatu</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-2 text-xs font-bold uppercase text-gray-500 tracking-wider">Zadania</div>
              <div className="text-4xl font-bold text-gray-900 font-display">14.5k</div>
              <div className="mt-2 text-xs text-gray-500">Przetworzone</div>
            </div>
          </div>

          {/* Chart Section - Fixed size for print */}
          <div className="mb-12">
            <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Trend Oszczędności</h4>
            <div className="h-64 w-full print:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Bar
                    dataKey="saved"
                    fill="#111"
                    radius={[2, 2, 0, 0]}
                    barSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="flex-1">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Topowe Automatyzacje</h4>
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-semibold uppercase text-gray-500 bg-gray-50">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">Nazwa Procesu</th>
                  <th className="py-3 px-4 text-right">Wykonania</th>
                  <th className="py-3 px-4 text-right rounded-r-lg">Oszczędność (PLN)</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-50">
                  <td className="py-4 px-4 font-bold text-gray-900">Invoice Parser</td>
                  <td className="py-4 px-4 text-right font-mono">4,200</td>
                  <td className="py-4 px-4 text-right font-bold text-green-600 font-mono">3,100</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-4 px-4 font-bold text-gray-900">Lead Scoring AI</td>
                  <td className="py-4 px-4 text-right font-mono">8,150</td>
                  <td className="py-4 px-4 text-right font-bold text-green-600 font-mono">2,800</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-gray-900">Email Outreach</td>
                  <td className="py-4 px-4 text-right font-mono">2,150</td>
                  <td className="py-4 px-4 text-right font-bold text-green-600 font-mono">1,600</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-auto border-t border-gray-100 pt-6 text-center text-xs text-gray-400 uppercase tracking-widest">
            Powered by ROI Sheet • www.roisheet.com
          </div>
        </div>
      </div>
    </div>
  );
}
