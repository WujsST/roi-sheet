import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Sidebar } from "@/components/Sidebar";
import { getCurrentRole } from "@/lib/auth/role";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getCurrentRole();

  // Wykrywamy aktualną ścieżkę z headerów (middleware przekazuje x-pathname; fallback do "")
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Redirect logic per role
  if (role.role === "unassigned" && !pathname.startsWith("/pending")) {
    redirect("/pending");
  }

  // Member nie widzi admin routes — twardy bypass na poziomie layoutu
  if (role.role === "member") {
    const memberAllowed =
      pathname === "" ||
      pathname.startsWith("/moja-organizacja") ||
      pathname.startsWith("/reports/") || // może otworzyć szczegół raportu przekierowany z listy
      pathname.startsWith("/pending");
    if (!memberAllowed) {
      redirect("/moja-organizacja");
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role.role} />
      <main className="flex-1 px-4 py-8 md:ml-64 md:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
