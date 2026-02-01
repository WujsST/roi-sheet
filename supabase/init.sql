-- ============================================================
-- ROI Sheet - Complete Database Initialization Script
-- Project: P13-Bento-Sheets (jzwsavttpkijccxliplr)
-- ============================================================
--
-- This script creates all required tables with Row Level Security
-- and inserts demo data. Execute this in Supabase SQL Editor.
--
-- Tables created:
--   1. automations      - Automation instances and status
--   2. savings_history  - Monthly savings tracking
--   3. dashboard_stats  - Main KPI metrics
--   4. clients          - Client management
--   5. reports          - Generated ROI reports
--   6. system_logs      - Application logging
--
-- ============================================================

-- ============================================================
-- TABLE 1: AUTOMATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  icon VARCHAR(50) DEFAULT 'Zap',
  status VARCHAR(20) DEFAULT 'healthy' CHECK (status IN ('healthy', 'error', 'paused')),
  saved_today DECIMAL(10,2) DEFAULT 0,
  uptime DECIMAL(5,2) DEFAULT 99.9,
  last_run TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on automations" ON automations
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_automations_status ON automations(status);
CREATE INDEX IF NOT EXISTS idx_automations_client_name ON automations(client_name);
CREATE INDEX IF NOT EXISTS idx_automations_created_at ON automations(created_at DESC);

COMMENT ON TABLE automations IS 'Stores automation instances and their current status';

-- ============================================================
-- TABLE 2: SAVINGS_HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS savings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month VARCHAR(10) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE savings_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on savings_history" ON savings_history
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_savings_history_created_at ON savings_history(created_at DESC);

COMMENT ON TABLE savings_history IS 'Stores monthly savings data for charts and reports';

-- ============================================================
-- TABLE 3: DASHBOARD_STATS
-- ============================================================
CREATE TABLE IF NOT EXISTS dashboard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_savings DECIMAL(10,2) DEFAULT 0,
  time_saved_hours INTEGER DEFAULT 0,
  efficiency_score INTEGER DEFAULT 0,
  inaction_cost DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dashboard_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on dashboard_stats" ON dashboard_stats
  FOR SELECT USING (true);

COMMENT ON TABLE dashboard_stats IS 'Stores aggregated dashboard KPI metrics';

-- ============================================================
-- TABLE 4: CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'warning', 'inactive')),
  automations_count INTEGER DEFAULT 0,
  saved_amount DECIMAL(10,2) DEFAULT 0,
  roi_percentage DECIMAL(5,2) DEFAULT 0,
  logo VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on clients" ON clients
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

COMMENT ON TABLE clients IS 'Stores client information and their ROI metrics';

-- ============================================================
-- TABLE 5: REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  period VARCHAR(50),
  file_size VARCHAR(20),
  status VARCHAR(20) DEFAULT 'ready',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on reports" ON reports
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_reports_client_name ON reports(client_name);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

COMMENT ON TABLE reports IS 'Stores metadata for generated ROI reports';

-- ============================================================
-- TABLE 6: SYSTEM_LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level VARCHAR(10) CHECK (level IN ('info', 'warn', 'error')),
  source VARCHAR(100),
  message TEXT
);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on system_logs" ON system_logs
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_source ON system_logs(source);

COMMENT ON TABLE system_logs IS 'Stores application logs for monitoring and debugging';

-- ============================================================
-- SEED DATA
-- ============================================================

-- Automations
INSERT INTO automations (name, client_name, icon, status, saved_today) VALUES
('Lead Scoring AI', 'TechCorp Sp. z o.o.', 'Mail', 'healthy', 120),
('Invoice Parser v2', 'LogisticsPro', 'FileText', 'healthy', 350),
('HR Onboarding', 'StartupHub', 'UserPlus', 'error', 0),
('Social Media Scheduler', 'MarketingMax', 'Share2', 'healthy', 85),
('Customer Support Bot', 'ServiceFirst', 'MessageCircle', 'paused', 200);

-- Savings History
INSERT INTO savings_history (month, amount) VALUES
('MAJ', 2400),
('CZE', 1398),
('LIP', 9800),
('SIE', 3908),
('WRZ', 4800),
('PAZ', 7500);

-- Dashboard Stats
INSERT INTO dashboard_stats (total_savings, time_saved_hours, efficiency_score, inaction_cost) VALUES
(7500, 45, 85, 2100);

-- Clients
INSERT INTO clients (name, industry, status, automations_count, saved_amount, roi_percentage, logo) VALUES
('TechCorp Sp. z o.o.', 'SaaS / IT', 'active', 5, 12500, 125, 'TC'),
('LogisticsPro', 'Logistyka', 'active', 3, 8200, 95, 'LP'),
('StartupHub', 'Consulting', 'warning', 2, 3100, 45, 'SH'),
('MarketingMax', 'Marketing', 'active', 4, 6800, 110, 'MM'),
('ServiceFirst', 'Customer Service', 'active', 3, 5500, 88, 'SF');

-- Reports
INSERT INTO reports (title, client_name, period, file_size, status) VALUES
('Raport ROI - Pazdziernik', 'TechCorp Sp. z o.o.', 'Pazdziernik 2023', '2.4 MB', 'ready'),
('Raport ROI - Q3 2023', 'LogisticsPro', 'Q3 2023', '4.1 MB', 'ready'),
('Raport ROI - Wrzesien', 'StartupHub', 'Wrzesien 2023', '1.8 MB', 'ready');

-- System Logs
INSERT INTO system_logs (level, source, message) VALUES
('info', 'Auth', 'User logged in successfully: admin@roisheet.com'),
('info', 'Automation', 'Lead Scoring AI completed execution: 150 leads processed'),
('warn', 'Webhook', 'Slow response from TechCorp API (2.3s)'),
('error', 'Automation', 'HR Onboarding failed: Connection timeout to StartupHub HRIS'),
('info', 'Report', 'PDF generated successfully for LogisticsPro'),
('info', 'System', 'Daily backup completed: 45.2MB exported'),
('warn', 'Rate Limit', 'Approaching API limit for Social Media Scheduler (85%)');

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these to verify the setup:
-- SELECT COUNT(*) as automations_count FROM automations;
-- SELECT COUNT(*) as savings_count FROM savings_history;
-- SELECT COUNT(*) as stats_count FROM dashboard_stats;
-- SELECT COUNT(*) as clients_count FROM clients;
-- SELECT COUNT(*) as reports_count FROM reports;
-- SELECT COUNT(*) as logs_count FROM system_logs;
