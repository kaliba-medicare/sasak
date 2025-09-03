import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileContainer from "@/components/ui/mobile-container";
import BottomNavigation from "@/components/BottomNavigation";
import AttendanceScreen from "./AttendanceScreen";
import HistoryScreen from "./HistoryScreen";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState<"absen" | "history">("absen");
  const { profile, signOut, loading } = useAuth();
  const { toast } = useToast();
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
      <MobileContainer>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      {/* Header */}
      <div className="gradient-primary text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-white/20">
              <AvatarFallback className="bg-white/20 text-white font-semibold">
                {profile.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-lg">{profile.name}</h2>
              <p className="text-white/80 text-sm">{profile.employee_id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <Bell className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* User Info Card */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-white">
              <div>
                <p className="text-white/70 text-sm">Posisi</p>
                <p className="font-medium">{profile.position}</p>
              </div>
              <div>
                <p className="text-white/70 text-sm">Departemen</p>
                <p className="font-medium">{profile.department}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="flex-1 bg-background">
        {activeTab === "absen" ? <AttendanceScreen /> : <HistoryScreen />}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </MobileContainer>
  );
};

export default DashboardPage;
