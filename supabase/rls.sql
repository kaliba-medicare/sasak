-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own attendance" ON public.attendance;

-- Create policy for profiles table
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for attendance table
CREATE POLICY "Users can manage their own attendance"
ON public.attendance
FOR ALL
USING (auth.uid() = user_id);

-- For admins
-- The following policies assume you have a function is_admin(user_id uuid) which returns true if the user is an admin.
-- You may need to create this function first.

-- Example of an admin function (if you don't have one):
-- CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
-- RETURNS boolean
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- BEGIN
--   RETURN EXISTS (
--     SELECT 1
--     FROM profiles
--     WHERE profiles.user_id = is_admin.user_id AND profiles.role = 'admin'::user_role
--   );
-- END;
-- $$;

-- Policies for Admins (Uncomment and adapt if needed)

-- DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
-- CREATE POLICY "Admins can view all profiles"
-- ON public.profiles
-- FOR SELECT
-- USING (is_admin(auth.uid()));

-- DROP POLICY IF EXISTS "Admins can manage all attendance" ON public.attendance;
-- CREATE POLICY "Admins can manage all attendance"
-- ON public.attendance
-- FOR ALL
-- USING (is_admin(auth.uid()));
