"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Download,
  Plus,
  AlertCircle,
  X,
  Users,
  Trash,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  getReportsData,
  getClientsData,
  deleteReport,
  generateReport,
} from "@/app/actions";
import type { Report, Client } from "@/lib/supabase/types";
import { DateRangePicker } from "@/components/DateRangePicker";
import {
  parseRangeFromSearchParams,
  toRangeISO,
  formatRangeLabel,
  presetRange,
} from "@/lib/date-range";
import { parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsPageFallback />}>
      <ReportsPageInner />
    </Suspense>
  );
}

function ReportsPageFallback() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-12 text-center">
      <div className="animate-spin h-8 w-8 border-2 border-brand-accent border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-text-muted font-mono">Ładowanie…</p>
    </div>
  );
}

function ReportsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const range = parseRangeFromSearchParams({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });
  const rangeISO = toRangeISO(range);
  const headerLabel = formatRangeLabel(range);

  const [reports, setReports] = useState<Report[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [reportsData, clientsData] = await Promise.all([
          getReportsData(),
          getClientsData(),
        ]);
        if (!cancelled) {
          setReports(reportsData);
          setClients(clientsData);
        }
      } catch (e) {
        if (!cancelled) setError(e as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGenerateReport(clientId: string) {
    setGeneratingFor(clientId);
    try {
      const { reportId } = await generateReport({
        clientId,
        from: rangeISO.from,
        to: rangeISO.to,
      });
      setIsModalOpen(false);
      startTransition(() => {
        router.push(`/reports/${reportId}`);
      });
    } catch (err) {
      console.error("Failed to generate report:", err);
      alert("Nie udało się wygenerować raportu: " + (err as Error).message);
    } finally {
      setGeneratingFor(null);
    }
  }

  const handleDeleteReport = async (
    reportId: string,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Czy na pewno chcesz usunąć ten raport?")) return;

    try {
      await deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      console.error("Failed to delete report:", err);
      alert("Nie udało się usunąć raportu.");
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-display tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8 text-text-muted" />
            Raporty
          </h1>
          <p className="text-text-muted mt-2 font-mono text-xs uppercase tracking-widest">
            Archiwum wygenerowanych dokumentów • Generuj dla: {headerLabel}
          </p>
        </div>

        <div className="flex gap-3">
          <DateRangePicker initial={rangeISO} />
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-bold text-black hover:bg-gray-200 transition-colors font-mono uppercase tracking-wide"
          >
            Generuj Nowy
          </button>
        </div>
      </div>

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

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-12 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-brand-accent border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-muted font-mono">Ładowanie raportów...</p>
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-12 text-center">
          <FileText className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted font-mono mb-4">
            Brak raportów do wyświetlenia
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-6 py-2 text-sm font-bold text-white hover:bg-brand-accent/80 transition-colors"
          >
            <Plus className="h-4 w-4" /> Wygeneruj pierwszy raport
          </button>
        </div>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {reports.map((report) => {
            const periodLabel = formatRangeLabel({
              from: parseISO(report.period_from),
              to: parseISO(report.period_to),
            });
            return (
              <div
                key={report.id}
                className="group relative flex flex-col rounded-3xl border border-white/10 bg-[#0a0a0a] overflow-hidden transition-all hover:border-white/30 hover:shadow-2xl hover:shadow-white/5"
              >
                <div className="relative h-64 w-full bg-[#0f0f0f] flex items-center justify-center p-8 overflow-hidden group-hover:bg-[#111] transition-colors">
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

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity backdrop-blur-sm">
                    <Link
                      href={`/reports/${report.id}`}
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-110 transition-transform"
                      title="Otwórz raport"
                    >
                      <FileText className="h-5 w-5" />
                    </Link>
                    <Link
                      href={`/reports/${report.id}?print=1`}
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-110 transition-transform"
                      title="Pobierz PDF"
                    >
                      <Download className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={(e) => handleDeleteReport(report.id, e)}
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 hover:scale-110 transition-transform"
                      title="Usuń raport"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-5 border-t border-white/5 bg-[#0a0a0a]">
                  <h3 className="font-bold text-white text-sm font-display truncate mb-1">
                    {report.client_name || "Raport"}
                  </h3>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-text-muted font-mono truncate">
                      {periodLabel}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono bg-white/5 px-2 py-1 rounded border border-white/5 shrink-0">
                      {new Date(report.created_at).toLocaleDateString("pl-PL")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 bg-transparent p-6 transition-all hover:border-white/30 hover:bg-white/5 min-h-[300px]"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white transition-colors border border-white/5">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-sm font-bold text-text-muted font-mono uppercase tracking-widest group-hover:text-white">
              Generuj Raport
            </span>
          </button>
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-text-muted hover:bg-white/5 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-brand-accent/10 p-2">
                  <Users className="h-5 w-5 text-brand-accent" />
                </div>
                <h2 className="text-xl font-bold text-white font-display">
                  Wybierz Klienta
                </h2>
              </div>
              <p className="text-sm text-text-muted">
                Raport zostanie wygenerowany dla zakresu:{" "}
                <span className="font-bold text-white">{headerLabel}</span>
              </p>
            </div>

            {/* Quick range presets */}
            <div className="mb-6 flex flex-wrap gap-2">
              {([
                { key: 'this_month' as const, label: 'Ten miesiąc' },
                { key: 'prev_month' as const, label: 'Poprzedni miesiąc' },
                { key: 'last_7' as const, label: 'Ost. 7 dni' },
                { key: 'last_30' as const, label: 'Ost. 30 dni' },
              ]).map((p) => {
                const presetISO = toRangeISO(presetRange(p.key));
                const isActive = presetISO.from === rangeISO.from && presetISO.to === rangeISO.to;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      const sp = new URLSearchParams(searchParams.toString());
                      sp.set('from', presetISO.from);
                      sp.set('to', presetISO.to);
                      router.replace(`/reports?${sp.toString()}`);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-mono border transition-colors",
                      isActive
                        ? "bg-brand-accent text-white border-brand-accent"
                        : "border-white/10 text-text-muted hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {clients.length === 0 ? (
                <p className="text-center text-text-muted py-8">Brak klientów</p>
              ) : (
                clients.map((client) => {
                  const busy = generatingFor === client.id;
                  return (
                    <button
                      key={client.id}
                      onClick={() => handleGenerateReport(client.id)}
                      disabled={generatingFor !== null}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left disabled:opacity-50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-sm font-bold text-white">
                        {client.logo || client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white">{client.name}</h3>
                        <p className="text-xs text-text-muted font-mono">
                          {client.industry}
                        </p>
                      </div>
                      <div className="text-xs text-text-muted">
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          `${client.automations_count} automatyzacji`
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
