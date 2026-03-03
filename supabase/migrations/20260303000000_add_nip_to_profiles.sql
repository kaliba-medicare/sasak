-- Add nip column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nip TEXT;

-- Update handle_new_user function to include nip and handle admin role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, employee_id, position, department, role, nip)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Unknown User'),
    'EMP' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0'),
    COALESCE(NEW.raw_user_meta_data ->> 'position', 'Employee'),
    COALESCE(NEW.raw_user_meta_data ->> 'department', 'General'),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'employee'),
    NEW.raw_user_meta_data ->> 'nip'
  );
  RETURN NEW;
END;
$$;
