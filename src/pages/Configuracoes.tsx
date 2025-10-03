import { useState, useEffect } from "react";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChevronLeft, ChevronRight, Languages, LogOut, Check, Download, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Configuracoes() {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed (running in standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone || 
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Listen for install prompt availability
    const handleInstallable = () => {
      setIsInstallable(true);
    };

    window.addEventListener('pwa-installable', handleInstallable);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
    };
  }, []);

  const languages = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setLanguageSheetOpen(false);
  };

  const handleInstallClick = async () => {
    if ((window as any).showInstallPrompt) {
      const accepted = await (window as any).showInstallPrompt();
      if (accepted) {
        toast({
          title: "App Instalado!",
          description: "Speed Charger foi instalado com sucesso.",
        });
        setIsInstallable(false);
      }
    }
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
          <h1 className="text-xl font-bold">{t('settings.title')}</h1>
        </div>

        {/* Lista de Configurações */}
        <div className="space-y-3">
          {/* Instalar App - Show only if installable and not standalone */}
          {isInstallable && !isStandalone && (
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow border-primary/50 bg-primary/5"
              onClick={handleInstallClick}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <Download className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-primary">Instalar App</p>
                  <p className="text-sm text-muted-foreground">Acesso rápido e offline</p>
                </div>
                <ChevronRight className="w-5 h-5 text-primary" />
              </CardContent>
            </Card>
          )}

          {/* App Instalado - Show only if running standalone */}
          {isStandalone && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-600">App Instalado</p>
                  <p className="text-sm text-muted-foreground">Funcionando em modo nativo</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* iOS Install Instructions - Show if not Chrome and not standalone */}
          {!isInstallable && !isStandalone && /iPhone|iPad|iPod/.test(navigator.userAgent) && (
            <Card className="border-blue-500/50 bg-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-600 mb-1">Instalar no iOS</p>
                    <p className="text-sm text-muted-foreground">
                      Para instalar no iPhone/iPad:
                    </p>
                  </div>
                </div>
                <ol className="text-sm text-muted-foreground space-y-1 ml-8 list-decimal">
                  <li>Toque no botão Compartilhar (
                    <span className="inline-block align-middle">
                      <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                      </svg>
                    </span>
                    )
                  </li>
                  <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
                  <li>Toque em "Adicionar"</li>
                </ol>
              </CardContent>
            </Card>
          )}

          {/* País e Idioma */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setLanguageSheetOpen(true)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Languages className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t('settings.countryAndLanguage')}</p>
                <p className="text-sm text-muted-foreground">{currentLanguageName}</p>
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
              <span className="flex-1 font-medium">{t('settings.logout')}</span>
            </CardContent>
          </Card>
        </div>

        {/* Sheet de seleção de idioma */}
        <Sheet open={languageSheetOpen} onOpenChange={setLanguageSheetOpen}>
          <SheetContent side="bottom" className="h-[50vh]">
            <SheetHeader>
              <SheetTitle>{t('settings.selectLanguage')}</SheetTitle>
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
