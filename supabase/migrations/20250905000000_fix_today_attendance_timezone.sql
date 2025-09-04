-- Fix timezone issue for today's attendance function
-- Drop the old function and create new one with proper WITA timezone
DROP FUNCTION IF EXISTS get_today_attendance();

-- Create function to get today's attendance with employee details using Asia/Makassar timezone
CREATE OR REPLACE FUNCTION get_today_attendance()
RETURNS TABLE (
  id UUID,
  employee_id TEXT,
  date DATE,
  status TEXT,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  location_lat FLOAT8,
  location_lng FLOAT8,
  name TEXT,
  department TEXT,
  position TEXT
)
LANGUAGE SQL
STABLE
AS $$
  -- Uses efficient JOIN instead of N+1 queries
  -- Uses Asia/Makassar timezone for proper WITA date filtering
  SELECT 
    a.id,
    a.employee_id,
    a.date,
    a.status,
    a.check_in_time,
    a.check_out_time,
    a.location_lat,
    a.location_lng,
    p.name,
    p.department,
    p.position
  FROM attendance a
  JOIN profiles p ON a.employee_id = p.employee_id
  WHERE a.date = (NOW() AT TIME ZONE 'Asia/Makassar')::DATE
  ORDER BY a.check_in_time DESC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_today_attendance() TO authenticated;