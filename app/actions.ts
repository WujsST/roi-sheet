'use server'

import { createClient } from '@/lib/supabase/server'
import {
  clientSchema,
  automationSchema,
  reportGenerationSchema,
  dateRangeSchema,
} from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { requireAdmin } from '@/lib/auth/role'
import { defaultRange, toRangeISO, formatRangeLabel, type RangeISO } from '@/lib/date-range'
import { parseISO, format } from 'date-fns'
import { pl } from 'date-fns/locale'
import type {
  Automation,
  Client,
  Report,
  ReportSnapshot,
  ComputedDashboardStats,
  WeeklySavings,
} from '@/lib/supabase/types'

// ============================================================================
// Helpers
// ============================================================================

function ensureRange(range?: RangeISO): RangeISO {
  if (range) {
    const parsed = dateRangeSchema.parse(range)
    return parsed
  }
  return toRangeISO(defaultRange())
}

async function requireUserId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  return userId
}

// ============================================================================
// Dashboard
// ============================================================================

export async function getDashboardData(range?: RangeISO) {
  const r = ensureRange(range)
  const [automations, savingsHistory, stats] = await Promise.all([
    getAutomationsData(),
    getMonthlySavingsData(r),
    getComputedDashboardStats(r),
  ])
  return { automations, savingsHistory, stats, range: r }
}

export async function getAutomationsData() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('automations_dashboard')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Automation[]
}

export async function getClientsData(): Promise<Client[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select(`id, name, industry, status, logo, created_at`)
    .order('created_at', { ascending: false })
  if (error) throw error

  const clientIds = (data || []).map((c) => c.id)
  if (clientIds.length === 0) return []

  const [{ data: statsData, error: statsError }, { data: automationsData, error: autoError }] =
    await Promise.all([
      supabase.from('clients_dashboard').select('*').in('client_id', clientIds),
      supabase
        .from('automations_dashboard')
        .select('client_id, roi_percentage, monthly_cost_pln')
        .in('client_id', clientIds),
    ])
  if (statsError) throw statsError
  if (autoError) throw autoError

  const statsMap = new Map((statsData || []).map((s) => [s.client_id, s]))
  const roiByClient = new Map<string, number>()
  const grouped = new Map<string, NonNullable<typeof automationsData>>()
  for (const auto of automationsData || []) {
    if (!grouped.has(auto.client_id)) grouped.set(auto.client_id, [])
    grouped.get(auto.client_id)!.push(auto)
  }
  for (const [clientId, autos] of grouped) {
    const valid = autos.filter(
      (a) => a.roi_percentage != null && a.monthly_cost_pln != null && a.monthly_cost_pln > 0,
    )
    if (valid.length > 0) {
      const avg = valid.reduce((sum, a) => sum + (a.roi_percentage || 0), 0) / valid.length
      roiByClient.set(clientId, Math.round(avg))
    } else {
      roiByClient.set(clientId, 0)
    }
  }

  return (data || []).map((client) => {
    const stats = statsMap.get(client.id)
    return {
      ...client,
      automations_count: stats?.automations_count || 0,
      saved_amount: stats?.money_saved_pln_total || 0,
      roi_percentage: roiByClient.get(client.id) || 0,
    } as Client
  })
}

export async function getMonthlySavingsData(
  range?: RangeISO,
  clientId: string | null = null,
): Promise<WeeklySavings[]> {
  const r = ensureRange(range)
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_monthly_savings_chart', {
    p_from: r.from,
    p_to: r.to,
    p_client_id: clientId,
  })

  if (error) {
    console.error('[getMonthlySavingsData] RPC error:', error)
    return []
  }
  return (data || []).map((item: { week_label: string; money_saved_pln: number | string }) => ({
    week_label: item.week_label,
    money_saved_pln: Number(item.money_saved_pln || 0),
  }))
}

