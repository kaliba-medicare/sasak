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
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month">("week");
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch attendance history
  const fetchAttendanceHistory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30);

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
    if (user) {
      fetchAttendanceHistory();
    }
  }, [user]);

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
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
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
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Period Selection */}
      <div className="flex gap-2">
        <Button
          variant={selectedPeriod === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedPeriod("week")}
        >
          Minggu Ini
        </Button>
        <Button
          variant={selectedPeriod === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedPeriod("month")}
        >
          Bulan Ini
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hadir</p>
                <p className="text-xl font-bold text-success">{stats.totalPresent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Terlambat</p>
                <p className="text-xl font-bold text-warning">{stats.totalLate}</p>
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
            Ringkasan Jam Kerja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Hari Kerja:</span>
            <span className="font-medium">{stats.totalPresent + stats.totalLate} hari</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Absen:</span>
            <span className="font-medium text-destructive">{stats.totalAbsent} hari</span>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Riwayat Kehadiran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {attendanceHistory.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {formatDate(record.date)}
                  </div>
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
          ))}
        </CardContent>
      </Card>

      {/* Load More */}
      <Button variant="outline" className="w-full">
        Muat Lebih Banyak
      </Button>
    </div>
  );
};

export default HistoryScreen;