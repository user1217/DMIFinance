import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type LeadStatus = 'Pending' | 'Active' | 'Rejected' | 'Disbursed';

export interface Lead {
  id: string;
  name: string;
  createdDate: string;
  status: LeadStatus;
}

export const LEADS_DATA_URL = '/lead-data.json';

@Injectable({ providedIn: 'root' })
export class LeadService {
  private readonly http = inject(HttpClient);

  getLeads(): Observable<Lead[]> {
    return this.http.get<Lead[]>(LEADS_DATA_URL);
  }
}
