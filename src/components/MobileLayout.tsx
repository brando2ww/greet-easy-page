import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
  header?: ReactNode;
}

export const MobileLayout = ({ children, header }: MobileLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-background">
      {header && (
        <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-40 max-w-md mx-auto">
          {header}
        </header>
      )}
      
      <main className={cn(
        "flex-1 pb-16",
        header && "pt-14"
      )}>
        {children}
      </main>
      
      <BottomNavigation />
    </div>
  );
};
