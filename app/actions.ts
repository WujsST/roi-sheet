import { createClient } from '@/lib/supabase/server'
import type { Automation, SavingsHistory, DashboardStats, Client, Report, SystemLog } from '@/lib/supabase/types'

export async function getDashboardData() {
  const supabase = await createClient()

  const [automationsRes, savingsRes, statsRes] = await Promise.all([
    supabase.from('automations').select('*').order('created_at', { ascending: false }),
    supabase.from('savings_history').select('*').order('created_at', { ascending: true }),
    supabase.from('dashboard_stats').select('*').limit(1).single()
  ])

  return {
    automations: (automationsRes.data || []) as Automation[],
    savingsHistory: (savingsRes.data || []) as SavingsHistory[],
    stats: statsRes.data as DashboardStats | null
  }
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
