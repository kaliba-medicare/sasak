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

interface MonthlyAttendanceRecord {
  id: string;
  employee_id: string;
  name: string;
  department: string;
  position?: string;
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
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    console.log('Component mounted, fetching monthly attendance data...');
    fetchMonthlyAttendance();
    fetchDepartments();
  }, [selectedMonth]);

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
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-${new Date(parseInt(year), parseInt(month), 0).getDate()}`;
      
      console.log('Fetching attendance for month:', selectedMonth, 'from', startDate, 'to', endDate);
      
      // First, get all attendance data for the month
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
        .order('date');

      if (attendanceError) {
        console.error('Attendance query error:', attendanceError);
        throw attendanceError;
      }
      
      console.log('Monthly attendance data:', attendanceData);
      
      // Get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('employee_id, name, department, position');
      
      if (profilesError) {
        console.error('Profiles query error:', profilesError);
        throw profilesError;
      }
      
      console.log('Profiles data:', profilesData);
      
      // Create profiles map
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.employee_id, profile);
      });
      
      // Group attendance by employee
      const attendanceByEmployee = new Map();
      attendanceData?.forEach(record => {
        if (!attendanceByEmployee.has(record.employee_id)) {
          attendanceByEmployee.set(record.employee_id, []);
        }
        attendanceByEmployee.get(record.employee_id).push(record);
      });
      
      // Calculate monthly summary for each employee
      const monthlySummary: MonthlyAttendanceRecord[] = [];
      
      // Get the total number of working days in the month (excluding weekends and holidays)
      const totalWorkingDays = getWorkingDaysInMonth(parseInt(year), parseInt(month) - 1);
      console.log(`Total working days for ${selectedMonth}: ${totalWorkingDays}`);
      
      profilesData?.forEach(profile => {
        const employeeAttendance = attendanceByEmployee.get(profile.employee_id) || [];
        
        // Only count attendance on working days (exclude holidays and weekends)
        const workingDayAttendance = employeeAttendance.filter(a => {
          const holidayInfo = isHolidayOrWeekend(a.date);
          return !holidayInfo.isHoliday;
        });
        
        const presentDays = workingDayAttendance.filter(a => a.status === 'present').length;
        const lateDays = workingDayAttendance.filter(a => a.status === 'late').length;
        const attendedDays = presentDays + lateDays;
        const absentDays = totalWorkingDays - attendedDays;
        
        const presentPercentage = totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0;
        const latePercentage = totalWorkingDays > 0 ? Math.round((lateDays / totalWorkingDays) * 100) : 0;
        const absentPercentage = totalWorkingDays > 0 ? Math.round((absentDays / totalWorkingDays) * 100) : 0;
        
        monthlySummary.push({
          id: profile.employee_id,
          employee_id: profile.employee_id,
          name: profile.name || 'Unknown Employee',
          department: profile.department || 'Unknown Department',
          position: profile.position || 'Unknown Position',
          total_days: totalWorkingDays,
          present_days: presentDays,
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

  const isHolidayOrWeekend = (dateString: string) => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    const year = date.getFullYear();
    const holidays = getIndonesianHolidays(year);
    
    // Check if it's weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { isHoliday: true, type: dayOfWeek === 0 ? 'Minggu' : 'Sabtu' };
    }
    
    // Check if it's national holiday
    if (holidays.includes(dateString)) {
      return { isHoliday: true, type: 'Hari Libur Nasional' };
    }
    
    return { isHoliday: false, type: null };
  };

  const getIndonesianHolidays = (year: number) => {
    // Indonesian National Holidays (fixed dates)
    const fixedHolidays = [
      `${year}-01-01`, // New Year's Day
      `${year}-08-17`, // Independence Day
      `${year}-12-25`, // Christmas Day
    ];
    
    // Add common Indonesian holidays (these may vary by year, but included common ones)
    const commonHolidays = [
      `${year}-03-22`, // Nyepi (varies by year, example date)
      `${year}-05-01`, // Labor Day
      `${year}-06-01`, // Pancasila Day
      `${year}-12-26`, // Boxing Day (sometimes observed)
    ];
    
    // Combine all holidays
    return [...fixedHolidays, ...commonHolidays];
  };

  const getWorkingDaysInMonth = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const holidays = getIndonesianHolidays(year);
    let workingDays = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const dateString = date.toISOString().split('T')[0];
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }
      
      // Skip national holidays
      if (holidays.includes(dateString)) {
        continue;
      }
      
      // Count as working day
      workingDays++;
    }
    
    console.log(`Working days in ${year}-${month + 1}: ${workingDays} (excluding weekends and holidays)`);
    return workingDays;
  };

  const handleRefresh = () => {
    fetchMonthlyAttendance();
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
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
    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long' 
    });
    
    const exportData = filteredAttendance.map(item => ({
      'ID Pegawai': item.employee_id,
      'Nama': item.name,
      'Departemen': item.department,
      'Total Hari Kerja': `${item.total_days} hari (tidak termasuk weekend & libur)`,
      'Hadir': item.present_days,
      'Terlambat': item.late_days,
      'Tidak Hadir': item.absent_days,
      'Persentase Hadir': `${item.present_percentage}%`,
      'Persentase Terlambat': `${item.late_percentage}%`,
      'Persentase Tidak Hadir': `${item.absent_percentage}%`
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Bulanan');
    XLSX.writeFile(wb, `Rekap_Absensi_${monthName.replace(/\s/g, '_')}.xlsx`);

    toast({
      title: "Berhasil",
      description: "Data rekap bulanan berhasil diekspor ke Excel",
    });
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
            <Button onClick={exportToExcel} disabled={filteredAttendance.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Rekap kehadiran pegawai untuk bulan {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })} 
          (tidak termasuk weekend dan hari libur nasional)
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
                <div className="text-sm text-muted-foreground">Rata-rata Hadir</div>
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
              Rekap Bulanan - {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
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
            
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="w-full sm:w-[180px]"
            />
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter Departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Departemen</SelectItem>
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
                  <TableHead>ID Pegawai</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead className="text-center">Total Hari</TableHead>
                  <TableHead className="text-center">Hadir</TableHead>
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
                      <TableCell className="font-medium">{item.employee_id}</TableCell>
                      <TableCell>{item.name}</TableCell>
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
                            <h4 className="font-semibold text-sm">Detail Kehadiran {item.name} - {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}</h4>
                            <div className="text-xs text-gray-600 mb-2">
                              Total Hari Kerja: {item.total_days} hari (tidak termasuk weekend dan hari libur nasional)
                            </div>
                            <div className="grid grid-cols-7 gap-1 max-h-60 overflow-y-auto">
                              {(() => {
                                const [year, month] = selectedMonth.split('-');
                                const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
                                const allDays = [];
                                
                                // Create attendance map for quick lookup
                                const attendanceMap = new Map();
                                item.attendance_details.forEach(detail => {
                                  attendanceMap.set(detail.date, detail);
                                });
                                
                                // Generate all days of the month
                                for (let day = 1; day <= daysInMonth; day++) {
                                  const date = new Date(parseInt(year), parseInt(month) - 1, day);
                                  const dateString = date.toISOString().split('T')[0];
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
                                              {new Date(attendance.check_in_time).toLocaleTimeString('id-ID', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyAttendancePage;