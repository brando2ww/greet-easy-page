import { useState } from "react";
import { LayoutDashboard, Users, Zap, BarChart3, UserCircle, LogOut, Menu } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);

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
      <div className={cn(
        "h-screen bg-[#0A0A0B] flex flex-col py-6 transition-all duration-300",
        isExpanded ? "w-[280px]" : "w-[70px]"
      )}>
        {/* Header com Logo e Toggle */}
        <div className={cn(
          "flex items-center gap-3 mb-2 px-3",
          isExpanded ? "justify-between" : "justify-center"
        )}>
          {isExpanded ? (
            <>
              <NavLink to="/admin/dashboard" className="flex items-center gap-3">
                <img src={speedLogo} alt="Speed" className="w-8 h-8 object-contain" />
                <span className="text-white font-semibold text-lg">Speed</span>
              </NavLink>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className={cn(
          "h-px bg-white/10",
          isExpanded ? "w-full" : "w-10"
        )} />

        {/* Navigation Icons */}
        <div className="flex-1 flex flex-col gap-2 px-3 overflow-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            if (!isExpanded) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.path}
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 mx-auto",
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
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  active
                    ? "bg-white/5 text-white border-l-4 border-primary"
                    : "text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                  {t(item.label)}
                </span>
              </NavLink>
            );
          })}
        </div>

        {/* User Section */}
        {isExpanded ? (
          <div className="px-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10 border-2 border-white/10">
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{getUserName()}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        ) : (
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
        )}
      </div>
    </TooltipProvider>
  );
};
