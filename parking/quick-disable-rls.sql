-- Simple RLS Fix for Immediate Access
-- Run this first to stop the infinite loading

-- Temporarily disable RLS to allow access
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_lots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated users
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.parking_lots TO authenticated;
GRANT ALL ON public.parking_slots TO authenticated;
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.notifications TO authenticated;

-- Check if rahul is properly set as admin
SELECT id, email, full_name, role, created_at 
FROM public.profiles 
WHERE email LIKE '%rahul%' OR role = 'admin';
