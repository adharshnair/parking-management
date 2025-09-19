-- Safe Incremental Schema Update
-- This script accounts for changes already made and only adds what's missing

-- 1. Add missing columns to parking_lots table (this is the main fix needed)
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS features TEXT[];
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS security_features TEXT[];

-- 2. Add missing columns to profiles table  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preference_settings JSONB DEFAULT '{}';

-- 3. Create user_vehicles table (safe with IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.user_vehicles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('two_wheeler', 'four_wheeler')),
  vehicle_model TEXT,
  vehicle_color TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, vehicle_number)
);

-- 4. Create user_preferences table (safe with IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  booking_reminders BOOLEAN DEFAULT TRUE,
  promotional_emails BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 5. Safe column rename for notifications (with error handling)
DO $$ 
BEGIN
    -- Check if is_read exists and read doesn't exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'is_read'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'read'
    ) THEN
        ALTER TABLE public.notifications RENAME COLUMN is_read TO read;
        RAISE NOTICE 'Renamed is_read to read in notifications table';
    ELSE
        RAISE NOTICE 'Column rename not needed - read column already exists or is_read does not exist';
    END IF;
EXCEPTION 
    WHEN OTHERS THEN 
        RAISE NOTICE 'Column rename failed or not needed: %', SQLERRM;
END $$;

-- 6. Add missing columns to notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high'));
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 7. Add missing columns to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS extended_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS penalty_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS notes TEXT;

-- 8. Add missing columns to parking_slots table
ALTER TABLE public.parking_slots ADD COLUMN IF NOT EXISTS length DECIMAL(5, 2);
ALTER TABLE public.parking_slots ADD COLUMN IF NOT EXISTS width DECIMAL(5, 2);
ALTER TABLE public.parking_slots ADD COLUMN IF NOT EXISTS is_covered BOOLEAN DEFAULT FALSE;
ALTER TABLE public.parking_slots ADD COLUMN IF NOT EXISTS has_charging BOOLEAN DEFAULT FALSE;

-- 9. Create additional tables (safe with IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  parking_lot_id UUID REFERENCES public.parking_lots(id),
  booking_id UUID REFERENCES public.bookings(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Add indexes (safe with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_user_vehicles_user_id ON public.user_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_reviews_parking_lot_id ON public.reviews(parking_lot_id);

-- 11. Add triggers for new tables (safe with IF NOT EXISTS check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_vehicles_updated_at'
    ) THEN
        CREATE TRIGGER update_user_vehicles_updated_at 
          BEFORE UPDATE ON public.user_vehicles 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_preferences_updated_at'
    ) THEN
        CREATE TRIGGER update_user_preferences_updated_at 
          BEFORE UPDATE ON public.user_preferences 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 12. Grant permissions (since RLS is disabled, ensure full access)
GRANT ALL ON public.user_vehicles TO authenticated;
GRANT ALL ON public.user_preferences TO authenticated;
GRANT ALL ON public.reviews TO authenticated;

-- 13. Verify the most important fix
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'parking_lots' AND column_name = 'description'
        ) 
        THEN 'SUCCESS: description column added to parking_lots'
        ELSE 'FAILED: description column missing from parking_lots'
    END as description_status;

-- 14. Show current status
SELECT 'Safe incremental update completed!' as status;

-- Show admin users
SELECT email, role, full_name 
FROM public.profiles 
WHERE role = 'admin';

-- Show new tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_vehicles', 'user_preferences', 'reviews')
ORDER BY table_name;
