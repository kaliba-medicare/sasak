import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const LocationTestPage = () => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testLocation = () => {
    setIsLoading(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      const errorMsg = "Geolocation tidak didukung oleh browser Anda";
      setLocationError(errorMsg);
      setIsLoading(false);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setIsLoading(false);
        toast({
          title: "Sukses",
          description: "Lokasi berhasil ditemukan",
        });
      },
      (error) => {
        let errorMsg = "";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Izin lokasi ditolak. Browser Anda memblokir akses lokasi untuk melindungi privasi Anda.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Informasi lokasi tidak tersedia. Pastikan GPS Anda aktif dan memiliki sinyal yang baik.";
            break;
          case error.TIMEOUT:
            errorMsg = "Permintaan lokasi timeout. Coba lagi atau periksa koneksi internet Anda.";
            break;
          default:
            errorMsg = `Error tidak dikenal: ${error.message}`;
            break;
        }
        setLocationError(errorMsg);
        setIsLoading(false);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  useEffect(() => {
    // Auto test on page load
    testLocation();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Test Lokasi</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Informasi Lokasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-2">Mendeteksi lokasi...</p>
            </div>
          ) : location ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Latitude:</div>
                <div>{location.coords.latitude}</div>
                
                <div className="font-medium">Longitude:</div>
                <div>{location.coords.longitude}</div>
                
                <div className="font-medium">Akurasi:</div>
                <div>{location.coords.accuracy} meter</div>
                
                <div className="font-medium">Timestamp:</div>
                <div>{new Date(location.timestamp).toLocaleString("id-ID")}</div>
              </div>
            </div>
          ) : locationError ? (
            <div className="text-destructive text-center">
              <p>Error: {locationError}</p>
            </div>
          ) : (
            <div className="text-muted-foreground text-center">
              Klik tombol di bawah untuk mendeteksi lokasi
            </div>
          )}
          
          <Button 
            onClick={testLocation} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Mendeteksi..." : "Test Lokasi"}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Cara Mengatasi Masalah Lokasi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Jika mengalami masalah lokasi, pastikan GPS aktif dan izin lokasi telah diberikan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationTestPage;