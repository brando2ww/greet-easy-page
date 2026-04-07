import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n/config";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { RoleBasedRedirect } from "./components/RoleBasedRedirect";
import Estacoes from "./pages/Estacoes";
import Home from "./pages/Home";
import Carregamento from "./pages/Carregamento";
import Dicas from "./pages/Dicas";
import Carteira from "./pages/Carteira";
import CarteiraSucesso from "./pages/CarteiraSucesso";
import IniciarCarga from "./pages/IniciarCarga";
import Veiculos from "./pages/Veiculos";
import Perfil from "./pages/Perfil";
import InformacoesCobranca from "./pages/InformacoesCobranca";
import Configuracoes from "./pages/Configuracoes";
import AuthWelcome from "./pages/AuthWelcome";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/admin/Dashboard";

import Carregadores from "./pages/admin/Carregadores";
import Relatorios from "./pages/admin/Relatorios";
import CarteiraAdmin from "./pages/admin/CarteiraAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<ProtectedRoute><RoleBasedRedirect /></ProtectedRoute>} />
              <Route path="/estacoes" element={<ProtectedRoute><Estacoes /></ProtectedRoute>} />
              <Route path="/dicas" element={<ProtectedRoute><Dicas /></ProtectedRoute>} />
              <Route path="/carteira" element={<ProtectedRoute><Carteira /></ProtectedRoute>} />
              <Route path="/carteira/sucesso" element={<ProtectedRoute><CarteiraSucesso /></ProtectedRoute>} />
              <Route path="/iniciar-carga" element={<ProtectedRoute><IniciarCarga /></ProtectedRoute>} />
              <Route path="/carregamento/:sessionId" element={<ProtectedRoute><Carregamento /></ProtectedRoute>} />
              <Route path="/veiculos" element={<ProtectedRoute><Veiculos /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
              <Route path="/perfil/informacoes-cobranca" element={<ProtectedRoute><InformacoesCobranca /></ProtectedRoute>} />
              <Route path="/perfil/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
              <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
              
              <Route path="/admin/carregadores" element={<AdminRoute><Carregadores /></AdminRoute>} />
              <Route path="/admin/relatorios" element={<AdminRoute><Relatorios /></AdminRoute>} />
              <Route path="/admin/carteira" element={<AdminRoute><CarteiraAdmin /></AdminRoute>} />
              <Route path="/auth" element={<AuthWelcome />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<SignUp />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </I18nextProvider>
  </QueryClientProvider>
);

export default App;
