import { LayoutDashboard, Users, Zap, BarChart3, UserCircle, LogOut } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { icon: LayoutDashboard, label: 'admin.dashboard', path: '/admin/dashboard' },
  { icon: Users, label: 'admin.clients', path: '/admin/clientes' },
  { icon: Zap, label: 'admin.chargers', path: '/admin/carregadores', special: true },
  { icon: BarChart3, label: 'admin.reports', path: '/admin/relatorios' },
  { icon: UserCircle, label: 'profile.title', path: '/perfil' },
];

export const AdminSidebar = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { state } = useSidebar();
  const { user, signOut } = useAuth();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;
  const hasActiveItem = navItems.some((item) => isActive(item.path));
  
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
    <Sidebar collapsible="icon" className={collapsed ? "w-16" : "w-64"}>
      <div className="p-4 border-b border-sidebar-border bg-gradient-to-b from-sidebar-background to-sidebar-accent/30">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 flex-shrink-0">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold text-sidebar-foreground">
                SpeedCharger
              </span>
              <span className="text-xs text-muted-foreground">Admin Panel</span>
            </div>
          )}
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground">
            {!collapsed && "Navegação"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const isChargerItem = item.special;

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 relative",
                            isChargerItem && !collapsed && "flex-col gap-2 py-4",
                            isChargerItem && collapsed && "justify-center py-3",
                            !isChargerItem && (isActive
                              ? "bg-primary/10 text-primary font-semibold before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-8 before:bg-primary before:rounded-r-full"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")
                          )
                        }
                      >
                        {isChargerItem ? (
                          <>
                            <div
                              className={cn(
                                "rounded-full bg-gradient-to-br from-purple-400 via-purple-600 via-purple-700 to-purple-950 shadow-lg shadow-purple-500/50 transition-all duration-300 flex items-center justify-center",
                                collapsed ? "w-10 h-10" : "w-12 h-12",
                                "hover:scale-110 hover:shadow-xl hover:shadow-purple-500/70",
                                active && "scale-110 shadow-xl shadow-purple-500/70 ring-2 ring-primary/30 ring-offset-2 ring-offset-sidebar-background"
                              )}
                            >
                              <Icon className={cn("text-white", collapsed ? "w-5 h-5" : "w-6 h-6")} strokeWidth={1.5} />
                            </div>
                            {!collapsed && (
                              <span className="font-semibold text-sm text-sidebar-foreground">{t(item.label)}</span>
                            )}
                          </>
                        ) : (
                          <>
                            <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                            {!collapsed && (
                              <span className="font-medium">{t(item.label)}</span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border bg-sidebar-accent/30">
        <div className={cn("p-3", collapsed ? "flex justify-center" : "")}>
          {collapsed ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="hover:bg-destructive/10 hover:text-destructive"
              aria-label="Sair"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">
                  {getUserName()}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                aria-label="Sair"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
