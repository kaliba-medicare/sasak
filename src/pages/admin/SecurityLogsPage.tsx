import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface SecurityLog {
  id: string;
  user_id: string;
  event_type: string;
  description: string | null;
  ip_address: string | null;
  gps_location_lat: number | null;
  gps_location_lng: number | null;
  created_at: string;
  user?: {
    name: string;
    employee_id: string;
  };
}

const SecurityLogsPage = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSecurityLogs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("security_logs")
        .select(`
          *,
          profiles:user_id(name, employee_id)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Type assertion to help TypeScript understand the structure
      const logsData = data as SecurityLog[];
      setLogs(logsData);
    } catch (error) {
      console.error("Error fetching security logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityLogs();
  }, [user]);

  const formatEventType = (eventType: string) => {
    switch (eventType) {
      case "suspicious_location_data":
        return "Data Lokasi Mencurigakan";
      case "location_ip_mismatch":
        return "Ketidakcocokan Lokasi IP-GPS";
      case "location_out_of_range":
        return "Lokasi Di Luar Jangkauan";
      default:
        return eventType;
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Log Keamanan</h1>
        <Button onClick={fetchSecurityLogs} variant="outline">
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Mencurigakan</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Memuat data...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada aktivitas mencurigakan yang tercatat
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal & Waktu</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Jenis Kejadian</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                    </TableCell>
                    <TableCell>
                      <div>{log.user?.name || "Unknown"}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.user?.employee_id || log.user_id}
                      </div>
                    </TableCell>
                    <TableCell>{formatEventType(log.event_type)}</TableCell>
                    <TableCell>{log.description || "-"}</TableCell>
                    <TableCell>{log.ip_address || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityLogsPage;