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
  // New ROI fields from simplified schema
  seconds_saved_per_execution?: number
  monthly_cost_pln?: number
  initial_investment_pln?: number  // NEW: One-time payment from client for setup
  executions_count?: number
  saved_hours?: number
  money_saved_pln?: number
  roi_percentage?: number | null
  last_run_at?: string | null
  // Time tracking fields for accurate Hours Back calculation
  manual_time_per_execution_seconds?: number
  automation_time_per_execution_seconds?: number
  // Technology/platform source
  source?: string
  // NEW: Calculated fields from automations_dashboard view
  months_elapsed?: number          // Time since creation in months
  total_cost_pln?: number          // Initial investment + cumulative monthly costs
  breakeven_months?: number        // When ROI reaches 0% (payback period)
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
  total_savings: number              // Current month's savings
  time_saved_hours: number
  efficiency_score: number
  inaction_cost: number
  active_automations: number
  total_executions_today: number
  total_savings_all_clients: number
  total_savings_all_time: number     // NEW: Lifetime total savings (all periods)
}

// Monthly Savings (for chart visualization)
export interface MonthlySavings {
  month_abbr: string
  month_date: string
  total_saved: number
}

// Automations Dashboard View (new simplified schema)
export interface AutomationDashboard {
  id: string
  name: string
  client_id: string | null
  client_name: string
  workflow_id: string
  icon: string | null
  status: 'healthy' | 'error' | 'paused'
  hourly_rate: number
  seconds_saved_per_execution: number
  monthly_cost_pln: number
  initial_investment_pln: number  // NEW: One-time payment from client
  created_at: string
  executions_count: number
  saved_seconds: number
  saved_hours: number
  money_saved_pln: number
  months_elapsed: number          // NEW: Time since creation in months
  total_cost_pln: number          // NEW: Initial + cumulative monthly costs
  roi_percentage: number | null
  breakeven_months: number | null // NEW: Payback period in months
  last_run_at: string | null
  saved_today: number
}

// Clients Dashboard View (aggregated per client)
export interface ClientDashboard {
  client_id: string
  client_name: string
  automations_count: number
  executions_count: number
  money_saved_pln_total: number
  saved_hours_total: number
}

// Weekly Savings (for chart visualization)
export interface WeeklySavings {
  week_label: string
  money_saved_pln: number
}