export async function getComputedDashboardStats(range?: RangeISO): Promise<ComputedDashboardStats> {
  const r = ensureRange(range)
  const supabase = await createClient()

  const { data: rangedRow, error: statsError } = await supabase
    .rpc('calculate_dashboard_stats', { p_from: r.from, p_to: r.to })
    .single()

  if (statsError) {
    console.error('[getComputedDashboardStats] RPC error:', statsError)
  }

  const ranged = rangedRow as
    | {
        total_savings: number
        time_saved_hours: number
        efficiency_score: number
        inaction_cost: number
        total_executions: number
      }
    | null

  // active_automations is independent of range, total_savings_all_time aggregates everything
  const [
    { count: activeAutomations },
    { count: todayExecutions },
    { data: allTimeRow },
  ] = await Promise.all([
    supabase.from('automations').select('*', { count: 'exact', head: true }).eq('status', 'healthy'),
    supabase
      .from('executions_raw')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().split('T')[0]),
    supabase
      .from('clients_dashboard')
      .select('money_saved_pln_total'),
  ])

  const totalAllClients = (allTimeRow || []).reduce(
    (acc: number, row: { money_saved_pln_total: number | null }) =>
      acc + Number(row.money_saved_pln_total || 0),
    0,
  )

  return {
    total_savings: Number(ranged?.total_savings || 0),
    time_saved_hours: Number(ranged?.time_saved_hours || 0),
    efficiency_score: Number(ranged?.efficiency_score || 0),
    inaction_cost: Number(ranged?.inaction_cost || 0),
    active_automations: activeAutomations ?? 0,
    total_executions_today: todayExecutions ?? 0,
    total_savings_all_clients: totalAllClients,
    total_savings_all_time: totalAllClients,
  }
}

// ============================================================================
// Reports
// ============================================================================

export async function getReportsData(): Promise<Report[]> {
  const userId = await requireUserId()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getReportsData] error:', error)
    throw error
  }
  return (data || []) as Report[]
}

/**
 * Fetch live data for a client+range — used both as the report preview and as the
 * source of truth when freezing into a snapshot.
 */
export async function getClientReportData(
  clientId: string,
  range?: RangeISO,
): Promise<ReportSnapshot> {
  const r = ensureRange(range)
  const supabase = await createClient()

  const { data: staticClient, error: staticError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()
  if (staticError) throw staticError

  const { data: clientStats, error: statsError } = await supabase
    .from('clients_dashboard')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()
  if (statsError) throw statsError

  const { data: chartData, error: chartError } = await supabase.rpc(
    'get_monthly_savings_chart',
    { p_from: r.from, p_to: r.to, p_client_id: clientId },
  )
  if (chartError) throw chartError

  const { data: topAutomations, error: automationsError } = await supabase
    .from('automations_dashboard')
    .select('*')
    .eq('client_id', clientId)
    .order('money_saved_pln', { ascending: false })
    .limit(5)
  if (automationsError) throw automationsError

  const validRoi = (topAutomations || []).filter(
    (a) => a.roi_percentage != null && a.roi_percentage > 0,
  )
  const avgRoi =
    validRoi.length > 0
      ? validRoi.reduce((sum, a) => sum + (a.roi_percentage || 0), 0) / validRoi.length
      : 0

  // Aggregate executions per workflow within report range
  const workflowIds = (topAutomations || []).map((a) => a.workflow_id).filter(Boolean) as string[]
  const { data: execStats, error: execStatsError } = workflowIds.length
    ? await supabase
        .from('executions_raw')
        .select('workflow_id, status, created_at')
        .in('workflow_id', workflowIds)
        .gte('created_at', r.from)
        .lte('created_at', r.to + 'T23:59:59')
    : { data: [], error: null }
  if (execStatsError) throw execStatsError

  const statsByWorkflow = new Map<string, { success: number; error: number; lastRun: string | null }>()
  for (const row of execStats || []) {
    const wid = row.workflow_id as string
    const slot = statsByWorkflow.get(wid) || { success: 0, error: 0, lastRun: null }
    if (row.status === 'success') slot.success++
    else if (row.status === 'error') slot.error++
    if (!slot.lastRun || (row.created_at as string) > slot.lastRun) slot.lastRun = row.created_at as string
    statsByWorkflow.set(wid, slot)
  }

  const totalErrors = Array.from(statsByWorkflow.values()).reduce((s, v) => s + v.error, 0)
  const totalExecsInRange = Array.from(statsByWorkflow.values()).reduce((s, v) => s + v.success + v.error, 0)
  const errorRate = totalExecsInRange > 0 ? totalErrors / totalExecsInRange : 0

  return {
    client: {
      client_id: clientId,
      client_name: staticClient.name,
      client_industry: staticClient.industry || 'Nieznana',
      total_automations: clientStats?.automations_count || 0,
      total_executions: clientStats?.executions_count || 0,
      total_savings_pln: Number(clientStats?.money_saved_pln_total || 0),
      total_hours_saved: Math.round(clientStats?.saved_hours_total || 0),
      avg_roi_percentage: Math.round(avgRoi),
      total_errors: totalErrors,
      error_rate: Number(errorRate.toFixed(4)),
    },
    trends: (chartData || []).map((t: { week_label: string; money_saved_pln: number | string }) => ({
      week_label: t.week_label,
      total_savings: Number(t.money_saved_pln || 0),
    })),
    automations: (topAutomations || []).map((a) => {
      const s = a.workflow_id ? statsByWorkflow.get(a.workflow_id) : undefined
      return {
        id: a.id,
        name: a.name,
        executions_count: a.executions_count || 0,
        money_saved_pln: Number(a.money_saved_pln || 0),
        success_count: s?.success || 0,
        error_count: s?.error || 0,
        last_run_at: s?.lastRun || a.last_run_at || null,
      }
    }),
    range: r,
    generated_at: new Date().toISOString(),
  }
}

/**
 * Snapshot the current data for a client+range and persist it as a Report row.
 * Returns the new report id; caller can then redirect to /reports/[id].
 */
export async function generateReport(input: {
  clientId: string
  from: string
  to: string
}): Promise<{ reportId: string }> {
  const userId = await requireUserId()
  const validated = reportGenerationSchema.parse(input)

  const supabase = await createClient()
  const snapshot = await getClientReportData(validated.clientId, {
    from: validated.from,
    to: validated.to,
  })

  const title = `Raport ROI — ${snapshot.client.client_name} — ${formatRangeLabel({
    from: parseISO(validated.from),
    to: parseISO(validated.to),
  })}`

  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: userId,
      client_id: validated.clientId,
      client_name: snapshot.client.client_name,
      title,
      period_from: validated.from,
      period_to: validated.to,
      status: 'ready',
      snapshot_data: snapshot,
    })
    .select('id')
    .single()

  if (error) throw error

  revalidatePath('/reports')
  return { reportId: data.id }
}

