#!/bin/bash
# ============================================================
# ROI Sheet - Database Setup Script
# Project: P13-Bento-Sheets (jzwsavttpkijccxliplr)
# ============================================================
#
# This script initializes the Supabase database with all required
# tables and demo data.
#
# Prerequisites:
#   - Supabase CLI (npx supabase) or direct access to SQL Editor
#   - SUPABASE_ACCESS_TOKEN environment variable (for CLI method)
#
# Usage:
#   Option 1 (CLI): ./setup-database.sh
#   Option 2 (Manual): Copy contents of init.sql to Supabase SQL Editor
#
# ============================================================

set -e

PROJECT_ID="jzwsavttpkijccxliplr"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================================"
echo "ROI Sheet Database Setup"
echo "Project: $PROJECT_ID"
echo "============================================================"
echo ""

# Check if we have access token
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "WARNING: SUPABASE_ACCESS_TOKEN not set"
    echo ""
    echo "To run this script automatically, you need to:"
    echo "  1. Go to https://supabase.com/dashboard/account/tokens"
    echo "  2. Generate a new access token"
    echo "  3. Run: export SUPABASE_ACCESS_TOKEN=your_token_here"
    echo "  4. Re-run this script"
    echo ""
    echo "Alternatively, you can manually execute the SQL:"
    echo "  1. Go to https://supabase.com/dashboard/project/$PROJECT_ID/sql"
    echo "  2. Copy and paste contents of: $SCRIPT_DIR/init.sql"
    echo "  3. Click 'Run' to execute"
    echo ""
    exit 1
fi

echo "Executing database initialization..."
echo ""

# Execute each migration file
for migration in "$SCRIPT_DIR/migrations"/*.sql; do
    if [ -f "$migration" ]; then
        echo "Running: $(basename "$migration")"
        npx supabase db push --db-url "postgresql://postgres:$SUPABASE_DB_PASSWORD@db.$PROJECT_ID.supabase.co:5432/postgres" < "$migration" 2>/dev/null || \
        npx supabase sql --project-ref "$PROJECT_ID" < "$migration"
    fi
done

echo ""
echo "============================================================"
echo "Database setup completed successfully!"
echo "============================================================"
echo ""
echo "Verify by running these queries in SQL Editor:"
echo "  SELECT COUNT(*) FROM automations;"
echo "  SELECT COUNT(*) FROM savings_history;"
echo "  SELECT COUNT(*) FROM dashboard_stats;"
echo "  SELECT COUNT(*) FROM clients;"
echo "  SELECT COUNT(*) FROM reports;"
echo "  SELECT COUNT(*) FROM system_logs;"
echo ""
