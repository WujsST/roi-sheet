import { redirect } from "next/navigation"
import { getCurrentRole } from "@/lib/auth/role"
import { getClientReportData } from "@/app/actions"
import { ClientDashboard } from "@/components/member/ClientDashboard"

export const dynamic = "force-dynamic"

export default async function MyOrgPage() {
  const role = await getCurrentRole()
  if (role.role === "admin") redirect("/")
  if (role.role === "unassigned" || !role.clientId) redirect("/pending")

  const snapshot = await getClientReportData(role.clientId)
  return <ClientDashboard snapshot={snapshot} />
}