export async function getReportById(reportId: string): Promise<Report | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .maybeSingle()
  if (error) throw error
  return (data as Report) || null
}

/**
 * Browser uploads a generated PDF blob; we proxy it into Storage at
 * {user_id}/{report_id}.pdf so RLS naturally scopes it.
 */
export async function uploadReportPdf(
  reportId: string,
  pdfBytes: Uint8Array,
): Promise<{ path: string }> {
  const userId = await requireUserId()
  const supabase = await createClient()

  // Confirm the report belongs to the user (RLS would also block, but be explicit)
  const { data: existing, error: fetchErr } = await supabase
    .from('reports')
    .select('id, user_id')
    .eq('id', reportId)
    .maybeSingle()
  if (fetchErr) throw fetchErr
  if (!existing) throw new Error('Raport nie istnieje')
  if (existing.user_id !== userId) throw new Error('Brak uprawnień')

  const path = `${userId}/${reportId}.pdf`
  const { error: uploadErr } = await supabase.storage
    .from('reports')
    .upload(path, pdfBytes, { contentType: 'application/pdf', upsert: true })
  if (uploadErr) throw uploadErr

  const { error: updateErr } = await supabase
    .from('reports')
    .update({ pdf_storage_path: path })
    .eq('id', reportId)
  if (updateErr) throw updateErr

  return { path }
}

export async function getReportPdfSignedUrl(reportId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: report, error } = await supabase
    .from('reports')
    .select('pdf_storage_path')
    .eq('id', reportId)
    .maybeSingle()
  if (error) throw error
  if (!report?.pdf_storage_path) return null

  const { data: signed, error: signErr } = await supabase.storage
    .from('reports')
    .createSignedUrl(report.pdf_storage_path, 60)
  if (signErr) throw signErr
  return signed.signedUrl
}

export async function deleteReport(reportId: string) {
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('reports')
    .select('pdf_storage_path')
    .eq('id', reportId)
    .maybeSingle()

  if (report?.pdf_storage_path) {
    await supabase.storage.from('reports').remove([report.pdf_storage_path])
  }

  const { error } = await supabase.from('reports').delete().eq('id', reportId)
  if (error) throw error

  revalidatePath('/reports')
  return { success: true }
}

