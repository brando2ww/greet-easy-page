import { Navigation, Sparkles, Bolt, CarFront, UserCircle2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export const BottomNavigation = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { icon: Navigation, label: t('navigation.stations'), path: "/" },
    { icon: Sparkles, label: t('navigation.tips'), path: "/dicas" },
    { icon: Bolt, label: t('navigation.chargingShort'), path: "/iniciar-carga" },
    { icon: CarFront, label: t('navigation.vehicles'), path: "/veiculos" },
    { icon: UserCircle2, label: t('navigation.profile'), path: "/perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border rounded-t-3xl z-50">
      <div className="flex justify-around items-center h-20 max-w-md mx-auto px-4 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center gap-1 min-w-[60px] py-2 px-1 group"
            >
              {/* Indicador visual de página ativa */}
              <div className={cn(
                "w-1 h-1 rounded-full transition-all duration-300",
                isActive 
                  ? "bg-primary opacity-100 scale-100 animate-in fade-in zoom-in-95 duration-200" 
                  : "opacity-0 scale-0"
              )} />
              
              {/* Ícone com animação */}
              <Icon className={cn(
                "transition-all duration-300 ease-out",
                isActive
                  ? "w-7 h-7 scale-110 text-primary"
                  : "w-6 h-6 text-muted-foreground group-hover:scale-105 group-hover:text-foreground"
              )} />
              
              {/* Label */}
              <span className={cn(
                "text-[10px] transition-all duration-300 text-center leading-tight",
                isActive 
                  ? "font-semibold text-primary" 
                  : "text-muted-foreground group-hover:text-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
