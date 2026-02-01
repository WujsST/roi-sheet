"use client";

import { Settings, User, Lock, Bell, Save } from "lucide-react";

export default function SettingsPage() {
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
