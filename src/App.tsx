import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n/config";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Estacoes /></ProtectedRoute>} />
              <Route path="/dicas" element={<ProtectedRoute><Dicas /></ProtectedRoute>} />
              <Route path="/iniciar-carga" element={<ProtectedRoute><IniciarCarga /></ProtectedRoute>} />
              <Route path="/veiculos" element={<ProtectedRoute><Veiculos /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
              <Route path="/auth" element={<AuthWelcome />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<SignUp />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </I18nextProvider>
  </QueryClientProvider>
);

export default App;
