import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Lead, LeadStatus, LeadService } from '../../service/lead.service';

// Restricts the view to the three request states rendered by the template.
type LoadState = 'loading' | 'loaded' | 'error';
// Keeps sorting to the two date directions supported by this dashboard.
type SortOrder = 'newest' | 'oldest';

// Centralizes the status options so the UI and status filtering share one order.
const STATUS_ORDER: readonly LeadStatus[] = ['Pending', 'Active', 'Rejected', 'Disbursed'];

// Gives each displayed metric a consistent, type-checked label/count shape.
interface DashboardMetric {
  label: string;
  count: number;
}

// Models a dashboard card and its typed metric rows for the template loops.
interface DashboardGroup {
  id: 'submission' | 'decision' | 'verification' | 'disbursement';
  watermark: string;
  metrics: readonly DashboardMetric[];
}

@Component({
  selector: 'app-loan-dashboard',
  imports: [DatePipe, RouterLink],
  templateUrl: './figma-loan-dashboard.html',
})
export class LoanDashboard {
  // Injects the API boundary used to load and retry lead data.
  private readonly leadService = inject(LeadService);

  // Provides the fixed status choices consumed by the status dropdown.
  readonly statuses = STATUS_ORDER;
  // Supplies the static workflow cards displayed above the live lead table.
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
  // Stores the unfiltered API results; filters and paging derive their views from this signal.
  readonly leads = signal<Lead[]>([]);
  // Drives loading, loaded, and error template states without separate flags.
  readonly loadState = signal<LoadState>('loading');
  // Holds the user-facing explanation when loading fails.
  readonly errorMessage = signal('');
  // Stores the current text filter and automatically refreshes derived lead results.
  readonly searchQuery = signal('');
  // Stores the selected lead status, including the all-statuses option.
  readonly statusFilter = signal<LeadStatus | 'All'>('All');
  // Stores the date direction used by sorting and the accessible sort label.
  readonly sortOrder = signal<SortOrder>('newest');
  // Controls whether the status filter drawer is visible.
  readonly filtersOpen = signal(false);
  // Tracks the current one-based page shown in the table.
  readonly currentPage = signal(1);
  // Sets the fixed number of lead rows displayed on each page.
  readonly pageSize = signal(9);

  // Derives visible leads from the search, status, and sort signals.
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

  // Computes the number of available pages while keeping one page for empty results.
  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filteredLeads().length / this.pageSize())),
  );
  // Supplies page numbers for the pagination control.
  readonly pageNumbers = computed(() =>
    Array.from({ length: this.pageCount() }, (_, index) => index + 1),
  );
  // Slices filtered results to the current page for the table body.
  readonly pagedLeads = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    return this.filteredLeads().slice(startIndex, startIndex + this.pageSize());
  });
  // Computes the first visible row number for the table footer.
  readonly rangeStart = computed(() =>
    this.filteredLeads().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1,
  );
  // Computes the last visible row number for the table footer.
  readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.filteredLeads().length),
  );

  constructor() {
    // Starts loading as soon as the dashboard component is created.
    this.loadLeads();
  }

  /** Loads leads and sets the state consumed by the loading, success, and error views. */
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

  /** Repeats the API request after the user chooses Try again. */
  retry(): void {
    this.loadLeads();
  }

  /** Updates the search query and returns pagination to the first result page. */
  setSearchQuery(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  /** Applies the selected status and returns pagination to the first result page. */
  setStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as LeadStatus | 'All');
    this.currentPage.set(1);
  }

  /** Flips the date ordering and resets paging so the user starts at the newest result page. */
  toggleDateSort(): void {
    this.sortOrder.set(this.sortOrder() === 'newest' ? 'oldest' : 'newest');
    this.currentPage.set(1);
  }

  /** Changes pages only when the requested page is within the computed page range. */
  changePage(page: number): void {
    if (page >= 1 && page <= this.pageCount()) {
      this.currentPage.set(page);
    }
  }

  /** Restores the default search, status, sort, and page state. */
  clearFilters(): void {
    this.statusFilter.set('All');
    this.searchQuery.set('');
    this.sortOrder.set('newest');
    this.currentPage.set(1);
  }

  /** Converts a status to the CSS suffix used for its visual badge. */
  statusClass(status: LeadStatus): string {
    return status.toLowerCase();
  }

  /** Builds a CSV from the currently filtered leads and starts a browser download. */
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
