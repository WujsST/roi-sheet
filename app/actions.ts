import { createClient } from '@/lib/supabase/server'
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
  const [savingsData, timeSavedData, efficiencyData, inactionData] = await Promise.all([
    supabase.rpc('get_monthly_total_savings'),
    supabase.rpc('get_monthly_time_saved'),
    supabase.rpc('get_monthly_efficiency'),
    supabase.rpc('get_inaction_cost')
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
    total_executions_today: todayExecutions ?? 0
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
