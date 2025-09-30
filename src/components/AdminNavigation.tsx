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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex justify-around items-center h-20 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[70px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-6 w-6', isActive && 'scale-110')} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
