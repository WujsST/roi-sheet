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
    .from('automations')
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

export async function getLogsData() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('system_logs')
    .select('*')
    .order('timestamp', { ascending: false })

  if (error) throw error
  return data as SystemLog[]
}

// === NEW WORKFLOW EXECUTION TRACKING FUNCTIONS ===

export async function getComputedDashboardStats(): Promise<ComputedDashboardStats> {
  const supabase = await createClient()

  // Call PostgreSQL RPC functions in parallel
  const [savingsData, timeSavedData, efficiencyData, inactionData, allClientsSavings] = await Promise.all([
    supabase.rpc('get_monthly_total_savings'),
    supabase.rpc('get_monthly_time_saved'),
    supabase.rpc('get_monthly_efficiency'),
    supabase.rpc('get_inaction_cost'),
    supabase.rpc('get_all_clients_total_savings')
  ])

  // Additional metrics
  const { count: activeAutomations } = await supabase
    .from('automations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'healthy')

  const { count: todayExecutions } = await supabase
    .from('workflow_executions')
    .select('*', { count: 'exact', head: true })
    .gte('start_time', new Date().toISOString().split('T')[0])

  return {
    total_savings: savingsData.data?.[0]?.total_savings ?? 0,
    time_saved_hours: timeSavedData.data?.[0]?.time_saved_hours ?? 0,
    efficiency_score: efficiencyData.data?.[0]?.efficiency_score ?? 0,
    inaction_cost: inactionData.data?.[0]?.inaction_cost ?? 0,
    active_automations: activeAutomations ?? 0,
    total_executions_today: todayExecutions ?? 0,
    total_savings_all_clients: allClientsSavings.data?.[0]?.total_savings_all_clients ?? 0
  }
}

export async function getMonthlySavingsData(): Promise<MonthlySavings[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('v_monthly_savings')
    .select('*')
    .order('month_date', { ascending: true })

  return (data || []) as MonthlySavings[]
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
    workflow_id: validated.workflowId,
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
