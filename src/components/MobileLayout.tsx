import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
  header?: ReactNode;
}

export const MobileLayout = ({ children, header }: MobileLayoutProps) => {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background overflow-hidden">
      {header && (
        <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-40 max-w-md mx-auto">
          {header}
        </header>
      )}
      
      <main className={cn(
        "flex-1 flex flex-col pb-28 overflow-hidden",
        header && "pt-14"
      )}>
        {children}
      </main>
    </div>
  );
};
