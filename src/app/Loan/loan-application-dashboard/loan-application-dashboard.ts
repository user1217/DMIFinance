import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { LoanApplication, LoanStatus, LoanType } from '../../loan-application';
import { LoanApplicationService } from '../../service/loan-application.service';
import { RouterLink } from '@angular/router';

// Limits the request-state UI to its loading, success, and failure views.
type LoadState = 'loading' | 'loaded' | 'error';
// Restricts sorting to the date and amount directions exposed by the sort dropdown.
type SortOrder = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

@Component({
  selector: 'app-loan-application-dashboard',
  imports: [CurrencyPipe, DatePipe,RouterLink],
  templateUrl: './loan-application-dashboard.html',
})
export class LoanApplicationDashboard {
  // Keeps HTTP access in the service rather than coupling view logic to the endpoint.
  private readonly loanService = inject(LoanApplicationService);

  // Supplies the valid status and loan-type choices used by the filters.
  readonly statuses: readonly LoanStatus[] = ['Pending', 'Under Review', 'Approved', 'Rejected'];
  readonly loanTypes: readonly LoanType[] = ['Personal', 'Business', 'Home'];
  // Lists the supported sorting modes and documents the dropdown's accepted values.
  readonly sortOrders: readonly SortOrder[] = ['date-desc', 'date-asc', 'amount-desc', 'amount-asc'];
  // Keeps the loaded source records so summary values remain independent of filters.
  readonly applications = signal<LoanApplication[]>([]);
  // Drives loading, loaded, and error presentation from one finite state.
  readonly loadState = signal<LoadState>('loading');
  // Provides actionable feedback when the local application API is unavailable.
  readonly errorMessage = signal('');
  // Stores the currently applied status filter.
  readonly statusFilter = signal<LoanStatus | 'All'>('All');
  // Stores the currently applied loan type filter.
  readonly loanTypeFilter = signal<LoanType | 'All'>('All');
  // Stores the active sort order for the visible application list.
  readonly sortOrder = signal<SortOrder>('date-desc');
  // Identifies the record whose detail panel is currently open.
  readonly selectedApplication = signal<LoanApplication | null>(null);
  // Holds the uncommitted status choice while the user reviews a change.
  readonly draftStatus = signal<LoanStatus>('Pending');
  // Controls whether the status-change confirmation prompt is shown.
  readonly confirmationPending = signal(false);

  // Derives the total count from all loaded records, not just filtered records.
  readonly totalApplications = computed(() => this.applications().length);
  // Sums only pending and under-review balances across the complete dataset.
  readonly pipelineAmount = computed(() =>
    this.applications()
      .filter((application) => application.status === 'Pending' || application.status === 'Under Review')
      .reduce((total, application) => total + application.amount, 0),
  );
  // Calculates the approved share of all loaded applications, including the empty-data case.
  readonly approvalRate = computed(() => {
    const total = this.totalApplications();
    if (total === 0) return 0;
    const approved = this.applications().filter((application) => application.status === 'Approved').length;
    return Math.round((approved / total) * 100);
  });
  // Applies the selected filters and sort without mutating the source application list.
  readonly filteredApplications = computed(() => {
    const status = this.statusFilter();
    const loanType = this.loanTypeFilter();
    const sort = this.sortOrder();
    return [
      ...this.applications()
        .filter((application) => status === 'All' || application.status === status)
        .filter((application) => loanType === 'All' || application.loanType === loanType),
    ].sort((left, right) => {
      switch (sort) {
        case 'amount-asc':
          return left.amount - right.amount;
        case 'amount-desc':
          return right.amount - left.amount;
        case 'date-asc':
          return left.appliedDate.localeCompare(right.appliedDate);
        case 'date-desc':
          return right.appliedDate.localeCompare(left.appliedDate);
      }
    });
  });

  constructor() {
    // Starts the first application request when the dashboard is created.
    this.loadApplications();
  }

  /** Loads applications and updates the state used by the dashboard's request views. */
  loadApplications(): void {
    this.loadState.set('loading');
    this.errorMessage.set('');
    this.loanService.getApplications().subscribe({
      next: (applications) => {
        this.applications.set(applications);
        this.loadState.set('loaded');
      },
      error: () => {
        this.errorMessage.set('Check that the local mock API is running at http://localhost:3000/applications, then try again.');
        this.loadState.set('error');
      },
    });
  }

  /** Retries the application request after a load failure. */
  retry(): void {
    this.loadApplications();
  }

  /** Applies the status selected in the status filter control. */
  setStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as LoanStatus | 'All');
  }

  /** Applies the loan type selected in the loan type filter control. */
  setLoanTypeFilter(event: Event): void {
    this.loanTypeFilter.set((event.target as HTMLSelectElement).value as LoanType | 'All');
  }

  /** Applies one of the supported date or amount sort orders. */
  setSortOrder(event: Event): void {
    this.sortOrder.set((event.target as HTMLSelectElement).value as SortOrder);
  }

  /** Updates a proposed status and dismisses any stale confirmation prompt. */
  setDraftStatus(event: Event): void {
    this.draftStatus.set((event.target as HTMLSelectElement).value as LoanStatus);
    this.confirmationPending.set(false);
  }

  /** Restores both filter controls to their unfiltered values. */
  clearFilters(): void {
    this.statusFilter.set('All');
    this.loanTypeFilter.set('All');
  }

  /** Opens an application's detail panel and initializes its proposed status. */
  selectApplication(application: LoanApplication): void {
    this.selectedApplication.set(application);
    this.draftStatus.set(application.status);
    this.confirmationPending.set(false);
  }

  /** Closes the detail panel and clears any pending confirmation state. */
  closeDetails(): void {
    this.selectedApplication.set(null);
    this.confirmationPending.set(false);
  }

  /** Requests confirmation only when the proposed status differs from the saved status. */
  requestStatusConfirmation(): void {
    if (this.selectedApplication() && this.draftStatus() !== this.selectedApplication()?.status) {
      this.confirmationPending.set(true);
    }
  }

  /** Discards a proposed status and restores the currently saved value. */
  cancelStatusChange(): void {
    this.draftStatus.set(this.selectedApplication()?.status ?? 'Pending');
    this.confirmationPending.set(false);
  }

  /** Applies a confirmed status change to the in-memory list and selected detail record. */
  confirmStatusChange(): void {
    const selected = this.selectedApplication();
    if (!selected || !this.confirmationPending()) return;

    const updated = { ...selected, status: this.draftStatus() };
    this.applications.update((applications) =>
      applications.map((application) => (application.id === updated.id ? updated : application)),
    );
    this.selectedApplication.set(updated);
    this.confirmationPending.set(false);
  }

  /** Builds a two-character avatar label from the applicant's name. */
  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  /** Converts a status into the normalized CSS class suffix for its badge. */
  statusClass(status: LoanStatus): string {
    return status.toLowerCase().replace(' ', '-');
  }

  /** Maps a numeric credit score to the user-facing rating label. */
  creditRating(score: number): string {
    if (score >= 750) return 'Excellent';
    if (score >= 700) return 'Good';
    if (score >= 650) return 'Fair';
    return 'Needs attention';
  }

  /** Maps a numeric credit score to the visual rating class used by the gauge. */
  creditRatingClass(score: number): string {
    if (score >= 700) return 'rating-good';
    if (score >= 650) return 'rating-fair';
    return 'rating-low';
  }
}
