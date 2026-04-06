// Structured extraction prompt + schema for Malaysian utility bill OCR.
// Used by parse-utility-bill edge function.

export const UTILITY_BILL_SCHEMA = {
  type: 'object',
  properties: {
    utility_type: { type: 'string', enum: ['electric', 'water', 'internet'] },
    total_amount: { type: 'number', description: 'Total amount payable in RM, no currency prefix' },
    billing_period_start: { type: ['string', 'null'], description: 'ISO 8601 date YYYY-MM-DD' },
    billing_period_end: { type: ['string', 'null'], description: 'ISO 8601 date YYYY-MM-DD' },
    account_number: { type: ['string', 'null'] },
    meter_reading_current: { type: ['number', 'null'] },
    meter_reading_previous: { type: ['number', 'null'] },
    units_consumed: { type: ['number', 'null'], description: 'kWh for electric, m³ for water' },
    confidence: {
      type: 'object',
      properties: {
        total_amount: { type: 'number' },
        billing_period: { type: 'number' },
        account_number: { type: 'number' },
      },
    },
  },
  required: ['utility_type', 'total_amount', 'confidence'],
} as const

export interface ExtractionResult {
  utility_type: 'electric' | 'water' | 'internet'
  total_amount: number
  billing_period_start: string | null
  billing_period_end: string | null
  account_number: string | null
  meter_reading_current: number | null
  meter_reading_previous: number | null
  units_consumed: number | null
  confidence: Record<string, number>
}

export function buildPrompt(utilityTypeHint?: string): string {
  const hint = utilityTypeHint
    ? `The user indicates this is a "${utilityTypeHint}" bill.`
    : 'Determine the utility type from the bill content.'

  return `You are extracting data from a Malaysian utility bill (TNB electricity, Air Selangor water, or ISP internet).

${hint}

Extract ONLY the fields in the JSON schema below. Return null for any field you cannot read confidently. Return all amounts as numbers without RM prefix or thousand separators. Return dates as ISO 8601 (YYYY-MM-DD).

For each key field, return a confidence score 0.0–1.0:
- 1.0: text is clearly visible and unambiguous
- 0.7–0.9: text is readable but slightly obscured
- 0.4–0.6: partially visible, your best guess
- <0.4: barely readable, likely wrong

JSON schema:
${JSON.stringify(UTILITY_BILL_SCHEMA, null, 2)}

Here are two examples of correct output:

Example 1 — TNB electricity bill:
{
  "utility_type": "electric",
  "total_amount": 182.40,
  "billing_period_start": "2026-03-01",
  "billing_period_end": "2026-03-31",
  "account_number": "220012345678",
  "meter_reading_current": 15847,
  "meter_reading_previous": 15562,
  "units_consumed": 285,
  "confidence": { "total_amount": 0.98, "billing_period": 0.95, "account_number": 0.92 }
}

Example 2 — Air Selangor water bill:
{
  "utility_type": "water",
  "total_amount": 45.60,
  "billing_period_start": "2026-03-05",
  "billing_period_end": "2026-04-04",
  "account_number": "3301234567",
  "meter_reading_current": 1205,
  "meter_reading_previous": 1189,
  "units_consumed": 16,
  "confidence": { "total_amount": 0.97, "billing_period": 0.85, "account_number": 0.72 }
}

Return ONLY valid JSON. No markdown fences, no explanation.`
}

export function parseExtraction(raw: string): ExtractionResult | null {
  try {
    // Strip markdown fences if the model wraps output
    const cleaned = raw.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim()
    const parsed = JSON.parse(cleaned)

    if (typeof parsed.total_amount !== 'number' || !parsed.utility_type || !parsed.confidence) {
      return null
    }

    return parsed as ExtractionResult
  } catch {
    return null
  }
}
