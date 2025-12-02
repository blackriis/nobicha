-- Fix: Remove conflicting trigger that causes "Database error creating new user"
--
-- Problem: The handle_new_user() trigger tries to INSERT into public.users
-- but conflicts with the API route which also inserts into public.users.
-- The trigger also doesn't bypass RLS policies.
--
-- Solution: Drop the trigger since the API route handles user creation manually

-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Optional: Keep the function but modify it to be idempotent (INSERT ... ON CONFLICT DO NOTHING)
-- This allows it to work alongside API inserts without errors
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if not already exists (prevents conflicts with API route)
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'employee')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Note: Trigger is dropped, so function won't run unless you recreate the trigger
-- To recreate trigger later (if needed):
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user();
