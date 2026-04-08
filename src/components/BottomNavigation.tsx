import { House, MapPin, Zap, Wallet, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: House, path: "/" },
  { icon: MapPin, path: "/estacoes" },
  { icon: Zap, path: "/iniciar-carga" },
  { icon: Wallet, path: "/carteira" },
  { icon: User, path: "/perfil" },
];

export const BottomNavigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-6">
      <div className="flex items-center gap-2 bg-background rounded-full px-4 py-3 shadow-lg border border-border/50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex items-center justify-center w-12 h-12 rounded-full"
            >
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <Icon
                className={cn(
                  "relative z-10 w-5 h-5 transition-colors duration-200",
                  isActive
                    ? "text-primary-foreground"
                    : "text-background/60"
                )}
                strokeWidth={1.8}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
