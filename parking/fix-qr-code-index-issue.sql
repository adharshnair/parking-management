-- Fix QR Code Index Issue
-- The problem: QR code data URLs are too large for B-tree indexes (>8191 bytes limit)
-- Solution: Use a hash-based approach for indexing while keeping full QR code

-- Step 1: Drop the problematic index
DROP INDEX IF EXISTS idx_bookings_qr_code;

-- Step 2: Add a new column for QR code hash (for fast lookups)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS qr_code_hash TEXT;

-- Step 3: Create index on the hash instead (much smaller)
CREATE INDEX IF NOT EXISTS idx_bookings_qr_code_hash ON public.bookings(qr_code_hash);

-- Step 4: Create a function to generate consistent hash
CREATE OR REPLACE FUNCTION generate_qr_hash(qr_data TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Use MD5 hash for consistent, short identifier
  RETURN MD5(qr_data);
END;
$$ LANGUAGE plpgsql;

-- Step 5: Update existing records with QR code hashes
UPDATE public.bookings 
SET qr_code_hash = generate_qr_hash(COALESCE(qr_code, ''))
WHERE qr_code_hash IS NULL AND qr_code IS NOT NULL;

-- Step 6: Create a trigger to automatically generate hash on insert/update
CREATE OR REPLACE FUNCTION update_qr_code_hash()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NOT NULL THEN
    NEW.qr_code_hash = generate_qr_hash(NEW.qr_code);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_qr_code_hash ON public.bookings;

-- Create the trigger
CREATE TRIGGER trigger_update_qr_code_hash
  BEFORE INSERT OR UPDATE OF qr_code ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_qr_code_hash();

-- Step 7: Add a unique constraint on the hash for uniqueness checking
ALTER TABLE public.bookings ADD CONSTRAINT unique_qr_code_hash UNIQUE (qr_code_hash);
