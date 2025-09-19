-- Create individual parking slots for existing parking lots
-- This script generates slots for parking lots that have total_slots > 0 but no actual slots

DO $$
DECLARE
    lot_record RECORD;
    slot_count INTEGER;
    i INTEGER;
BEGIN
    -- Loop through parking lots that have total_slots but no slots created
    FOR lot_record IN 
        SELECT id, name, total_slots, hourly_rate
        FROM public.parking_lots 
        WHERE total_slots > 0 
        AND id NOT IN (
            SELECT DISTINCT parking_lot_id 
            FROM public.parking_slots 
            WHERE parking_lot_id IS NOT NULL
        )
    LOOP
        slot_count := lot_record.total_slots;
        
        -- Create two-wheeler slots (40% of total)
        FOR i IN 1..CEIL(slot_count * 0.4) LOOP
            INSERT INTO public.parking_slots (
                parking_lot_id,
                slot_number,
                slot_type,
                status,
                hourly_rate,
                floor_level
            ) VALUES (
                lot_record.id,
                'TW-' || LPAD(i::text, 2, '0'),
                'two-wheeler',
                'available',
                COALESCE(lot_record.hourly_rate * 0.6, 10.00), -- 60% of lot rate for two-wheelers
                1
            );
        END LOOP;
        
        -- Create four-wheeler slots (60% of total)
        FOR i IN 1..(slot_count - CEIL(slot_count * 0.4)) LOOP
            INSERT INTO public.parking_slots (
                parking_lot_id,
                slot_number,
                slot_type,
                status,
                hourly_rate,
                floor_level
            ) VALUES (
                lot_record.id,
                'FW-' || LPAD(i::text, 2, '0'),
                'four-wheeler',
                'available',
                COALESCE(lot_record.hourly_rate, 15.00), -- Full rate for four-wheelers
                1
            );
        END LOOP;
        
        RAISE NOTICE 'Created % slots for parking lot: %', slot_count, lot_record.name;
    END LOOP;
END $$;

-- Verify the slots were created
SELECT 
    pl.name as parking_lot_name,
    pl.total_slots,
    COUNT(ps.id) as created_slots,
    COUNT(CASE WHEN ps.slot_type = 'two_wheeler' THEN 1 END) as two_wheeler_slots,
    COUNT(CASE WHEN ps.slot_type = 'four_wheeler' THEN 1 END) as four_wheeler_slots
FROM public.parking_lots pl
LEFT JOIN public.parking_slots ps ON pl.id = ps.parking_lot_id
WHERE pl.total_slots > 0
GROUP BY pl.id, pl.name, pl.total_slots
ORDER BY pl.name;
