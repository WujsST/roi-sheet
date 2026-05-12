"use client";

import { useRef, useEffect } from "react";
import { Download, Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useReactToPrint } from "react-to-print";
import { formatCurrency } from "@/lib/utils";
import { formatRangeLabel } from "@/lib/date-range";
import { parseISO } from "date-fns";
import type { Report } from "@/lib/supabase/types";

interface Props {
  report: Report;
  autoPrint?: boolean;
}

export function ReportRenderer({ report, autoPrint = false }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const snapshot = report.snapshot_data;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Raport_ROI_${snapshot.client.client_name}`,
    pageStyle: `
      @page { size: A4; margin: 0; }
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

  useEffect(() => {
    if (autoPrint) {
      // Slight delay so the rendered DOM is committed before opening the print dialog
      const t = setTimeout(() => handlePrint(), 250);
      return () => clearTimeout(t);
    }
  }, [autoPrint, handlePrint]);

  const periodLabel = formatRangeLabel({
    from: parseISO(report.period_from),
    to: parseISO(report.period_to),
  });

  const chartData = (snapshot.trends || []).map((t) => ({
    name: t.week_label,
    saved: Number(t.total_savings || 0),
  }));

  return (
    <div className="min-h-screen bg-bg-app pb-20 pt-8 relative font-sans">
      <div className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-white/10 bg-bg-app/90 px-8 py-4 backdrop-blur-md print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/reports"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-text-muted hover:bg-white/10 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">
              {report.title}
            </h1>
            <p className="text-xs text-text-muted">
              Zakres: {periodLabel} • Wygenerowano:{" "}
              {new Date(report.created_at).toLocaleDateString("pl-PL")}
            </p>
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
            <Download className="h-4 w-4" /> Pobierz PDF
          </button>
        </div>
      </div>

      <div
        ref={printRef}
        className="mx-auto mt-24 max-w-[210mm] overflow-hidden rounded-sm bg-white shadow-2xl relative z-10 min-h-[297mm] print:mt-0 print:shadow-none print:rounded-none"
      >
        <div className="flex flex-col p-[20mm]">
          {/* Header */}
          <div className="mb-12 flex items-start justify-between border-b border-gray-100 pb-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 flex items-center justify-center bg-black text-white font-bold text-xl rounded-lg">
                R
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-display">
                  ROI Sheet
                </h2>
                <p className="text-sm text-gray-500 font-mono uppercase tracking-wide">
                  Automation Analytics
                </p>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold text-gray-900">
                {snapshot.client.client_name}
              </h3>
              <p className="text-sm text-gray-500">Okres: {periodLabel}</p>
              <p className="text-sm text-gray-500">
                Wygenerowano:{" "}
                {new Date(report.created_at).toLocaleDateString("pl-PL", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-10">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
              Podsumowanie
            </h4>
            <p className="text-gray-700 leading-relaxed text-sm">
              W okresie <span className="font-bold text-gray-900">{periodLabel}</span>{" "}
              automatyzacje dla {snapshot.client.client_name} przetworzyły łącznie{" "}
              <span className="font-bold text-gray-900">
                {formatCurrency(snapshot.client.total_executions)} zadań
              </span>
              , co przełożyło się na bezpośrednią oszczędność{" "}
              <span className="font-bold text-green-600">
                {formatCurrency(snapshot.client.total_savings_pln)} PLN
              </span>
              . Zaoszczędzono{" "}
              <span className="font-bold text-gray-900">
                {snapshot.client.total_hours_saved}h
              </span>{" "}
              czasu pracy.
              {snapshot.client.avg_roi_percentage > 0 &&
                ` Średni ROI wyniósł ${snapshot.client.avg_roi_percentage.toFixed(0)}%.`}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="mb-12 grid grid-cols-3 gap-6">
            <MetricCard
              title="Oszczędności"
              value={formatCurrency(snapshot.client.total_savings_pln)}
              suffix="PLN"
            />
            <MetricCard
              title="Godziny"
              value={`${snapshot.client.total_hours_saved}h`}
              suffix={`~${(snapshot.client.total_hours_saved / 160).toFixed(1)} etatu`}
            />
            <MetricCard
              title="Zadania"
              value={formatCurrency(snapshot.client.total_executions)}
              suffix="Przetworzone"
            />
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="mb-12">
              <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
                Trend Oszczędności
              </h4>
              <div className="h-64 w-full print:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: 600 }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Bar dataKey="saved" fill="#111" radius={[2, 2, 0, 0]} barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top automations */}
          {snapshot.automations.length > 0 && (
            <div className="flex-1">
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
                Topowe Automatyzacje
              </h4>
              <table className="w-full text-left text-sm">
                <thead className="text-xs font-semibold uppercase text-gray-500 bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 rounded-l-lg">Nazwa Procesu</th>
                    <th className="py-3 px-4 text-right">Wykonania</th>
                    <th className="py-3 px-4 text-right rounded-r-lg">
                      Oszczędność (PLN)
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {snapshot.automations.slice(0, 5).map((automation, index) => (
                    <tr
                      key={automation.id}
                      className={
                        index < snapshot.automations.length - 1
                          ? "border-b border-gray-50"
                          : ""
                      }
                    >
                      <td className="py-4 px-4 font-bold text-gray-900">
                        {automation.name}
                      </td>
                      <td className="py-4 px-4 text-right font-mono">
                        {formatCurrency(automation.executions_count)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-green-600 font-mono">
                        {formatCurrency(automation.money_saved_pln)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Execution stats per automation — only show if new snapshot fields present */}
          {snapshot.automations.length > 0 && snapshot.automations.some((a) => a.success_count !== undefined || a.error_count !== undefined) && (
            <div className="mt-10 print:mt-6">
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
                Wykonania &amp; Błędy per Automatyzacja
              </h4>
              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-4 py-3">Automatyzacja</th>
                      <th className="text-right px-4 py-3">Sukces</th>
                      <th className="text-right px-4 py-3">Błędy</th>
                      <th className="text-right px-4 py-3">Oszczędności</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {snapshot.automations.map((a) => {
                      const success = a.success_count ?? 0
                      const errors = a.error_count ?? 0
                      return (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-900">{a.name}</td>
                          <td className="px-4 py-3 text-right text-green-600 font-mono">{success}</td>
                          <td className={`px-4 py-3 text-right font-mono ${errors > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            {errors}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900 font-mono">
                            {formatCurrency(a.money_saved_pln)} PLN
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-4 py-3 text-gray-900 text-xs">
                        Razem ({snapshot.client.total_errors ?? 0} błędów, {((snapshot.client.error_rate ?? 0) * 100).toFixed(1)}% error rate)
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 font-mono">
                        {snapshot.automations.reduce((s, a) => s + (a.success_count ?? 0), 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600 font-mono">
                        {snapshot.client.total_errors ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 font-mono">
                        {formatCurrency(snapshot.client.total_savings_pln)} PLN
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-auto border-t border-gray-100 pt-6 text-center text-xs text-gray-400 uppercase tracking-widest">
            Powered by ROI Sheet • www.roisheet.com
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  suffix,
}: {
  title: string;
  value: string;
  suffix: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
      <div className="mb-2 text-xs font-bold uppercase text-gray-500 tracking-wider">
        {title}
      </div>
      <div className="text-4xl font-bold text-gray-900 font-display">{value}</div>
      <div className="mt-2 text-xs text-gray-500">{suffix}</div>
    </div>
  );
}
