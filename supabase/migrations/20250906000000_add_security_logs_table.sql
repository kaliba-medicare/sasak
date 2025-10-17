-- Create security log table for tracking suspicious activities
CREATE TABLE public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT,
  ip_address TEXT,
  gps_location_lat DECIMAL(10, 8),
  gps_location_lng DECIMAL(11, 8),
  ip_location_lat DECIMAL(10, 8),
  ip_location_lng DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security_logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for security_logs
CREATE POLICY "Admins can view security logs" 
ON public.security_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  )
);

-- Grant permissions
GRANT ALL ON public.security_logs TO authenticated;