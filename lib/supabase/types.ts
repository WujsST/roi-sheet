export interface Automation {
  id: string
  name: string
  client_name: string
  client_id: string | null
  icon: string
  status: 'healthy' | 'error' | 'paused'
  saved_today: number
  workflow_id: string | null
  hourly_rate: number
  created_at: string
}

export interface SavingsHistory {
  id: string
  month: string
  amount: number
  created_at: string
}

export interface DashboardStats {
  id: string
  total_savings: number
  time_saved_hours: number
  efficiency_score: number
  inaction_cost: number
  updated_at: string
}

export interface Client {
  id: string
  name: string
  industry: string
  status: 'active' | 'warning' | 'inactive'
  automations_count: number
  saved_amount: number
  roi_percentage: number
  logo: string
  created_at: string
}

export interface Report {
  id: string
  title: string
  client_name: string
  period: string
  file_size: string
  status: string
  created_at: string
}

export interface SystemLog {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error'
  source: string
  message: string
}

// Workflow Execution Tracking
export interface WorkflowExecution {
  id: string
  automation_id: string
  client_id: string
  start_time: string
  end_time: string | null
  duration_seconds: number | null
  hourly_rate: number
  cost_saved: number | null
  status: 'running' | 'completed' | 'failed' | 'timeout'
  error_message: string | null
  execution_metadata: Record<string, any>
  created_at: string
}

// Computed Dashboard Statistics (from RPC functions)
export interface ComputedDashboardStats {
  total_savings: number
  time_saved_hours: number
  efficiency_score: number
  inaction_cost: number
  active_automations: number
  total_executions_today: number
  total_savings_all_clients: number
}

// Monthly Savings (for chart visualization)
export interface MonthlySavings {
  month_abbr: string
  month_date: string
  total_saved: number
}
