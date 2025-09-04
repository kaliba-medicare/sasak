import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, Clock, UserCheck, Search, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getTodayDateWITA, formatTimeWITA, formatDateWITA } from "@/lib/timezone";
import * as XLSX from 'xlsx';

interface TodayAttendance {
  id: string;
  employee_id: string;
  date: string;
  status: "present" | "late" | "absent";
  check_in_time: string | null;
  check_out_time: string | null;
  location_lat: number | null;
  location_lng: number | null;
  name: string;
  department: string;
  position?: string;
}

const TodayAttendancePage = () => {
  const [attendanceData, setAttendanceData] = useState<TodayAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(getTodayDateWITA());
  const [departments, setDepartments] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Component mounted, fetching initial data...');
    fetchAttendanceByDate();
    fetchDepartments();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('Auto-refreshing attendance data...');
      fetchAttendanceByDate(true);
    }, 30000);

    return () => {
      console.log('Component unmounting, clearing interval...');
      clearInterval(interval);
    };
  }, [selectedDate]); // Re-fetch when date changes

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
      // Set empty array on error to prevent UI issues
      setDepartments([]);
    }
  };

  const fetchAttendanceByDate = async (isAutoRefresh = false) => {
    if (isAutoRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log('Fetching attendance for date:', selectedDate);
      console.log('Current WITA date:', getTodayDateWITA());
      console.log('Current UTC date:', new Date().toISOString().split('T')[0]);
      
      // First, get attendance data for selected date
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          id,
          employee_id,
          date,
          status,
          check_in_time,
          check_out_time,
          location_lat,
          location_lng
        `)
        .eq('date', selectedDate)
        .order('check_in_time', { ascending: false });

      if (attendanceError) {
        console.error('Attendance query error:', attendanceError);
        throw attendanceError;
      }
      
      console.log('Attendance data:', attendanceData);
      
      if (!attendanceData || attendanceData.length === 0) {
        console.log('No attendance data found for selected date');
        setAttendanceData([]);
        return;
      }
      
      // Get unique employee IDs from attendance data
      const employeeIds = [...new Set(attendanceData.map(item => item.employee_id))];
      console.log('Employee IDs to fetch:', employeeIds);
      
      // Fetch profiles for these employees
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('employee_id, name, department, position')
        .in('employee_id', employeeIds);
      
      if (profilesError) {
        console.error('Profiles query error:', profilesError);
        throw profilesError;
      }
      
      console.log('Profiles data:', profilesData);
      
      // Create a map of employee_id to profile data for efficient lookup
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.employee_id, profile);
      });
      
      // Combine attendance and profile data
      const transformedData = attendanceData.map(item => {
        const profile = profilesMap.get(item.employee_id);
        return {
          ...item,
          name: profile?.name || 'Unknown Employee',
          department: profile?.department || 'Unknown Department',
          position: profile?.position || 'Unknown Position'
        };
      });
      
      console.log('Final transformed data:', transformedData);
      setAttendanceData(transformedData);
      
    } catch (error: any) {
      console.error('Error fetching attendance by date:', error);
      toast({
        title: "Error",
        description: `Failed to load attendance data: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
      
      // Set empty data on error to prevent infinite loading
      setAttendanceData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchAttendanceByDate();
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    // Data will be fetched automatically due to useEffect dependency
  };

  const exportToExcel = () => {
    const selectedDateFormatted = formatDateWITA(selectedDate);
    const exportData = filteredAttendance.map(item => ({
      'ID Pegawai': item.employee_id,
      'Nama': item.name,
      'Departemen': item.department,
      'Status': getStatusText(item.status),
      'Waktu Masuk': item.check_in_time ? formatTimeWITA(item.check_in_time) : '-',
      'Waktu Keluar': item.check_out_time ? formatTimeWITA(item.check_out_time) : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Absensi');
    XLSX.writeFile(wb, `Absensi_${selectedDateFormatted.replace(/\//g, '-')}.xlsx`);

    toast({
      title: "Berhasil",
      description: "Data absensi berhasil diekspor ke Excel",
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Hadir';
      case 'late': return 'Terlambat';
      case 'absent': return 'Tidak Hadir';
      default: return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'present': return 'default';
      case 'late': return 'secondary';
      case 'absent': return 'destructive';
      default: return 'outline';
    }
  };

  const filteredAttendance = attendanceData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || item.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const totalEmployees = attendanceData.length;
  const presentCount = attendanceData.filter(item => item.status === 'present').length;
  const lateCount = attendanceData.filter(item => item.status === 'late').length;
  const absentCount = attendanceData.filter(item => item.status === 'absent').length;

  const presentPercentage = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;
  const latePercentage = totalEmployees > 0 ? Math.round((lateCount / totalEmployees) * 100) : 0;

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
            <CalendarDays className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold">Data Absensi</h1>
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
          Daftar pegawai yang telah melakukan absensi pada tanggal {formatDateWITA(selectedDate)}
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
                <div className="text-sm text-muted-foreground">Total Absensi</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                <div className="text-sm text-muted-foreground">Hadir ({presentPercentage}%)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
                <div className="text-sm text-muted-foreground">Terlambat ({latePercentage}%)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{absentCount}</div>
                <div className="text-sm text-muted-foreground">Tidak Hadir</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Data Absensi - {formatDateWITA(selectedDate)}
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredAttendance.length} dari {totalEmployees} data
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
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
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
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="present">Hadir</SelectItem>
                <SelectItem value="late">Terlambat</SelectItem>
                <SelectItem value="absent">Tidak Hadir</SelectItem>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Waktu Masuk</TableHead>
                  <TableHead>Waktu Keluar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.employee_id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.department}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(item.status) as any}>
                        {getStatusText(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.check_in_time 
                        ? formatTimeWITA(item.check_in_time)
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {item.check_out_time 
                        ? formatTimeWITA(item.check_out_time)
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAttendance.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {attendanceData.length === 0 
                        ? `Belum ada data absensi pada tanggal ${formatDateWITA(selectedDate)}`
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

export default TodayAttendancePage;