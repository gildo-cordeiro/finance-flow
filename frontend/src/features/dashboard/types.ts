export interface MemberBreakdown {
  userRevenue: number;
  userExpenses: number;
  partnerRevenue: number;
  partnerExpenses: number;
}

export interface DashboardSummary {
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  budgetPlanned: number;
  budgetRealized: number;
  memberBreakdown?: MemberBreakdown | null;
}
