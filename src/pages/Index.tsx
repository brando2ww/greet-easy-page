import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-subtle px-4">
      <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-hero bg-clip-text text-transparent animate-slide-up">
            Bem-vindo!
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-slide-up-delay">
            É um prazer ter você aqui. Estamos felizes em compartilhar esta jornada com você.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay">
          <Button variant="hero" size="lg" className="min-w-[200px]">
            Começar Agora
          </Button>
          <Button variant="outline" size="lg" className="min-w-[200px]">
            Saiba Mais
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Index;
