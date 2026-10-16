import { Routes } from '@angular/router';
import { BlankPage } from './Loan/blank-page/blank-page';
import { DashboardHome } from './Loan/dashboard-home/dashboard-home';
import { LoanDashboard } from './Loan/loaddasboard/loaddasboard';

export const routes: Routes = [
  { path: '', component: BlankPage, title: 'Loan Dashboards | DMI Finance' },
  { path: 'loan-dashboard-2', component: LoanDashboard, title: 'Loan Dashboard 2 | DMI Finance' },
  { path: 'loan-dashboard', component: DashboardHome, title: 'Loan Applications | DMI Finance' },
  { path: 'verify-kyb', component: BlankPage, title: 'Verify KYB | DMI Finance' },
  { path: '**', redirectTo: '' },
];
