import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';

export const DASHBOARD_KEY = ['dashboard'];

export function useDashboard(month: string) {
  return useQuery({ queryKey: [...DASHBOARD_KEY, month], queryFn: () => dashboardApi.summary(month) });
}

// Pagar muda o painel, a lista de transações, o saldo das contas e o pago do orçamento
export function usePayFromDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardApi.pay,
    onSuccess: () =>
      Promise.all(
        [DASHBOARD_KEY, ['transactions'], ['accounts'], ['budgets']].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        )
      ),
  });
}
