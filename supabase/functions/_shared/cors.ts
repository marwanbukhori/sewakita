// Shared CORS helper for edge functions called from the frontend.
// Supports GET, POST, PUT, OPTIONS methods.

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

export function corsResponse(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

export function errorResponse(error: string, status = 400): Response {
  return jsonResponse({ success: false, error }, status)
}
