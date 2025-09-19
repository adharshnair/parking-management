-- -- =============================================================================
-- SECTION 1: PARKING LOTS TABLE ENHANCEMENTS
-- =============================================================================

-- Fix hourly_rate NOT NULL constraint issue
ALTER TABLE public.parking_lots ALTER COLUMN hourly_rate DROP NOT NULL;
ALTER TABLE public.parking_lots ALTER COLUMN hourly_rate SET DEFAULT 0.00;

-- Fix available_slots default to match total_slots for new parking lots
-- Update existing parking lots where available_slots is 0 but total_slots > 0 (no bookings scenario)
UPDATE public.parking_lots 
SET available_slots = total_slots 
WHERE available_slots = 0 AND total_slots > 0 
AND id NOT IN (
  SELECT DISTINCT parking_lot_id 
  FROM public.bookings 
  WHERE status IN ('confirmed', 'active')
);

-- Add missing columns that the admin parking lots page expects
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS security_features TEXT[] DEFAULT '{}';sive Schema Update for Parking Management System
-- This addresses all schema-related issues found in the codebase analysis

-- =============================================================================
-- SECTION 1: PARKING LOTS TABLE ENHANCEMENTS
-- =============================================================================

-- Fix hourly_rate NOT NULL constraint issue
ALTER TABLE public.parking_lots ALTER COLUMN hourly_rate DROP NOT NULL;
ALTER TABLE public.parking_lots ALTER COLUMN hourly_rate SET DEFAULT 0.00;

-- Add missing columns that the admin parking lots page expects
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS security_features TEXT[] DEFAULT '{}';

-- Add missing columns for enhanced functionality
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE public.parking_lots ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;

-- =============================================================================
-- SECTION 2: PARKING SLOTS TABLE ENHANCEMENTS
-- =============================================================================

-- Add missing columns for slot details that the app might need
ALTER TABLE public.parking_slots ADD COLUMN IF NOT EXISTS length DECIMAL(5, 2);
ALTER TABLE public.parking_slots ADD COLUMN IF NOT EXISTS width DECIMAL(5, 2);
ALTER TABLE public.parking_slots ADD COLUMN IF NOT EXISTS height DECIMAL(5, 2);
ALTER TABLE public.parking_slots ADD COLUMN IF NOT EXISTS is_covered BOOLEAN DEFAULT FALSE;
ALTER TABLE public.parking_slots ADD COLUMN IF NOT EXISTS has_charging BOOLEAN DEFAULT FALSE;
ALTER TABLE public.parking_slots ADD COLUMN IF NOT EXISTS accessibility_features TEXT[];
ALTER TABLE public.parking_slots ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- =============================================================================
-- SECTION 3: PROFILES TABLE ENHANCEMENTS
-- =============================================================================

-- Add columns that might be referenced in user management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preference_settings JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- =============================================================================
-- SECTION 4: BOOKINGS TABLE ENHANCEMENTS
-- =============================================================================

-- Add columns that booking services might expect
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS extended_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS penalty_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS review_comment TEXT;

-- =============================================================================
-- SECTION 5: NOTIFICATIONS TABLE ENHANCEMENTS
-- =============================================================================

-- Fix the is_read/read column issue
DO $$ 
BEGIN
    -- Check if is_read exists and read doesn't exist, then rename
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

-- Add missing notification columns
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high'));
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- =============================================================================
-- SECTION 6: NEW TABLES THAT MIGHT BE REFERENCED
-- =============================================================================

-- User vehicles table (referenced in user profile management)
CREATE TABLE IF NOT EXISTS public.user_vehicles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('two_wheeler', 'four_wheeler', 'bicycle', 'motorcycle')),
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  vehicle_year INTEGER,
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  insurance_expiry DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, vehicle_number)
);

-- User preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_vehicle_type TEXT DEFAULT 'four_wheeler',
  default_booking_duration INTEGER DEFAULT 2, -- hours
  auto_extend_booking BOOLEAN DEFAULT FALSE,
  favorite_locations UUID[],
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  booking_reminders BOOLEAN DEFAULT TRUE,
  promotional_emails BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Reviews table for parking lot feedback
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  parking_lot_id UUID REFERENCES public.parking_lots(id),
  booking_id UUID REFERENCES public.bookings(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  helpful_votes INTEGER DEFAULT 0,
  reported_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, booking_id)
);

-- Favorite parking lots table
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  parking_lot_id UUID REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, parking_lot_id)
);

