import { useQuery } from '@tanstack/react-query';
import { transactionsApi } from '@/services/api';

export const useAdminReport = () => {
  return useQuery({
    queryKey: ['admin-report'],
    queryFn: async () => {
      const result = await transactionsApi.adminReport();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};
