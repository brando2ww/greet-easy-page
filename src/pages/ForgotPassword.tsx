import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import evChargingBg from "@/assets/ev-charging-bg.png";
import speedLogo from "@/assets/logo-speed.png";
import { LanguageSelector } from "@/components/LanguageSelector";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      setSent(true);
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${evChargingBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80 pointer-events-none" />

      <button
        onClick={() => navigate("/auth/login")}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-200"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">{t("common.back")}</span>
      </button>

      <div className="absolute top-6 right-6 z-20">
        <LanguageSelector variant="minimal" />
      </div>

      <div className="w-full max-w-sm space-y-8 animate-fade-in relative z-10">
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center relative p-3">
            <img src={speedLogo} alt="Speed Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-primary mx-auto" />
            <h1 className="text-white text-2xl font-bold">{t("auth.forgotPassword.sentTitle")}</h1>
            <p className="text-white/60 text-sm">{t("auth.forgotPassword.sentDescription")}</p>
            <Button
              onClick={() => navigate("/auth/login")}
              className="w-full h-14 text-base font-semibold bg-white hover:bg-white/90 text-black rounded-full transition-all duration-300 mt-6"
            >
              {t("auth.forgotPassword.backToLogin")}
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-white text-3xl font-bold tracking-tight">
                {t("auth.forgotPassword.title")}
              </h1>
              <p className="text-white/60 text-sm">
                {t("auth.forgotPassword.subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  type="email"
                  placeholder={t("auth.login.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-14 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-white/20 rounded-xl transition-all duration-200"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold bg-white hover:bg-white/90 text-black rounded-full transition-all duration-300 hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? t("common.loading") : t("auth.forgotPassword.submit")}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
