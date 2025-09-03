-- Create role enum
CREATE TYPE public.user_role AS ENUM ('admin', 'employee');

-- Add role column to profiles table
ALTER TABLE public.profiles ADD COLUMN role public.user_role NOT NULL DEFAULT 'employee';

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 AND profiles.role = 'admin'
  );
$$;

-- Create admin policies for profiles table
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));

-- Create admin policies for attendance table  
CREATE POLICY "Admins can view all attendance" 
ON public.attendance 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert all attendance" 
ON public.attendance 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all attendance" 
ON public.attendance 
FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all attendance" 
ON public.attendance 
FOR DELETE 
TO authenticated
USING (public.is_admin(auth.uid()));

-- Update handle_new_user function to handle admin role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, employee_id, position, department, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Unknown User'),
    'EMP' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0'),
    COALESCE(NEW.raw_user_meta_data ->> 'position', 'Employee'),
    COALESCE(NEW.raw_user_meta_data ->> 'department', 'General'),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'employee')
  );
  RETURN NEW;
END;
$$;