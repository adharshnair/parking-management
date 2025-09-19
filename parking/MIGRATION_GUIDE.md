# Database Migration Guide: Adding Admin Auto-Detection

## 🎯 Overview

You've already run the old database schema, and now you need to add the new admin auto-detection functionality. Follow these steps to update your existing Supabase database.

## 📋 Migration Steps

### Step 1: Update Admin Email List

1. **Open the migration file:** `migration-add-admin-detection.sql`
2. **Edit the admin_emails array** (line 6):
   ```sql
   admin_emails TEXT[] := ARRAY['your-email@example.com', 'admin@parkeasy.com'];
   ```
3. **Replace with your actual admin email(s)**

### Step 2: Run the Migration

1. **Go to your Supabase dashboard:**
   - URL: https://supabase.com/dashboard/project/jehqvoqbbmbclqqzeojl
   
2. **Open SQL Editor:**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste the migration SQL:**
   - Copy the entire contents of `migration-add-admin-detection.sql`
   - Paste into the SQL editor
   - **Before running:** Update the admin emails in the script

4. **Execute the migration:**
   - Click "Run" to execute the SQL
   - Check for success messages

### Step 3: Verify Migration Success

After running the migration, you should see:
- ✅ "Migration completed successfully!"
- ✅ "handle_new_user function created"  
- ✅ "on_auth_user_created trigger created"
- ✅ List of current admin users

### Step 4: Test Admin Account Creation

1. **Register a new account** with one of your admin emails:
   - Go to: http://localhost:5173/auth/register
   - Use the email you added to the admin list
   - Complete registration

2. **Verify admin role assigned:**
   - Check Supabase "Table Editor" → "profiles"
   - Your new user should have `role: 'admin'`

3. **Login and test admin access:**
   - Login with your new admin account
   - You should see admin navigation options
   - Try accessing: http://localhost:5173/admin

## 🔧 Alternative: Manual Admin Promotion

If you prefer to manually promote existing users to admin:

1. **In Supabase SQL Editor, run:**
   ```sql
   UPDATE public.profiles 
   SET role = 'admin' 
   WHERE email = 'your-existing-email@example.com';
   ```

2. **Or use the Table Editor:**
   - Go to "Table Editor" → "profiles"
   - Find your user record
   - Edit the `role` column from `'user'` to `'admin'`

## 🎉 Result

After the migration:

- ✅ **Existing database preserved** (no data loss)
- ✅ **New admin auto-detection** functionality added
- ✅ **Future registrations** with admin emails get admin role automatically
- ✅ **Existing functionality** remains unchanged

## 🛠️ Troubleshooting

**If migration fails:**
1. Check for syntax errors in the admin email list
2. Ensure you have proper permissions in Supabase
3. Try running each section of the migration separately

**If auto-admin doesn't work:**
1. Verify the trigger was created (check migration output)
2. Test with a fresh email not already in the database
3. Check browser console for any authentication errors

**Need to add more admin emails later?**
Just re-run the function creation part of the migration with updated emails.

---

**Your database is now ready for automatic admin account creation!** 🚀
