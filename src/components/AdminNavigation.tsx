import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, Zap, BarChart3, UserCircle } from 'lucide-react';
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
    },
    {
      icon: UserCircle,
      label: t('profile.title'),
      path: '/perfil'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="relative max-w-md mx-auto">
        <div className="relative bg-background/95 backdrop-blur-lg border-t border-border rounded-t-3xl">
          {/* Left notch curve */}
          <div className="absolute left-[calc(50%-50px)] -top-5 w-10 h-10 bg-transparent">
            <div className="absolute bottom-0 left-0 w-full h-full bg-background/95 backdrop-blur-lg rounded-br-[100%]" />
          </div>
          {/* Right notch curve */}
          <div className="absolute right-[calc(50%-50px)] -top-5 w-10 h-10 bg-transparent">
            <div className="absolute bottom-0 right-0 w-full h-full bg-background/95 backdrop-blur-lg rounded-bl-[100%]" />
          </div>
          
          <div className="flex justify-around items-end h-24 px-4 pb-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              const isChargerItem = item.path === '/admin/carregadores';
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 min-w-[60px] py-2 px-1 group",
                    isChargerItem ? "-mt-6" : "pb-2"
                  )}
                >
                  {isChargerItem ? (
                    <div className="relative z-10">
                      <div className={cn(
                        "rounded-full bg-gradient-to-br from-purple-400 via-purple-600 via-purple-700 to-purple-950 shadow-lg shadow-purple-500/50 transition-all duration-300 w-16 h-16 flex items-center justify-center",
                        "group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-purple-500/60",
                        isActive && "scale-110 shadow-xl shadow-purple-500/60"
                      )}>
                        <Icon
                          strokeWidth={1.5}
                          className="w-8 h-8 text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <Icon
                      strokeWidth={1.0}
                      className={cn(
                        "transition-all duration-300 ease-out",
                        isActive
                          ? "w-7 h-7 scale-110 text-foreground"
                          : "w-6 h-6 text-muted-foreground group-hover:scale-105 group-hover:text-foreground"
                      )} 
                    />
                  )}
                  
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
