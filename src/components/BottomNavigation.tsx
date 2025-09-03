import { Clock, History, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: "absen" | "history";
  onTabChange: (tab: "absen" | "history") => void;
}

const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  const navItems = [
    {
      id: "absen" as const,
      label: "Absen",
      icon: Clock,
    },
    {
      id: "history" as const,
      label: "Riwayat",
      icon: History,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="max-w-sm mx-auto">
        <div className="flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex-1 py-3 px-4 flex flex-col items-center gap-1 transition-all",
                  isActive
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <div className="w-12 h-0.5 bg-primary rounded-full mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNavigation;