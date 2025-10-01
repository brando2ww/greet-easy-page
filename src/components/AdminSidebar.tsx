import { LayoutDashboard, Users, Zap, BarChart3, UserCircle, LogOut, Sparkles } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [menuOpen, setMenuOpen] = useState(false);

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
      <div className="relative flex">
        {/* Icon Sidebar - Always visible */}
        <div className="w-20 h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col items-center py-6 gap-6">
          {/* Logo */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
          >
            <Sparkles className="w-6 h-6 text-primary" />
          </button>

          <div className="w-12 h-px bg-border" />

          {/* Icon Menu Items */}
          <div className="flex-1 flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.path}
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200",
                        active
                          ? "bg-foreground text-background shadow-lg"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
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

          {/* User Avatar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={signOut}
                className="w-12 h-12 rounded-xl hover:bg-destructive/10 flex items-center justify-center transition-colors group"
              >
                <LogOut className="w-5 h-5 text-muted-foreground group-hover:text-destructive" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-foreground text-background">
              Sair
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Expanded Menu Panel */}
        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => setMenuOpen(false)}
            />

            {/* Menu Panel */}
            <div className="fixed left-20 top-0 h-screen w-80 bg-sidebar-background border-r border-sidebar-border shadow-2xl z-50 animate-slide-in-right">
              <div className="p-6 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-5 h-5 text-foreground" />
                  <h2 className="text-lg font-bold text-foreground">Menu</h2>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 space-y-1 overflow-y-auto">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                          active
                            ? "bg-foreground text-background shadow-md"
                            : "text-foreground hover:bg-sidebar-accent"
                        )}
                      >
                        <Icon className="w-5 h-5" strokeWidth={1.5} />
                        <span className="font-medium">{t(item.label)}</span>
                      </NavLink>
                    );
                  })}
                </div>

                {/* User Section */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sidebar-accent">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {getUserName()}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
};
