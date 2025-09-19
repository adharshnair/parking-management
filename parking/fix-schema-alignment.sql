-- Fix Database Schema Mismatches
-- Run this in Supabase SQL Editor to align schema with app

-- 1. Fix notification column name (is_read -> read)
ALTER TABLE public.notifications RENAME COLUMN is_read TO read;

-- 2. Update admin detection function with correct email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT := 'user';
  admin_emails TEXT[] := ARRAY[
    'rahul.kumar@textbox.org',
    'rahul.kumar@fexbox.org', 
    'admin@parkeasy.com'
  ];
BEGIN
  -- Check if the email is in the admin list
  IF NEW.email = ANY(admin_emails) THEN
    user_role := 'admin';
  END IF;
  
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), user_role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Make sure rahul is admin (regardless of how he was created)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email IN ('rahul.kumar@textbox.org', 'rahul.kumar@fexbox.org');

-- 4. Verify the fixes
SELECT 'Schema fixes applied successfully!' as status;

-- Check notification column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name IN ('read', 'is_read');

-- Check admin users
SELECT email, role, created_at 
FROM public.profiles 
WHERE role = 'admin' OR email LIKE '%rahul%';
