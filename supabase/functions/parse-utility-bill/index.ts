// Parse utility bill via Vision LLM OCR
// Deploy: supabase functions deploy parse-utility-bill
//
// Accepts POST { image_url, utility_type_hint? }
// image_url = Supabase Storage path within 'utility-scans' bucket
// Returns { success, extraction } or { success: false, error }
//
// Primary: Gemini 2.0 Flash (cheapest, 94% invoice accuracy)
// Fallback: Claude Haiku 4.5 (best JSON consistency)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildPrompt, parseExtraction } from '../_shared/ocr-prompts.ts'
import type { ExtractionResult } from '../_shared/ocr-prompts.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

interface RequestBody {
  image_url: string
  utility_type_hint?: 'electric' | 'water' | 'internet'
}

async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const { data, error } = await supabase.storage
    .from('utility-scans')
    .download(imageUrl)

  if (error || !data) {
    throw new Error(`Failed to download image: ${error?.message || 'no data'}`)
  }

  const arrayBuffer = await data.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)
  let binary = ''
  for (const byte of uint8) {
    binary += String.fromCharCode(byte)
  }
  const base64 = btoa(binary)

  const mimeType = imageUrl.endsWith('.png') ? 'image/png'
    : imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg') ? 'image/jpeg'
    : imageUrl.endsWith('.webp') ? 'image/webp'
    : 'image/jpeg'

  return { base64, mimeType }
}

async function callGemini(base64: string, mimeType: string, prompt: string): Promise<ExtractionResult | null> {
  if (!GEMINI_API_KEY) return null

  const startMs = Date.now()
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: prompt },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      }),
    }
  )

  if (!response.ok) {
    console.error('Gemini API error:', response.status, await response.text())
    return null
  }

  const result = await response.json()
  const latencyMs = Date.now() - startMs
  console.log(`Gemini call: ${latencyMs}ms`)

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) return null

  return parseExtraction(text)
}

async function callClaude(base64: string, mimeType: string, prompt: string): Promise<ExtractionResult | null> {
  if (!ANTHROPIC_API_KEY) return null

  const mediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  const startMs = Date.now()

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  })

  if (!response.ok) {
    console.error('Claude API error:', response.status, await response.text())
    return null
  }

  const result = await response.json()
  const latencyMs = Date.now() - startMs
  console.log(`Claude call: ${latencyMs}ms`)

  const text = result.content?.[0]?.text
  if (!text) return null

  return parseExtraction(text)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body: RequestBody = await req.json()
    const { image_url, utility_type_hint } = body

    if (!image_url) {
      return new Response(
        JSON.stringify({ success: false, error: 'image_url is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { base64, mimeType } = await fetchImageAsBase64(image_url)
    const prompt = buildPrompt(utility_type_hint)
    let extraction: ExtractionResult | null = null
    let model = 'gemini-2.0-flash'
    let retryCount = 0

    // Primary: Gemini 2.0 Flash
    extraction = await callGemini(base64, mimeType, prompt)

    // Fallback: Claude Haiku if Gemini fails
    if (!extraction) {
      retryCount = 1
      model = 'claude-haiku-4.5'
      extraction = await callClaude(base64, mimeType, prompt)
    }

    if (!extraction) {
      return new Response(
        JSON.stringify({ success: false, error: 'Both OCR providers failed to extract data', retry_count: retryCount }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Log to activity_log for audit
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      if (user) {
        const profileId = user.id
        await supabase.from('activity_log').insert({
          landlord_id: profileId,
          type: 'utility_scanned',
          title: `Utility bill scanned (${extraction.utility_type})`,
          detail: JSON.stringify({ model, retry_count: retryCount, amount: extraction.total_amount }),
        }).then(({ error }) => { if (error) console.error('Activity log error:', error) })
      }
    }

    return new Response(
      JSON.stringify({ success: true, extraction, model, retry_count: retryCount }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('parse-utility-bill error:', err)
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
