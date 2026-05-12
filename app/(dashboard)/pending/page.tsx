import { redirect } from "next/navigation"
import { getCurrentRole } from "@/lib/auth/role"
import { UserButton } from "@clerk/nextjs"
import { Hourglass, Mail } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PendingPage() {
  const role = await getCurrentRole()
  if (role.role === "admin") redirect("/")
  if (role.role === "member") redirect("/moja-organizacja")

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-accent/10 border border-brand-accent/30">
          <Hourglass className="h-10 w-10 text-brand-accent" />
        </div>
        <h1 className="text-3xl font-bold text-white font-display">
          Konto czeka na aktywację
        </h1>
        <p className="text-text-muted">
          Dziękujemy za rejestrację. Twoja agencja musi przypisać Cię do organizacji,
          żebyś mógł zobaczyć dane swojej firmy.
        </p>
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 text-left">
          <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-3">
            Co dalej?
          </div>
          <ul className="space-y-2 text-sm text-white">
            <li className="flex gap-2">
              <Mail className="h-4 w-4 mt-0.5 text-brand-accent flex-shrink-0" />
              Skontaktuj się ze swoją agencją i poinformuj, że się zarejestrowałeś.
            </li>
            <li className="flex gap-2">
              <span className="text-brand-accent">•</span>
              Po przypisaniu dostęp zostanie automatycznie aktywowany.
            </li>
            <li className="flex gap-2">
              <span className="text-brand-accent">•</span>
              Możesz odświeżyć tę stronę za chwilę.
            </li>
          </ul>
        </div>
        <div className="flex justify-center pt-4">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
    </div>
  )
}
