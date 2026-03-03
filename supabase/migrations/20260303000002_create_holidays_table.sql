-- Create the holidays table
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date DATE NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read holidays
CREATE POLICY "Authenticated users can read holidays" 
ON public.holidays 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow only admins to insert, update, or delete holidays
CREATE POLICY "Admins can insert holidays" 
ON public.holidays 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update holidays" 
ON public.holidays 
FOR UPDATE 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete holidays" 
ON public.holidays 
FOR DELETE 
USING (public.is_admin(auth.uid()));
