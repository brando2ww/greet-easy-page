import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import evChargingBg from "@/assets/ev-charging-bg.png";
import newLogo from "@/assets/logo-speed.png";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";

const AuthWelcome = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-end bg-black p-6 pb-8 relative overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${evChargingBg})` }}
      />
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black pointer-events-none" />
      
      {/* Language selector in top right */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageSelector variant="minimal" />
      </div>
      
      {/* Content container */}
      <div className="w-full max-w-sm space-y-8 animate-fade-in relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-16 h-16 flex items-center justify-center">
            <img src={newLogo} alt="Speed Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-4 mb-16">
          <h1 className="text-white text-4xl font-bold leading-tight tracking-tight">
            {t('auth.welcome.title')}
          </h1>
          <p className="text-white/90 text-xl leading-relaxed font-light">
            {t('auth.welcome.subtitle')}
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button 
            className="w-full h-14 text-base font-medium bg-white hover:bg-white/90 text-black rounded-full transition-all duration-300"
            onClick={() => navigate("/auth/signup")}
          >
            {t('auth.welcome.signup')}
          </Button>
          <Button 
            variant="outline"
            className="w-full h-14 text-base font-medium bg-transparent hover:bg-white/10 text-white border-white/30 hover:border-white/50 rounded-full transition-all duration-300"
            onClick={() => navigate("/auth/login")}
          >
            {t('auth.welcome.login')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthWelcome;
