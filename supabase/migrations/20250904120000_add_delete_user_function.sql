-- Create a function to safely delete user profiles
-- This function will delete a user profile and handle related data cleanup

CREATE OR REPLACE FUNCTION public.delete_user_profile(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role user_role;
BEGIN
  -- Check if the calling user is an admin
  SELECT role INTO current_user_role
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Delete attendance records first (to avoid foreign key constraints)
  DELETE FROM public.attendance WHERE user_id = target_user_id;
  
  -- Delete the profile (this will not cascade to auth.users, but that's intentional)
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  
  -- Check if deletion was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found or could not be deleted';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_profile(UUID) TO authenticated;