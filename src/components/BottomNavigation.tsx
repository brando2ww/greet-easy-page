import { MapPin, Wallet, Car, User } from "lucide-react";
import chargingIcon from "@/assets/charging-icon.png";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export const BottomNavigation = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { icon: MapPin, label: t('navigation.stations'), path: "/" },
    { icon: Wallet, label: t('navigation.wallet'), path: "/carteira" },
    { icon: Zap, label: t('navigation.chargingShort'), path: "/iniciar-carga" },
    { icon: Car, label: t('navigation.vehicles'), path: "/veiculos" },
    { icon: User, label: t('navigation.profile'), path: "/perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="relative max-w-md mx-auto">
        <div className="relative bg-background/95 backdrop-blur-lg border-t border-border rounded-t-3xl">
          <div className="flex justify-around items-center h-24 px-4 pb-8">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              const isCharging = item.path === "/iniciar-carga";
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 group relative",
                    isCharging ? "-mt-6 w-16" : "py-2 px-1 min-w-[60px]"
                  )}
                >
                  {isCharging ? (
                    <>
                      {/* Círculo animado para iniciar carga */}
                      <div className="relative z-20">
                        <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                          <Icon
                            strokeWidth={1.5}
                            className="w-8 h-8 text-background"
                          />
                        </div>
                      </div>
                      
                      {/* Label */}
                      <span className="text-[10px] transition-all duration-300 text-center leading-tight mt-1 text-muted-foreground group-hover:text-foreground">
                        {item.label}
                      </span>
                    </>
                  ) : (
                    <>
                      {/* Ícone normal */}
                      <Icon
                        strokeWidth={1.0}
                        className={cn(
                          "transition-all duration-300 ease-out",
                          isActive
                            ? "w-7 h-7 scale-110 text-foreground"
                            : "w-6 h-6 text-muted-foreground group-hover:scale-105 group-hover:text-foreground"
                        )} 
                      />
                      
                      {/* Label */}
                      <span className={cn(
                        "text-[10px] transition-all duration-300 text-center leading-tight",
                        isActive 
                          ? "font-semibold text-foreground" 
                          : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        {item.label}
                      </span>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
