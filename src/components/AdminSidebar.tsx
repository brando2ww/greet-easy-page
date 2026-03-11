import { LayoutDashboard, Zap, BarChart3, Wallet, UserCircle, LogOut } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import speedLogo from "@/assets/speed_logo_04-2.png";

const navItems = [
  { icon: LayoutDashboard, label: 'admin.dashboard', path: '/admin/dashboard' },
  { icon: Wallet, label: 'adminWallet.title', path: '/admin/carteira' },
  { icon: Zap, label: 'admin.chargers', path: '/admin/carregadores' },
  { icon: BarChart3, label: 'admin.reports', path: '/admin/relatorios' },
  { icon: UserCircle, label: 'profile.title', path: '/perfil' },
];

export const AdminSidebar = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;
  
  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };
  
  const getUserName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0];
    return "Usuário";
  };

  return (
    <div className="w-[280px] h-screen bg-white border-r border-border flex flex-col py-6">
      {/* Header com Logo */}
      <div className="flex items-center gap-3 mb-6 px-6">
        <NavLink to="/admin/dashboard" className="flex items-center gap-3">
          <img src={speedLogo} alt="Speed" className="w-8 h-8 object-contain" />
          <span className="text-foreground font-semibold text-lg">Speed</span>
        </NavLink>
      </div>

      <div className="h-px bg-border mx-6 mb-4" />

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2 px-3 overflow-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                active
                  ? "bg-green-50 text-green-600 border-l-4 border-green-400 font-medium"
                  : "text-muted-foreground hover:bg-green-50 hover:text-green-600 border-l-4 border-transparent"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
              <span className="text-sm whitespace-nowrap overflow-hidden">
                {t(item.label)}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="px-3 pt-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 border-2 border-border">
            <AvatarFallback className="bg-green-50 text-green-600 font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-foreground truncate">{getUserName()}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};
