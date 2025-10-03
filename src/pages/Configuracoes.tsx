import { useState } from "react";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChevronLeft, ChevronRight, Languages, LogOut, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function Configuracoes() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { signOut } = useAuth();
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);

  const languages = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/auth/login");
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setLanguageSheetOpen(false);
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
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setLanguageSheetOpen(true)}
          >
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

        {/* Sheet de seleção de idioma */}
        <Sheet open={languageSheetOpen} onOpenChange={setLanguageSheetOpen}>
          <SheetContent side="bottom" className="h-[50vh]">
            <SheetHeader>
              <SheetTitle>Selecione o idioma</SheetTitle>
            </SheetHeader>
            <div className="space-y-2 mt-6">
              {languages.map((lang) => (
                <Card
                  key={lang.code}
                  className={cn(
                    "cursor-pointer hover:shadow-md transition-shadow",
                    lang.code === i18n.language && "border-primary"
                  )}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="flex-1 font-medium">{lang.name}</span>
                    {lang.code === i18n.language && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </ResponsiveLayout>
  );
}
