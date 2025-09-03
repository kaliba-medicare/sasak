/**
 * Database Schema Documentation
 * 
 * This file documents the current database schema and its alignment with TypeScript types.
 * 
 * PROFILES TABLE:
 * ===============
 * - id: UUID (PK, auto-generated)
 * - user_id: UUID (FK → auth.users.id, UNIQUE, CASCADE DELETE)
 * - name: TEXT (NOT NULL)
 * - employee_id: TEXT (NOT NULL, UNIQUE)
 * - position: TEXT (NOT NULL)
 * - department: TEXT (NOT NULL)
 * - role: user_role ENUM (DEFAULT 'employee')
 * - created_at: TIMESTAMPTZ (AUTO)
 * - updated_at: TIMESTAMPTZ (AUTO with trigger)
 * 
 * ATTENDANCE TABLE:
 * ================
 * - id: UUID (PK, auto-generated)
 * - user_id: UUID (FK → auth.users.id, CASCADE DELETE)
 * - employee_id: TEXT (FK → profiles.employee_id, CASCADE DELETE)
 * - check_in_time: TIMESTAMPTZ (NULLABLE)
 * - check_out_time: TIMESTAMPTZ (NULLABLE)
 * - location_lat: NUMERIC(10,8) (NULLABLE)
 * - location_lng: NUMERIC(11,8) (NULLABLE)
 * - status: TEXT (CONSTRAINED to 'present'|'late'|'absent')
 * - date: DATE (DEFAULT CURRENT_DATE)
 * - created_at: TIMESTAMPTZ (AUTO)
 * - updated_at: TIMESTAMPTZ (AUTO with trigger)
 * 
 * ENUMS:
 * ======
 * - user_role: 'admin' | 'employee'
 * 
 * RELATIONSHIPS:
 * =============
 * 1. profiles.user_id → auth.users.id (1:1)
 * 2. attendance.user_id → auth.users.id (1:many)
 * 3. attendance.employee_id → profiles.employee_id (many:1)
 * 
 * CONSTRAINTS:
 * ===========
 * - profiles.employee_id: UNIQUE
 * - profiles.user_id: UNIQUE
 * - attendance.status: CHECK constraint for valid values
 * 
 * TRIGGERS:
 * =========
 * - update_profiles_updated_at: Auto-update timestamp on profile changes
 * - update_attendance_updated_at: Auto-update timestamp on attendance changes
 */