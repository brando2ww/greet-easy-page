import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Languages, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

export default function Configuracoes() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth/login");
  };

  // Obter nome do idioma atual
  const currentLanguageName = {
    pt: "Português",
    en: "English",
    es: "Español",
    zh: "中文"
  }[i18n.language] || "Português";

  return (
    <ResponsiveLayout showBottomNav>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/perfil")}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Configurações</h1>
        </div>

        {/* Lista de Configurações */}
        <div className="space-y-3">
          {/* País e Idioma */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <Languages className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">País e Idioma</p>
                <p className="text-sm text-muted-foreground">BR, {currentLanguageName}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>

          {/* Sair da conta */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleLogout}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <LogOut className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 font-medium">Sair da conta</span>
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
