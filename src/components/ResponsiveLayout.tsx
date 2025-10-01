import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileLayout } from "./MobileLayout";
import { Header } from "./Header";
import { BottomNavigation } from "./BottomNavigation";
import { AdminNavigation } from "./AdminNavigation";
import { AdminSidebar } from "./AdminSidebar";
import { useUserRole } from "@/hooks/useUserRole";

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
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <main className="flex-1">
          {children}
        </main>
      </div>
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
