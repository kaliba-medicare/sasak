-- Add foreign key constraint from attendance.employee_id to profiles.employee_id
ALTER TABLE public.attendance
ADD CONSTRAINT attendance_employee_id_fkey
FOREIGN KEY (employee_id) REFERENCES public.profiles(employee_id)
ON DELETE CASCADE;