-- Quick fix for existing parking lots with 0 available_slots
-- This will set available_slots = total_slots for parking lots that have no active bookings

UPDATE public.parking_lots 
SET available_slots = total_slots 
WHERE available_slots = 0 
AND total_slots > 0 
AND id NOT IN (
  SELECT DISTINCT parking_lot_id 
  FROM public.bookings 
  WHERE status IN ('confirmed', 'active') 
  AND parking_lot_id IS NOT NULL
);

-- Verify the update
SELECT name, total_slots, available_slots, status
FROM public.parking_lots
ORDER BY name;
