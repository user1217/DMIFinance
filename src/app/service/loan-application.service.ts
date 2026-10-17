import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LoanApplication } from '../loan-application';

// Centralizes the mock API endpoint so the service and tests use the same URL.
export const LOAN_APPLICATIONS_API_URL = 'http://localhost:3000/applications';

// Encapsulates loan-application HTTP access outside the dashboard component.
@Injectable({ providedIn: 'root' })
export class LoanApplicationService {
  // Uses Angular's injector to provide the configured HttpClient.
  private readonly http = inject(HttpClient);

  /** Requests typed loan-application records from the local mock API. */
  getApplications(): Observable<LoanApplication[]> {
    return this.http.get<LoanApplication[]>(LOAN_APPLICATIONS_API_URL);
  }
}
