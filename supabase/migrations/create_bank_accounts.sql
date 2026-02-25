-- Migration: Create bank account management tables
-- Tables: bank_accounts, bank_transactions, bank_fees

-- 1) bank_accounts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name     text NOT NULL,
  account_name  text NOT NULL,
  currency      text NOT NULL DEFAULT 'USD'
                  CHECK (currency IN ('USD','CAD','JMD','EUR','GBP')),
  last_four_digits text NOT NULL CHECK (char_length(last_four_digits) = 4),
  current_balance  numeric(15,2) NOT NULL DEFAULT 0,
  pending_payments numeric(15,2) NOT NULL DEFAULT 0,
  last_funding     date,
  card_color       text NOT NULL DEFAULT 'blue'
                     CHECK (card_color IN ('blue','purple','indigo','green','orange','pink','teal','red')),
  account_type     text DEFAULT 'Checking'
                     CHECK (account_type IN ('Checking','Savings','Business','Reserve')),
  purpose          text DEFAULT 'Operations'
                     CHECK (purpose IN ('Operations','Payroll','Vendor Payments','Reserve Funds','Project Specific')),
  status           text NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','inactive')),
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 2) bank_transactions
CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id  uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  transaction_date  date NOT NULL DEFAULT CURRENT_DATE,
  type             text NOT NULL CHECK (type IN ('Funding','Payment','Fee')),
  vendor           text,
  amount           numeric(15,2) NOT NULL,
  fee_amount       numeric(15,2) NOT NULL DEFAULT 0,
  exchange_rate    numeric(12,4),
  balance_after    numeric(15,2) NOT NULL DEFAULT 0,
  currency         text NOT NULL DEFAULT 'USD',
  receipt_uploaded boolean NOT NULL DEFAULT false,
  reconciled       boolean NOT NULL DEFAULT false,
  funding_source   text,
  fee_type         text CHECK (fee_type IS NULL OR fee_type IN ('Exchange Variance','Transfer Fee')),
  reference_number text,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 3) bank_fees
CREATE TABLE IF NOT EXISTS public.bank_fees (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id        uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  bank_transaction_id    uuid REFERENCES public.bank_transactions(id) ON DELETE SET NULL,
  transaction_date          date NOT NULL DEFAULT CURRENT_DATE,
  transaction_type       text NOT NULL,
  fee_type               text NOT NULL CHECK (fee_type IN ('Exchange Variance','Transfer Fee')),
  exchange_rate_variance numeric(15,2),
  bank_transfer_fee      numeric(15,2),
  related_payment_id     text,
  amount                 numeric(15,2) NOT NULL,
  currency               text NOT NULL DEFAULT 'USD',
  notes                  text,
  created_at             timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account
  ON public.bank_transactions(bank_account_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_bank_fees_account
  ON public.bank_fees(bank_account_id);

-- Auto-update updated_at on bank_accounts
CREATE OR REPLACE FUNCTION update_bank_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bank_accounts_updated_at ON public.bank_accounts;
CREATE TRIGGER trg_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_accounts_updated_at();
