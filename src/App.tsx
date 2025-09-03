import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const App = () => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-foreground border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in and at the root path, redirect to their dashboard.
  if (location.pathname === "/") {
    return <Navigate to={isAdmin ? "/admin" : "/employee"} replace />;
  }

  // For all other nested routes, render the appropriate child component.
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Outlet />
    </TooltipProvider>
  );
};

export default App;
