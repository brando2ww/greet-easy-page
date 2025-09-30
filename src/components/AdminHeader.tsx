import { LayoutDashboard, Users, Zap, BarChart3, UserCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export const AdminHeader = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { icon: LayoutDashboard, label: t('admin.dashboard'), path: '/admin/dashboard' },
    { icon: Users, label: t('admin.clients'), path: '/admin/clientes' },
    { icon: Zap, label: t('admin.chargers'), path: '/admin/carregadores', special: true },
    { icon: BarChart3, label: t('admin.reports'), path: '/admin/relatorios' },
    { icon: UserCircle, label: t('profile.title'), path: '/perfil' },
  ];

  return (
    <header className="sticky top-0 bg-background border-b border-border z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <Zap className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold text-foreground">SpeedCharger Admin</span>
        </Link>
        
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const isChargerItem = item.special;
            
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-4 py-2 rounded-md transition-all duration-300",
                    isChargerItem ? "flex flex-col items-center gap-1" : "flex items-center gap-2",
                    !isChargerItem && (isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground")
                  )}
                >
                  {isChargerItem ? (
                    <>
                      <div className={cn(
                        "rounded-full bg-gradient-to-br from-purple-400 via-purple-600 via-purple-700 to-purple-950 shadow-lg shadow-purple-500/50 transition-all duration-300 w-12 h-12 flex items-center justify-center",
                        "hover:scale-125 hover:shadow-2xl hover:shadow-purple-500/70",
                        isActive && "scale-110 shadow-2xl shadow-purple-500/70"
                      )}>
                        <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                      </div>
                      <span className="font-medium text-sm">{item.label}</span>
                    </>
                  ) : (
                    <>
                      <Icon className="w-5 h-5" strokeWidth={1.0} />
                      <span className="font-medium">{item.label}</span>
                    </>
                  )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
