import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LoanApplication } from './loan-application';

export const LOAN_APPLICATIONS_API_URL = 'http://localhost:3000/applications';

@Injectable({ providedIn: 'root' })
export class LoanApplicationService {
  private readonly http = inject(HttpClient);

  getApplications(): Observable<LoanApplication[]> {
    return this.http.get<LoanApplication[]>(LOAN_APPLICATIONS_API_URL);
  }
}