-- Parking lot amenities/features lookup table
CREATE TABLE IF NOT EXISTS public.amenities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_name TEXT,
  category TEXT CHECK (category IN ('security', 'convenience', 'accessibility', 'services')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets table for user issues
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  booking_id UUID REFERENCES public.bookings(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('booking', 'payment', 'technical', 'feedback', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES public.profiles(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- SECTION 7: INDEXES FOR PERFORMANCE
-- =============================================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parking_lots_city ON public.parking_lots(city);
CREATE INDEX IF NOT EXISTS idx_parking_lots_status ON public.parking_lots(status);
CREATE INDEX IF NOT EXISTS idx_parking_lots_location ON public.parking_lots(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_parking_slots_lot_type ON public.parking_slots(parking_lot_id, slot_type);
CREATE INDEX IF NOT EXISTS idx_parking_slots_status ON public.parking_slots(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON public.bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_lot_time ON public.bookings(parking_lot_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_user_vehicles_user_id ON public.user_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vehicles_primary ON public.user_vehicles(user_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_reviews_parking_lot_id ON public.reviews(parking_lot_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_status ON public.support_tickets(user_id, status);

-- =============================================================================
-- SECTION 8: TRIGGERS FOR UPDATED_AT COLUMNS
-- =============================================================================

-- Add triggers for new tables
DO $$
BEGIN
    -- User vehicles trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_vehicles_updated_at'
    ) THEN
        CREATE TRIGGER update_user_vehicles_updated_at 
          BEFORE UPDATE ON public.user_vehicles 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- User preferences trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_preferences_updated_at'
    ) THEN
        CREATE TRIGGER update_user_preferences_updated_at 
          BEFORE UPDATE ON public.user_preferences 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Reviews trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_reviews_updated_at'
    ) THEN
        CREATE TRIGGER update_reviews_updated_at 
          BEFORE UPDATE ON public.reviews 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Support tickets trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_support_tickets_updated_at'
    ) THEN
        CREATE TRIGGER update_support_tickets_updated_at 
          BEFORE UPDATE ON public.support_tickets 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================================================
-- SECTION 9: GRANT PERMISSIONS (Since RLS is disabled)
-- =============================================================================

-- Grant permissions to all new tables
GRANT ALL ON public.user_vehicles TO authenticated;
GRANT ALL ON public.user_preferences TO authenticated;
GRANT ALL ON public.reviews TO authenticated;
GRANT ALL ON public.user_favorites TO authenticated;
GRANT ALL ON public.amenities TO authenticated;
GRANT ALL ON public.support_tickets TO authenticated;

-- =============================================================================
-- SECTION 10: INSERT DEFAULT AMENITIES DATA
-- =============================================================================

-- Insert common amenities
INSERT INTO public.amenities (name, description, icon_name, category) VALUES
('Security Cameras', '24/7 CCTV surveillance', 'camera', 'security'),
('Security Guard', 'On-site security personnel', 'shield', 'security'),
('Covered Parking', 'Protection from weather', 'umbrella', 'convenience'),
('EV Charging', 'Electric vehicle charging stations', 'battery-charging', 'services'),
('Valet Service', 'Professional valet parking', 'user-check', 'services'),
('Restrooms', 'Clean restroom facilities', 'restroom', 'convenience'),
('Elevator Access', 'Elevator to all floors', 'move-vertical', 'accessibility'),
('Wheelchair Access', 'Wheelchair accessible', 'accessibility', 'accessibility'),
('Car Wash', 'Vehicle cleaning service', 'car-wash', 'services'),
('ATM', 'ATM machine available', 'credit-card', 'convenience'),
('WiFi', 'Free WiFi access', 'wifi', 'convenience'),
('Shopping Mall Access', 'Direct access to shopping', 'shopping-bag', 'convenience')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- SECTION 11: VERIFICATION QUERIES
-- =============================================================================

-- Verify the most critical fix for adding parking lots
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'parking_lots' AND column_name = 'description'
        ) 
        THEN 'SUCCESS: description column exists in parking_lots'
        ELSE 'FAILED: description column missing from parking_lots'
    END as description_status;

-- Show all new columns added to parking_lots
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'parking_lots' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show all new tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_vehicles', 'user_preferences', 'reviews', 'user_favorites', 'amenities', 'support_tickets')
ORDER BY table_name;

-- Show admin users to confirm access
SELECT email, role, full_name 
FROM public.profiles 
WHERE role = 'admin';

-- Final status
SELECT 'New comprehensive schema update completed successfully!' as status,
       NOW() as completed_at;
