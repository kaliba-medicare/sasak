-- Execute this SQL manually in your Supabase SQL Editor
-- This will add the missing foreign key constraint

-- Add foreign key constraint from attendance.employee_id to profiles.employee_id
ALTER TABLE public.attendance
ADD CONSTRAINT attendance_employee_id_fkey
FOREIGN KEY (employee_id) REFERENCES public.profiles(employee_id)
ON DELETE CASCADE;

-- Verify the constraint was added
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table,
  a.attname as column_name,
  af.attname as referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = ANY(c.confkey)
WHERE c.contype = 'f' 
  AND conrelid::regclass::text = 'attendance'
  AND conname = 'attendance_employee_id_fkey';