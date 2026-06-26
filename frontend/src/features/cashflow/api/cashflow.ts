import { request } from '../../../services/api';
import type { CashFlowResponse } from '../types';

export const cashflowApi = {
  async getProjection(from: string, to: string): Promise<CashFlowResponse> {
    return request<CashFlowResponse>(`/cashflow?from=${from}&to=${to}`, {
      method: 'GET',
    });
  },
};
