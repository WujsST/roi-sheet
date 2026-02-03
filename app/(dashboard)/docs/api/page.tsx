"use client";

import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function ApiDocsPage() {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const exampleRequest = `{
  "workflow_id": "google-ads-optimizer",
  "execution_id": "exec-12345",
  "status": "success",
  "platform": "n8n",
  "started_at": "2024-02-03T10:00:00Z",
  "execution_time_ms": 1500,
  "metadata": {
    "campaign": "Spring Sale",
    "budget_adjustment": 150
  }
}`;

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <div>
                    <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
                        <ArrowLeft className="w-4 h-4" />
                        Powrót do Ustawień
                    </Link>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold font-display tracking-tight">Dokumentacja API</h1>
                            <p className="text-gray-400 mt-1 text-lg">Integracja zewnętrznych automatyzacji z ROI Sheet</p>
                        </div>
                    </div>
                </div>

                {/* Authentication */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-2">Uwierzytelnianie</h2>
                    <p className="text-gray-400 leading-relaxed">
                        API wymaga uwierzytelnienia przy każdym zapytaniu. Użyj nagłówka <code className="text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded text-sm font-mono">X-API-Key</code> z Twoim kluczem API.
                    </p>
                    <div className="bg-[#111] border border-white/10 rounded-xl p-4 font-mono text-sm text-gray-300">
                        X-API-Key: roi_live_...
                    </div>
                </section>

                {/* Endpoint */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-2">Rejestracja Wykonania</h2>
                    <div className="flex items-center gap-4 font-mono text-sm">
                        <span className="px-3 py-1 rounded-md bg-green-500/10 text-green-400 font-bold border border-green-500/20">POST</span>
                        <span className="text-gray-300">https://app.roisheet.com/api/webhook/execution</span>
                    </div>
                    <p className="text-gray-400">
                        Wysyła dane o wykonaniu pojedynczego workflow. Obsługuje n8n, Zapier, Make i inne platformy.
                    </p>

                    <div className="space-y-4">
                        <h3 className="font-bold text-white">Parametry Body</h3>
                        <div className="overflow-hidden rounded-xl border border-white/10">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#111] text-gray-400 font-mono uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="p-4 font-medium">Pole</th>
                                        <th className="p-4 font-medium">Wymagane</th>
                                        <th className="p-4 font-medium">Typ</th>
                                        <th className="p-4 font-medium">Opis</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 bg-[#0a0a0a]">
                                    <tr className="group hover:bg-[#111]">
                                        <td className="p-4 font-mono text-indigo-300">workflow_id</td>
                                        <td className="p-4 text-green-400">Tak</td>
                                        <td className="p-4 text-gray-400">string</td>
                                        <td className="p-4 text-gray-300">ID twojego workflow (np. z n8n)</td>
                                    </tr>
                                    <tr className="group hover:bg-[#111]">
                                        <td className="p-4 font-mono text-indigo-300">status</td>
                                        <td className="p-4 text-green-400">Tak</td>
                                        <td className="p-4 text-gray-400">string</td>
                                        <td className="p-4 text-gray-300">'success' | 'error' | 'running'</td>
                                    </tr>
                                    <tr className="group hover:bg-[#111]">
                                        <td className="p-4 font-mono text-indigo-300">execution_id</td>
                                        <td className="p-4 text-gray-500">Opcjonalne</td>
                                        <td className="p-4 text-gray-400">string</td>
                                        <td className="p-4 text-gray-300">Unikalne ID egzekucji</td>
                                    </tr>
                                    <tr className="group hover:bg-[#111]">
                                        <td className="p-4 font-mono text-indigo-300">created_at</td>
                                        <td className="p-4 text-gray-500">Opcjonalne</td>
                                        <td className="p-4 text-gray-400">ISO 8601</td>
                                        <td className="p-4 text-gray-300">Data rozpoczęcia (domyślnie teraz)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white">Przykład (JSON)</h3>
                            <button
                                onClick={() => copyToClipboard(exampleRequest)}
                                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                {copied ? "Skopiowano" : "Kopiuj JSON"}
                            </button>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-[#111] p-6 overflow-x-auto relative group">
                            <pre className="font-mono text-sm text-gray-300 leading-relaxed">
                                {exampleRequest}
                            </pre>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
