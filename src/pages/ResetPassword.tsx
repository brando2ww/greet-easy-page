import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import evChargingBg from "@/assets/ev-charging-bg.png";
import speedLogo from "@/assets/logo-speed.png";
import { LanguageSelector } from "@/components/LanguageSelector";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    // Also check if we already have a session (user clicked link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t("common.error"),
        description: t("auth.signup.passwordMismatch"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
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

      <div className="absolute top-6 right-6 z-20">
        <LanguageSelector variant="minimal" />
      </div>

      <div className="w-full max-w-sm space-y-8 animate-fade-in relative z-10">
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center relative p-3">
            <img src={speedLogo} alt="Speed Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-primary mx-auto" />
            <h1 className="text-white text-2xl font-bold">{t("auth.resetPassword.successTitle")}</h1>
            <p className="text-white/60 text-sm">{t("auth.resetPassword.successDescription")}</p>
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
                {t("auth.resetPassword.title")}
              </h1>
              <p className="text-white/60 text-sm">
                {t("auth.resetPassword.subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.resetPassword.newPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-14 pl-12 pr-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-white/20 rounded-xl transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.resetPassword.confirmPassword")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-14 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-white/20 rounded-xl transition-all duration-200"
                />
              </div>

              <p className="text-white/40 text-xs">{t("auth.signup.passwordHint")}</p>

              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold bg-white hover:bg-white/90 text-black rounded-full transition-all duration-300 hover:scale-[1.02]"
                disabled={loading || !sessionReady}
              >
                {loading ? t("common.loading") : t("auth.resetPassword.submit")}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
