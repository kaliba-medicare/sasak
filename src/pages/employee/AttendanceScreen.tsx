import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, CheckCircle, XCircle, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase, getIPLocation } from "@/integrations/supabase/client";
import { getNowMakassar, getTodayDateWITA, formatTimeWITA, getTimestampForDB } from "@/lib/timezone";

// Target location coordinates (Lombok area)
const TARGET_LOCATION = {
  lat: -8.3581056,
  lng: 116.159854,
  name: "Kantor Diskominfo KLU",
};

interface AttendanceRecord {
  id?: string;
  check_in_time?: string;
  check_out_time?: string;
  location_lat?: number;
  location_lng?: number;
  status?: string;
  date?: string;
}

// Add function to detect suspicious location data
const isSuspiciousLocation = (position: GeolocationPosition) => {
  // Check for common fake GPS patterns
  const { latitude, longitude, accuracy } = position.coords;
  
  // Suspicious if accuracy is too perfect (0m) or too low
  if (accuracy === 0 || accuracy > 1000) {
    return true;
  }
  
  // Check if coordinates are suspiciously round (common in fake GPS)
  const latStr = latitude.toString();
  const lngStr = longitude.toString();
  if (latStr.split('.')[1]?.length < 3 || lngStr.split('.')[1]?.length < 3) {
    return true;
  }
  
  return false;
};

