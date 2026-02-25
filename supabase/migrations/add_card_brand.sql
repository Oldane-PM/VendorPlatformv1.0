-- Migration: Add card_brand column to bank_accounts
ALTER TABLE public.bank_accounts
  ADD COLUMN IF NOT EXISTS card_brand text
    DEFAULT 'unknown'
    CHECK (card_brand IN ('visa','mastercard','unknown'));

-- Update seeded accounts with realistic brands
UPDATE public.bank_accounts SET card_brand = 'visa'       WHERE last_four_digits = '4582';
UPDATE public.bank_accounts SET card_brand = 'mastercard' WHERE last_four_digits = '7293';
UPDATE public.bank_accounts SET card_brand = 'visa'       WHERE last_four_digits = '1847';
