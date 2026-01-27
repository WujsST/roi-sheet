export interface Automation {
  id: string
  name: string
  client_name: string
  icon: string
  status: 'healthy' | 'error' | 'paused'
  saved_today: number
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
