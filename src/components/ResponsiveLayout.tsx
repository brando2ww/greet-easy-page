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
            <header className="h-14 border-b border-border flex items-center px-4">
              <SidebarTrigger />
            </header>
            <main className="flex-1 container mx-auto px-4 py-6">
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
