import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Estacoes from '@/pages/Estacoes';

export const RoleBasedRedirect = () => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redireciona admin/support para dashboard
  if (userRole === 'admin' || userRole === 'support') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Usuários regulares veem a página de Estações
  return <Estacoes />;
};
