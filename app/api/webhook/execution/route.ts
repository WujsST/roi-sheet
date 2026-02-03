import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Allow CORS for external webhooks
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
    try {
        // Initialize Supabase client
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Check API key
        const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Missing API key' },
                { status: 401, headers: corsHeaders }
            )
        }

        // Validate API Key against app_settings to find the user
        const { data: userSettings, error: authError } = await supabase
            .from('app_settings')
            .select('user_id')
            .eq('key', 'api_key')
            .eq('value', apiKey)
            .single()

        if (authError || !userSettings) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Invalid API key' },
                { status: 401, headers: corsHeaders }
            )
        }

        const userId = userSettings.user_id;

        // Parse request body
        const body = await request.json()

        // Validate required fields
        const {
            workflow_id,        // Required: n8n workflow ID
            execution_id,       // Optional: unique execution ID
            status,             // Required: 'success' | 'error' | 'running'
            platform,           // Optional: 'n8n' | 'zapier' | 'make' | 'custom'
            started_at,         // Optional: ISO timestamp
            finished_at,        // Optional: ISO timestamp
            execution_time_ms,  // Optional: execution duration in milliseconds
            error_message,      // Optional: error details if status is 'error'
            items_count,        // Optional: number of items processed
            metadata            // Optional: any additional JSON data
        } = body

        if (!workflow_id) {
            return NextResponse.json(
                { error: 'Bad Request', message: 'workflow_id is required' },
                { status: 400, headers: corsHeaders }
            )
        }

        if (!status || !['success', 'error', 'running', 'waiting'].includes(status)) {
            return NextResponse.json(
                { error: 'Bad Request', message: 'status must be one of: success, error, running, waiting' },
                { status: 400, headers: corsHeaders }
            )
        }

        // Prepare execution record - only core columns
        const executionRecord: Record<string, unknown> = {
            n8n_workflow_id: workflow_id,
            n8n_execution_id: execution_id || `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: status,
            created_at: started_at || new Date().toISOString(),
            user_id: userId // Associate with the user who owns the API Key
        }

        // Add finished_at if provided
        if (finished_at) {
            executionRecord.finished_at = finished_at
        }

        // Insert into executions_raw table
        const { data, error } = await supabase
            .from('executions_raw')
            .insert(executionRecord)
            .select()
            .single()

        if (error) {
            console.error('Supabase insert error:', error)
            return NextResponse.json(
                { error: 'Database Error', message: error.message },
                { status: 500, headers: corsHeaders }
            )
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Execution recorded successfully',
                execution_id: data.id,
                workflow_id: workflow_id,
                status: status
            },
            { status: 201, headers: corsHeaders }
        )

    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error', message: (error as Error).message },
            { status: 500, headers: corsHeaders }
        )
    }
}

// GET endpoint for health check and documentation
export async function GET() {
    return NextResponse.json({
        name: 'ROI Sheet Webhook API',
        version: '1.0.0',
        description: 'Webhook endpoint for receiving workflow execution data from n8n, Zapier, Make, and other automation platforms.',
        endpoints: {
            'POST /api/webhook/execution': {
                description: 'Record a workflow execution',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'YOUR_API_KEY (required)'
                },
                body: {
                    workflow_id: 'string (required) - Your workflow ID',
                    execution_id: 'string (optional) - Unique execution identifier',
                    status: 'string (required) - One of: success, error, running, waiting',
                    platform: 'string (optional) - One of: n8n, zapier, make, retell, custom',
                    started_at: 'string (optional) - ISO 8601 timestamp',
                    finished_at: 'string (optional) - ISO 8601 timestamp',
                    execution_time_ms: 'number (optional) - Execution duration in milliseconds',
                    error_message: 'string (optional) - Error details if status is error',
                    items_count: 'number (optional) - Number of items processed',
                    metadata: 'object (optional) - Any additional JSON data'
                },
                example: {
                    workflow_id: 'abc123',
                    execution_id: 'exec-456',
                    status: 'success',
                    platform: 'n8n',
                    started_at: '2024-01-15T10:30:00Z',
                    finished_at: '2024-01-15T10:30:05Z',
                    execution_time_ms: 5000,
                    items_count: 10
                }
            }
        }
    }, { headers: corsHeaders })
}