// ============================================================================
// API key management (Settings)
// ============================================================================

export async function getApiKey() {
  const supabase = await createClient()
  const { userId } = await auth()
  if (!userId) return 'roi_live_not_authenticated'

  const { data } = await supabase
    .from('api_keys')
    .select('key_hash, key_prefix')
    .eq('created_by', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return 'roi_live_not_set'
  return data.key_hash || 'roi_live_not_set'
}

export async function generateNewApiKey() {
  const userId = await requireUserId()
  const supabase = await createClient()

  const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 32)
  const newKey = `roi_live_ak_${randomPart}`
  const keyPrefix = newKey.substring(0, 12)

  await supabase.from('api_keys').update({ is_active: false }).eq('created_by', userId)

  const { error } = await supabase.from('api_keys').insert({
    key_name: 'Default API Key',
    key_hash: newKey,
    key_prefix: keyPrefix,
    is_active: true,
    created_by: userId,
    created_at: new Date().toISOString(),
  })
  if (error) throw error
  return newKey
}

// ============================================================================
// Logs
// ============================================================================

export interface ExecutionLog {
  id: string
  execution_id: string
  workflow_id: string
  status: 'success' | 'error' | 'running' | 'waiting'
  mode: string
  finished: boolean
  started_at: string
  stopped_at: string | null
  created_at: string
  workflow_name?: string | null
  client_id?: string | null
  client_name?: string | null
}

export async function getLogsData(): Promise<ExecutionLog[]> {
  const supabase = await createClient()
  const { data: executions, error: execError } = await supabase
    .from('executions_raw')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (execError) throw execError

  // Pull automations with their assigned client (left join via embed)
  const { data: automations } = await supabase
    .from('automations')
    .select('workflow_id, name, client_id, clients(name)')
  const automationMap = new Map<string, { name: string; client_id: string | null; client_name: string | null }>(
    (automations || []).map((a) => [
      a.workflow_id as string,
      {
        name: a.name as string,
        client_id: (a.client_id as string | null) || null,
        client_name: (a.clients as unknown as { name: string } | null)?.name || null,
      },
    ])
  )

  return (executions || []).map((e) => {
    const meta = automationMap.get(e.workflow_id)
    return {
      ...e,
      workflow_name: meta?.name || null,
      client_id: meta?.client_id || null,
      client_name: meta?.client_name || null,
    }
  }) as ExecutionLog[]
}

// ============================================================================
// Client management
// ============================================================================

export async function createNewClient(data: {
  name: string
  industry: string
  logo: string
  automationIds: string[]
}) {
  const userId = await requireUserId()
  const validated = clientSchema.parse(data)
  const supabase = await createClient()

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      name: validated.name,
      industry: validated.industry || '',
      logo: validated.logo,
      status: 'active',
      automations_count: validated.automationIds.length,
      roi_percentage: 0,
      saved_amount: 0,
      user_id: userId,
    })
    .select()
    .single()
  if (error) throw error

  if (validated.automationIds.length > 0) {
    await supabase
      .from('automations')
      .update({ client_id: client.id })
      .in('id', validated.automationIds)
  }

  revalidatePath('/clients')
  return client
}

export async function updateClient(
  clientId: string,
  data: {
    name?: string
    industry?: string
    logo?: string
    status?: 'active' | 'warning' | 'inactive'
  },
) {
  await requireUserId()
  const supabase = await createClient()
  const { error } = await supabase.from('clients').update(data).eq('id', clientId)
  if (error) throw error
  revalidatePath('/clients')
  return { success: true }
}

export async function deleteClient(clientId: string) {
  await requireUserId()
  const supabase = await createClient()

  await supabase.from('automations').update({ client_id: null }).eq('client_id', clientId)
  const { error } = await supabase.from('clients').delete().eq('id', clientId)
  if (error) throw error

  revalidatePath('/clients')
  revalidatePath('/automations')
  revalidatePath('/')
  return { success: true }
}

export async function assignAutomationsToClient(clientId: string, automationIds: string[]) {
  await requireUserId()
  const supabase = await createClient()

  await supabase.from('automations').update({ client_id: null }).eq('client_id', clientId)
  if (automationIds.length > 0) {
    const { error } = await supabase
      .from('automations')
      .update({ client_id: clientId })
      .in('id', automationIds)
    if (error) throw error
  }

  revalidatePath('/clients')
  revalidatePath('/automations')
  return { success: true }
}

