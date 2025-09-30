import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  User, 
  History, 
  CreditCard, 
  Wallet, 
  Bell, 
  Settings, 
  HelpCircle, 
  LogOut,
  ChevronRight 
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function Perfil() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: t('common.success'),
        description: t('profile.logout'),
      });
      navigate("/auth/login");
    } catch (error) {
      toast({
        title: t('common.error'),
        description: "Erro ao sair",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { icon: User, label: t('profile.myAccount'), path: "/perfil/dados" },
    { icon: History, label: "Histórico de Cargas", path: "/perfil/historico" },
    { icon: CreditCard, label: "Formas de Pagamento", path: "/perfil/pagamento" },
    { icon: Wallet, label: "Carteira", path: "/perfil/carteira" },
    { icon: Bell, label: t('profile.notifications'), path: "/perfil/notificacoes" },
    { icon: Settings, label: t('profile.settings'), path: "/perfil/configuracoes" },
    { icon: HelpCircle, label: t('profile.help'), path: "/perfil/ajuda" },
  ];
  return (
    <ResponsiveLayout showBottomNav>
      <div className="p-4 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {user?.email?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{user?.user_metadata?.full_name || "Usuário"}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium">{t('profile.language')}</span>
              </div>
              <LanguageSelector />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.path} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="flex-1 font-medium">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button variant="destructive" className="w-full" size="lg" onClick={handleLogout}>
          <LogOut className="w-5 h-5 mr-2" />
          {t('profile.logout')}
        </Button>
      </div>
    </ResponsiveLayout>
  );
}
