import { MapPin, Lightbulb, Zap, Car, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export const BottomNavigation = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { icon: MapPin, label: t('navigation.stations'), path: "/" },
    { icon: Lightbulb, label: t('navigation.tips'), path: "/dicas" },
    { icon: Zap, label: t('navigation.chargingShort'), path: "/iniciar-carga" },
    { icon: Car, label: t('navigation.vehicles'), path: "/veiculos" },
    { icon: User, label: t('navigation.profile'), path: "/perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black rounded-t-3xl z-50">
      <div className="flex justify-around items-center h-20 max-w-md mx-auto px-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center justify-center transition-colors duration-300",
                isActive
                  ? "text-[hsl(var(--active-nav))]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-7 h-7" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
