import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Filter, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatTimeWITA, formatDateWITA } from "@/lib/timezone";

interface AttendanceRecord {
  id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  location_lat?: number;
  location_lng?: number;
  status: "present" | "late" | "absent";
  employee_id: string;
}

const HistoryScreen = () => {
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { user } = useAuth();

  // Generate month options
  const months = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
  ];

  // Generate year options (last 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => ({
    value: currentYear - i,
    label: (currentYear - i).toString(),
  }));

  // Fetch attendance history based on selected month/year
  const fetchAttendanceHistory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Format the date range for the selected month/year
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0); // Last day of the month
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching attendance history:', error);
        return;
      }
      
      setAttendanceHistory((data || []).map(record => ({
        ...record,
        status: record.status as "present" | "late" | "absent"
      })));
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, [user, selectedMonth, selectedYear]);

  const getStatusBadge = (status: AttendanceRecord["status"]) => {
    const variants = {
      present: "default",
      late: "secondary", 
      absent: "destructive",
    } as const;

    const labels = {
      present: "Hadir",
      late: "Terlambat",
      absent: "Tidak Hadir",
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return formatDateWITA(dateString);
  };

  const calculateWorkingHours = (checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut) return null;
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}j ${minutes}m`;
  };

  // Calculate statistics
  const stats = {
    totalPresent: attendanceHistory.filter(r => r.status === "present").length,
    totalLate: attendanceHistory.filter(r => r.status === "late").length,
    totalAbsent: attendanceHistory.filter(r => r.status === "absent").length,
  };

  // Total attendance (present + late)
  const totalAttendance = stats.totalPresent + stats.totalLate;

  // Check if a date is a weekend (Saturday or Sunday)
  const isWeekend = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    return day === 0 || day === 6;
  };

  // Calculate total working days (Monday-Friday) that have passed so far in the selected month
  const calculateTotalWorkingDays = () => {
    const year = selectedYear;
    const month = selectedMonth - 1; // JavaScript months are 0-indexed
    
    // Get the first day of the month and today's date
    const firstDay = new Date(year, month, 1);
    const today = new Date();
    
    // If we're not in the selected month/year, use the last day of the month
    let endDate;
    if (today.getFullYear() === year && today.getMonth() === month) {
      endDate = today;
    } else if (year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth())) {
      // If the selected month is in the past, use the last day of that month
      endDate = new Date(year, month + 1, 0);
    } else {
      // If the selected month is in the future, return 0
      return 0;
    }
    
    let workingDays = 0;
    const currentDate = new Date(firstDay);
    
    // Iterate through each day from the first day to the end date
    while (currentDate <= endDate) {
      // Check if it's a weekday (Monday-Friday)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
        workingDays++;
      }
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
  };

  // Calculate attendance percentage
  const calculateAttendancePercentage = () => {
    const totalWorkingDays = calculateTotalWorkingDays();
    if (totalWorkingDays === 0) return 0;
    return Math.round((totalAttendance / totalWorkingDays) * 100);
  };

  const totalWorkingDays = calculateTotalWorkingDays();
  const attendancePercentage = calculateAttendancePercentage();

  if (loading) {
    return (
      <div className="p-4 space-y-6 pb-20">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Riwayat Absensi</h1>
          <p className="text-muted-foreground">Rekap kehadiran Anda</p>
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Berdasarkan Bulan & Tahun
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Bulan</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full p-2 border rounded-md"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tahun</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full p-2 border rounded-md"
              >
                {years.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button onClick={fetchAttendanceHistory} className="w-full">
            Terapkan Filter
          </Button>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Hadir Tepat Waktu</p>
                <p className="text-2xl font-bold text-success">{stats.totalPresent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Terlambat</p>
                <p className="text-2xl font-bold text-warning">{stats.totalLate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Hadir</p>
                <p className="text-2xl font-bold text-primary">{totalAttendance}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Working Hours Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Informasi Jam Kerja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-muted-foreground">Hari Kerja:</span>
            <span className="font-medium">Senin - Jumat</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-muted-foreground">Hari Libur:</span>
            <span className="font-medium text-destructive">Sabtu & Minggu</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-muted-foreground">Total Hari Kerja Berjalan:</span>
            <span className="font-medium">{totalWorkingDays} hari</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-muted-foreground">Total Kehadiran:</span>
            <span className="font-medium">{totalAttendance} hari</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Persentase Kehadiran:</span>
            <span className={`font-bold text-lg ${attendancePercentage >= 90 ? 'text-success' : attendancePercentage >= 75 ? 'text-warning' : 'text-destructive'}`}>
              {attendancePercentage}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Riwayat Kehadiran - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {attendanceHistory.length > 0 ? (
            attendanceHistory.map((record) => (
              <div
                key={record.id}
                className={`flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors ${isWeekend(record.date) ? 'bg-muted/50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {formatDate(record.date)}
                    </div>
                    {isWeekend(record.date) && (
                      <div className="text-xs text-destructive font-medium">Libur</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Kantor Pusat
                      </span>
                    </div>
                    {record.check_in_time && record.check_out_time ? (
                      <div className="text-sm">
                        <span className="text-success font-medium">{formatTimeWITA(record.check_in_time)}</span>
                        <span className="text-muted-foreground mx-2">-</span>
                        <span className="text-primary font-medium">{formatTimeWITA(record.check_out_time)}</span>
                        {(() => {
                          const workingHours = calculateWorkingHours(record.check_in_time, record.check_out_time);
                          return workingHours ? (
                            <span className="text-muted-foreground ml-2">
                              ({workingHours})
                            </span>
                          ) : null;
                        })()}
                      </div>
                    ) : record.check_in_time ? (
                      <div className="text-sm">
                        <span className="text-success font-medium">{formatTimeWITA(record.check_in_time)}</span>
                        <span className="text-muted-foreground ml-2">- Belum checkout</span>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Tidak ada data absensi
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(record.status)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data absensi untuk periode ini
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryScreen;