import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  History, 
  DollarSign, 
  Headphones, 
  Settings, 
  Ticket,
  ChevronRight,
  Zap,
  Leaf,
  Clock,
  Mail
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Perfil() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [receiveNewsletters, setReceiveNewsletters] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");

  const handleLogout = async () => {
    await signOut();
    navigate("/auth/login");
  };

  return (
    <ResponsiveLayout showBottomNav>
      <div className="p-4 space-y-6">
        {/* Header com Avatar e Botão Editar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user?.email?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{user?.user_metadata?.full_name || "Usuário"}</h2>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
            Editar
          </Button>
        </div>

        {/* Card de Impacto Ambiental */}
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="flex justify-center gap-6 mb-3">
              <Zap className="w-6 h-6 text-primary" />
              <DollarSign className="w-6 h-6 text-primary" />
              <Leaf className="w-6 h-6 text-primary" />
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <p className="text-center font-semibold text-foreground mb-1">
              Descubra o impacto positivo
            </p>
            <p className="text-center text-sm text-muted-foreground">
              das suas viagens elétricas
            </p>
          </CardContent>
        </Card>

        {/* Grid de 3 Cards Principais */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow bg-muted/30">
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <Headphones className="w-8 h-8 text-foreground" />
              <span className="text-sm font-medium text-center">Ajuda</span>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow bg-muted/30">
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <DollarSign className="w-8 h-8 text-foreground" />
              <span className="text-sm font-medium text-center">Pagamento</span>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow bg-muted/30">
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <History className="w-8 h-8 text-foreground" />
              <span className="text-sm font-medium text-center">Histórico</span>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Email com Toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pl-8">
              <span className="text-sm text-muted-foreground">
                Receber novidades e promoções por email
              </span>
              <Switch 
                checked={receiveNewsletters}
                onCheckedChange={setReceiveNewsletters}
              />
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <div className="space-y-2">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 font-medium">Informações de cobrança</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <Ticket className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Cupons</p>
                <p className="text-sm text-muted-foreground">Nenhum cupom adicionado</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 font-medium">Configurações</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-muted-foreground">
            <button className="hover:underline">Termos de uso</button>
            {" • "}
            <button className="hover:underline">Política de privacidade</button>
          </p>
        </div>
      </div>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input 
                id="fullName" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Digite seu nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={user?.email || ""} 
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsEditDialogOpen(false)}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ResponsiveLayout>
  );
}
