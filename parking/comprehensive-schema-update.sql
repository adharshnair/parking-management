-- Comprehensive Schema Update for Parking Management System
-- Run this in Supabase SQL Editor to add all missing columns and tables

-- 1. Add missing columns to parking_lots table
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS features TEXT[];
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS security_features TEXT[];

-- 2. Add missing columns to profiles table  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preference_settings JSONB DEFAULT '{}';

-- 3. Create user_vehicles table (referenced in ProfilePage)
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

-- 4. Create user_preferences table (referenced in NotificationsPage)
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

-- 5. Fix notifications table - ensure proper column names
ALTER TABLE public.notifications RENAME COLUMN is_read TO read;
-- If the above fails (column already renamed), ignore the error
DO $$ 
BEGIN
    ALTER TABLE public.notifications RENAME COLUMN is_read TO read;
EXCEPTION 
    WHEN undefined_column THEN 
        -- Column might already be renamed, continue
        NULL;
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

-- 9. Create reviews table (if needed for future features)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  parking_lot_id UUID REFERENCES public.parking_lots(id),
  booking_id UUID REFERENCES public.bookings(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create parking_lot_amenities table (for better amenity management)
CREATE TABLE IF NOT EXISTS public.parking_lot_amenities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parking_lot_id UUID REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  amenity_name TEXT NOT NULL,
  amenity_description TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_vehicles_user_id ON public.user_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_reviews_parking_lot_id ON public.reviews(parking_lot_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- 12. Add triggers for new tables
CREATE TRIGGER update_user_vehicles_updated_at 
  BEFORE UPDATE ON public.user_vehicles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON public.user_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Fix notification service - update is_read references to read
-- This ensures the notification service works with the correct column name

-- 14. Enable RLS for new tables
ALTER TABLE public.user_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_lot_amenities ENABLE ROW LEVEL SECURITY;

-- 15. Create RLS policies for new tables
-- User vehicles policies
CREATE POLICY "Users can manage their own vehicles" ON public.user_vehicles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vehicles" ON public.user_vehicles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- User preferences policies  
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Users can manage their own reviews" ON public.reviews
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read reviews" ON public.reviews
  FOR SELECT USING (TRUE);

-- Parking lot amenities policies
CREATE POLICY "Anyone can read amenities" ON public.parking_lot_amenities
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage amenities" ON public.parking_lot_amenities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 16. Verify schema updates
SELECT 'Schema update completed successfully!' as status;

-- Check parking_lots has description column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'parking_lots' 
AND column_name = 'description';

-- Check notifications has read column (not is_read)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name IN ('read', 'is_read');

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_vehicles', 'user_preferences', 'reviews');

-- Show current admin users
SELECT email, role, created_at 
FROM public.profiles 
WHERE role = 'admin';
