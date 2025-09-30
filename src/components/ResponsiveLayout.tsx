import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileLayout } from "./MobileLayout";
import { Header } from "./Header";

interface ResponsiveLayoutProps {
  children: ReactNode;
  mobileHeader?: ReactNode;
}

export const ResponsiveLayout = ({ children, mobileHeader }: ResponsiveLayoutProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileLayout header={mobileHeader}>{children}</MobileLayout>;
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
