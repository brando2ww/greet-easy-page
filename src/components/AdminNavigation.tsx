import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, Zap, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AdminNavigation = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    {
      icon: LayoutDashboard,
      label: t('admin.dashboard'),
      path: '/admin/dashboard'
    },
    {
      icon: Users,
      label: t('admin.clients'),
      path: '/admin/clientes'
    },
    {
      icon: Zap,
      label: t('admin.chargers'),
      path: '/admin/carregadores'
    },
    {
      icon: BarChart3,
      label: t('admin.reports'),
      path: '/admin/relatorios'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="relative max-w-md mx-auto">
        <div className="relative bg-background/95 backdrop-blur-lg border-t border-border rounded-t-3xl">
          <div className="flex justify-around items-center h-24 px-4 pb-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center justify-center gap-1 min-w-[60px] py-2 px-1 group"
                >
                  <Icon
                    strokeWidth={1.0}
                    className={cn(
                      "transition-all duration-300 ease-out",
                      isActive
                        ? "w-7 h-7 scale-110 text-foreground"
                        : "w-6 h-6 text-muted-foreground group-hover:scale-105 group-hover:text-foreground"
                    )} 
                  />
                  
                  <span className={cn(
                    "text-[10px] transition-all duration-300 text-center leading-tight",
                    isActive 
                      ? "font-semibold text-foreground" 
                      : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
