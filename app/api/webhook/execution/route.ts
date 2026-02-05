import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ============================================================================
// REQUEST VALIDATION SCHEMA
// ============================================================================

const webhookSchema = z.object({
  workflow_id: z.string().min(1, 'workflow_id is required'),
  status: z.enum(['success', 'error', 'running', 'waiting']),
  execution_id: z.string().optional(),
  platform: z.enum(['n8n', 'zapier', 'make', 'retell', 'custom', 'other']).optional().default('custom'),
  started_at: z.string().datetime().optional(),
  finished_at: z.string().datetime().optional(),
  execution_time_ms: z.number().int().positive().optional(),
  metadata: z.record(z.any()).optional().default({})
})

type WebhookPayload = z.infer<typeof webhookSchema>

// ============================================================================
// API KEY AUTHENTICATION
// ============================================================================

async function validateApiKey(apiKey: string): Promise<{ valid: boolean; keyId?: string; userId?: string }> {
  const supabase = await createClient()

  // Query api_keys table (not app_settings)
  const { data: keyRecord, error } = await supabase
    .from('api_keys')
    .select('id, key_hash, is_active, created_by')
    .eq('key_hash', apiKey) // In production, use proper hashing (bcrypt/argon2)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !keyRecord) {
    return { valid: false }
  }

  // Update last_used_at timestamp
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRecord.id)

  return {
    valid: true,
    keyId: keyRecord.id,
    userId: keyRecord.created_by
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // -------------------------------------------------------------------------
    // 1. API Key Authentication
    // -------------------------------------------------------------------------
    const apiKey = request.headers.get('X-API-Key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing X-API-Key header' },
        { status: 401 }
      )
    }

    const auth = await validateApiKey(apiKey)

    if (!auth.valid) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // -------------------------------------------------------------------------
    // 2. Request Body Validation
    // -------------------------------------------------------------------------
    let body: unknown
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const parseResult = webhookSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    const payload: WebhookPayload = parseResult.data

    // -------------------------------------------------------------------------
    // 3. Generate execution_id if not provided (idempotency key)
    // -------------------------------------------------------------------------
    const executionId = payload.execution_id || `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // -------------------------------------------------------------------------
    // 4. Insert Execution Record (with idempotency)
    // -------------------------------------------------------------------------
    const supabase = await createClient()

    const executionRecord = {
      workflow_id: payload.workflow_id,
      execution_id: executionId,
      status: payload.status,
      platform: payload.platform,
      started_at: payload.started_at || new Date().toISOString(),
      finished_at: payload.finished_at || null,
      execution_time_ms: payload.execution_time_ms || null,
      metadata: payload.metadata,
      created_at: new Date().toISOString(),
      user_id: auth.userId || null
    }

    const { data, error } = await supabase
      .from('executions_raw')
      .insert(executionRecord)
      .select()
      .single()

    // Handle duplicate execution_id (idempotency)
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          {
            success: true,
            message: 'Execution already recorded (idempotent)',
            execution_id: executionId
          },
          { status: 200 }
        )
      }

      console.error('[WEBHOOK] Database error:', error)
      return NextResponse.json(
        {
          error: 'Database error',
          details: error.message
        },
        { status: 500 }
      )
    }

    // -------------------------------------------------------------------------
    // 5. Success Response
    // -------------------------------------------------------------------------
    return NextResponse.json(
      {
        success: true,
        execution_id: executionId,
        workflow_id: payload.workflow_id,
        recorded_at: data.created_at
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('[WEBHOOK] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET HANDLER (for health check and documentation)
// ============================================================================

export async function GET() {
  return NextResponse.json({
    name: 'ROI Sheet Webhook API',
    status: 'ok',
    endpoint: '/api/webhook/execution',
    methods: ['POST'],
    version: '2.0.0',
    description: 'Production-ready webhook endpoint for receiving workflow execution data from n8n, Zapier, Make, and other automation platforms.',
    features: [
      'Dedicated API key authentication via api_keys table',
      'Idempotent execution recording (unique execution_id constraint)',
      'Platform-agnostic design (supports multiple automation platforms)',
      'Complete webhook data storage (execution_time_ms, platform, metadata)',
      'Zod-based request validation',
      'Proper error handling with specific HTTP status codes'
    ],
    usage: {
      authentication: 'Include X-API-Key header with your API key',
      request_body: {
        workflow_id: 'string (required) - Your workflow ID',
        status: 'enum (required) - One of: success, error, running, waiting',
        execution_id: 'string (optional) - Unique execution identifier for idempotency',
        platform: 'enum (optional) - One of: n8n, zapier, make, retell, custom, other (default: custom)',
        started_at: 'string (optional) - ISO 8601 timestamp',
        finished_at: 'string (optional) - ISO 8601 timestamp',
        execution_time_ms: 'number (optional) - Execution duration in milliseconds',
        metadata: 'object (optional) - Any additional JSON data'
      },
      example: {
        workflow_id: 'test_workflow_123',
        status: 'success',
        execution_id: 'exec-001',
        platform: 'n8n',
        started_at: '2026-02-05T10:00:00Z',
        finished_at: '2026-02-05T10:00:05Z',
        execution_time_ms: 5000,
        metadata: { items_processed: 10 }
      }
    }
  })
}
