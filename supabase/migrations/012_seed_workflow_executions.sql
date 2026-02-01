-- Migration: 012_seed_workflow_executions
-- Description: Insert realistic workflow execution test data
-- Created: 2026-02-01

DO $$
DECLARE
  automation_1 UUID;
  automation_2 UUID;
  automation_3 UUID;
  automation_4 UUID;
  automation_5 UUID;
  client_1 UUID;
  client_2 UUID;
  client_3 UUID;
  client_4 UUID;
  client_5 UUID;
BEGIN
  -- Get existing automation IDs
  SELECT id INTO automation_1 FROM automations WHERE name LIKE '%Lead Scoring%' LIMIT 1;
  SELECT id INTO automation_2 FROM automations WHERE name LIKE '%Invoice Parser%' LIMIT 1;
  SELECT id INTO automation_3 FROM automations WHERE name LIKE '%HR Onboarding%' LIMIT 1;
  SELECT id INTO automation_4 FROM automations WHERE name LIKE '%Social Media%' LIMIT 1;
  SELECT id INTO automation_5 FROM automations WHERE name LIKE '%Customer Support%' LIMIT 1;

  -- Get existing client IDs
  SELECT id INTO client_1 FROM clients WHERE name LIKE '%TechCorp%' LIMIT 1;
  SELECT id INTO client_2 FROM clients WHERE name LIKE '%LogisticsPro%' LIMIT 1;
  SELECT id INTO client_3 FROM clients WHERE name LIKE '%StartupHub%' LIMIT 1;
  SELECT id INTO client_4 FROM clients WHERE name LIKE '%MarketingMax%' LIMIT 1;
  SELECT id INTO client_5 FROM clients WHERE name LIKE '%ServiceFirst%' LIMIT 1;

  -- Insert 50 executions for Lead Scoring AI (TechCorp) - mostly successful
  FOR i IN 1..50 LOOP
    INSERT INTO workflow_executions (
      automation_id, client_id, start_time, end_time, hourly_rate, status
    ) VALUES (
      automation_1,
      client_1,
      NOW() - (RANDOM() * INTERVAL '30 days'),
      NOW() - (RANDOM() * INTERVAL '30 days') + (RANDOM() * INTERVAL '2 hours'),
      120.00,
      'completed'
    );
  END LOOP;

  -- Insert 40 executions for Invoice Parser (LogisticsPro) - all successful
  FOR i IN 1..40 LOOP
    INSERT INTO workflow_executions (
      automation_id, client_id, start_time, end_time, hourly_rate, status
    ) VALUES (
      automation_2,
      client_2,
      NOW() - (RANDOM() * INTERVAL '30 days'),
      NOW() - (RANDOM() * INTERVAL '30 days') + (RANDOM() * INTERVAL '1 hour'),
      150.00,
      'completed'
    );
  END LOOP;

  -- Insert 20 executions for HR Onboarding (StartupHub) - 30% failure rate
  FOR i IN 1..20 LOOP
    INSERT INTO workflow_executions (
      automation_id, client_id, start_time, end_time, hourly_rate, status, error_message
    ) VALUES (
      automation_3,
      client_3,
      NOW() - (RANDOM() * INTERVAL '30 days'),
      NOW() - (RANDOM() * INTERVAL '30 days') + (RANDOM() * INTERVAL '30 minutes'),
      100.00,
      CASE WHEN RANDOM() < 0.3 THEN 'failed' ELSE 'completed' END,
      CASE WHEN RANDOM() < 0.3 THEN 'Connection timeout to HRIS API' ELSE NULL END
    );
  END LOOP;

  -- Insert 30 executions for Social Media Scheduler (MarketingMax) - all successful
  IF automation_4 IS NOT NULL AND client_4 IS NOT NULL THEN
    FOR i IN 1..30 LOOP
      INSERT INTO workflow_executions (
        automation_id, client_id, start_time, end_time, hourly_rate, status
      ) VALUES (
        automation_4,
        client_4,
        NOW() - (RANDOM() * INTERVAL '30 days'),
        NOW() - (RANDOM() * INTERVAL '30 days') + (RANDOM() * INTERVAL '45 minutes'),
        90.00,
        'completed'
      );
    END LOOP;
  END IF;

  -- Insert 25 executions for Customer Support Bot (ServiceFirst) - some paused/timeout
  IF automation_5 IS NOT NULL AND client_5 IS NOT NULL THEN
    FOR i IN 1..25 LOOP
      INSERT INTO workflow_executions (
        automation_id, client_id, start_time, end_time, hourly_rate, status, error_message
      ) VALUES (
        automation_5,
        client_5,
        NOW() - (RANDOM() * INTERVAL '30 days'),
        NOW() - (RANDOM() * INTERVAL '30 days') + (RANDOM() * INTERVAL '1.5 hours'),
        110.00,
        CASE
          WHEN RANDOM() < 0.1 THEN 'timeout'
          WHEN RANDOM() < 0.05 THEN 'failed'
          ELSE 'completed'
        END,
        CASE
          WHEN RANDOM() < 0.1 THEN 'Execution timeout after 10 minutes'
          WHEN RANDOM() < 0.05 THEN 'Rate limit exceeded'
          ELSE NULL
        END
      );
    END LOOP;
  END IF;

  RAISE NOTICE 'Seeded approximately 165 workflow execution records across 5 automations';

END $$;
