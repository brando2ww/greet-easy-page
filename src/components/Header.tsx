import { MapPin, Lightbulb, Zap, Car, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: MapPin, label: "Estações", path: "/" },
  { icon: Lightbulb, label: "Dicas", path: "/dicas" },
  { icon: Zap, label: "Iniciar Carga", path: "/iniciar-carga" },
  { icon: Car, label: "Veículos", path: "/veiculos" },
  { icon: User, label: "Perfil", path: "/perfil" },
];

export const Header = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 bg-background border-b border-border z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Zap className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold text-foreground">SpeedCharger</span>
        </Link>
        
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
