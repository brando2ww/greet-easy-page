import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileLayout } from "./MobileLayout";
import { Header } from "./Header";
import { BottomNavigation } from "./BottomNavigation";
import { AdminNavigation } from "./AdminNavigation";
import { AdminSidebar } from "./AdminSidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface ResponsiveLayoutProps {
  children: ReactNode;
  mobileHeader?: ReactNode;
  showBottomNav?: boolean;
}

export const ResponsiveLayout = ({ children, mobileHeader, showBottomNav = false }: ResponsiveLayoutProps) => {
  const isMobile = useIsMobile();
  const { isAdmin, isSupport, roleLoading } = useUserRole();

  if (isMobile) {
    return (
      <>
        <MobileLayout header={mobileHeader}>{children}</MobileLayout>
        {showBottomNav && !roleLoading && (isAdmin || isSupport) && <AdminNavigation />}
        {showBottomNav && !roleLoading && !isAdmin && !isSupport && <BottomNavigation />}
      </>
    );
  }

  if (isAdmin || isSupport) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AdminSidebar />
          <div className="flex flex-col flex-1">
            <header className="sticky top-0 z-10 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-full items-center justify-between px-6">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground transition-colors" />
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-foreground">
                      SpeedCharger Admin
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Gerencie sua plataforma
                    </p>
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-1">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};
