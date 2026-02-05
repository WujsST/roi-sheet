'use server'

import { createClient } from '@/lib/supabase/server'
import { clientSchema, automationSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import type {
  Automation,
  SavingsHistory,
  DashboardStats,
  Client,
  Report,
  SystemLog,
  ComputedDashboardStats,
  MonthlySavings,
  WeeklySavings,
  WorkflowExecution
} from '@/lib/supabase/types'

export async function getDashboardData() {
  const [automations, savingsHistory, stats] = await Promise.all([
    getAutomationsData(),
    getMonthlySavingsData(),
    getComputedDashboardStats()
  ])

  return { automations, savingsHistory, stats }
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

export async function getClientsData() {
  const supabase = await createClient()

  // Join clients table with clients_dashboard view for combined data
  const { data, error } = await supabase
    .from('clients')
    .select(`
      id,
      name,
      industry,
      status,
      logo,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Get stats for each client from clients_dashboard view
  const clientIds = (data || []).map(c => c.id)

  if (clientIds.length === 0) {
    return []
  }

  const { data: statsData, error: statsError } = await supabase
    .from('clients_dashboard')
    .select('*')
    .in('client_id', clientIds)

  if (statsError) throw statsError

  // Get automations ROI for each client
  const { data: automationsData, error: automationsError } = await supabase
    .from('automations_dashboard')
    .select('client_id, roi_percentage, monthly_cost_pln')
    .in('client_id', clientIds)

  if (automationsError) throw automationsError

  // Create maps for stats and ROI by client_id
  const statsMap = new Map(
    (statsData || []).map(s => [s.client_id, s])
  )

  // Calculate average ROI per client
  const roiMap = new Map<string, number>()
  const automationsByClient = new Map<string, typeof automationsData>()

  for (const auto of (automationsData || [])) {
    if (!automationsByClient.has(auto.client_id)) {
      automationsByClient.set(auto.client_id, [])
    }
    automationsByClient.get(auto.client_id)!.push(auto)
  }

  for (const [clientId, autos] of automationsByClient.entries()) {
    // Only include automations with valid ROI (monthly_cost_pln > 0 and roi_percentage != null)
    const validRois = autos.filter(a =>
      a.roi_percentage != null &&
      a.monthly_cost_pln != null &&
      a.monthly_cost_pln > 0
    )

    if (validRois.length > 0) {
      const avgRoi = validRois.reduce((sum, a) => sum + (a.roi_percentage || 0), 0) / validRois.length
      roiMap.set(clientId, Math.round(avgRoi))
    } else {
      roiMap.set(clientId, 0)
    }
  }

  // Merge clients with their stats and ROI
  return (data || []).map(client => {
    const stats = statsMap.get(client.id)
    const roi = roiMap.get(client.id) || 0

    return {
      ...client,
      automations_count: stats?.automations_count || 0,
      saved_amount: stats?.money_saved_pln_total || 0,
      roi_percentage: roi
    } as Client
  })
}

export async function getReportsData() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Report[]
}

export async function deleteReport(reportId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId)

  if (error) throw error

  if (error) throw error
  revalidatePath('/reports')
  return { success: true }
}

export async function getApiKey() {
  const supabase = await createClient()

  // Authenticate user
  const { userId } = await auth()
  if (!userId) return 'roi_live_not_authenticated'

  // Get the most recent active API key for this user
  const { data } = await supabase
    .from('api_keys')
    .select('key_hash, key_prefix')
    .eq('created_by', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return 'roi_live_not_set'

  // Return the full key hash (which is what we store in plain text for now)
  // In production, this would return key_prefix only for display
  return data.key_hash || 'roi_live_not_set'
}

export async function generateNewApiKey() {
  const supabase = await createClient()

  // Authenticate user
  const { userId } = await auth()
  if (!userId) throw new Error('User not authenticated')

  // Generate a random key format roi_live_ak_...
  const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('').substring(0, 32);

  const newKey = `roi_live_ak_${randomPart}`
  const keyPrefix = newKey.substring(0, 12) // First 12 chars for display

  // Deactivate all previous keys for this user
  await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('created_by', userId)

  // Insert new API key
  const { error } = await supabase
    .from('api_keys')
    .insert({
      key_name: 'Default API Key',
      key_hash: newKey, // In production, use bcrypt/argon2 hashing
      key_prefix: keyPrefix,
      is_active: true,
      created_by: userId,
      created_at: new Date().toISOString()
    })

  if (error) throw error
  return newKey
}

// Execution Log type for logs page
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
}

export async function getLogsData(): Promise<ExecutionLog[]> {
  const supabase = await createClient()

  // Get executions with workflow names from automations
  const { data: executions, error: execError } = await supabase
    .from('executions_raw')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (execError) throw execError

  // Get automation names for workflow IDs
  const { data: automations } = await supabase
    .from('automations')
    .select('workflow_id, name')

  const automationMap = new Map(
    automations?.map(a => [a.workflow_id, a.name]) || []
  )

  return (executions || []).map(e => ({
    ...e,
    workflow_name: automationMap.get(e.workflow_id) || null
  })) as ExecutionLog[]
}

// === NEW WORKFLOW EXECUTION TRACKING FUNCTIONS ===

export async function getComputedDashboardStats(): Promise<ComputedDashboardStats> {
  const supabase = await createClient()

  // Call new RPC function that calculates stats from executions_raw
  const { data: statsDataRaw, error } = await supabase
    .rpc('calculate_dashboard_stats')
    .single()

  const statsData = statsDataRaw as unknown as ComputedDashboardStats

  if (error) {
    console.error('Error fetching dashboard stats:', error)
    // Return default values on error
    return {
      total_savings: 0,
      time_saved_hours: 0,
      efficiency_score: 0,
      inaction_cost: 0,
      active_automations: 0,
      total_executions_today: 0,
      total_savings_all_clients: 0,
      total_savings_all_time: 0
    }
  }

  // Count active automations
  const { count: activeAutomations } = await supabase
    .from('automations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'healthy')

  // Count today's executions
  const today = new Date().toISOString().split('T')[0]
  const { count: todayExecutions } = await supabase
    .from('executions_raw')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today)

  // DEBUG LOGGING
  const { data: debugExecutions } = await supabase.from('executions_raw').select('id, created_at, workflow_id').limit(5);
  console.log('[DEBUG] Recent executions:', debugExecutions);
  console.log('[DEBUG] Active automations:', activeAutomations);
  console.log('[DEBUG] Today executions count:', todayExecutions);

  const count = activeAutomations ?? 0

  return {
    total_savings: statsData?.total_savings ?? 0,
    time_saved_hours: statsData?.time_saved_hours ?? 0,
    efficiency_score: statsData?.efficiency_score ?? 0,
    inaction_cost: statsData?.inaction_cost ?? 0,
    active_automations: count,
    total_executions_today: todayExecutions ?? 0,
    total_savings_all_clients: statsData?.total_savings_all_clients ?? 0,
    total_savings_all_time: statsData?.total_savings_all_time ?? 0
  }
}

export async function getClientReportData(clientId: string) {
  const supabase = await createClient()

  // 1. Get Client Details from clients table (for industry, logo, etc.)
  const { data: staticClient, error: staticError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (staticError) throw staticError

  // 2. Get Aggregated Stats from clients_dashboard view
  const { data: clientStats, error: statsError } = await supabase
    .from('clients_dashboard')
    .select('*')
    .eq('client_id', clientId)
    .single()

  if (statsError) throw statsError

  // 3. Get Weekly Chart Data (Real Data via RPC)
  const now = new Date()
  const { data: chartData, error: chartError } = await supabase
    .rpc('get_monthly_savings_chart', {
      p_year: now.getFullYear(),
      p_month: now.getMonth() + 1, // JS months are 0-indexed, Postgres 1-indexed
      p_client_id: clientId
    })

  if (chartError) throw chartError

  // 4. Get Top Automations with ROI data
  const { data: topAutomations, error: automationsError } = await supabase
    .from('automations_dashboard')
    .select('*')
    .eq('client_id', clientId)
    .order('money_saved_pln', { ascending: false })
    .limit(5)

  if (automationsError) throw automationsError

  // 5. Calculate average ROI percentage from automations
  const activeAutomations = (topAutomations || []).filter(a => a.roi_percentage != null && a.roi_percentage > 0)
  const avgRoi = activeAutomations.length > 0
    ? activeAutomations.reduce((sum, a) => sum + (a.roi_percentage || 0), 0) / activeAutomations.length
    : 0

  // 6. Map to expected interface with correct field names
  return {
    client: {
      client_id: clientId,
      client_name: staticClient.name,
      client_industry: staticClient.industry || 'Nieznana',
      total_automations: clientStats.automations_count || 0,
      total_executions: clientStats.executions_count || 0,
      total_savings_pln: clientStats.money_saved_pln_total || 0,
      total_hours_saved: Math.round(clientStats.saved_hours_total || 0),
      avg_roi_percentage: Math.round(avgRoi)
    },
    trends: (chartData || []).map((t: any) => ({
      week_label: t.week_label,
      total_savings: Number(t.money_saved_pln || 0)
    })),
    automations: (topAutomations || []).map(a => ({
      id: a.id,
      name: a.name,
      executions_count: a.executions_count || 0,
      money_saved_pln: a.money_saved_pln || 0
    }))
  }
}

export async function getMonthlySavingsData() {
  const supabase = await createClient()

  const now = new Date()
  const { data, error } = await supabase
    .rpc('get_monthly_savings_chart', {
      p_year: now.getFullYear(),
      p_month: now.getMonth() + 1,
      p_client_id: null // Explicitly pass null
    })

  console.log('[DEBUG] getMonthlySavingsData raw data:', data)

  if (error) {
    console.error('Error fetching monthly savings chart:', error)
    return []
  }

  // Map to match expected ChartCard format (WeeklySavings)
  // RPC returns: week_label, week_start, executions_count, money_saved_pln
  return (data || []).map((item: any) => ({
    week_label: item.week_label,
    money_saved_pln: Number(item.money_saved_pln || 0)
  }))
}

export async function getWorkflowExecutions(limit = 100): Promise<WorkflowExecution[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('workflow_executions')
    .select('*')
    .order('start_time', { ascending: false })
    .limit(limit)

  return (data || []) as WorkflowExecution[]
}

// === CLIENT MANAGEMENT ===

export async function createNewClient(data: {
  name: string
  industry: string
  logo: string
  automationIds: string[]
}) {
  const supabase = await createClient()

  // Authenticate user
  const { userId } = await auth()
  if (!userId) throw new Error('User not authenticated')

  // Validate with Zod
  const validated = clientSchema.parse(data)

  // Insert client
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
      user_id: userId
    })
    .select()
    .single()

  if (error) throw error

  // Update automations to link with client
  if (validated.automationIds.length > 0) {
    await supabase
      .from('automations')
      .update({ client_id: client.id })
      .in('id', validated.automationIds)
  }

  revalidatePath('/clients')
  return client
}

// === AUTOMATION MANAGEMENT ===

export async function createNewAutomation(data: {
  name: string
  icon: string
  hourlyRate: number
  workflowId: string
  clientIds: string[]
  manualTimeMinutes?: number
  automationTimeSeconds?: number
}) {
  const supabase = await createClient()

  // Authenticate user
  const { userId } = await auth()
  if (!userId) throw new Error('User not authenticated')

  // Validate with Zod
  const validated = automationSchema.parse(data)

  // Create automation for each client
  const automations = validated.clientIds.map(clientId => ({
    name: validated.name,
    icon: validated.icon,
    hourly_rate: validated.hourlyRate,
    workflow_id: validated.workflowId, // Changed from workflow_id to match DB schema
    client_id: clientId,
    client_name: '', // Will be filled by database trigger or view
    status: 'healthy' as const,
    saved_today: 0,
    user_id: userId,
    manual_time_per_execution_seconds: (validated.manualTimeMinutes ?? 5) * 60,
    automation_time_per_execution_seconds: validated.automationTimeSeconds ?? 30
  }))

  const { data: result, error } = await supabase
    .from('automations')
    .insert(automations)
    .select()

  if (error) throw error

  // Update client automation counts
  for (const clientId of validated.clientIds) {
    const { count } = await supabase
      .from('automations')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)

    await supabase
      .from('clients')
      .update({ automations_count: count || 0 })
      .eq('id', clientId)
  }

  // Trigger reprocessing of pending n8n executions
  try {
    const { data: reprocessedCount, error: rpcError } = await supabase.rpc('reprocess_n8n_executions', {
      p_workflow_id: validated.workflowId
    });
    console.log(`Reprocessed ${reprocessedCount} executions for workflow ${validated.workflowId}`);
    if (rpcError) console.error("Error reprocessing executions:", rpcError);
  } catch (e) {
    console.error("Failed to reprocess executions:", e);
  }

  revalidatePath('/automations')
  revalidatePath('/clients')
  return result
}

// --- Unlinked Workflows (n8n) ---

export async function getUnlinkedWorkflows() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_unlinked_workflows_stats')

  if (error) {
    console.error('Error fetching unlinked workflows:', error)
    return []
  }

  return data as { workflow_id: string; execution_count: number; last_seen: string }[]
}

// --- Workflow Management ---

export async function updateAutomationName(automationId: string, name: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('automations')
    .update({ name })
    .eq('id', automationId)

  if (error) throw error

  revalidatePath('/automations')
  return { success: true }
}

export async function assignClientToAutomation(automationId: string, clientId: string) {
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

// Client Management Actions
export async function updateClient(
  clientId: string,
  data: {
    name?: string
    industry?: string
    logo?: string
    status?: 'active' | 'warning' | 'inactive'
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .update(data)
    .eq('id', clientId)

  if (error) throw error

  revalidatePath('/clients')
  return { success: true }
}

export async function deleteClient(clientId: string) {
  const supabase = await createClient()

  // First, unassign all automations from this client
  await supabase
    .from('automations')
    .update({ client_id: null })
    .eq('client_id', clientId)

  // Then delete the client
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)

  if (error) throw error

  revalidatePath('/clients')
  revalidatePath('/automations')
  revalidatePath('/')
  return { success: true }
}

export async function assignAutomationsToClient(
  clientId: string,
  automationIds: string[]
) {
  const supabase = await createClient()

  // First, unassign all automations from this client
  await supabase
    .from('automations')
    .update({ client_id: null })
    .eq('client_id', clientId)

  // Then assign selected automations
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

export async function updateAutomation(
  automationId: string,
  data: {
    hourly_rate?: number
    manual_time_per_execution_seconds?: number
    automation_time_per_execution_seconds?: number
    source?: string
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('automations')
    .update(data)
    .eq('id', automationId)

  if (error) throw error

  revalidatePath('/automations')
  revalidatePath('/clients')
  revalidatePath('/')
  return { success: true }
}

// Get recent error executions for dashboard alert
export async function getErrorExecutions() {
  const supabase = await createClient()

  // Get recent errors from last 24 hours
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

  // Get automation names
  const { data: automations } = await supabase
    .from('automations')
    .select('workflow_id, name')

  const automationMap = new Map(
    automations?.map(a => [a.workflow_id, a.name]) || []
  )

  return (errors || []).map(e => ({
    ...e,
    workflow_name: automationMap.get(e.workflow_id) || null
  }))
}
