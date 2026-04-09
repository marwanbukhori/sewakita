// Shared admin auth guard for edge functions.
// Verifies JWT and checks is_admin flag on profiles.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { errorResponse } from './cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

export { supabase as adminClient }

export interface AdminUser {
  id: string
  email: string
  profileId: string
}

export async function verifyAdmin(req: Request): Promise<AdminUser | Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return errorResponse('unauthorized', 401)
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return errorResponse('unauthorized', 401)
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, is_admin')
    .eq('auth_id', user.id)
    .single()

  if (profileError || !profile?.is_admin) {
    return errorResponse('forbidden: admin access required', 403)
  }

  return {
    id: user.id,
    email: user.email!,
    profileId: profile.id,
  }
}
