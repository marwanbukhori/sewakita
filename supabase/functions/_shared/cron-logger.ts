// Shared cron run logger for edge functions.
// Tracks cron job start, completion, and failures in cron_run_log table.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

export async function startCronRun(functionName: string): Promise<string> {
  const { data, error } = await supabase
    .from('cron_run_log')
    .insert({
      function_name: functionName,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to start cron log:', error.message)
    return '' // Return empty string — caller should still proceed
  }
  return data.id
}

export async function completeCronRun(runId: string, summary: Record<string, unknown>): Promise<void> {
  if (!runId) return
  const now = new Date()
  const { data: run } = await supabase.from('cron_run_log').select('started_at').eq('id', runId).single()
  const durationMs = run?.started_at ? now.getTime() - new Date(run.started_at).getTime() : null

  await supabase
    .from('cron_run_log')
    .update({
      status: 'success',
      completed_at: now.toISOString(),
      summary,
      duration_ms: durationMs,
    })
    .eq('id', runId)
}

export async function failCronRun(runId: string, error: string): Promise<void> {
  if (!runId) return
  const now = new Date()
  const { data: run } = await supabase.from('cron_run_log').select('started_at').eq('id', runId).single()
  const durationMs = run?.started_at ? now.getTime() - new Date(run.started_at).getTime() : null

  await supabase
    .from('cron_run_log')
    .update({
      status: 'failed',
      completed_at: now.toISOString(),
      error,
      duration_ms: durationMs,
    })
    .eq('id', runId)
}
