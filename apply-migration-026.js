#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Read migration file
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '026_fix_rpc_functions_column_names.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('Applying Migration 026: Fix RPC Functions Column Names...\n');

  // Split SQL by function (simple approach - split by DROP FUNCTION)
  const sqlStatements = migrationSQL
    .split(/-- ={10,}/)
    .filter(section => section.trim().length > 0 && !section.trim().startsWith('Verification'));

  for (let i = 0; i < sqlStatements.length; i++) {
    const section = sqlStatements[i].trim();
    if (!section || section.startsWith('Migration 026')) continue;

    console.log(`Executing section ${i + 1}/${sqlStatements.length}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: section
      });

      if (error) {
        console.error(`Error in section ${i + 1}:`, error);
        // Try direct approach
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql: section })
        });

        if (!response.ok) {
          console.error(`HTTP Error: ${response.status} ${response.statusText}`);
          const text = await response.text();
          console.error('Response:', text);
        }
      } else {
        console.log(`✓ Section ${i + 1} executed successfully`);
      }
    } catch (err) {
      console.error(`Exception in section ${i + 1}:`, err.message);
    }
  }

  console.log('\nMigration application complete!');
  console.log('\nVerifying functions...');

  // Test get_monthly_savings_chart
  try {
    const { data, error } = await supabase.rpc('get_monthly_savings_chart', {
      p_year: 2026,
      p_month: 2,
      p_client_id: null
    });

    if (error) {
      console.error('Error testing get_monthly_savings_chart:', error);
    } else {
      console.log('✓ get_monthly_savings_chart working:', data?.length || 0, 'weeks');
    }
  } catch (err) {
    console.error('Exception testing get_monthly_savings_chart:', err.message);
  }

  // Test get_rolling_weekly_savings
  try {
    const { data, error } = await supabase.rpc('get_rolling_weekly_savings', {
      p_weeks_back: 5,
      p_client_id: null
    });

    if (error) {
      console.error('Error testing get_rolling_weekly_savings:', error);
    } else {
      console.log('✓ get_rolling_weekly_savings working:', data?.length || 0, 'weeks');
    }
  } catch (err) {
    console.error('Exception testing get_rolling_weekly_savings:', err.message);
  }

  console.log('\nDone! Please refresh your dashboard at http://localhost:3000');
}

applyMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
