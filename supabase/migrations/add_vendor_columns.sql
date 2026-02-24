-- Migration: Add missing vendor columns
-- These columns align with the Vendor interface in PlatformContext.tsx

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS email               text,
  ADD COLUMN IF NOT EXISTS phone               text,
  ADD COLUMN IF NOT EXISTS address             text,
  ADD COLUMN IF NOT EXISTS category            text,
  ADD COLUMN IF NOT EXISTS rating              real         DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_score          integer      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_engagements   integer      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent         numeric      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contact_person      text,
  ADD COLUMN IF NOT EXISTS joined_date         date,
  ADD COLUMN IF NOT EXISTS last_engagement_date date,
  ADD COLUMN IF NOT EXISTS notes               text;
