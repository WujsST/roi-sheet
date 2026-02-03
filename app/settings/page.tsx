"use client";

import { Settings, User, Lock, Save, Copy, Check, Eye, EyeOff, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getApiKey, generateNewApiKey } from "@/app/actions";

export default function SettingsPage() {
   const [isKeyVisible, setIsKeyVisible] = useState(false);
   const [copiedKey, setCopiedKey] = useState(false);
   const [copiedWebhook, setCopiedWebhook] = useState(false);

   const [apiKey, setApiKey] = useState("Ładowanie...");
   const [isGenerating, setIsGenerating] = useState(false);

   const webhookUrl = "https://app.roisheet.com/api/webhook/execution";

   useEffect(() => {
      getApiKey().then(setApiKey);
   }, []);

   const copyToClipboard = (text: string, type: 'key' | 'webhook') => {
      navigator.clipboard.writeText(text);
      if (type === 'key') {
         setCopiedKey(true);
         setTimeout(() => setCopiedKey(false), 2000);
      } else {
         setCopiedWebhook(true);
         setTimeout(() => setCopiedWebhook(false), 2000);
      }
   };

   const generateNewKey = async () => {
      setIsGenerating(true);
      try {
         const newKey = await generateNewApiKey();
         setApiKey(newKey);
         setIsKeyVisible(true);
      } catch (error) {
         console.error("Failed to generate key:", error);
         alert("Błąd generowania klucza API");
      } finally {
         setIsGenerating(false);
      }
   };

   return (
      <div className="space-y-8 pb-20 max-w-4xl">
         {/* Header */}
         <div>
            <h1 className="text-3xl font-bold text-white font-display tracking-tight flex items-center gap-3">
               <Settings className="h-8 w-8 text-text-muted" />
               Ustawienia
            </h1>
            <p className="text-text-muted mt-2 font-mono text-xs uppercase tracking-widest">
               Konfiguracja profilu, integracji i bezpieczeństwa
            </p>
         </div>

         {/* Sections Container */}
         <div className="space-y-8">

            {/* Profile Section */}
            <section className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-8">
               <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                  <User className="h-5 w-5 text-white" />
                  <h2 className="text-lg font-bold text-white font-display">Profil Użytkownika</h2>
               </div>

               <div className="flex gap-8">
                  <div className="shrink-0">
                     <div className="h-24 w-24 rounded-full bg-brand-accent flex items-center justify-center text-3xl font-bold text-white mb-4">DS</div>
                     <button className="text-xs text-brand-accent hover:underline font-mono uppercase tracking-wide">Zmień Avatar</button>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Imię</label>
                        <input type="text" defaultValue="Dawid" className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none focus:border-brand-accent transition-colors" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Nazwisko</label>
                        <input type="text" defaultValue="Stępień" className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none focus:border-brand-accent transition-colors" />
                     </div>
                     <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Email</label>
                        <input type="email" defaultValue="dawid@roisheet.com" className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none focus:border-brand-accent transition-colors" />
                     </div>
                  </div>
               </div>
            </section>

            {/* Security Section */}
            <section className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-8">
               <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                  <Lock className="h-5 w-5 text-white" />
                  <h2 className="text-lg font-bold text-white font-display">Bezpieczeństwo</h2>
               </div>

               <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-[#111]">
                  <div>
                     <h3 className="font-bold text-white text-sm">Dwuskładnikowe Uwierzytelnianie (2FA)</h3>
                     <p className="text-xs text-text-muted mt-1">Dodatkowa warstwa ochrony konta.</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 uppercase tracking-wider">Włącz</button>
               </div>
            </section>

            {/* API & Integrations Section */}
            <section className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-8">
               <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                  </div>
                  <h2 className="text-lg font-bold text-white font-display">API & Integracje</h2>
               </div>

               <div className="space-y-6">
                  <div className="p-4 rounded-xl border border-white/5 bg-[#111]">
                     <h3 className="font-bold text-white text-sm mb-2">Twój Webhook URL</h3>
                     <p className="text-xs text-text-muted mb-4 leading-relaxed">
                        Użyj tego adresu URL, aby przesyłać dane o wykonaniach automatyzacji z platform takich jak n8n, Zapier czy Make.
                     </p>
                     <div className="flex items-center gap-2 bg-[#000] p-3 rounded-lg border border-white/10 group relative transition-colors border-dashed focus-within:border-solid focus-within:border-indigo-500/50">
                        <code className="text-xs text-indigo-300 font-mono flex-1 font-bold truncate select-all">
                           {webhookUrl}
                        </code>
                        <button
                           onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                           className="flex items-center gap-2 text-xs text-text-muted hover:text-white px-3 py-1.5 rounded-md transition-colors bg-white/5 hover:bg-white/10"
                        >
                           {copiedWebhook ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                           {copiedWebhook ? "Skopiowano" : "Kopiuj"}
                        </button>
                     </div>
                  </div>

                  <div className="p-4 rounded-xl border border-white/5 bg-[#111]">
                     <div className="flex items-start justify-between mb-4">
                        <div>
                           <h3 className="font-bold text-white text-sm">Klucz API</h3>
                           <p className="text-xs text-text-muted mt-1">Służy do autoryzacji zapytań webhooka.</p>
                        </div>
                        <button
                           onClick={generateNewKey}
                           disabled={isGenerating}
                           className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 hover:bg-indigo-500/20 transition-colors uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                           {isGenerating ? (
                              <>
                                 <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                 Generowanie...
                              </>
                           ) : (
                              "Generuj Nowy"
                           )}
                        </button>
                     </div>
                     <div className="flex items-center gap-2 bg-[#000] p-3 rounded-lg border border-white/10">
                        <div className="flex-1 flex items-center gap-2">
                           <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                           <code className="text-xs text-text-muted font-mono truncate">
                              {isKeyVisible ? apiKey : "roi_live_****************************"}
                           </code>
                        </div>
                        <div className="flex gap-2">
                           <button
                              onClick={() => copyToClipboard(apiKey, 'key')}
                              className="p-2 rounded hover:bg-white/10 text-text-muted hover:text-white transition-colors"
                              title="Kopiuj klucz API"
                           >
                              {copiedKey ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                           </button>
                           <button
                              onClick={() => setIsKeyVisible(!isKeyVisible)}
                              className="p-2 rounded hover:bg-white/10 text-text-muted hover:text-white transition-colors"
                              title={isKeyVisible ? "Ukryj" : "Pokaż"}
                           >
                              {isKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                     <Link
                        href="/docs/api"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group w-full justify-center"
                     >
                        <div className="p-1.5 rounded-md bg-white/5 group-hover:bg-white/10">
                           <FileText className="w-4 h-4 text-indigo-400" />
                        </div>
                        <span className="text-sm font-bold text-gray-200">Zobacz Dokumentację API</span>
                        <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors ml-auto" />
                     </Link>
                  </div>
               </div>
            </section>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
               <button className="flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-bold text-black hover:bg-gray-200 transition-colors shadow-lg shadow-white/5">
                  <Save className="h-4 w-4" /> Zapisz Zmiany
               </button>
            </div>

         </div>
      </div>
   );
}
