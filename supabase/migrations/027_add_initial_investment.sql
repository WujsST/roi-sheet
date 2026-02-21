-- Migration 027: Add initial_investment_pln field
-- Purpose: Track one-time payment from client for automation setup/creation
-- This enables proper ROI calculation: ((total_savings - total_cost) / total_cost) × 100%

-- Add initial_investment_pln to automations table
ALTER TABLE public.automations
  ADD COLUMN IF NOT EXISTS initial_investment_pln NUMERIC(10, 2) DEFAULT 0;

COMMENT ON COLUMN public.automations.initial_investment_pln IS
  'One-time payment from client for automation setup/creation (e.g., 5000 PLN for building the automation)';

-- Update existing automations with default value of 0
UPDATE public.automations
SET initial_investment_pln = 0
WHERE initial_investment_pln IS NULL;

-- Update automations_dashboard view with new ROI formula
DROP VIEW IF EXISTS public.automations_dashboard CASCADE;

CREATE OR REPLACE VIEW public.automations_dashboard AS
SELECT
  a.id,
  a.name,
  a.icon,
  a.status,
  a.workflow_id,
  a.hourly_rate,
  a.monthly_cost_pln,
  a.initial_investment_pln,
  a.manual_time_per_execution_seconds,
  a.automation_time_per_execution_seconds,
  a.created_at,
  a.client_id,
  c.name as client_name,

  -- Execution counts
  COUNT(er.id) as executions_count,

  -- Time saved (SIMPLE formula: manual_time × executions)
  (COUNT(er.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) as saved_seconds,
  (COUNT(er.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) / 3600.0 as saved_hours,

  -- Money saved (hours × hourly_rate)
  ((COUNT(er.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) / 3600.0) * a.hourly_rate as money_saved_pln,

  -- Calculate months elapsed since creation (for ROI calculation)
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.created_at)) / (60 * 60 * 24 * 30.44) as months_elapsed,

  -- Total cost = initial investment + (monthly cost × months)
  COALESCE(a.initial_investment_pln, 0) +
    (COALESCE(a.monthly_cost_pln, 0) * GREATEST(1, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.created_at)) / (60 * 60 * 24 * 30.44)))
    as total_cost_pln,

  -- NEW ROI FORMULA: ((total_savings - total_cost) / total_cost) × 100
  CASE
    WHEN (COALESCE(a.initial_investment_pln, 0) +
          (COALESCE(a.monthly_cost_pln, 0) * GREATEST(1, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.created_at)) / (60 * 60 * 24 * 30.44)))) > 0
    THEN (
      (
        (((COUNT(er.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) / 3600.0) * a.hourly_rate) -
        (COALESCE(a.initial_investment_pln, 0) + (COALESCE(a.monthly_cost_pln, 0) * GREATEST(1, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.created_at)) / (60 * 60 * 24 * 30.44))))
      ) /
      (COALESCE(a.initial_investment_pln, 0) + (COALESCE(a.monthly_cost_pln, 0) * GREATEST(1, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.created_at)) / (60 * 60 * 24 * 30.44))))
    ) * 100
    ELSE NULL
  END as roi_percentage,

  -- Break-even point in months (when will it pay for itself?)
  -- Only calculate if monthly net savings > 0 (monthly savings > monthly cost)
  CASE
    WHEN (
      ((COUNT(er.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) / 3600.0) * a.hourly_rate /
      NULLIF(GREATEST(1, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.created_at)) / (60 * 60 * 24 * 30.44)), 0)
    ) > COALESCE(a.monthly_cost_pln, 0)
    THEN COALESCE(a.initial_investment_pln, 0) /
         NULLIF(
           (
             ((COUNT(er.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) / 3600.0) * a.hourly_rate /
             GREATEST(1, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.created_at)) / (60 * 60 * 24 * 30.44))
           ) - COALESCE(a.monthly_cost_pln, 0),
           0
         )
    ELSE NULL
  END as breakeven_months,

  -- Today's savings
  COALESCE(SUM(
    CASE
      WHEN DATE(er.created_at) = CURRENT_DATE
      THEN ((COALESCE(a.manual_time_per_execution_seconds, 300) / 3600.0) * a.hourly_rate)
      ELSE 0
    END
  ), 0) as saved_today,

  -- Last run timestamp
  MAX(er.created_at) as last_run_at

FROM public.automations a
LEFT JOIN public.clients c ON c.id = a.client_id
LEFT JOIN public.executions_raw er ON er.workflow_id = a.workflow_id
GROUP BY
  a.id,
  a.name,
  a.icon,
  a.status,
  a.workflow_id,
  a.hourly_rate,
  a.monthly_cost_pln,
  a.initial_investment_pln,
  a.manual_time_per_execution_seconds,
  a.automation_time_per_execution_seconds,
  a.created_at,
  a.client_id,
  c.name;