export async function getClientAutomations(clientId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('automations')
    .select('id, name')
    .eq('client_id', clientId)
  if (error) {
    console.error('Error fetching client automations:', error)
    return []
  }
  return data
}

// ============================================================================
// Automation management
// ============================================================================

export async function createNewAutomation(data: {
  name: string
  icon: string
  hourlyRate: number
  monthlyCost?: number
  initialInvestment?: number
  workflowId: string
  clientIds: string[]
  manualTimeMinutes?: number
  automationTimeSeconds?: number
}) {
  const userId = await requireUserId()
  const validated = automationSchema.parse(data)
  const supabase = await createClient()

  const automations = validated.clientIds.map((clientId) => ({
    name: validated.name,
    icon: validated.icon,
    hourly_rate: validated.hourlyRate,
    monthly_cost_pln: validated.monthlyCost ?? 0,
    initial_investment_pln: validated.initialInvestment ?? 0,
    workflow_id: validated.workflowId,
    client_id: clientId,
    client_name: '',
    status: 'healthy' as const,
    saved_today: 0,
    user_id: userId,
    manual_time_per_execution_seconds: (validated.manualTimeMinutes ?? 5) * 60,
    automation_time_per_execution_seconds: validated.automationTimeSeconds ?? 30,
  }))

  const { data: result, error } = await supabase.from('automations').insert(automations).select()
  if (error) throw error

  for (const clientId of validated.clientIds) {
    const { count } = await supabase
      .from('automations')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
    await supabase.from('clients').update({ automations_count: count || 0 }).eq('id', clientId)
  }

  // Re-process pending executions for this workflow (best-effort)
  try {
    await supabase.rpc('reprocess_n8n_executions', { p_workflow_id: validated.workflowId })
  } catch (e) {
    console.error('Failed to reprocess executions:', e)
  }

  revalidatePath('/automations')
  revalidatePath('/clients')
  return result
}

export async function updateAutomation(
  automationId: string,
  data: {
    hourly_rate?: number
    monthly_cost_pln?: number
    initial_investment_pln?: number
    manual_time_per_execution_seconds?: number
    automation_time_per_execution_seconds?: number
    source?: string
  },
) {
  await requireUserId()
  const supabase = await createClient()
  const { error } = await supabase.from('automations').update(data).eq('id', automationId)
  if (error) throw error
  revalidatePath('/automations')
  revalidatePath('/clients')
  revalidatePath('/')
  return { success: true }
}

export async function updateAutomationName(automationId: string, name: string) {
  await requireUserId()
  const supabase = await createClient()
  const { error } = await supabase.from('automations').update({ name }).eq('id', automationId)
  if (error) throw error
  revalidatePath('/automations')
  return { success: true }
}

export async function assignClientToAutomation(automationId: string, clientId: string) {
  await requireUserId()
  const supabase = await createClient()
  const { error } = await supabase
    .from('automations')
    .update({ client_id: clientId })
    .eq('id', automationId)
  if (error) throw error
  revalidatePath('/automations')
  revalidatePath('/clients')
  return { success: true }
}

export async function getUnnamedAutomations() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .is('name', null)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Error fetching unnamed automations:', error)
    return []
  }
  return data as Automation[]
}

export async function getUnlinkedWorkflows() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_unlinked_workflows_stats')
  if (error) {
    console.error('Error fetching unlinked workflows:', error)
    return []
  }
  return data as { workflow_id: string; execution_count: number; last_seen: string }[]
}

// ============================================================================
// Errors monitoring
// ============================================================================

export async function getErrorExecutions() {
  const supabase = await createClient()

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const { data: errors, error } = await supabase
    .from('executions_raw')
    .select('*')
    .eq('status', 'error')
    .gte('created_at', yesterday.toISOString())
    .order('created_at', { ascending: false })
    .limit(10)
  if (error) throw error

  const { data: automations } = await supabase.from('automations').select('workflow_id, name')
  const automationMap = new Map(automations?.map((a) => [a.workflow_id, a.name]) || [])

  return (errors || []).map((e) => ({
    ...e,
    workflow_name: automationMap.get(e.workflow_id) || null,
  }))
}

// Helper for client components: localized human-readable label for a date range.
export async function describeRange(range: RangeISO): Promise<string> {
  return formatRangeLabel({ from: parseISO(range.from), to: parseISO(range.to) })
}

