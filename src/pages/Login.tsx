import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import evChargingBg from "@/assets/ev-charging-bg.png";
import speedLogo from "@/assets/speed-logo.png";
import { LanguageSelector } from "@/components/LanguageSelector";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('auth.login.title'),
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6 relative overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${evChargingBg})` }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80 pointer-events-none" />
      
      {/* Back button */}
      <button
        onClick={() => navigate("/auth")}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-200 animate-fade-in"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">{t('common.back')}</span>
      </button>

      {/* Language selector */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageSelector variant="minimal" />
      </div>
      
      {/* Content container */}
      <div className="w-full max-w-sm space-y-8 animate-fade-in relative z-10">
        {/* Logo with glow effect */}
        <div className="flex justify-center mb-8">
          <div 
            className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center relative p-3"
            style={{
              boxShadow: `
                0 0 60px 20px hsla(var(--primary) / 0.3),
                0 0 100px 40px hsla(var(--primary) / 0.2),
                0 0 140px 60px hsla(var(--primary) / 0.1)
              `
            }}
          >
            <img src={speedLogo} alt="Speed Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-white text-3xl font-bold tracking-tight">
            {t('auth.login.title')}
          </h1>
          <p className="text-white/60 text-sm">
            {t('auth.login.subtitle')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          {/* Email field */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              id="email"
              type="email"
              placeholder={t('auth.login.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-14 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-white/20 rounded-xl transition-all duration-200"
            />
          </div>

          {/* Password field */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              id="password"
              type="password"
              placeholder={t('auth.login.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-14 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-white/20 rounded-xl transition-all duration-200"
            />
          </div>

          {/* Forgot password link */}
          <div className="text-right">
            <a href="#" className="text-sm text-white/50 hover:text-white/80 transition-colors duration-200">
              {t('auth.login.forgotPassword')}
            </a>
          </div>

          {/* Submit button */}
          <Button 
            type="submit" 
            className="w-full h-14 text-base font-semibold bg-white hover:bg-white/90 text-black rounded-full transition-all duration-300 hover:scale-[1.02]" 
            disabled={loading}
          >
            {loading ? t('common.loading') : t('auth.login.submit')}
          </Button>
        </form>

        {/* Sign up link */}
        <p className="text-center text-sm text-white/50 mt-6">
          {t('auth.login.noAccount')}{" "}
          <Link to="/auth/signup" className="text-white hover:text-white/80 font-medium underline underline-offset-2 transition-colors duration-200">
            {t('auth.login.signupLink')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
