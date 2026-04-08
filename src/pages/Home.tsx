import { ArrowRight, Clock, Battery, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useChargingHistory } from "@/hooks/useChargingHistory";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import speedLogo from "@/assets/nexcharge-logo-new.png";
import chargerStation from "@/assets/charger-station.png";
import evCarIcon from "@/assets/ev-car-icon.png";
import { format } from "date-fns";

const actionCards = [
  { key: "stations", path: "/estacoes" },
  { key: "startCharging", path: "/iniciar-carga" },
];

export default function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: sessions } = useChargingHistory();

  const fullName = user?.user_metadata?.full_name || t("profile.user");
  const firstName = fullName.split(" ")[0];
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const recentSessions = sessions?.slice(0, 3) || [];

  const homeHeader = (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={firstName} />}
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-bold text-foreground">Hey! {firstName}</p>
          <p className="text-xs text-muted-foreground">Ready to have a ride today?</p>
        </div>
      </div>
      <Button variant="outline" size="icon" className="relative rounded-full">
        <Bell size={18} strokeWidth={2} />
        <Badge className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 text-[10px] flex items-center justify-center">
          3
        </Badge>
      </Button>
    </div>
  );

  return (
    <ResponsiveLayout showBottomNav mobileHeader={homeHeader} noBorder>
      <div className="px-4 pt-6 space-y-6 pb-32">
        {/* Logo */}
        <img src={speedLogo} alt="Nexcharge" className="h-10" />

        {/* Action Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {actionCards.map((card) => (
              <Link key={card.key} to={card.path}>
                <Card className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer h-full border-border/50 min-h-[200px] relative overflow-hidden active:scale-[0.97]">
                  {card.key === "stations" && (
                    <img
                      src={chargerStation}
                      alt=""
                      className="absolute top-8 left-4 h-20 object-contain pointer-events-none"
                    />
                  )}
                  {card.key === "startCharging" && (
                    <img
                      src={evCarIcon}
                      alt=""
                      className="absolute top-8 left-4 h-20 object-contain pointer-events-none"
                    />
                  )}
                  <div className="flex flex-col h-full justify-end gap-3 relative z-10">
                    <span className="font-semibold text-base text-foreground">
                      {t(`home.${card.key}`)}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-background" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
        </div>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {t("home.recent")}
            </h2>
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <Card key={session.id} className="p-3 border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Battery className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {session.charger?.name || t("home.chargingSession")}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {session.startedAt
                            ? format(new Date(session.startedAt), "dd/MM · HH:mm")
                            : "—"}
                        </span>
                        {session.energyConsumed != null && (
                          <span className="ml-1">· {session.energyConsumed.toFixed(1)} kWh</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground capitalize">
                      {session.status === "completed"
                        ? t("wallet.statusCompleted")
                        : session.status === "in_progress"
                        ? t("home.inProgress")
                        : session.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
}