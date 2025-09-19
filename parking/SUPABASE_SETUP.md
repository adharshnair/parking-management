# Supabase End-to-End Setup Guide for ParkEasy

## 📋 Complete Setup Checklist

### 1. Create Supabase Account & Project

1. **Sign up at Supabase**
   - Go to [supabase.com](https://supabase.com)
   - Create a free account
   - Click "New Project"

2. **Create a New Project**
   - Organization: Choose or create one
   - Project Name: `ParkEasy` (or your preferred name)
   - Database Password: Create a strong password (save it!)
   - Region: Choose closest to your users
   - Click "Create new project"

3. **Wait for Setup**
   - Project creation takes 2-3 minutes
   - You'll see a loading screen

### 2. Get Your Project Credentials

1. **Navigate to Project Settings**
   - In your Supabase dashboard
   - Go to "Settings" → "API"

2. **Copy These Values:**
   ```
   Project URL: https://your-project-ref.supabase.co
   Anon/Public Key: eyJhbGci... (long key)
   ```

3. **Update Your .env.local File**
   ```env
   # Replace with your actual Supabase credentials
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...your-actual-anon-key
   ```

### 3. Set Up Database Schema

1. **Open SQL Editor**
   - In Supabase dashboard: "SQL Editor" → "New query"

2. **Run the Database Schema**
   - Copy the entire contents of `database-schema.sql`
   - Paste into the SQL editor
   - Click "Run" to execute

3. **Verify Tables Created**
   - Go to "Table Editor"
   - You should see tables: profiles, parking_lots, parking_slots, bookings, payments, notifications, audit_logs

### 4. Configure Authentication

1. **Enable Auth Providers**
   - Go to "Authentication" → "Providers"
   - Email is enabled by default
   - Optionally enable Google, GitHub, etc.

2. **Set Up Email Templates** (Optional)
   - Go to "Authentication" → "Email Templates"
   - Customize confirmation and reset emails

3. **Configure Redirect URLs**
   - Go to "Authentication" → "URL Configuration"
   - Add: `http://localhost:5173/auth/callback` (for development)
   - Add your production domain when deploying

### 5. Set Up Row Level Security (RLS)

The schema includes RLS policies, but verify they're active:

1. **Check RLS Status**
   - Go to "Authentication" → "Policies"
   - All tables should have policies enabled

2. **Key Policies Included:**
   - Users can only see their own data
   - Admins can see all data
   - Public can view parking lots (read-only)

### 6. Test Your Setup

1. **Restart Your Dev Server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Test Authentication**
   - Go to http://localhost:5173
   - Try registering a new account
   - Check if user appears in "Authentication" → "Users"

3. **Verify Database Connection**
   - Register should create a profile in the `profiles` table
   - Check "Table Editor" → "profiles"

### 7. Create Sample Data (Optional)

Run this in SQL Editor to create test parking lots:

```sql
-- Insert sample parking lots
INSERT INTO parking_lots (name, description, address, city, state, zip_code, latitude, longitude, total_spots, hourly_rate, daily_rate)
VALUES 
('Downtown Plaza', 'Premium parking in the heart of downtown', '123 Main St', 'San Francisco', 'CA', '94105', 37.7749, -122.4194, 100, 5.00, 25.00),
('Airport Long-term', 'Convenient long-term parking near the airport', '456 Airport Blvd', 'San Francisco', 'CA', '94128', 37.6213, -122.3790, 500, 3.00, 15.00),
('Shopping Center', 'Free parking for shoppers', '789 Mall Way', 'San Francisco', 'CA', '94102', 37.7849, -122.4094, 200, 0.00, 0.00);

-- Insert sample parking slots for the first lot
INSERT INTO parking_slots (parking_lot_id, slot_number, vehicle_type, is_available)
SELECT 
    (SELECT id FROM parking_lots WHERE name = 'Downtown Plaza' LIMIT 1),
    'A' || generate_series(1, 50),
    CASE WHEN random() > 0.8 THEN 'SUV' WHEN random() > 0.6 THEN 'COMPACT' ELSE 'STANDARD' END,
    CASE WHEN random() > 0.3 THEN true ELSE false END;
```

### 8. Environment Variables Checklist

Ensure your `.env.local` file has:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Add these for production
# VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (for admin operations)
# VITE_APP_URL=http://localhost:5173 (or your production URL)
```

### 9. Verify Everything Works

1. **Authentication Flow**
   - ✅ Register new user
   - ✅ Login with credentials
   - ✅ Password reset functionality
   - ✅ User profile creation

2. **Database Operations**
   - ✅ User profiles created automatically
   - ✅ Parking lots visible on homepage
   - ✅ Real-time updates working

3. **Security**
   - ✅ RLS policies preventing unauthorized access
   - ✅ Users can only see their own bookings
   - ✅ Admin users have elevated permissions

### � How to Login as Admin

There are **two ways** to get admin access:

#### Method 1: Direct Database Update (Recommended for Development)

1. **First, register a regular user account:**
   - Go to http://localhost:5173/auth/register
   - Create your admin account with your email
   - Complete the registration process

2. **Update user role in Supabase:**
   - Go to your Supabase dashboard: https://supabase.com/dashboard/project/jehqvoqbbmbclqqzeojl
   - Navigate to "Table Editor" → "profiles"
   - Find your user record (by email)
   - Edit the `role` column from `'user'` to `'admin'`
   - Save the changes

3. **Logout and login again:**
   - The app will detect your new admin role
   - You'll see admin navigation options
   - Access admin dashboard at: http://localhost:5173/admin

#### Method 2: SQL Command (Advanced)

Run this in Supabase SQL Editor to make any user an admin:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

#### Method 3: Create Admin During Registration (Code Modification)

If you want to automatically create admin users, you can modify the registration logic:

1. **Add admin email list to .env.local:**
   ```env
   # Add this to your .env.local file
   VITE_ADMIN_EMAILS=your-email@example.com,another-admin@example.com
   ```

2. **The registration logic will automatically set admin role for these emails**

### 🛡️ Admin Access Features

Once you're logged in as an admin, you'll have access to:

- **Admin Dashboard:** `/admin` - Overview of all system metrics
- **Parking Lot Management:** `/admin/parking-lots` - Create, edit, delete lots
- **User Management:** `/admin/users` - View and manage all users
- **Booking Management:** `/admin/bookings` - View and manage all bookings
- **Reports & Analytics:** `/admin/reports` - System-wide reporting
- **QR Scanner:** `/admin/qr-scanner` - Validate parking QR codes

### 📝 Verification Steps

1. **Check your current role:**
   - Login to your app
   - Check if you see "Admin Dashboard" in the navigation
   - Or check the browser developer tools console

2. **Test admin routes:**
   - Try accessing: http://localhost:5173/admin
   - You should see the admin dashboard instead of being redirected

3. **Verify in database:**
   - Check Supabase "Table Editor" → "profiles"
   - Your user record should show `role: 'admin'`

### 🚀 You're Ready!

---

**Your ParkEasy system is now ready for end-to-end testing and development!** 🎉

### 🛠️ Troubleshooting

**If you get connection errors:**
1. Double-check your environment variables
2. Ensure `.env.local` is in the root of the `parking` folder
3. Restart your dev server after changing env vars

**If authentication doesn't work:**
1. Check your redirect URLs in Supabase
2. Verify email confirmation is disabled for development
3. Check browser console for detailed errors

**If RLS errors occur:**
1. Ensure you're logged in as the correct user
2. Check if policies are properly set up
3. Verify user roles in the database

### 📞 Need Help?

- Supabase Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- GitHub Issues: Create an issue in your repo

---

**Your ParkEasy system is now ready for end-to-end testing and development!** 🎉
