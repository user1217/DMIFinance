import { Component } from '@angular/core';
import { LoanDashboard } from './Loan/loaddasboard/loaddasboard';

@Component({
  selector: 'app-root',
  imports: [LoanDashboard],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
