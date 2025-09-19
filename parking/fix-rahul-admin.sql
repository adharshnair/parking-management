-- Quick fix to make rahul.kumar@textbox.org an admin

-- Update rahul's role to admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'rahul.kumar@textbox.org';

-- Also update the admin detection function to include the correct email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT := 'user';
  admin_emails TEXT[] := ARRAY[
    'admin@parkeasy.com', 
    'rahul.kumar@textbox.org',
    'rahul.kumar@fexbox.org'
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

-- Verify the update
SELECT email, role, created_at 
FROM public.profiles 
WHERE email = 'rahul.kumar@textbox.org';
