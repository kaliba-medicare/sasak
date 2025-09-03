import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LogIn, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import SasakLogo from "@/components/SasakLogo";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { signIn, user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't do anything while auth status is loading.
    if (loading) {
      return;
    }

    // If loading is finished and user is logged in, redirect.
    if (user && profile) {
      toast({
        title: "Login Berhasil",
        description: "Mengarahkan ke dasbor...",
      });
      if (profile.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/employee', { replace: true });
      }
    }
  }, [user, profile, loading, navigate, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim whitespace from inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedEmail || !trimmedPassword) {
      toast({
        title: "Login Gagal",
        description: "Email dan password harus diisi",
        variant: "destructive",
      });
      console.log("Toast called for empty fields");
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: "Login Gagal",
        description: "Format email tidak valid",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await signIn(trimmedEmail, trimmedPassword);
    
    if (error) {
      console.log("Authentication error occurred:", error);
      let errorMessage = "Terjadi kesalahan yang tidak diketahui";
      
      // Handle specific Supabase authentication errors
      switch (error.message) {
        case "Invalid login credentials":
          errorMessage = "Email atau password yang Anda masukkan salah";
          break;
        case "Email not confirmed":
          errorMessage = "Email belum dikonfirmasi. Silakan periksa inbox email Anda";
          break;
        case "Too many requests":
          errorMessage = "Terlalu banyak percobaan login. Silakan coba lagi nanti";
          break;
        case "User not found":
          errorMessage = "Akun dengan email tersebut tidak ditemukan";
          break;
        default:
          // Handle other common error patterns
          if (error.message.toLowerCase().includes("invalid") && error.message.toLowerCase().includes("credential")) {
            errorMessage = "Email atau password yang Anda masukkan salah";
          } else if (error.message.toLowerCase().includes("email")) {
            errorMessage = "Format email tidak valid";
          } else if (error.message.toLowerCase().includes("password")) {
            errorMessage = "Password tidak valid";
          } else if (error.message.toLowerCase().includes("network")) {
            errorMessage = "Koneksi internet bermasalah. Silakan coba lagi";
          } else {
            errorMessage = error.message || "Terjadi kesalahan saat login";
          }
          break;
      }
      
      console.log("Showing toast with message:", errorMessage);
      toast({
        title: "Login Gagal",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    setIsSubmitting(false);
  };

  // Show a full-page loader while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-foreground border-t-transparent"></div>
      </div>
    );
  }

  // After loading, if user is not logged in, show the login form.
  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4 gradient-primary">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-4">
            <SasakLogo size="lg" className="mx-auto" />
            <div>
              <p className="text-primary-foreground/90 text-lg font-medium mb-1">
                Sistem Absensi Sederhana untuk 
              </p>
              <p className="text-primary-foreground/90 text-lg font-medium mb-1">
                Aparatur Kontrak
              </p>
            </div>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2 justify-center">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Masuk Akun</h2>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Masukkan kredensial Anda untuk mengakses sistem
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contoh@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 gradient-primary shadow-blue"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Memproses...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Masuk
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-primary-foreground/70 space-y-2">
            <p>© 2025 SASAK - Sistem Absensi Aparatur Kontrak</p>
            <p>Hubungi administrator untuk bantuan akses akun</p>
            <div className="text-xs text-primary-foreground/50 mt-3">
              Dikembangkan untuk efisiensi pengelolaan kehadiran pegawai kontrak
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
};

export default LoginPage;
