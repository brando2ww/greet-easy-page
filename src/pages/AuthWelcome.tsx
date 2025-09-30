import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

const AuthWelcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">SpeedCharger</CardTitle>
          <CardDescription className="text-base">
            Encontre estações de carregamento e gerencie seus veículos elétricos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="w-full h-12 text-base"
            onClick={() => navigate("/auth/signup")}
          >
            Criar Conta
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-12 text-base"
            onClick={() => navigate("/auth/login")}
          >
            Já tenho uma conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthWelcome;
