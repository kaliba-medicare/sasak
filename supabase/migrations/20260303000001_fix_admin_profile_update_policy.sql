-- Fix RLS policies for profiles to ensure admins can update

-- Drop existing update policy if it exists to replace it
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create the correct policy that allows admins to update ANY profile
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
