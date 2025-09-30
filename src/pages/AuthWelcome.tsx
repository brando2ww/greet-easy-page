import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Battery, MapPin, Gauge } from "lucide-react";

const AuthWelcome = () => {
  const navigate = useNavigate();

  const features = [
    { icon: MapPin, text: "Encontre estações" },
    { icon: Battery, text: "Gerencie cargas" },
    { icon: Gauge, text: "Acompanhe consumo" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-primary/10 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <Card className="w-full max-w-md shadow-2xl animate-fade-in relative z-10 border-primary/20">
        <CardHeader className="text-center space-y-6 pb-4">
          {/* Animated logo */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center animate-scale-in shadow-lg shadow-primary/20 hover:scale-110 transition-transform duration-300">
            <Zap className="w-10 h-10 text-primary-foreground animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              SpeedCharger
            </CardTitle>
            <Badge variant="secondary" className="mx-auto">
              Veículos Elétricos
            </Badge>
          </div>

          <CardDescription className="text-base leading-relaxed px-2">
            Sua plataforma completa para gerenciar veículos elétricos
          </CardDescription>

          {/* Features badges */}
          <div className="flex justify-center gap-2 flex-wrap pt-2">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium animate-fade-in hover:bg-primary/20 transition-colors"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <feature.icon className="w-3.5 h-3.5" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-2">
          <Button 
            className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
            onClick={() => navigate("/auth/signup")}
          >
            <Zap className="w-4 h-4 mr-2" />
            Criar Conta
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-12 text-base font-medium hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02] hover:border-primary/50"
            onClick={() => navigate("/auth/login")}
          >
            Já tenho uma conta
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-2">
            Junte-se a milhares de usuários de veículos elétricos
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthWelcome;
