import { LayoutDashboard, Zap, BarChart3, Wallet, UserCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export const AdminHeader = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { icon: LayoutDashboard, label: t('admin.dashboard'), path: '/admin/dashboard' },
    { icon: Wallet, label: t('adminWallet.title'), path: '/admin/carteira' },
    { icon: Zap, label: t('admin.chargers'), path: '/admin/carregadores', special: true },
    { icon: BarChart3, label: t('admin.reports'), path: '/admin/relatorios' },
    { icon: UserCircle, label: t('profile.title'), path: '/perfil' },
  ];

  return (
    <header className="sticky top-0 bg-background border-b border-border z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <Zap className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold text-foreground"><span className="text-xl font-bold text-foreground">Nexcharge Admin</span></span>
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
                      ? "bg-primary/5 text-primary"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-primary")
                  )}
                >
                  {isChargerItem ? (
                    <>
                      <div className={cn(
                        "rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/50 transition-all duration-300 w-12 h-12 flex items-center justify-center",
                        "hover:scale-125 hover:shadow-2xl hover:shadow-primary/70",
                        isActive && "scale-110 shadow-2xl shadow-primary/70"
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
