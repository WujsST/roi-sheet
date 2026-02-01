-- Migration: 007_seed_data
-- Description: Insert test/demo data into all tables
-- Created: 2026-01-28

-- =============================================
-- Automations - sample automation instances
-- =============================================
INSERT INTO automations (name, client_name, icon, status, saved_today) VALUES
('Lead Scoring AI', 'TechCorp Sp. z o.o.', 'Mail', 'healthy', 120),
('Invoice Parser v2', 'LogisticsPro', 'FileText', 'healthy', 350),
('HR Onboarding', 'StartupHub', 'UserPlus', 'error', 0),
('Social Media Scheduler', 'MarketingMax', 'Share2', 'healthy', 85),
('Customer Support Bot', 'ServiceFirst', 'MessageCircle', 'paused', 200);

-- =============================================
-- Savings History - monthly savings data
-- =============================================
INSERT INTO savings_history (month, amount) VALUES
('MAJ', 2400),
('CZE', 1398),
('LIP', 9800),
('SIE', 3908),
('WRZ', 4800),
('PAZ', 7500);

-- =============================================
-- Dashboard Stats - main KPI metrics
-- =============================================
INSERT INTO dashboard_stats (total_savings, time_saved_hours, efficiency_score, inaction_cost) VALUES
(7500, 45, 85, 2100);

-- =============================================
-- Clients - client portfolio
-- =============================================
INSERT INTO clients (name, industry, status, automations_count, saved_amount, roi_percentage, logo) VALUES
('TechCorp Sp. z o.o.', 'SaaS / IT', 'active', 5, 12500, 125, 'TC'),
('LogisticsPro', 'Logistyka', 'active', 3, 8200, 95, 'LP'),
('StartupHub', 'Consulting', 'warning', 2, 3100, 45, 'SH'),
('MarketingMax', 'Marketing', 'active', 4, 6800, 110, 'MM'),
('ServiceFirst', 'Customer Service', 'active', 3, 5500, 88, 'SF');

-- =============================================
-- Reports - generated ROI reports
-- =============================================
INSERT INTO reports (title, client_name, period, file_size, status) VALUES
('Raport ROI - Pazdziernik', 'TechCorp Sp. z o.o.', 'Pazdziernik 2023', '2.4 MB', 'ready'),
('Raport ROI - Q3 2023', 'LogisticsPro', 'Q3 2023', '4.1 MB', 'ready'),
('Raport ROI - Wrzesien', 'StartupHub', 'Wrzesien 2023', '1.8 MB', 'ready');

-- =============================================
-- System Logs - application logs
-- =============================================
INSERT INTO system_logs (level, source, message) VALUES
('info', 'Auth', 'User logged in successfully: admin@roisheet.com'),
('info', 'Automation', 'Lead Scoring AI completed execution: 150 leads processed'),
('warn', 'Webhook', 'Slow response from TechCorp API (2.3s)'),
('error', 'Automation', 'HR Onboarding failed: Connection timeout to StartupHub HRIS'),
('info', 'Report', 'PDF generated successfully for LogisticsPro'),
('info', 'System', 'Daily backup completed: 45.2MB exported'),
('warn', 'Rate Limit', 'Approaching API limit for Social Media Scheduler (85%)');
