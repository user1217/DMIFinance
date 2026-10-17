// Restricts application categories to the options supported by the dashboard filter.
export type LoanType = 'Personal' | 'Business' | 'Home';
// Restricts application statuses to the workflow states shown and managed by the dashboard.
export type LoanStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected';

// Defines the shared API/UI record shape so components and services agree on application fields.
export interface LoanApplication {
  id: string;
  applicantName: string;
  loanType: LoanType;
  amount: number;
  status: LoanStatus;
  appliedDate: string;
  creditScore: number;
  assignedTo: string;
  remarks: string;
}
