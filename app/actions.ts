'use server'

import { createClient } from '@/lib/supabase/server'
import { clientSchema, automationSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
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
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('saved_amount', { ascending: false })

  if (error) throw error
  return data as Client[]
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

  revalidatePath('/reports')
  return { success: true }
}

// Execution Log type for logs page
export interface ExecutionLog {
  id: string
  n8n_execution_id: string
  n8n_workflow_id: string
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
    .select('n8n_workflow_id, name')

  const automationMap = new Map(
    automations?.map(a => [a.n8n_workflow_id, a.name]) || []
  )

  return (executions || []).map(e => ({
    ...e,
    workflow_name: automationMap.get(e.n8n_workflow_id) || null
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
  const { data: debugExecutions } = await supabase.from('executions_raw').select('id, created_at, n8n_workflow_id').limit(5);
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

  // 1. Get Client Details & Aggregated Stats
  const { data: clientData, error: clientError } = await supabase
    .from('clients_dashboard')
    .select('*')
    .eq('client_id', clientId)
    .single()

  if (clientError) throw clientError

  // 2. Get Weekly Chart Data (Real Data via RPC)
  const now = new Date()
  const { data: chartData, error: chartError } = await supabase
    .rpc('get_monthly_savings_chart', {
      p_year: now.getFullYear(),
      p_month: now.getMonth() + 1, // JS months are 0-indexed, Postgres 1-indexed
      p_client_id: clientId
    })

  if (chartError) throw chartError

  // 3. Get Top Automations
  const { data: topAutomations, error: automationsError } = await supabase
    .from('automations_dashboard')
    .select('*')
    .eq('client_id', clientId)
    .order('money_saved_pln', { ascending: false })
    .limit(5)

  if (automationsError) throw automationsError

  return {
    client: clientData,
    trends: chartData, // Corrected variable name
    automations: topAutomations
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
      saved_amount: 0
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
}) {
  const supabase = await createClient()

  // Validate with Zod
  const validated = automationSchema.parse(data)

  // Create automation for each client
  const automations = validated.clientIds.map(clientId => ({
    name: validated.name,
    icon: validated.icon,
    hourly_rate: validated.hourlyRate,
    n8n_workflow_id: validated.workflowId, // Changed from workflow_id to match DB schema
    client_id: clientId,
    client_name: '', // Will be filled by database trigger or view
    status: 'healthy' as const,
    saved_today: 0
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
    .select('n8n_workflow_id, name')

  const automationMap = new Map(
    automations?.map(a => [a.n8n_workflow_id, a.name]) || []
  )

  return (errors || []).map(e => ({
    ...e,
    workflow_name: automationMap.get(e.n8n_workflow_id) || null
  }))
}
