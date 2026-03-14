-- Synchronize total_amount across all rows in challan_ledger
-- This ensures that total_amount is always the sum of individual tax heads
UPDATE public.challan_ledger 
SET total_amount = COALESCE(cgst, 0) + COALESCE(igst, 0) + COALESCE(sgst, 0) + COALESCE(cess, 0);

-- Also ensure total_amount has a default of 0 for future inserts if not already set
ALTER TABLE public.challan_ledger 
ALTER COLUMN total_amount SET DEFAULT 0;
