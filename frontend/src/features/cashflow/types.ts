export interface AccountBalanceInfo {
  name: string;
  balance: number;
}

export interface CashFlowDailyPoint {
  date: string;
  consolidatedBalance: number;
  income: number;
  expense: number;
  accountBalances: Record<string, AccountBalanceInfo>;
}

export interface CashFlowPeriodTightness {
  startDate: string;
  endDate: string;
  minimumBalance: number;
}

export interface CashFlowResponse {
  dailyPoints: CashFlowDailyPoint[];
  tightnessPeriods: CashFlowPeriodTightness[];
}
