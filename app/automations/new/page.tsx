"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/Stepper";
import { Copy, Mail, Database, Bot, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createNewAutomation, getClientsData } from "@/app/actions";
import type { Client } from "@/lib/supabase/types";

const steps = ["Info", "Benchmark", "Wartość", "Integracja"];

const categories = [
  { id: "email", name: "Email Marketing", icon: Mail, saved: "2h / 100 items" },
  { id: "data", name: "Data Entry", icon: Database, saved: "5h / 1000 rows" },
  { id: "support", name: "AI Support", icon: Bot, saved: "15min / ticket" },
];

export default function NewAutomationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [workflowId, setWorkflowId] = useState("");
  const [createdAutomationId, setCreatedAutomationId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    client: "",
    category: "",
    hourlyRate: 100,
  });

  useEffect(() => {
    // Generate random workflow ID on mount
    setWorkflowId(`wh_${Math.random().toString(36).substring(2, 11)}`);

    // Fetch clients
    getClientsData().then(data => {
      setClients(data);
      // Removed auto-select to allow "no selection" (which will default to first in handleActivate if needed)
    });
  }, []);

  const handleActivate = async () => {
    if (!formData.name || !formData.category) {
      alert("Proszę uzupełnić nazwę i kategorię.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Logic: If user selected a client, use it. If not, use the first available one as fallback.
      const selectedClientId = formData.client || (clients.length > 0 ? clients[0].id : null);

      if (!selectedClientId) {
        alert("Brak dostępnych klientów w systemie.");
        setIsSubmitting(false);
        return;
      }

      // Map category to icon
      const iconMap: Record<string, string> = {
        email: 'Mail',
        data: 'Database',
        support: 'Bot'
      };

      const result = await createNewAutomation({
        name: formData.name,
        icon: iconMap[formData.category] || 'Zap',
        hourlyRate: formData.hourlyRate,
        workflowId: workflowId,
        clientIds: [selectedClientId]
      });

      // Show success state with ID
      if (result && result.length > 0) {
        setCreatedAutomationId(result[0].id);
      } else {
        router.push('/automations');
      }

    } catch (error) {
      console.error(error);
      alert("Wystąpił błąd podczas tworzenia automatyzacji.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 20 : -20,
      opacity: 0,
    }),
  };

  if (createdAutomationId) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center space-y-8 bg-black p-8 text-center animate-in fade-in duration-500">
        <div className="rounded-full bg-brand-success/10 p-6">
          <Bot className="h-12 w-12 text-brand-success" />
        </div>
        <div className="space-y-4 max-w-lg">
          <h2 className="text-3xl font-bold text-white">Automatyzacja Utworzona!</h2>
          <p className="text-gray-400">
            Aby połączyć n8n z tą automatyzacją, użyj poniższego ID w swoim workflow (INSERT do tabeli workflow_executions).
          </p>
        </div>

        <div className="w-full max-w-lg space-y-2 text-left">
          <label className="text-xs font-bold text-gray-500 uppercase">Automation ID (UUID)</label>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-brand-accent font-mono break-all">
              {createdAutomationId}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(createdAutomationId)}
              className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-4 text-white hover:bg-white hover:text-black transition-colors"
            >
              <Copy className="h-5 w-5" />
            </button>
          </div>
        </div>

        <Link
          href="/automations"
          className="rounded-full bg-white px-8 py-3 text-sm font-bold text-black hover:bg-gray-200 transition-colors"
        >
          Wróć do listy
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-12 px-6">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-white font-display tracking-tight">
          Konfigurator Automatyzacji
        </h1>
        <p className="text-text-muted mt-2 font-mono text-xs uppercase tracking-widest">
          Skonfiguruj nowe śledzenie ROI w 4 krokach
        </p>
      </div>

      <div className="mb-12">
        <Stepper steps={steps} currentStep={currentStep} />
      </div>

      <div className="min-h-[450px] overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f0f] p-10 shadow-2xl relative">
        <AnimatePresence mode="wait" custom={currentStep}>
          <motion.div
            key={currentStep}
            custom={currentStep}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full flex flex-col relative z-10"
          >
            {/* Step 1: Info */}
            {currentStep === 0 && (
              <div className="space-y-8 max-w-lg mx-auto w-full pt-4">
                <div>
                  <label className="mb-3 block text-sm font-bold text-white uppercase tracking-wider">Nazwa Automatyzacji</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder-white/20 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all font-mono"
                    placeholder="np. Invoice Parser v2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-3 block text-sm font-bold text-white uppercase tracking-wider flex justify-between">
                    <span>Klient</span>
                    <span className="text-gray-500 text-xs normal-case">(Opcjonalnie)</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all appearance-none font-mono"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  >
                    <option value="" className="bg-black text-gray-400">Nie wybieraj teraz (Przypisz domyślnego)</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id} className="bg-black">
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Benchmark */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 pt-4">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={cn(
                      "flex flex-col items-center gap-6 rounded-2xl border p-8 text-center transition-all duration-200 group",
                      formData.category === cat.id
                        ? "border-brand-accent bg-brand-accent/10"
                        : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    <div className={cn(
                      "rounded-xl p-4 transition-transform duration-300 group-hover:scale-110",
                      formData.category === cat.id ? "bg-brand-accent text-white" : "bg-white/10 text-text-muted"
                    )}>
                      <cat.icon className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white font-display text-lg">{cat.name}</h3>
                      <p className="mt-2 text-xs font-mono text-text-muted uppercase tracking-wider">{cat.saved}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 3: Value */}
            {currentStep === 2 && (
              <div className="flex flex-col items-center justify-center py-10">
                <label className="mb-8 block text-lg font-bold text-white uppercase tracking-widest">Stawka Godzinowa</label>
                <div className="relative w-full max-w-xs group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-accent font-bold font-mono">PLN</span>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-6 py-8 pl-16 text-center text-5xl font-bold text-white outline-none focus:border-brand-accent transition-all font-display"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                  />
                </div>
                <p className="mt-8 text-sm text-text-muted font-mono uppercase tracking-wide">
                  Używane do obliczania całkowitych oszczędności
                </p>
              </div>
            )}

            {/* Step 4: Integration */}
            {currentStep === 3 && (
              <div className="space-y-8 max-w-xl mx-auto w-full pt-4">
                <div className="rounded-xl border border-brand-accent/30 bg-brand-accent/10 p-6 flex gap-4">
                  <Bot className="h-6 w-6 text-brand-accent shrink-0" />
                  <div>
                    <h3 className="mb-1 font-bold text-white">Webhook Integration</h3>
                    <p className="text-sm text-text-muted leading-relaxed">
                      Skopiuj ten adres URL i wklej go do swojego workflow w n8n jako Webhook Trigger.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <label className="mb-2 block text-xs uppercase tracking-wide text-text-muted font-bold">Webhook URL</label>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 rounded-xl border border-white/10 bg-black/50 px-5 py-4 text-sm text-brand-accent font-mono break-all shadow-inner">
                      https://api.roisheet.com/v1/hooks/{workflowId || '...'}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(`https://api.roisheet.com/v1/hooks/${workflowId}`)}
                      className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-4 text-white hover:bg-white hover:text-black hover:border-white transition-all"
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-10 flex items-center justify-between px-2">
        {currentStep > 0 ? (
          <button
            onClick={prevStep}
            className="flex items-center gap-2 rounded-full px-6 py-3 font-medium text-text-muted hover:text-white hover:bg-white/5 transition-colors uppercase text-xs tracking-widest"
          >
            <ArrowLeft className="h-4 w-4" /> Wróć
          </button>
        ) : (
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full px-6 py-3 font-medium text-text-muted hover:text-white hover:bg-white/5 transition-colors uppercase text-xs tracking-widest"
          >
            Anuluj
          </Link>
        )}

        {currentStep < steps.length - 1 ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 rounded-full bg-white text-black px-8 py-3 text-sm font-bold hover:bg-gray-200 transition-colors"
          >
            Dalej <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleActivate}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-full bg-brand-success text-black px-8 py-3 text-sm font-bold hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>Aktywuj <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
