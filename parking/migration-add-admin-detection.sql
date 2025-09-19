-- Migration Script: Add Admin Auto-Detection Functionality
-- Run this in your Supabase SQL Editor to update existing database

-- 1. First, add the new admin detection function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT := 'user';
  admin_emails TEXT[] := ARRAY['admin@parkeasy.com', 'rahul.kumar@fexbox.org']; -- Add your admin emails here
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

-- 2. Drop existing trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Create the new trigger for auto admin detection
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Update admin_emails array with your actual admin emails
-- IMPORTANT: Replace the emails below with your actual admin email addresses
-- You can add multiple emails separated by commas

-- Example: To add your email as admin, update the function:
/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT := 'user';
  admin_emails TEXT[] := ARRAY[
    'your-email@example.com',
    'another-admin@example.com',
    'admin@parkeasy.com'
  ]; -- Add your admin emails here
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
*/

-- 5. Optional: If you want to promote an existing user to admin
-- Uncomment and modify the email below:
/*
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
*/

-- 6. Verify the migration worked
SELECT 'Migration completed successfully! Check the results below:' as status;

-- Check if the function exists
SELECT 'handle_new_user function created' as function_status
WHERE EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'handle_new_user'
);

-- Check if the trigger exists  
SELECT 'on_auth_user_created trigger created' as trigger_status
WHERE EXISTS (
  SELECT 1 FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created'
);

-- Show current admin users
SELECT 'Current admin users:' as admin_list;
SELECT email, role, created_at 
FROM public.profiles 
WHERE role = 'admin';
