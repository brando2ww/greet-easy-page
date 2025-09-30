import { useAuth } from '@/contexts/AuthContext';

export const useUserRole = () => {
  const { userRole, roleLoading } = useAuth();
  
  return {
    isAdmin: userRole === 'admin',
    isSupport: userRole === 'support',
    isUser: userRole === 'user',
    role: userRole,
    roleLoading
  };
};
