import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Estacoes from "./pages/Estacoes";
import Dicas from "./pages/Dicas";
import IniciarCarga from "./pages/IniciarCarga";
import Veiculos from "./pages/Veiculos";
import Perfil from "./pages/Perfil";
import AuthWelcome from "./pages/AuthWelcome";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Estacoes />} />
          <Route path="/dicas" element={<Dicas />} />
          <Route path="/iniciar-carga" element={<IniciarCarga />} />
          <Route path="/veiculos" element={<Veiculos />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/auth" element={<AuthWelcome />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<SignUp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
