import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// Restricts lead status values to the states supported by the dashboard filters and badges.
export type LeadStatus = 'Pending' | 'Active' | 'Rejected' | 'Disbursed';

// Describes the API record shape consumed by the lead dashboard.
export interface Lead {
  id: string;
  name: string;
  createdDate: string;
  status: LeadStatus;
}

// Keeps the static lead-data location centralized for loading and HTTP tests.
export const LEADS_DATA_URL = '/lead-data.json';

// Encapsulates retrieval of lead records so components do not own HTTP details.
@Injectable({ providedIn: 'root' })
export class LeadService {
  // Uses Angular's injector to provide the configured HttpClient.
  private readonly http = inject(HttpClient);

  /** Returns the lead records as a typed observable from the shared data URL. */
  getLeads(): Observable<Lead[]> {
    return this.http.get<Lead[]>(LEADS_DATA_URL);
  }
}
