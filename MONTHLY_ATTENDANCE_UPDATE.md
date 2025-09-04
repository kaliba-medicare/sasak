# Monthly Attendance Logic Update

## Problem
The monthly attendance report was not correctly counting "late" status employees as "present" (hadir). Previously:
- "Present" only counted employees with exact "present" status
- "Late" employees were counted separately but not included in total attendance

## Solution Implemented
Updated the monthly attendance calculation logic to:
- Count both "present" and "late" status as "hadir" (attended)
- Keep separate tracking of late arrivals
- Update UI labels and descriptions to clarify this logic

## Changes Made

### 1. Calculation Logic Update
**File**: `/src/pages/admin/MonthlyAttendancePage.tsx`

**Before**:
```typescript
const presentDays = workingDayAttendance.filter(a => a.status === 'present').length;
const lateDays = workingDayAttendance.filter(a => a.status === 'late').length;
const attendedDays = presentDays + lateDays;
const absentDays = totalWorkingDays - attendedDays;

present_days: presentDays, // Only counted 'present' status
```

**After**:
```typescript
const presentDays = workingDayAttendance.filter(a => a.status === 'present').length;
const lateDays = workingDayAttendance.filter(a => a.status === 'late').length;
// Late employees are also considered as present (hadir) for attendance purposes
const totalPresentDays = presentDays + lateDays; 
const absentDays = totalWorkingDays - totalPresentDays;

present_days: totalPresentDays, // Now includes both 'present' and 'late' status
```

### 2. UI Updates
- **Table Header**: Changed "Hadir" to "Hadir*" with explanation
- **Statistics Card**: Updated label to "Rata-rata Hadir (Termasuk Terlambat)"
- **Excel Export**: Updated column name to "Hadir (Termasuk Terlambat)"
- **Added Legend**: Explanation note below the table
- **Header Description**: Added clarification note about the calculation

### 3. Documentation
- Added comments explaining the logic
- Added debug logging to verify calculations
- Created this documentation file

## Result
Now the monthly attendance report correctly shows:
- **Hadir**: Total attendance including both on-time and late employees
- **Terlambat**: Separate count of late arrivals (subset of Hadir)
- **Tidak Hadir**: Actual absent days
- **Percentage calculations**: Based on the corrected attendance logic

## Example
If an employee has:
- 20 working days in a month
- 15 days present on time
- 3 days late
- 2 days absent

**Previous calculation**: Hadir = 15 days (75%)
**New calculation**: Hadir = 18 days (90%), with 3 of those being late

This provides a more accurate representation of actual attendance vs. absenteeism.