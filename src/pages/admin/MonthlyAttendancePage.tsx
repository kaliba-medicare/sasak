import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, UserCheck, Search, Download, RefreshCw, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getTodayDateWITA, formatTimeWITA, formatDateWITA } from "@/lib/timezone";
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MonthlyAttendancePdfReport } from './MonthlyAttendancePdfReport';
import { useRef } from 'react';

interface MonthlyAttendanceRecord {
  id: string;
  employee_id: string;
  name: string;
  department: string;
  position?: string;
  nip?: string;
  total_days: number;
  present_days: number;
  late_days: number;
  absent_days: number;
  present_percentage: number;
  late_percentage: number;
  absent_percentage: number;
  attendance_details: Array<{
    date: string;
    status: "present" | "late" | "absent";
    check_in_time: string | null;
    check_out_time: string | null;
  }>;
}

const MonthlyAttendancePage = () => {
  const [attendanceData, setAttendanceData] = useState<MonthlyAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedYear, setSelectedYear] = useState(() => {
    const today = getTodayDateWITA();
    return parseInt(today.split('-')[0]);
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = getTodayDateWITA();
    return parseInt(today.split('-')[1]);
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [dynamicHolidays, setDynamicHolidays] = useState<any[]>([]);
  const { toast } = useToast();
  const pdfRef = useRef<HTMLDivElement>(null);

  // Generate years for selection (current year and 5 years back)
  const availableYears = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).reverse();

  useEffect(() => {
    console.log('Component mounted, fetching monthly attendance data...');
    fetchMonthlyAttendance();
    fetchDepartments();
  }, [selectedYear, selectedMonth]);

  const fetchDepartments = async () => {
    try {
      console.log('Fetching departments...');
      const { data, error } = await supabase
        .from('profiles')
        .select('department')
        .not('department', 'is', null);
      
      if (error) {
        console.error('Error fetching departments:', error);
        throw error;
      }
      
      console.log('Departments data:', data);
      const uniqueDepartments = [...new Set(data?.map(p => p.department) || [])];
      console.log('Unique departments:', uniqueDepartments);
      setDepartments(uniqueDepartments);
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const fetchMonthlyAttendance = async (isAutoRefresh = false) => {
    if (isAutoRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log('Fetching data for:', selectedYear, selectedMonth);
      
      // Fetch dynamic holidays
      const { data: dbHolidays, error: holidaysError } = await (supabase as any)
        .from('holidays')
        .select('*');
      if (holidaysError) {
        console.error('Error fetching holidays:', holidaysError);
        throw holidaysError;
      }
      const fetchedHolidays = dbHolidays || [];
      setDynamicHolidays(fetchedHolidays);

      const year = selectedYear;
      const month = selectedMonth.toString().padStart(2, '0');
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-${new Date(year, parseInt(month), 0).getDate()}`;
      
      console.log('=== MONTHLY ATTENDANCE DEBUG ===');
      console.log('Selected date:', year, month);
      console.log('Date range:', startDate, 'to', endDate);
      
      // First, get all attendance data for the month with proper deduplication
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          id,
          employee_id,
          date,
          status,
          check_in_time,
          check_out_time
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('employee_id')
        .order('date')
        .order('id', { ascending: false }); // Get latest records first for deduplication

      if (attendanceError) {
        console.error('Attendance query error:', attendanceError);
        throw attendanceError;
      }
      
      console.log('Raw attendance data count:', attendanceData?.length || 0);
      console.log('Sample attendance data:', attendanceData?.slice(0, 3));
      
      // Check for duplicate records (same employee_id + date)
      const recordKeys = attendanceData?.map(a => `${a.employee_id}-${a.date}`) || [];
      const uniqueKeys = new Set(recordKeys);
      if (recordKeys.length !== uniqueKeys.size) {
        console.warn('⚠️ DUPLICATE RECORDS DETECTED IN DATABASE!');
        const duplicates = recordKeys.filter((key, index) => recordKeys.indexOf(key) !== index);
        console.warn('Duplicate keys:', [...new Set(duplicates)]);
        
        // Find actual duplicate records
        const duplicateRecords = attendanceData?.filter(record => {
          const key = `${record.employee_id}-${record.date}`;
          return duplicates.includes(key);
        });
        console.warn('Duplicate records:', duplicateRecords);
      }
      
      // Get all profiles, excluding admins
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('employee_id, name, department, position, nip, role')
        .neq('role', 'admin');
      
      if (profilesError) {
        console.error('Profiles query error:', profilesError);
        throw profilesError;
      }
      
      console.log('Profiles data count:', profilesData?.length || 0);
      
      if (!profilesData || profilesData.length === 0) {
        console.warn('No profiles found');
        setAttendanceData([]);
        return;
      }
      
      // Create profiles map
      const profilesMap = new Map();
      (profilesData as any[])?.forEach((profile: any) => {
        profilesMap.set(profile.employee_id, profile);
      });
      
      // Group attendance by employee
      const attendanceByEmployee = new Map();
      
      // Remove duplicates and group by employee
      const processedRecords = new Map();
      attendanceData?.forEach(record => {
        const key = `${record.employee_id}-${record.date}`;
        
        // If we already have a record for this employee-date, keep the latest one (by ID)
        if (processedRecords.has(key)) {
          const existing = processedRecords.get(key);
          // Keep the record with the higher ID (likely the latest)
          if (record.id > existing.id) {
            console.log(`Replacing duplicate record for ${key}: ${existing.id} -> ${record.id}`);
            processedRecords.set(key, record);
          }
        } else {
          processedRecords.set(key, record);
        }
      });
      
      // Now group the deduplicated records by employee
      processedRecords.forEach(record => {
        if (!attendanceByEmployee.has(record.employee_id)) {
          attendanceByEmployee.set(record.employee_id, []);
        }
        attendanceByEmployee.get(record.employee_id).push(record);
      });
      
      console.log(`Processed records: ${processedRecords.size} unique records from ${attendanceData?.length || 0} total`);
      
      // Calculate monthly summary for each employee
      const monthlySummary: MonthlyAttendanceRecord[] = [];
      
      // Calculate working days manually using the fetched holidays
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate(); // Get last day of the month
      let totalWorkingDays = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const holidayInfo = isHolidayOrWeekend(dateString, fetchedHolidays);
        if (!holidayInfo.isHoliday) {
          totalWorkingDays++;
        }
      }
      
      console.log(`Working days in ${selectedYear}-${selectedMonth}: ${totalWorkingDays}`);
      
      (profilesData as any[])?.forEach((profile: any) => {
        const employeeAttendance = attendanceByEmployee.get(profile.employee_id) || [];
        
        console.log(`\n=== DEBUGGING EMPLOYEE ${profile.employee_id} (${profile.name}) ===`);
        console.log('Raw attendance records:', employeeAttendance);
        
        // Check for duplicate dates
        const dateCount = new Map();
        employeeAttendance.forEach(a => {
          const count = dateCount.get(a.date) || 0;
          dateCount.set(a.date, count + 1);
        });
        
        const duplicateDates = Array.from(dateCount.entries()).filter(([date, count]) => count > 1);
        if (duplicateDates.length > 0) {
          console.warn('⚠️ DUPLICATE DATES FOUND:', duplicateDates);
        }
        
        // Only count attendance on working days (exclude holidays and weekends)
        const workingDayAttendance = employeeAttendance.filter(a => {
          const holidayInfo = isHolidayOrWeekend(a.date);
          const isWorkingDay = !holidayInfo.isHoliday;
          console.log(`Date ${a.date}: isWorkingDay=${isWorkingDay}, status=${a.status}`);
          return isWorkingDay;
        });
        
        console.log('Working day attendance:', workingDayAttendance);
        
        const presentDays = workingDayAttendance.filter(a => a.status === 'present').length;
        const lateDays = workingDayAttendance.filter(a => a.status === 'late').length;
        // Late employees are also considered as present (hadir) for attendance purposes
        const totalPresentDays = presentDays + lateDays; 
        const absentDays = totalWorkingDays - totalPresentDays;
        
        // Enhanced debug log to verify calculation
        console.log(`📊 CALCULATION RESULTS:`);
        console.log(`   - Total working days: ${totalWorkingDays}`);
        console.log(`   - Present days (status='present'): ${presentDays}`);
        console.log(`   - Late days (status='late'): ${lateDays}`);
        console.log(`   - Total present days (present + late): ${totalPresentDays}`);
        console.log(`   - Absent days: ${absentDays}`);
        console.log(`   - Working day records count: ${workingDayAttendance.length}`);
        
        // Check if calculation makes sense
        if (totalPresentDays > totalWorkingDays) {
          console.error('🚨 ERROR: totalPresentDays > totalWorkingDays!');
          console.error('This indicates duplicate records or calculation error');
        }
        
        const presentPercentage = totalWorkingDays > 0 ? Math.round((totalPresentDays / totalWorkingDays) * 100) : 0;
        const latePercentage = totalWorkingDays > 0 ? Math.round((lateDays / totalWorkingDays) * 100) : 0;
        const absentPercentage = totalWorkingDays > 0 ? Math.round((absentDays / totalWorkingDays) * 100) : 0;
        
        monthlySummary.push({
          id: profile.employee_id,
          employee_id: profile.employee_id,
          name: profile.name || 'Unknown Employee',
          department: profile.department || 'Unknown Department',
          position: profile.position || 'Unknown Position',
          nip: profile.nip || '-',
          total_days: totalWorkingDays,
          present_days: totalPresentDays, // This now includes both 'present' and 'late' status
          late_days: lateDays,
          absent_days: absentDays,
          present_percentage: presentPercentage,
          late_percentage: latePercentage,
          absent_percentage: absentPercentage,
          attendance_details: employeeAttendance.map(a => ({
            date: a.date,
            status: a.status,
            check_in_time: a.check_in_time,
            check_out_time: a.check_out_time
          }))
        });
      });
      
      console.log('Monthly summary:', monthlySummary);
      setAttendanceData(monthlySummary);
      
    } catch (error: any) {
      console.error('Error fetching monthly attendance:', error);
      toast({
        title: "Error",
        description: `Failed to load monthly attendance data: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
      
      setAttendanceData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const isHolidayOrWeekend = (dateString: string, holidaysList: any[] = dynamicHolidays) => {
    try {
      // Use WITA timezone to determine day of week
      const date = new Date(dateString + 'T12:00:00'); // Noon to avoid timezone issues
      
      // Get day of week in WITA timezone
      const dayOfWeek = date.getDay();
      
      // Check if it's weekend
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { isHoliday: true, type: dayOfWeek === 0 ? 'Minggu' : 'Sabtu' };
      }
      
      // Check dynamic custom holidays
      const customHoliday = holidaysList.find(h => h.date === dateString);
      if (customHoliday) {
        return { isHoliday: true, type: customHoliday.name };
      }

      return { isHoliday: false, type: null };
    } catch (error) {
      console.error('Error checking holiday/weekend for date:', dateString, error);
      return { isHoliday: false, type: null };
    }
  };

  // Remove old getIndonesianHolidays and getWorkingDaysInMonth here since we use dynamic db query.

  const handleRefresh = () => {
    fetchMonthlyAttendance();
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(parseInt(year));
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(parseInt(month));
  };

  const toggleRowExpansion = (employeeId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(employeeId)) {
      newExpandedRows.delete(employeeId);
    } else {
      newExpandedRows.add(employeeId);
    }
    setExpandedRows(newExpandedRows);
  };

  const exportToExcel = () => {
    const year = selectedYear;
    const month = selectedMonth.toString().padStart(2, '0');
    const monthName = new Date(year, parseInt(month) - 1).toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long' 
    });
    
    // Create comprehensive export data with daily attendance details
    const exportData: any[] = [];
    
    filteredAttendance.forEach(item => {
      // Add employee summary row
      exportData.push({
        'ID Pegawai': item.employee_id,
        'NIP': item.nip || '-',
        'Nama': item.name,
        'Bidang': item.department,
        'Jabatan': item.position || '-',
        'Total Hari Kerja': item.total_days,
        'Hadir (Termasuk Terlambat)': item.present_days,
        'Terlambat': item.late_days,
        'Tidak Hadir': item.absent_days,
        'Persentase Hadir': `${item.present_percentage}%`,
        'Persentase Terlambat': `${item.late_percentage}%`,
        'Persentase Tidak Hadir': `${item.absent_percentage}%`,
        'Tanggal': '',
        'Status': '',
        'Waktu Masuk': '',
        'Waktu Keluar': ''
      });
      
      // Add daily attendance details for each employee
      // Create attendance map for quick lookup
      const attendanceMap = new Map();
      item.attendance_details.forEach(detail => {
        attendanceMap.set(detail.date, detail);
      });
      
      // Generate all days of the month
      const daysInMonth = new Date(year, parseInt(month), 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${year}-${month}-${String(day).padStart(2, '0')}`;
        const date = new Date(dateString + 'T12:00:00'); // Noon to avoid timezone issues
        const holidayInfo = isHolidayOrWeekend(dateString);
        const attendance = attendanceMap.get(dateString);
        
        let status = '';
        let checkInTime = '';
        let checkOutTime = '';
        
        if (holidayInfo.isHoliday) {
          status = holidayInfo.type === 'Minggu' || holidayInfo.type === 'Sabtu' ? 'Weekend' : 'Libur';
        } else if (attendance) {
          status = getStatusText(attendance.status);
          checkInTime = attendance.check_in_time ? formatTimeWITA(attendance.check_in_time) : '-';
          checkOutTime = attendance.check_out_time ? formatTimeWITA(attendance.check_out_time) : '-';
        } else {
          status = 'Tidak Hadir';
        }
        
        exportData.push({
          'ID Pegawai': '',
          'NIP': '',
          'Nama': '',
          'Bidang': '',
          'Jabatan': '',
          'Total Hari Kerja': '',
          'Hadir (Termasuk Terlambat)': '',
          'Terlambat': '',
          'Tidak Hadir': '',
          'Persentase Hadir': '',
          'Persentase Terlambat': '',
          'Persentase Tidak Hadir': '',
          'Tanggal': dateString,
          'Status': status,
          'Waktu Masuk': checkInTime,
          'Waktu Keluar': checkOutTime
        });
      }
      
      // Add empty row as separator
      exportData.push({
        'ID Pegawai': '',
        'NIP': '',
        'Nama': '',
        'Bidang': '',
        'Jabatan': '',
        'Total Hari Kerja': '',
        'Hadir (Termasuk Terlambat)': '',
        'Terlambat': '',
        'Tidak Hadir': '',
        'Persentase Hadir': '',
        'Persentase Terlambat': '',
        'Persentase Tidak Hadir': '',
        'Tanggal': '',
        'Status': '',
        'Waktu Masuk': '',
        'Waktu Keluar': ''
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Bulanan_Detail');
    XLSX.writeFile(wb, `Rekap_Absensi_Detail_${monthName.replace(/\s/g, '_')}.xlsx`);

    toast({
      title: "Berhasil",
      description: "Data rekap bulanan lengkap berhasil diekspor ke Excel",
    });
  };

  const exportToPdf = async () => {
    if (!pdfRef.current) return;
    try {
      setLoading(true);
      
      const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' for landscape
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const sections = pdfRef.current.querySelectorAll('.print-container');
      
      if (sections.length === 0) {
        toast({
          title: "Peringatan",
          description: "Tidak ada data untuk diekspor",
          variant: "destructive"
        });
        return;
      }
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;
        
        // Clone the section and append to body to ensure it's rendered properly before capture
        const clone = section.cloneNode(true) as HTMLElement;
        clone.style.position = 'fixed';
        clone.style.left = '-9999px';
        clone.style.top = '0';
        clone.style.width = '297mm';
        clone.style.backgroundColor = 'white';
        clone.style.opacity = '1';
        clone.style.display = 'block';
        document.body.appendChild(clone);
        
        const canvas = await html2canvas(clone, {
          scale: 2,
          useCORS: true,
          logging: false
        });
        
        // Remove clone after capture
        document.body.removeChild(clone);
        
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        
        if (i > 0) {
          pdf.addPage();
        }
        
        let heightLeft = imgHeight;
        let position = 0;
        const topMargin = 15; // 15mm margin atas untuk halaman kedua dan seterusnya
        
        // Page 1 for this section
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Subsequent Pages for this section
        while (heightLeft > 0) {
          position = position - pageHeight + topMargin; 
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          
          // Menutup bocoran potongan gambar di bagian atas dokumen dengan balok putih
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pdfWidth, topMargin, 'F');
          
          heightLeft -= (pageHeight - topMargin);
        }
      }
      
      const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { 
        year: 'numeric', 
        month: 'long' 
      });
      pdf.save(`Rekap_Absensi_${monthName.replace(/\s/g, '_')}.pdf`);
      
      toast({
        title: "Berhasil",
        description: "Data rekap berhasil diekspor ke PDF",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal",
        description: "Gagal saat membuat dokumen PDF.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'present': return 'default';
      case 'late': return 'secondary';
      case 'absent': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Hadir';
      case 'late': return 'Terlambat';
      case 'absent': return 'Tidak Hadir';
      default: return status;
    }
  };

  const filteredAttendance = attendanceData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || item.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  }).sort((a, b) => {
    const posA = a.position || '';
    const posB = b.position || '';
    return posA.localeCompare(posB);
  });

  const totalEmployees = filteredAttendance.length;
  const avgPresentPercentage = totalEmployees > 0 
    ? Math.round(filteredAttendance.reduce((sum, item) => sum + item.present_percentage, 0) / totalEmployees) 
    : 0;
  const avgLatePercentage = totalEmployees > 0 
    ? Math.round(filteredAttendance.reduce((sum, item) => sum + item.late_percentage, 0) / totalEmployees) 
    : 0;
  const avgAbsentPercentage = totalEmployees > 0 
    ? Math.round(filteredAttendance.reduce((sum, item) => sum + item.absent_percentage, 0) / totalEmployees) 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold">Rekap Absensi Bulanan</h1>
            {refreshing && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={exportToPdf} disabled={filteredAttendance.length === 0} variant="secondary">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={exportToExcel} disabled={filteredAttendance.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel (Detail)
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Rekap kehadiran pegawai untuk bulan {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })} 
          (tidak termasuk weekend dan hari libur nasional). <br/>
          <span className="font-medium">Catatan:</span> Kolom "Hadir" mencakup pegawai yang datang tepat waktu dan terlambat.
          <br/>
          <span className="font-medium">Export Excel (Detail):</span> Mengekspor data pegawai lengkap dengan riwayat absensi harian.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <div className="text-2xl font-bold text-primary">{totalEmployees}</div>
                <div className="text-sm text-muted-foreground">Total Pegawai</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{avgPresentPercentage}%</div>
                <div className="text-sm text-muted-foreground">Rata-rata Hadir (Termasuk Terlambat)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{avgLatePercentage}%</div>
                <div className="text-sm text-muted-foreground">Rata-rata Terlambat</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{avgAbsentPercentage}%</div>
                <div className="text-sm text-muted-foreground">Rata-rata Tidak Hadir</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Rekap Bulanan - {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredAttendance.length} pegawai
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari berdasarkan nama atau ID pegawai..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Januari</SelectItem>
                <SelectItem value="2">Februari</SelectItem>
                <SelectItem value="3">Maret</SelectItem>
                <SelectItem value="4">April</SelectItem>
                <SelectItem value="5">Mei</SelectItem>
                <SelectItem value="6">Juni</SelectItem>
                <SelectItem value="7">Juli</SelectItem>
                <SelectItem value="8">Agustus</SelectItem>
                <SelectItem value="9">September</SelectItem>
                <SelectItem value="10">Oktober</SelectItem>
                <SelectItem value="11">November</SelectItem>
                <SelectItem value="12">Desember</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter Bidang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bidang</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIP</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Unit Kerja</TableHead>
                  <TableHead className="text-center">Total Hari</TableHead>
                  <TableHead className="text-center">Hadir*</TableHead>
                  <TableHead className="text-center">Terlambat</TableHead>
                  <TableHead className="text-center">Tidak Hadir</TableHead>
                  <TableHead className="text-center">% Hadir</TableHead>
                  <TableHead className="text-center">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.map((item) => (
                  <>
                    <TableRow key={item.id}>
                      <TableCell>{item.nip}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.position}</TableCell>
                      <TableCell>{item.department}</TableCell>
                      <TableCell className="text-center">{item.total_days}</TableCell>
                      <TableCell className="text-center text-green-600 font-semibold">{item.present_days}</TableCell>
                      <TableCell className="text-center text-yellow-600 font-semibold">{item.late_days}</TableCell>
                      <TableCell className="text-center text-red-600 font-semibold">{item.absent_days}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.present_percentage >= 80 ? 'default' : 'destructive'}>
                          {item.present_percentage}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(item.employee_id)}
                        >
                          {expandedRows.has(item.employee_id) ? 'Tutup' : 'Lihat'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Row - Attendance Details */}
                    {expandedRows.has(item.employee_id) && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-gray-50 p-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Detail Kehadiran {item.name} - {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}</h4>
                            <div className="text-xs text-gray-600 mb-2">
                              Total Hari Kerja: {item.total_days} hari (tidak termasuk weekend dan hari libur nasional)
                            </div>
                            <div className="grid grid-cols-7 gap-1 max-h-60 overflow-y-auto">
                              {(() => {
                                const year = selectedYear;
                                const month = selectedMonth;
                                const daysInMonth = new Date(year, month, 0).getDate();
                                const allDays = [];
                                
                                // Create attendance map for quick lookup
                                const attendanceMap = new Map();
                                item.attendance_details.forEach(detail => {
                                  attendanceMap.set(detail.date, detail);
                                });
                                
                                // Generate all days of the month with proper WITA handling
                                for (let day = 1; day <= daysInMonth; day++) {
                                  // Create consistent date string format
                                  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                  const date = new Date(dateString + 'T12:00:00'); // Noon to avoid timezone issues
                                  const holidayInfo = isHolidayOrWeekend(dateString);
                                  const attendance = attendanceMap.get(dateString);
                                  
                                  allDays.push(
                                    <div key={day} className={`text-xs p-1 border rounded ${
                                      holidayInfo.isHoliday ? 'bg-gray-100' : 'bg-white'
                                    }`}>
                                      <div className="font-medium text-center">
                                        {day}
                                      </div>
                                      <div className="text-center text-xs">
                                        {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                                      </div>
                                      {holidayInfo.isHoliday ? (
                                        <div className="text-center mt-1">
                                          <Badge variant="outline" className="text-xs px-1 py-0">
                                            {holidayInfo.type === 'Minggu' || holidayInfo.type === 'Sabtu' ? holidayInfo.type : 'Libur'}
                                          </Badge>
                                        </div>
                                      ) : attendance ? (
                                        <>
                                          <div className="text-center mt-1">
                                            <Badge 
                                              variant={getStatusBadgeVariant(attendance.status) as any}
                                              className="text-xs px-1 py-0"
                                            >
                                              {getStatusText(attendance.status)}
                                            </Badge>
                                          </div>
                                          {attendance.check_in_time && (
                                            <div className="text-gray-600 text-center mt-1 text-xs">
                                              {formatTimeWITA(attendance.check_in_time)}
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <div className="text-center mt-1">
                                          <Badge variant="destructive" className="text-xs px-1 py-0">
                                            Absen
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                                
                                return allDays;
                              })()}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              <span className="mr-4">🟢 Hadir</span>
                              <span className="mr-4">🟡 Terlambat</span>
                              <span className="mr-4">🔴 Tidak Hadir</span>
                              <span>⚪ Weekend/Libur</span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
                {filteredAttendance.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {attendanceData.length === 0 
                        ? `Belum ada data absensi untuk bulan ${new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}`
                        : "Tidak ada data yang sesuai dengan filter"
                      }
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Legend */}
          <div className="text-xs text-gray-600 mt-2">
            <p>* Hadir = Total kehadiran (termasuk yang terlambat)</p>
            <p>Data ini tidak termasuk weekend dan hari libur nasional</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Hidden PDF template container */}
      <div 
        ref={pdfRef} 
        style={{ 
          position: 'absolute', 
          left: '-9999px',
          top: 0,
          width: '297mm', // Force A4 landscape width so html2canvas can render text correctly
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1
        }}
      >
        {(() => {
          // Group attendance by position
          const grouped: Record<string, any[]> = {};
          filteredAttendance.forEach(item => {
            const pos = item.position || 'Tidak Ada Jabatan';
            if (!grouped[pos]) grouped[pos] = [];
            grouped[pos].push(item);
          });
          
          const monthYearStr = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          
          return Object.entries(grouped).sort((a,b) => a[0].localeCompare(b[0])).map(([jabatan, items], index) => (
            <MonthlyAttendancePdfReport 
              key={index}
              monthYear={monthYearStr}
              totalWorkingDays={items.length > 0 ? items[0].total_days : 0}
              totalHours={items.length > 0 ? (items[0].total_days * 7.5) : 0}
              data={items}
              jabatan={jabatan}
            />
          ));
        })()}
      </div>
    </div>
  );
};

export default MonthlyAttendancePage;