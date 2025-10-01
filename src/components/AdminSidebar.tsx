import { LayoutDashboard, Users, Zap, BarChart3, UserCircle, LogOut } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import speedLogo from "@/assets/speed-logo.png";

const navItems = [
  { icon: LayoutDashboard, label: 'admin.dashboard', path: '/admin/dashboard' },
  { icon: Users, label: 'admin.clients', path: '/admin/clientes' },
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
    <TooltipProvider delayDuration={0}>
      <div className="w-[70px] h-screen bg-[#0A0A0B] flex flex-col items-center py-6 gap-6">
        {/* Logo */}
        <NavLink to="/admin/dashboard" className="mb-2">
          <img src={speedLogo} alt="Speed" className="w-10 h-10 object-contain" />
        </NavLink>

        <div className="w-10 h-px bg-white/10" />

        {/* Navigation Icons */}
        <div className="flex-1 flex flex-col gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.path}
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200",
                      active
                        ? "bg-primary text-white shadow-lg shadow-primary/50"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-foreground text-background">
                  {t(item.label)}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* User Avatar with Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button className="w-12 h-12 rounded-full hover:ring-2 hover:ring-primary/50 transition-all">
                  <Avatar className="h-12 w-12 border-2 border-white/10">
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-foreground text-background">
              {getUserName()}
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent side="right" align="end" className="w-56 bg-popover">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{getUserName()}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <NavLink to="/perfil" className="cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4" />
                <span>{t('profile.title')}</span>
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
};
