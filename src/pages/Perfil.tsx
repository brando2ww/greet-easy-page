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

const menuItems = [
  { icon: User, label: "Dados Pessoais", path: "/perfil/dados" },
  { icon: History, label: "Histórico de Cargas", path: "/perfil/historico" },
  { icon: CreditCard, label: "Formas de Pagamento", path: "/perfil/pagamento" },
  { icon: Wallet, label: "Carteira", path: "/perfil/carteira" },
  { icon: Bell, label: "Notificações", path: "/perfil/notificacoes" },
  { icon: Settings, label: "Configurações", path: "/perfil/configuracoes" },
  { icon: HelpCircle, label: "Ajuda e Suporte", path: "/perfil/ajuda" },
];

export default function Perfil() {
  return (
    <ResponsiveLayout>
      <div className="p-4 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold">João da Silva</h2>
                <p className="text-sm text-muted-foreground">joao@email.com</p>
              </div>
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

        <Button variant="destructive" className="w-full" size="lg">
          <LogOut className="w-5 h-5 mr-2" />
          Sair da Conta
        </Button>
      </div>
    </ResponsiveLayout>
  );
}
