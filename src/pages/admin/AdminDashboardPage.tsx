import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Users, Clock, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import SasakLogo from "@/components/SasakLogo";

const AdminDashboardPage = () => {
  const { profile, signOut, loading, isAdmin } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Logout Gagal",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout Berhasil",
        description: "Anda telah berhasil logout",
      });
      // Redirect to login page
      navigate("/login");
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-screen gradient-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-foreground border-t-transparent"></div>
      </div>
    );
  }

  // Check if user is admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access the admin dashboard.</p>
          <Button onClick={() => navigate("/employee")}>Go to Employee Dashboard</Button>
        </div>
      </div>
    );
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-primary text-primary-foreground p-6 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <SasakLogo size="sm" />
              <div>
                <h1 className="text-2xl font-bold">SASAK - Admin Dashboard</h1>
                <p className="text-primary-foreground/80">{profile.name} - {profile.position}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          <nav className="flex gap-4">
            <Button
              asChild
              variant={isActive("/admin") || isActive("/admin/employees") ? "secondary" : "ghost"}
              className={isActive("/admin") || isActive("/admin/employees")
                ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                : "text-primary-foreground hover:bg-primary-foreground/10"
              }
            >
              <Link to="/admin/employees">
                <Users className="w-4 h-4 mr-2" />
                Manajemen Pegawai
              </Link>
            </Button>
            <Button
              asChild
              variant={isActive("/admin/today-attendance") ? "secondary" : "ghost"}
              className={isActive("/admin/today-attendance")
                ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                : "text-primary-foreground hover:bg-primary-foreground/10"
              }
            >
              <Link to="/admin/today-attendance">
                <Clock className="w-4 h-4 mr-2" />
                Absen Hari ini
              </Link>
            </Button>
            <Button
              asChild
              variant={isActive("/admin/monthly-attendance") ? "secondary" : "ghost"}
              className={isActive("/admin/monthly-attendance")
                ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                : "text-primary-foreground hover:bg-primary-foreground/10"
              }
            >
              <Link to="/admin/monthly-attendance">
                <Calendar className="w-4 h-4 mr-2" />
                Rekap Bulanan
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboardPage;
