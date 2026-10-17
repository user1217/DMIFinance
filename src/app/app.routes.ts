import { Routes } from '@angular/router';
import { LoanApplicationDashboard } from './Loan/loan-application-dashboard/loan-application-dashboard';
import { LoanDashboard } from './Loan/figma-loan-dashboard/figma-loan-dashboard';
import { VerifyKyc } from './Loan/verify-kyc/verify-kyc';

export const routes: Routes = [
  { path: '', component: VerifyKyc, title: 'Loan Dashboards | DMI Finance' },
  { path: 'figma-loan-dashboard', component: LoanDashboard, title: 'Figma Loan Dashboard | DMI Finance' },
  { path: 'loan-application-dashboard', component: LoanApplicationDashboard, title: 'Loan Application Dashboard | DMI Finance' },
  { path: 'verify-kyc', component: VerifyKyc, title: 'Verify KYB | DMI Finance' },
  { path: '**', redirectTo: '' },
];
