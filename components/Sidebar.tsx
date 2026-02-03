"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Workflow,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  ScrollText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, UserButton } from "@clerk/nextjs";

const menuItems = [
  { name: "Dashboard", icon: LayoutGrid, href: "/" },
  { name: "Automatyzacje", icon: Workflow, href: "/automations" },
  { name: "Klienci", icon: Users, href: "/clients" },
  { name: "Logi", icon: ScrollText, href: "/logs" },
  { name: "Raporty", icon: FileText, href: "/reports" },
  { name: "Ustawienia", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border-subtle bg-bg-sidebar transition-transform max-md:-translate-x-full font-sans">
      <div className="flex h-full flex-col px-4 py-8">
        {/* Logo */}
        <div className="mb-12 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black font-bold text-lg font-display">
            R
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white font-display">
              ROI Sheet
            </h1>
            <p className="text-xs text-text-muted">Automation Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-full px-5 py-3.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "border border-white/20 text-white bg-white/5 shadow-sm"
                    : "border border-transparent text-text-muted hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-text-muted")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="mt-auto pt-6">
          <div className="group flex items-center gap-3 rounded-full border border-border-subtle bg-white/5 p-2 pr-4 transition-colors hover:border-white/20">
            <div className="h-10 w-10 flex items-center justify-center">
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: "h-10 w-10"
                  }
                }}
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold text-white">
                {isLoaded ? (user?.fullName || user?.firstName || "Użytkownik") : "..."}
              </p>
              <p className="truncate text-xs text-text-muted">
                {isLoaded ? (user?.primaryEmailAddress?.emailAddress || "Pro Plan") : "..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
