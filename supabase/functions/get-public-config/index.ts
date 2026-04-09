// Public config endpoint — returns non-sensitive configuration for the frontend.
// No auth required. Returns site_config, feature_flags, and active plans.
// Deploy: supabase functions deploy get-public-config

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  try {
    const [configRes, flagsRes, plansRes] = await Promise.all([
      supabase.from('site_config').select('key, value, category'),
      supabase.from('feature_flags').select('key, enabled, tier'),
      supabase.from('plans').select('*').eq('is_active', true).order('sort_order'),
    ])

    // Transform to maps for easy frontend consumption
    const config: Record<string, unknown> = {}
    for (const row of configRes.data || []) {
      config[row.key] = row.value
    }

    const flags: Record<string, { enabled: boolean; tier: string }> = {}
    for (const row of flagsRes.data || []) {
      flags[row.key] = { enabled: row.enabled, tier: row.tier }
    }

    return new Response(JSON.stringify({
      config,
      flags,
      plans: plansRes.data || [],
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('get-public-config error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