const AttendanceScreen = () => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isInRange, setIsInRange] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [currentTime, setCurrentTime] = useState(getNowMakassar());
  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Get user location with enhanced validation
  const getCurrentLocation = async () => {
    // Clear previous errors
    setLocationError(null);
    
    // Check if geolocation is available
    if (!navigator.geolocation) {
      const errorMsg = "Geolocation tidak didukung oleh browser Anda";
      console.error(errorMsg);
      setLocationError(errorMsg);
      toast({
        title: "Lokasi Tidak Ditemukan",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    console.log("Attempting to get current location...");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log("Location obtained:", position);
        
        // Reset error state
        setLocationError(null);
        
        // Check for suspicious location data
        if (isSuspiciousLocation(position)) {
          const errorMsg = "Lokasi Anda terdeteksi tidak valid. Mohon gunakan GPS asli.";
          console.error("Suspicious location detected:", errorMsg);
          setLocationError(errorMsg);
          
          toast({
            title: "Lokasi Mencurigakan Terdeteksi",
            description: errorMsg,
            variant: "destructive",
          });
          
          // Log suspicious activity
          if (user) {
            await supabase.from("security_logs").insert({
              user_id: user.id,
              event_type: "suspicious_location_data",
              description: `User ${user.id} provided suspicious location data with accuracy: ${position.coords.accuracy}`,
              gps_location_lat: position.coords.latitude,
              gps_location_lng: position.coords.longitude
            });
          }
          
          return;
        }

        const { latitude, longitude } = position.coords;
        console.log(`Setting current location: ${latitude}, ${longitude}`);
        setCurrentLocation({ lat: latitude, lng: longitude });

        // Get IP location for cross-validation
        try {
          const ipLocation = await getIPLocation();
          console.log("IP location:", ipLocation);
          
          if (ipLocation) {
            // Calculate distance between GPS location and IP-based location
            const ipDistance = calculateDistance(
              latitude,
              longitude,
              ipLocation.latitude,
              ipLocation.longitude
            );
            console.log(`Distance between GPS and IP location: ${ipDistance}m`);
            
            // If distance is too large (>500km), likely fake GPS
            if (ipDistance > 500000) { // 500km in meters
              const errorMsg = "Lokasi GPS tidak sesuai dengan lokasi jaringan. Absensi ditolak.";
              console.error("Location/IP mismatch detected:", errorMsg);
              setLocationError(errorMsg);
              
              toast({
                title: "Peringatan Keamanan",
                description: errorMsg,
                variant: "destructive",
              });
              
              // Log suspicious activity
              if (user) {
                await supabase.from("security_logs").insert({
                  user_id: user.id,
                  event_type: "location_ip_mismatch",
                  description: `GPS and IP location mismatch. Distance: ${ipDistance}m`,
                  ip_address: ipLocation.ip,
                  gps_location_lat: latitude,
                  gps_location_lng: longitude,
                  ip_location_lat: ipLocation.latitude,
                  ip_location_lng: ipLocation.longitude
                });
              }
              
              return;
            }
          }
        } catch (ipError) {
          console.warn("Failed to get IP location, continuing with GPS only:", ipError);
        }

        const dist = calculateDistance(
          latitude,
          longitude,
          TARGET_LOCATION.lat,
          TARGET_LOCATION.lng
        );
        console.log(`Distance from office: ${dist}m`);

        setDistance(Math.round(dist));
        setIsInRange(dist <= 50); // 50 meter radius for testing
        console.log(`Is in range: ${dist <= 50}`);
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMsg = "";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Izin lokasi ditolak. Mohon aktifkan izin lokasi di pengaturan browser Anda. Klik ikon kunci di address bar browser untuk mengatur izin lokasi.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Informasi lokasi tidak tersedia. Pastikan GPS Anda aktif dan memiliki sinyal yang baik.";
            break;
          case error.TIMEOUT:
            errorMsg = "Permintaan lokasi timeout. Coba lagi atau periksa koneksi internet Anda.";
            break;
          default:
            errorMsg = `Error tidak dikenal saat mendapatkan lokasi: ${error.message}`;
            break;
        }
        
        setLocationError(errorMsg);
        toast({
          title: "Lokasi Tidak Ditemukan",
          description: errorMsg,
          variant: "destructive",
        });
      },
      { 
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout to 15 seconds
        maximumAge: 60000
      }
    );
  };

  // Fetch today's attendance
  const fetchTodayAttendance = async () => {
    if (!user) return;

    const today = getTodayDateWITA();
    console.log('Fetching attendance for WITA date:', today);
    console.log('User ID:', user.id);

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching attendance:", error);
    } else if (data) {
      console.log('Found attendance data:', data);
      setTodayAttendance(data);
    } else {
      console.log('No attendance data found for today');
    }
  };

  useEffect(() => {
    getCurrentLocation();
    fetchTodayAttendance();

    const locationInterval = setInterval(getCurrentLocation, 30000); // Update location every 30 seconds
    const timeInterval = setInterval(() => setCurrentTime(getNowMakassar()), 1000); // Update time every second

    return () => {
      clearInterval(locationInterval);
      clearInterval(timeInterval);
    };
  }, [user]);

  // ✅ Handle Check-in / Check-out with enhanced security
  const handleCheckIn = async () => {
    console.log("handleCheckIn called", { user, profile, currentLocation, isInRange });
    
    if (!user) {
      toast({
        title: "Error",
        description: "User tidak terautentikasi",
        variant: "destructive",
      });
      return;
    }

    if (!profile) {
      toast({
        title: "Error", 
        description: "Profile tidak ditemukan, silakan login ulang",
        variant: "destructive",
      });
      return;
    }

    if (!currentLocation) {
      toast({
        title: "Lokasi Diperlukan",
        description: "Mohon aktifkan GPS dan berikan izin lokasi",
        variant: "destructive",
      });
      getCurrentLocation();
      return;
    }

    // For testing, make location check less strict or allow override
    if (!isInRange && distance && distance > 50) { // Changed from 30m to 50m for testing
      toast({
        title: "Lokasi Terlalu Jauh",
        description: `Jarak Anda ${distance}m dari kantor. Mendekatlah ke kantor untuk absensi.`,
        variant: "destructive",
      });
      
      // Log suspicious activity
      await supabase.from("security_logs").insert({
        user_id: user.id,
        event_type: "location_out_of_range",
        description: `User ${user.id} attempted attendance from ${distance}m away`,
        gps_location_lat: currentLocation.lat,
        gps_location_lng: currentLocation.lng
      });
      
      return;
    }

    setIsCheckingIn(true);

    try {
      const now = getNowMakassar();
      const hour = now.getHours();
      const timestamp = getTimestampForDB(); // Let PostgreSQL handle timezone conversion
      const today = getTodayDateWITA(); // Use WITA date for date field

      // Get IP location for additional validation
      const ipLocation = await getIPLocation();
      
      // Check if there's existing attendance data for today for this employee
      const { data: existingAttendance, error: fetchError } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      // Log the check for debugging
      console.log('Checking existing attendance:', { existingAttendance, fetchError });

      if (!todayAttendance?.check_in_time) {
        // This is a check-in attempt
        
        // Check if employee already has a check-out record for today (prevent duplicate late check-out)
        if (todayAttendance?.check_out_time) {
          toast({
            title: "Sudah Check-out",
            description: "Anda sudah melakukan check-out hari ini dengan status terlambat",
            variant: "destructive",
          });
          setIsCheckingIn(false);
          return;
        }
        
        // Check if it's after 12:00 WITA - only allow check-out with late status
        if (hour >= 12 && hour < 19) {
          // This is actually a late check-out, not check-in
          if (existingAttendance && !fetchError) {
            // Update existing record with check-out
            const { data, error } = await supabase
              .from("attendance")
              .update({
                check_out_time: timestamp,
                location_lat: currentLocation.lat,
                location_lng: currentLocation.lng,
                status: "late", // Update status to late
              })
              .eq("id", existingAttendance.id)
              .select()
              .single();

            if (error) throw error;
            setTodayAttendance(data);
          } else {
            // Insert new record with check-out only
            const { data, error } = await supabase
              .from("attendance")
              .insert({
                user_id: user.id,
                employee_id: profile.employee_id,
                check_in_time: null, // No check-in time since they're late
                check_out_time: timestamp,
                location_lat: currentLocation.lat,
                location_lng: currentLocation.lng,
                status: "late", // Automatically late for missing check-in window
                date: today,
              })
              .select()
              .single();

            if (error) throw error;
            setTodayAttendance(data);
          }

          toast({
            title: "Check-out Terlambat! ⚠️",
            description: `Anda melewatkan waktu check-in. Tercatat check-out pada ${now.toLocaleTimeString("id-ID")} dengan status TERLAMBAT`,
            variant: "destructive",
          });
          setIsCheckingIn(false);
          return;
        }
        
        // 🚨 Validasi Check-in (07–12)
        if (hour < 7 || hour >= 12) {
          toast({
            title: "Waktu Check-in Tidak Valid",
            description: "Check-in hanya bisa dilakukan antara jam 07:00–12:00 WITA. Setelah jam 12:00, hanya bisa check-out dengan status terlambat.",
            variant: "destructive",
          });
          setIsCheckingIn(false);
          return;
        }

        // 🚨 Determine status based on check-in time
        // Late if check-in after 08:00 WITA, otherwise present
        const attendanceStatus = hour >= 8 ? "late" : "present";
        
        if (existingAttendance && !fetchError) {
          // Update existing record with check-in
          const { data, error } = await supabase
            .from("attendance")
            .update({
              check_in_time: timestamp,
              location_lat: currentLocation.lat,
              location_lng: currentLocation.lng,
              status: attendanceStatus,
            })
            .eq("id", existingAttendance.id)
            .select()
            .single();

          if (error) throw error;
          setTodayAttendance(data);
        } else {
          // Insert new record with check-in
          const { data, error } = await supabase
            .from("attendance")
            .insert({
              user_id: user.id,
              employee_id: profile.employee_id,
              check_in_time: timestamp,
              location_lat: currentLocation.lat,
              location_lng: currentLocation.lng,
              status: attendanceStatus,
              date: today,
            })
            .select()
            .single();

          if (error) throw error;
          setTodayAttendance(data);
        }
        
        // Show appropriate message based on status
        if (attendanceStatus === "late") {
          toast({
            title: "Check-in Terlambat! ⚠️",
            description: `Tercatat pada ${now.toLocaleTimeString("id-ID")} - Status: Terlambat`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Check-in Berhasil! ✅",
            description: `Tercatat pada ${now.toLocaleTimeString("id-ID")} - Status: Tepat Waktu`,
          });
        }
      } else if (!todayAttendance?.check_out_time) {
        // This is a check-out attempt
        
        // 🚨 Validasi Check-out (12–19)
        if (hour < 12 || hour >= 19) {
          toast({
            title: "Waktu Check-out Tidak Valid",
            description: "Check-out hanya bisa dilakukan antara jam 12:00–19:00 WITA",
            variant: "destructive",
          });
          setIsCheckingIn(false);
          return;
        }

        if (existingAttendance && !fetchError) {
          // Update existing record with check-out
          const { data, error } = await supabase
            .from("attendance")
            .update({
              check_out_time: timestamp,
            })
            .eq("id", existingAttendance.id)
            .select()
            .single();

          if (error) throw error;
          setTodayAttendance(data);
        } else {
          // Insert new record with check-out only
          const { data, error } = await supabase
            .from("attendance")
            .insert({
              user_id: user.id,
              employee_id: profile.employee_id,
              check_out_time: timestamp,
              location_lat: currentLocation.lat,
              location_lng: currentLocation.lng,
              status: "present", // Default status for check-out only
              date: today,
            })
            .select()
            .single();

          if (error) throw error;
          setTodayAttendance(data);
        }

        toast({
          title: "Check-out Berhasil! 👋",
          description: `Tercatat pada ${now.toLocaleTimeString("id-ID")}`,
        });
      } else {
        // Employee has already completed attendance for today
        toast({
          title: "Absensi Sudah Lengkap",
          description: "Anda sudah menyelesaikan absensi hari ini (check-in dan check-out sudah tercatat)",
          variant: "destructive",
        });
        setIsCheckingIn(false);
        return;
      }
      
      // Refresh today's attendance after any update
      await fetchTodayAttendance();
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast({
        title: "Gagal Menyimpan Absensi",
        description: "Terjadi kesalahan, silakan coba lagi",
        variant: "destructive",
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Format waktu & tanggal
  const getCurrentTime = () => {
    return currentTime.toLocaleTimeString("id-ID");
  };

  const getCurrentDate = () => {
    return currentTime.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Absensi Hari Ini</h1>
        <p className="text-muted-foreground">{getCurrentDate()}</p>
        <div className="text-3xl font-mono font-bold text-primary">
          {getCurrentTime()}
        </div>
      </div>

      {/* Location Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5" />
            Status Lokasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Kantor:</span>
            <span className="font-medium">{TARGET_LOCATION.name}</span>
          </div>

          {distance !== null && (
            <div className="flex items-center justify-between">
              <span>Jarak Anda:</span>
              <Badge variant={isInRange ? "default" : "destructive"}>
                {distance} meter
              </Badge>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span>Status:</span>
            {isInRange ? (
              <Badge className="bg-success text-success-foreground">
                <CheckCircle className="w-3 h-3 mr-1" />
                Dalam Jangkauan
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 mr-1" />
                Di Luar Jangkauan
              </Badge>
            )}
          </div>

          <Button variant="outline" className="w-full" onClick={getCurrentLocation}>
            <Navigation className="w-4 h-4 mr-2" />
            Perbarui Lokasi
          </Button>
          
          {locationError && (
            <div className="text-sm text-destructive mt-2 text-center">
              Error: {locationError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            Absensi Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg border-2 border-dashed border-border">
              <div className="text-sm text-muted-foreground mb-1">Check-in</div>
              {todayAttendance?.check_in_time ? (
                <div>
                  <div className={`font-bold ${
                    todayAttendance.status === 'late' ? 'text-orange-600' : 'text-success'
                  }`}>
                    {formatTimeWITA(todayAttendance.check_in_time)}
                  </div>
                  <div className="text-xs mt-1">
                    <Badge variant={todayAttendance.status === 'late' ? 'secondary' : 'default'} className="text-xs">
                      {todayAttendance.status === 'late' ? 'Terlambat' : 'Tepat Waktu'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {TARGET_LOCATION.name}
                  </div>
                </div>
              ) : todayAttendance?.check_out_time ? (
                <div>
                  <div className="text-red-600 font-bold text-xs mb-1">
                    Tidak Check-in
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    Terlambat
                  </Badge>
                </div>
              ) : (
                <div className="text-muted-foreground">Belum check-in</div>
              )}
            </div>

            <div className="text-center p-4 rounded-lg border-2 border-dashed border-border">
              <div className="text-sm text-muted-foreground mb-1">Check-out</div>
              {todayAttendance?.check_out_time ? (
                <div>
                  <div className="font-bold text-primary">
                    {formatTimeWITA(todayAttendance.check_out_time)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {TARGET_LOCATION.name}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">Belum check-out</div>
              )}
            </div>
          </div>

          {/* Status Indicator */}
          {!todayAttendance?.check_in_time && !todayAttendance?.check_out_time && (
            <div className="text-center text-sm mb-2">
              {(() => {
                const now = getNowMakassar();
                const hour = now.getHours();
                if (hour >= 12 && hour < 19) {
                  return (
                    <div className="text-red-600 font-medium">
                      🔴 Anda melewatkan waktu check-in. Klik untuk check-out dengan status TERLAMBAT
                    </div>
                  );
                } else if (hour >= 8 && hour < 12) {
                  return (
                    <div className="text-orange-600 font-medium">
                      ⚠️ Check-in sekarang akan berstatus TERLAMBAT
                    </div>
                  );
                } else if (hour >= 7 && hour < 8) {
                  return (
                    <div className="text-green-600 font-medium">
                      ✅ Check-in sekarang akan berstatus TEPAT WAKTU
                    </div>
                  );
                } else {
                  return (
                    <div className="text-gray-600">
                      Waktu check-in: 07:00 - 12:00 WITA.
                    </div>
                  );
                }
              })()}
            </div>
          )}
          
          {todayAttendance?.check_in_time && !todayAttendance?.check_out_time && (
            <div className="text-center text-sm mb-2">
              <div className="text-blue-600 font-medium">
                📋 Menunggu check-out (12:00 - 19:00 WITA)
              </div>
            </div>
          )}
          
          {(todayAttendance?.check_in_time && todayAttendance?.check_out_time) || (todayAttendance?.check_out_time && !todayAttendance?.check_in_time) ? (
            <div className="text-center text-sm mb-2">
              <div className="text-green-600 font-medium">
                ✅ Absensi hari ini sudah selesai
              </div>
            </div>
          ) : null}

          {/* Check-in/Check-out Button */}
          <Button
            onClick={handleCheckIn}
            disabled={isCheckingIn || !!(todayAttendance?.check_in_time && todayAttendance?.check_out_time) || !!(todayAttendance?.check_out_time && !todayAttendance?.check_in_time)}
            className="w-full h-14 text-lg gradient-primary shadow-blue"
          >
            {isCheckingIn ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Memproses...
              </div>
            ) : (todayAttendance?.check_in_time && todayAttendance?.check_out_time) ? (
              "Absensi Hari Ini Selesai"
            ) : !todayAttendance?.check_in_time ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {(() => {
                  const now = getNowMakassar();
                  const hour = now.getHours();
                  if (hour >= 12 && hour < 19) {
                    return "Check-out Terlambat";
                  } else {
                    return "Check-in Sekarang";
                  }
                })()}
              </div>
            ) : !todayAttendance?.check_out_time ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Check-out Sekarang
              </div>
            ) : (
              "Absensi Hari Ini Selesai"
            )}
          </Button>

          {!isInRange && (
            <p className="text-sm text-muted-foreground text-center">
              Mendekatlah ke kantor (radius 50m) untuk melakukan absensi
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceScreen;