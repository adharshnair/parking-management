-- Simple fix for QR Code Index Issue
-- Remove the problematic index that's causing the "index row requires 12888 bytes" error

-- Step 1: Drop the problematic index on qr_code
DROP INDEX IF EXISTS idx_bookings_qr_code;

-- Step 2: Remove the UNIQUE constraint on qr_code if it exists
-- (We'll handle uniqueness at the application level instead)
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_qr_code_key;

-- Step 3: Create a simpler approach - use booking_reference for unique identification
-- Make sure booking_reference has a proper index for lookups
CREATE INDEX IF NOT EXISTS idx_bookings_booking_reference ON public.bookings(booking_reference);

-- Step 4: Add a partial index on qr_code for non-null values only (much more efficient)
-- This will help with lookups while avoiding the size issue
CREATE INDEX IF NOT EXISTS idx_bookings_qr_code_partial 
ON public.bookings(qr_code) 
WHERE qr_code IS NOT NULL AND length(qr_code) < 1000;

-- Note: The partial index only includes QR codes that are shorter than 1000 characters
-- This should handle text-based QR codes but exclude large data URLs
