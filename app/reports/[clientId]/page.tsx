"use client";

import { useRef, useEffect, useState } from "react";
import { Download, Printer, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useReactToPrint } from "react-to-print";
import { getClientReportData } from "@/app/actions";
import { formatCurrency } from "@/lib/utils";

interface ClientReportPageProps {
    params: {
        clientId: string;
    };
}

export default function ClientReportPage({ params }: ClientReportPageProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const reportData = await getClientReportData(params.clientId);
                setData(reportData);
            } catch (e) {
                setError(e as Error);
                console.error("Failed to load report data:", e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [params.clientId]);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Raport_ROI_${data?.client?.client_name || 'Klient'}`,
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-app text-white">
                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-bg-app text-white gap-4">
                <p className="text-red-400">Nie udało się załadować raportu.</p>
                <Link href="/clients" className="text-sm underline text-gray-500 hover:text-white">
                    Wróć do listy klientów
                </Link>
            </div>
        );
    }

    const { client, trends, automations } = data;
    const currentDate = new Date().toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' });
    const currentMonth = new Date().toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });

    // Format trends for chart (Handling Weekly Data from RPC)
    // The RPC returns { week_label, money_saved_pln, ... }
    // trends is now the chartData from existing RPC
    const chartData = (trends || []).map((t: any) => ({
        name: t.week_label, // e.g., "Tydzień 1"
        saved: t.money_saved_pln
    }));

    return (
        <div className="min-h-screen bg-bg-app pb-20 pt-8 relative font-sans">
            {/* Header Actions - hidden in print */}
            <div className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-white/10 bg-bg-app/90 px-8 py-4 backdrop-blur-md print:hidden">
                <div className="flex items-center gap-4">
                    <Link
                        href="/clients"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-text-muted hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-bold text-white uppercase tracking-wider">Raport ROI - {currentMonth}</h1>
                        <p className="text-xs text-text-muted">{client.client_name}</p>
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

            {/* A4 Paper Container */}
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
                            <h3 className="text-lg font-bold text-gray-900">{client.client_name}</h3>
                            <p className="text-sm text-gray-500">Data: {currentDate}</p>
                            <p className="text-sm text-gray-500">Raport generowany automatycznie</p>
                        </div>
                    </div>

                    {/* Executive Summary */}
                    <div className="mb-10">
                        <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Podsumowanie</h4>
                        <p className="text-gray-700 leading-relaxed text-sm">
                            Łącznie Twoje automatyzacje wykonały się <span className="font-bold text-gray-900">{client.executions_count?.toLocaleString() || 0} razy</span>,
                            co przełożyło się na oszczędność na poziomie <span className="font-bold text-green-600">{formatCurrency(client.money_saved_pln_total || 0)} PLN</span>.
                            Dzięki temu zaoszczędzono <span className="font-bold text-gray-900">{Math.round(client.saved_hours_total || 0)} godzin</span> pracy zespołu.
                        </p>
                    </div>

                    {/* Key Metrics */}
                    <div className="mb-12 grid grid-cols-3 gap-6">
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                            <div className="mb-2 text-xs font-bold uppercase text-gray-500 tracking-wider">Oszczędności</div>
                            <div className="text-4xl font-bold text-gray-900 font-display">{formatCurrency(client.money_saved_pln_total || 0)}</div>
                            <div className="mt-2 text-xs font-medium text-green-600 bg-green-100 inline-block px-2 py-1 rounded">PLN Total</div>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                            <div className="mb-2 text-xs font-bold uppercase text-gray-500 tracking-wider">Godziny</div>
                            <div className="text-4xl font-bold text-gray-900 font-display">{Math.round(client.saved_hours_total || 0)}h</div>
                            <div className="mt-2 text-xs text-gray-500">Zaoszczędzone</div>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                            <div className="mb-2 text-xs font-bold uppercase text-gray-500 tracking-wider">Procesy</div>
                            <div className="text-4xl font-bold text-gray-900 font-display">{client.automations_count || 0}</div>
                            <div className="mt-2 text-xs text-gray-500">Aktywne automatyzacje</div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="mb-12">
                        <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Trend Oszczędności (Ten Miesiąc)</h4>
                        <div className="h-64 w-full print:h-48">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
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
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <p className="text-xs text-gray-400 font-mono text-center">
                                        Brak danych o oszczędnościach w tym miesiącu.<br />
                                        Uzupełnij stawki godzinowe i czas oszczędności w automatyzacjach.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Automations Table */}
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
                                {automations.map((automation: any) => (
                                    <tr key={automation.id} className="border-b border-gray-50">
                                        <td className="py-4 px-4 font-bold text-gray-900">{automation.name}</td>
                                        <td className="py-4 px-4 text-right font-mono">{automation.executions_count?.toLocaleString() || 0}</td>
                                        <td className="py-4 px-4 text-right font-bold text-green-600 font-mono">{formatCurrency(automation.money_saved_pln || 0)}</td>
                                    </tr>
                                ))}
                                {automations.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-gray-400 italic">Brak danych o automatyzacjach</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-auto border-t border-gray-100 pt-6 text-center text-xs text-gray-400 uppercase tracking-widest">
                        Powered by ROI Sheet • www.roisheet.com
                    </div>
                </div>
            </div>
        </div>
    );
}
