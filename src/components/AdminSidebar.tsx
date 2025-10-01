import { LayoutDashboard, Users, Zap, BarChart3, UserCircle } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  Sidebar,
  SidebarContent,
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
  const collapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;
  const hasActiveItem = navItems.some((item) => isActive(item.path));

  return (
    <Sidebar collapsible="icon" className={collapsed ? "w-16" : "w-64"}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-8 h-8 text-primary flex-shrink-0" />
          {!collapsed && (
            <span className="text-lg font-bold text-foreground">
              SpeedCharger Admin
            </span>
          )}
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && t('admin.navigation')}</SidebarGroupLabel>
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
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-300",
                            isChargerItem && "flex-col gap-1 py-4",
                            !isChargerItem && (isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground")
                          )
                        }
                      >
                        {isChargerItem ? (
                          <>
                            <div
                              className={cn(
                                "rounded-full bg-gradient-to-br from-purple-400 via-purple-600 via-purple-700 to-purple-950 shadow-lg shadow-purple-500/50 transition-all duration-300 w-12 h-12 flex items-center justify-center",
                                "hover:scale-110 hover:shadow-xl hover:shadow-purple-500/70",
                                active && "scale-110 shadow-xl shadow-purple-500/70"
                              )}
                            >
                              <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                            </div>
                            {!collapsed && (
                              <span className="font-medium text-sm">{t(item.label)}</span>
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
    </Sidebar>
  );
};
