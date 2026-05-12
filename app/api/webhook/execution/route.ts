import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

// ============================================================================
// REQUEST VALIDATION SCHEMA
// ============================================================================

const webhookSchema = z.object({
  workflow_id: z.string().min(1, 'workflow_id is required'),
  status: z.enum(['success', 'error', 'running', 'waiting']),
  execution_id: z.string().optional(),
  platform: z
    .enum(['n8n', 'zapier', 'make', 'retell', 'custom', 'other'])
    .optional()
    .default('custom'),
  started_at: z.string().datetime().optional(),
  finished_at: z.string().datetime().optional(),
  execution_time_ms: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
})

type WebhookPayload = z.infer<typeof webhookSchema>

// ============================================================================
// API KEY AUTHENTICATION
// ============================================================================

/**
 * Validate the API key and return the owning user_id (Clerk sub string).
 * Uses the service role client so we bypass RLS for the lookup.
 */
async function validateApiKey(
  apiKey: string,
): Promise<{ valid: boolean; keyId?: string; userId?: string }> {
  const supabase = createAdminClient()

  const { data: keyRecord, error } = await supabase
    .from('api_keys')
    .select('id, key_hash, is_active, created_by')
    .eq('key_hash', apiKey)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !keyRecord) return { valid: false }

  // Best-effort timestamp update (don't fail the request if this fails)
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRecord.id)

  return {
    valid: true,
    keyId: keyRecord.id,
    userId: keyRecord.created_by as string,
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Auth ----------------------------------------------------------------
    const apiKey = request.headers.get('X-API-Key')
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing X-API-Key header' }, { status: 401 })
    }

    const auth = await validateApiKey(apiKey)
    if (!auth.valid || !auth.userId) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }
    const userId = auth.userId

    // 2. Body validation -----------------------------------------------------
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parseResult = webhookSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 },
      )
    }
    const payload: WebhookPayload = parseResult.data

    // 3. Ownership check -----------------------------------------------------
    // The workflow must belong to an automation owned by this API key's user.
    // Returning 403 (not 404) keeps us from leaking which workflow_ids exist.
    const supabase = createAdminClient()
    const { data: automation, error: ownershipError } = await supabase
      .from('automations')
      .select('id, user_id')
      .eq('workflow_id', payload.workflow_id)
      .maybeSingle()

    if (ownershipError) {
      console.error('[WEBHOOK] Ownership check error:', ownershipError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    if (!automation || automation.user_id !== userId) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    // 4. Idempotency key -----------------------------------------------------
    const executionId =
      payload.execution_id ||
      `webhook-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

    // 5. Insert --------------------------------------------------------------
    const { data, error } = await supabase
      .from('executions_raw')
      .insert({
        workflow_id: payload.workflow_id,
        execution_id: executionId,
        status: payload.status,
        platform: payload.platform,
        started_at: payload.started_at || new Date().toISOString(),
        finished_at: payload.finished_at || null,
        execution_time_ms: payload.execution_time_ms || null,
        metadata: payload.metadata,
        created_at: new Date().toISOString(),
        user_id: userId,
      })
      .select()
      .single()

    if (error) {
      // Unique constraint violation = idempotent replay
      if (error.code === '23505') {
        return NextResponse.json(
          {
            success: true,
            message: 'Execution already recorded (idempotent)',
            execution_id: executionId,
          },
          { status: 200 },
        )
      }

      console.error('[WEBHOOK] Database error:', error)
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        execution_id: executionId,
        workflow_id: payload.workflow_id,
        recorded_at: data.created_at,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[WEBHOOK] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// ============================================================================
// GET — health check
// ============================================================================

export async function GET() {
  return NextResponse.json({
    name: 'ROI Sheet Webhook API',
    status: 'ok',
    endpoint: '/api/webhook/execution',
    methods: ['POST'],
    version: '3.0.0',
    description:
      'Webhook endpoint for execution data from automation platforms. Authenticates with X-API-Key, enforces workflow ownership against the API key owner.',
    usage: {
      authentication: 'Include X-API-Key header with your API key',
      ownership:
        'workflow_id must belong to an automation owned by the API key holder; otherwise 403',
      request_body: {
        workflow_id: 'string (required)',
        status: 'enum: success|error|running|waiting',
        execution_id: 'string (optional, used for idempotency)',
        platform: 'enum: n8n|zapier|make|retell|custom|other (default: custom)',
        started_at: 'ISO 8601 timestamp (optional)',
        finished_at: 'ISO 8601 timestamp (optional)',
        execution_time_ms: 'number (optional)',
        metadata: 'object (optional)',
      },
    },
  })
}
