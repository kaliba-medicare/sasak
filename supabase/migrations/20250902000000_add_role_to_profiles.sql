-- Create a user_role type
CREATE TYPE public.user_role AS ENUM ('admin', 'employee');

-- Add role to profiles table
ALTER TABLE public.profiles
ADD COLUMN role user_role NOT NULL DEFAULT 'employee';

-- Allow admins to do anything on profiles
CREATE POLICY "Admins can do anything on profiles"
ON public.profiles
FOR ALL
USING ((
  SELECT auth.jwt() ->> 'role'
) = 'service_role' OR (
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'user')
) = 'admin');

-- Allow admins to do anything on attendance
CREATE POLICY "Admins can do anything on attendance"
ON public.attendance
FOR ALL
USING ((
  SELECT auth.jwt() ->> 'role'
) = 'service_role' OR (
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'user')
) = 'admin');
