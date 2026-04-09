-- =============================================================================
-- Migration 022: Edge Function Observability
--
-- Adds cron run logging and extends notification_log for subscription emails.
-- 1. cron_run_log table for tracking cron job executions
-- 2. notification_log changes to support subscription emails (nullable tenant_id, add landlord_id)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Cron run log
-- ---------------------------------------------------------------------------
CREATE TABLE cron_run_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    function_name TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
    summary JSONB,
    error TEXT,
    duration_ms INTEGER
);

CREATE INDEX idx_cron_run_log_function ON cron_run_log (function_name, started_at DESC);

-- RLS: admin reads via service_role, no authenticated access
ALTER TABLE cron_run_log ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. Extend notification_log for subscription emails
-- ---------------------------------------------------------------------------
-- Make tenant_id nullable (subscription emails have no tenant)
ALTER TABLE notification_log ALTER COLUMN tenant_id DROP NOT NULL;

-- Add landlord_id for subscription email logging
ALTER TABLE notification_log ADD COLUMN landlord_id UUID REFERENCES profiles(id);
