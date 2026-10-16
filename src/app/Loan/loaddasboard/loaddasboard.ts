import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Lead, LeadStatus, LeadService } from '../../service/lead.service';

type LoadState = 'loading' | 'loaded' | 'error';
type SortOrder = 'newest' | 'oldest';

const STATUS_ORDER: readonly LeadStatus[] = ['Pending', 'Active', 'Rejected', 'Disbursed'];

interface DashboardMetric {
  label: string;
  count: number;
}

interface DashboardGroup {
  id: 'submission' | 'decision' | 'verification' | 'disbursement';
  watermark: string;
  metrics: readonly DashboardMetric[];
}

@Component({
  selector: 'app-loan-dashboard',
  imports: [DatePipe],
  templateUrl: './loaddasboard.html',
})
export class LoanDashboard {
  private readonly leadService = inject(LeadService);

  readonly statuses = STATUS_ORDER;
  readonly dashboardGroups: readonly DashboardGroup[] = [
    {
      id: 'submission',
      watermark: '➤',
      metrics: [
        { label: 'Pending for Submission', count: 2910 },
        { label: 'Lead Initiated', count: 2500 },
        { label: 'Dedupe Pass', count: 1973 },
      ],
    },
    {
      id: 'decision',
      watermark: '▤',
      metrics: [
        { label: 'Decision Trigger Initiate', count: 1973 },
        { label: 'Decision Approved', count: 1872 },
        { label: 'Offer Accepted', count: 1823 },
      ],
    },
    {
      id: 'verification',
      watermark: '✓',
      metrics: [
        { label: 'KYC Approved', count: 1521 },
        { label: 'Mandate Registered', count: 1423 },
        { label: 'Agreement Signed', count: 1602 },
      ],
    },
    {
      id: 'disbursement',
      watermark: '₹',
      metrics: [
        { label: 'Agreement Signed', count: 1209 },
        { label: 'Disbursement Initiated', count: 1192 },
        { label: 'Disbursement', count: 1023 },
      ],
    },
  ];
  readonly leads = signal<Lead[]>([]);
  readonly loadState = signal<LoadState>('loading');
  readonly errorMessage = signal('');
  readonly searchQuery = signal('');
  readonly statusFilter = signal<LeadStatus | 'All'>('All');
  readonly sortOrder = signal<SortOrder>('newest');
  readonly filtersOpen = signal(false);
  readonly currentPage = signal(1);
  readonly pageSize = signal(9);

  readonly filteredLeads = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    return this.leads()
      .filter((lead) => status === 'All' || lead.status === status)
      .filter(
        (lead) =>
          !query ||
          lead.name.toLowerCase().includes(query) ||
          lead.id.toLowerCase().includes(query),
      )
      .sort((left, right) =>
        this.sortOrder() === 'newest'
          ? right.createdDate.localeCompare(left.createdDate)
          : left.createdDate.localeCompare(right.createdDate),
      );
  });

  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filteredLeads().length / this.pageSize())),
  );
  readonly pageNumbers = computed(() =>
    Array.from({ length: this.pageCount() }, (_, index) => index + 1),
  );
  readonly pagedLeads = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    return this.filteredLeads().slice(startIndex, startIndex + this.pageSize());
  });
  readonly rangeStart = computed(() =>
    this.filteredLeads().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1,
  );
  readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.filteredLeads().length),
  );

  constructor() {
    this.loadLeads();
  }

  loadLeads(): void {
    this.loadState.set('loading');
    this.errorMessage.set('');
    this.leadService.getLeads().subscribe({
      next: (leads) => {
        this.leads.set(leads);
        this.currentPage.set(1);
        this.loadState.set('loaded');
      },
      error: () => {
        this.errorMessage.set('The lead data file could not be loaded. Check the app assets and retry.');
        this.loadState.set('error');
      },
    });
  }

  retry(): void {
    this.loadLeads();
  }

  setSearchQuery(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  setStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as LeadStatus | 'All');
    this.currentPage.set(1);
  }

  toggleDateSort(): void {
    this.sortOrder.set(this.sortOrder() === 'newest' ? 'oldest' : 'newest');
    this.currentPage.set(1);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.pageCount()) {
      this.currentPage.set(page);
    }
  }

  clearFilters(): void {
    this.statusFilter.set('All');
    this.searchQuery.set('');
    this.sortOrder.set('newest');
    this.currentPage.set(1);
  }

  statusClass(status: LeadStatus): string {
    return status.toLowerCase();
  }

  downloadCsv(): void {
    const rows = this.filteredLeads().map((lead) =>
      [lead.name, lead.id, lead.createdDate, lead.status]
        .map((value) => `"${value.replaceAll('"', '""')}"`)
        .join(','),
    );
    const csv = [
      ['Lead Name', 'Lead ID', 'Lead Creation Date', 'Status'].join(','),
      ...rows,
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'loan-dashboard-leads.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
