import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileLayout } from "./MobileLayout";
import { Header } from "./Header";
import { BottomNavigation } from "./BottomNavigation";
import { AdminNavigation } from "./AdminNavigation";
import { useUserRole } from "@/hooks/useUserRole";

interface ResponsiveLayoutProps {
  children: ReactNode;
  mobileHeader?: ReactNode;
  showBottomNav?: boolean;
}

export const ResponsiveLayout = ({ children, mobileHeader, showBottomNav = false }: ResponsiveLayoutProps) => {
  const isMobile = useIsMobile();
  const { isAdmin, isSupport } = useUserRole();

  if (isMobile) {
    return (
      <>
        <MobileLayout header={mobileHeader}>{children}</MobileLayout>
        {showBottomNav && (isAdmin || isSupport) && <AdminNavigation />}
        {showBottomNav && !isAdmin && !isSupport && <BottomNavigation />}
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      {showBottomNav && (isAdmin || isSupport) && <AdminNavigation />}
      {showBottomNav && !isAdmin && !isSupport && <BottomNavigation />}
    </div>
  );
};