// Helper used by Dashboard heading
export async function describeRangeShort(range: RangeISO): Promise<string> {
  const from = parseISO(range.from)
  const to = parseISO(range.to)
  return `${format(from, 'd LLL', { locale: pl })} – ${format(to, 'd LLL yyyy', { locale: pl })}`
}

// ============================================================================
// Admin (Dawid-only) — lista Clerk userów + przypisywanie do klientów
// ============================================================================

export interface ClerkUserRow {
  id: string
  email: string | null
  fullName: string | null
  imageUrl: string
  createdAt: string
  /** Lista org IDs do których user należy (Clerk membership) */
  orgIds: string[]
  /** Lista nazw klientów (clients.name) do których jest przypisany przez clerk_org_id */
  assignedClientNames: string[]
}

/**
 * Lista wszystkich userów Clerk + ich przypisania do klientów-firm.
 * Admin-only (sprawdzane przez requireAdmin).
 */
export async function listAllClerkUsers(): Promise<ClerkUserRow[]> {
  await requireAdmin()

  const clerk = await clerkClient()
  const users = await clerk.users.getUserList({ limit: 200, orderBy: '-created_at' })

  // Pobierz mapę clerk_org_id → client_name z Supabase (admin RLS umożliwia SELECT *)
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('clerk_org_id, name')
    .not('clerk_org_id', 'is', null)
  const orgToClientName = new Map<string, string>(
    (clients || []).map((c) => [c.clerk_org_id as string, c.name as string]),
  )

  return Promise.all(
    users.data.map(async (u) => {
      const memberships = await clerk.users.getOrganizationMembershipList({ userId: u.id })
      const orgIds = memberships.data.map((m) => m.organization.id)
      const assignedClientNames = orgIds
        .map((id) => orgToClientName.get(id))
        .filter(Boolean) as string[]

      return {
        id: u.id,
        email: u.emailAddresses[0]?.emailAddress || null,
        fullName: [u.firstName, u.lastName].filter(Boolean).join(' ') || null,
        imageUrl: u.imageUrl,
        createdAt: new Date(u.createdAt).toISOString(),
        orgIds,
        assignedClientNames,
      }
    }),
  )
}

/**
 * Przypisuje Clerk usera do klienta-firmy poprzez:
 *  1. Tworzy Clerk Organization dla tego klienta (jeśli jeszcze nie ma) i zapisuje org_id do clients.clerk_org_id
 *  2. Dodaje usera jako member tej Organization
 */
export async function assignClerkUserToClient(input: {
  clerkUserId: string
  clientId: string
}): Promise<{ orgId: string }> {
  const admin = await requireAdmin()
  const supabase = await createClient()

  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id, name, clerk_org_id')
    .eq('id', input.clientId)
    .maybeSingle()
  if (clientErr) throw clientErr
  if (!client) throw new Error('Klient nie znaleziony')

  const clerk = await clerkClient()
  let orgId = (client.clerk_org_id as string | null) || null

  if (!orgId) {
    const slug = (client.name as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50) || `klient-${input.clientId.slice(0, 8)}`

    const org = await clerk.organizations.createOrganization({
      name: client.name as string,
      slug,
      createdBy: admin.userId,
    })
    orgId = org.id

    const { error: updateErr } = await supabase
      .from('clients')
      .update({ clerk_org_id: orgId })
      .eq('id', input.clientId)
    if (updateErr) throw updateErr
  }

  // Dodaj usera do org jako member (skip jeśli już jest)
  try {
    await clerk.organizations.createOrganizationMembership({
      organizationId: orgId,
      userId: input.clerkUserId,
      role: 'org:member',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (!msg.toLowerCase().includes('already')) throw err
  }

  revalidatePath('/admin/users')
  revalidatePath('/clients')
  return { orgId }
}

/**
 * Cofa przypisanie usera do klienta — usuwa go z Clerk Organization.
 */
export async function unassignClerkUserFromClient(input: {
  clerkUserId: string
  orgId: string
}): Promise<void> {
  await requireAdmin()
  const clerk = await clerkClient()
  await clerk.organizations.deleteOrganizationMembership({
    organizationId: input.orgId,
    userId: input.clerkUserId,
  })
  revalidatePath('/admin/users')
}
