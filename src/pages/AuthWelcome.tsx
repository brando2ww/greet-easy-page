import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

const AuthWelcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-end bg-black p-6 pb-8 relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/5 to-black pointer-events-none" />
      
      {/* Content container */}
      <div className="w-full max-w-sm space-y-8 animate-fade-in relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
            <Zap className="w-7 h-7 text-black" />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-4 mb-16">
          <h1 className="text-white text-4xl font-bold leading-tight tracking-tight">
            SpeedCharger —
          </h1>
          <p className="text-white/90 text-xl leading-relaxed font-light">
            sua plataforma para descobrir, gerenciar e otimizar o carregamento de veículos elétricos.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button 
            className="w-full h-14 text-base font-medium bg-white hover:bg-white/90 text-black rounded-full transition-all duration-300"
            onClick={() => navigate("/auth/signup")}
          >
            Sign up
          </Button>
          <Button 
            variant="outline"
            className="w-full h-14 text-base font-medium bg-transparent hover:bg-white/10 text-white border-white/30 hover:border-white/50 rounded-full transition-all duration-300"
            onClick={() => navigate("/auth/login")}
          >
            I have an account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthWelcome;
