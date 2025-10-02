import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  noBorder?: boolean;
}

export const MobileLayout = ({ children, header, noBorder }: MobileLayoutProps) => {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background overflow-hidden">
      {header && (
        <header className={cn(
          "fixed top-0 left-0 right-0 bg-background z-40 max-w-md mx-auto",
          !noBorder && "border-b border-border"
        )}>
          {header}
        </header>
      )}
      
      <main className={cn(
        "flex-1 flex flex-col pb-16 overflow-y-auto",
        header && "pt-14"
      )}>
        {children}
      </main>
    </div>
  );
};
