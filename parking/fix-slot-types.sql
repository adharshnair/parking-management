-- First, check what the constraint actually expects
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'parking_slots_slot_type_check';

-- Delete existing slots that have incorrect format
DELETE FROM public.parking_slots 
WHERE slot_type IN ('two_wheeler', 'four_wheeler');

-- Now recreate them with the correct format based on what we see in the UI
-- It seems the constraint expects 'two_wheeler' and 'four_wheeler' (with underscores)
-- Let's check the actual constraint first

-- For Demo Parking lot, create the slots properly
INSERT INTO public.parking_slots (
    parking_lot_id,
    slot_number,
    slot_type,
    status,
    hourly_rate,
    floor_level
) VALUES 
-- Get the parking lot ID for Demo Parking
((SELECT id FROM public.parking_lots WHERE name = 'Demo Parking' LIMIT 1), 'FW-01', 'four_wheeler', 'available', 15.00, 1),
((SELECT id FROM public.parking_lots WHERE name = 'Demo Parking' LIMIT 1), 'TW-01', 'two_wheeler', 'available', 9.00, 1),
((SELECT id FROM public.parking_lots WHERE name = 'Demo Parking' LIMIT 1), 'TW-02', 'two_wheeler', 'available', 9.00, 1);

-- Verify the slots were created
SELECT 
    pl.name as parking_lot_name,
    ps.slot_number,
    ps.slot_type,
    ps.status,
    ps.hourly_rate
FROM public.parking_lots pl
JOIN public.parking_slots ps ON pl.id = ps.parking_lot_id
WHERE pl.name = 'Demo Parking'
ORDER BY ps.slot_number;
