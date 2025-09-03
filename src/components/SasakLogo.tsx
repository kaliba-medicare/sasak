import { cn } from "@/lib/utils";

interface SasakLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SasakLogo = ({ className, size = "md" }: SasakLogoProps) => {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-24 h-24"
  };

  return (
    <div className={cn(
      "relative flex items-center justify-center bg-white rounded-full shadow-lg",
      sizeClasses[size],
      className
    )}>
      {/* Main Logo Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Background Circle with Gradient */}
        <div className="absolute inset-1 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full"></div>
        
        {/* Logo Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-white">
          {/* SASAK Text */}
          <div className="font-bold text-lg leading-none mb-0.5">
            SASAK
          </div>
          
          {/* Attendance Icon */}
          <div className="flex items-center gap-0.5">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-2 right-2 w-1 h-1 bg-white/30 rounded-full"></div>
        <div className="absolute bottom-2 left-2 w-0.5 h-0.5 bg-white/30 rounded-full"></div>
      </div>
    </div>
  );
};

export default SasakLogo;