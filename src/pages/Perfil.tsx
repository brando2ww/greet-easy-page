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
  ChevronRight,
  Zap,
  Leaf,
  Clock,
  Mail
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { ChargingHistorySheet } from "@/components/ChargingHistorySheet";

export default function Perfil() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [receiveNewsletters, setReceiveNewsletters] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || "");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar estado local com user metadata
  useEffect(() => {
    if (user?.user_metadata) {
      setFullName(user.user_metadata.full_name || "");
      setAvatarUrl(user.user_metadata.avatar_url || "");
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth/login");
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const { error } = await supabase.auth.updateUser({
        data: { 
          full_name: fullName,
          avatar_url: avatarUrl
        }
      });

      if (error) throw error;

      // Forçar refresh do user no contexto
      await supabase.auth.getUser();
      
      toast.success(t('profile.profileUpdatedSuccess'));
      setIsEditSheetOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t('profile.profileUpdateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteAccount = async () => {
    // Placeholder para funcionalidade de exclusão de conta
    toast.error(t('profile.deleteNotImplemented'));
    setIsDeleteDialogOpen(false);
  };

  return (
    <ResponsiveLayout showBottomNav>
      <div className="p-4 space-y-6">
        {/* Header com Avatar e Botão Editar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user?.email?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{user?.user_metadata?.full_name || t('profile.user')}</h2>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditSheetOpen(true)}>
            {t('profile.edit')}
          </Button>
        </div>

        {/* Card de Impacto Ambiental */}
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="flex justify-center gap-6 mb-3">
              <Zap className="w-6 h-6 text-green-600" />
              <DollarSign className="w-6 h-6 text-green-600" />
              <Leaf className="w-6 h-6 text-green-600" />
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-center font-semibold text-foreground mb-1">
              {t('profile.impactTitle')}
            </p>
            <p className="text-center text-sm text-muted-foreground">
              {t('profile.impactSubtitle')}
            </p>
          </CardContent>
        </Card>

        {/* Grid de 3 Cards Principais */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow bg-muted/30">
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <Headphones className="w-8 h-8 text-foreground" />
              <span className="text-sm font-medium text-center">{t('profile.help')}</span>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow bg-muted/30"
            onClick={() => navigate("/carteira")}
          >
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <DollarSign className="w-8 h-8 text-foreground" />
              <span className="text-sm font-medium text-center">{t('profile.payment')}</span>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow bg-muted/30"
            onClick={() => setIsHistorySheetOpen(true)}
          >
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <History className="w-8 h-8 text-foreground" />
              <span className="text-sm font-medium text-center">{t('profile.history')}</span>
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
                {t('profile.newsletterLabel')}
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
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/perfil/informacoes-cobranca")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 font-medium">{t('profile.billingInfo')}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/perfil/configuracoes")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 font-medium">{t('profile.settings')}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-muted-foreground">
            <button className="hover:underline">{t('profile.termsOfUse')}</button>
            {" • "}
            <button className="hover:underline">{t('profile.privacyPolicy')}</button>
          </p>
        </div>
      </div>

      {/* Sheet de Edição */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-4 border-b p-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsEditSheetOpen(false)}
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </Button>
            <h1 className="text-xl font-bold">{t('profile.myAccount')}</h1>
          </div>

          {/* Conteúdo Scrollável */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <Avatar className="w-32 h-32">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                  {user?.email?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-primary hover:underline"
                >
                  {t('profile.uploadPhoto')}
                </button>
                {avatarUrl && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <button
                      onClick={handleRemoveAvatar}
                      className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {t('profile.removePhoto')}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Campo de Nome */}
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('profile.yourName')}</Label>
              <Input 
                id="fullName" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('profile.namePlaceholder')}
              />
            </div>
          </div>

          {/* Footer Fixo */}
          <div className="border-t p-6 space-y-4">
            <Button 
              className="w-full" 
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? t('profile.saving') : t('profile.saveChanges')}
            </Button>
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex items-center justify-center gap-2 w-full text-sm text-destructive hover:underline"
            >
              <Trash2 className="w-4 h-4" />
              {t('profile.deleteAccount')}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('profile.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('profile.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('profile.deleteAccount')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sheet de Histórico */}
      <ChargingHistorySheet 
        open={isHistorySheetOpen} 
        onOpenChange={setIsHistorySheetOpen} 
      />
    </ResponsiveLayout>
  );
}
