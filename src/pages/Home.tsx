import { MapPin, Zap, ArrowRight, Clock, Battery } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useChargingHistory } from "@/hooks/useChargingHistory";
import { Card } from "@/components/ui/card";
import speedLogo from "@/assets/nexcharge-logo-new.png";
import { format } from "date-fns";

const actionCards = [
  { key: "stations", icon: MapPin, path: "/estacoes", color: "bg-blue-500/10 text-blue-500" },
  { key: "startCharging", icon: Zap, path: "/iniciar-carga", color: "bg-green-500/10 text-green-500" },
  { key: "wallet", icon: Wallet, path: "/carteira", color: "bg-amber-500/10 text-amber-500" },
  { key: "vehicles", icon: Car, path: "/veiculos", color: "bg-purple-500/10 text-purple-500" },
];

export default function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: sessions } = useChargingHistory();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || t("profile.user");
  const recentSessions = sessions?.slice(0, 3) || [];

  return (
    <ResponsiveLayout>
      <div className="px-4 pt-24 space-y-6 pb-32">
        {/* Logo */}
        <img src={speedLogo} alt="Nexcharge" className="h-10" />

        {/* Action Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {actionCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.key} to={card.path}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer h-full border-border/50">
                  <div className="flex flex-col gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">
                        {t(`home.${card.key}`)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
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
