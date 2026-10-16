export type LoanType = 'Personal' | 'Business' | 'Home';
export type LoanStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected';

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
