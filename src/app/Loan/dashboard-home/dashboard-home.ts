import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { LoanApplication, LoanStatus, LoanType } from '../../loan-application';
import { LoanApplicationService } from '../../loan-application.service';
import { RouterLink } from '@angular/router';

type LoadState = 'loading' | 'loaded' | 'error';
type SortOrder = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

@Component({
  selector: 'app-dashboard-home',
  imports: [CurrencyPipe, DatePipe,RouterLink],
  templateUrl: './dashboard-home.html',
})
export class DashboardHome {
  private readonly loanService = inject(LoanApplicationService);

  readonly statuses: readonly LoanStatus[] = ['Pending', 'Under Review', 'Approved', 'Rejected'];
  readonly loanTypes: readonly LoanType[] = ['Personal', 'Business', 'Home'];
  readonly sortOrders: readonly SortOrder[] = ['date-desc', 'date-asc', 'amount-desc', 'amount-asc'];
  readonly applications = signal<LoanApplication[]>([]);
  readonly loadState = signal<LoadState>('loading');
  readonly errorMessage = signal('');
  readonly statusFilter = signal<LoanStatus | 'All'>('All');
  readonly loanTypeFilter = signal<LoanType | 'All'>('All');
  readonly sortOrder = signal<SortOrder>('date-desc');
  readonly selectedApplication = signal<LoanApplication | null>(null);
  readonly draftStatus = signal<LoanStatus>('Pending');
  readonly confirmationPending = signal(false);

  readonly totalApplications = computed(() => this.applications().length);
  readonly pipelineAmount = computed(() =>
    this.applications()
      .filter((application) => application.status === 'Pending' || application.status === 'Under Review')
      .reduce((total, application) => total + application.amount, 0),
  );
  readonly approvalRate = computed(() => {
    const total = this.totalApplications();
    if (total === 0) return 0;
    const approved = this.applications().filter((application) => application.status === 'Approved').length;
    return Math.round((approved / total) * 100);
  });
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
    this.loadApplications();
  }

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

  retry(): void {
    this.loadApplications();
  }

  setStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as LoanStatus | 'All');
  }

  setLoanTypeFilter(event: Event): void {
    this.loanTypeFilter.set((event.target as HTMLSelectElement).value as LoanType | 'All');
  }

  setSortOrder(event: Event): void {
    this.sortOrder.set((event.target as HTMLSelectElement).value as SortOrder);
  }

  setDraftStatus(event: Event): void {
    this.draftStatus.set((event.target as HTMLSelectElement).value as LoanStatus);
    this.confirmationPending.set(false);
  }

  clearFilters(): void {
    this.statusFilter.set('All');
    this.loanTypeFilter.set('All');
  }

  selectApplication(application: LoanApplication): void {
    this.selectedApplication.set(application);
    this.draftStatus.set(application.status);
    this.confirmationPending.set(false);
  }

  closeDetails(): void {
    this.selectedApplication.set(null);
    this.confirmationPending.set(false);
  }

  requestStatusConfirmation(): void {
    if (this.selectedApplication() && this.draftStatus() !== this.selectedApplication()?.status) {
      this.confirmationPending.set(true);
    }
  }

  cancelStatusChange(): void {
    this.draftStatus.set(this.selectedApplication()?.status ?? 'Pending');
    this.confirmationPending.set(false);
  }

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

  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  statusClass(status: LoanStatus): string {
    return status.toLowerCase().replace(' ', '-');
  }

  creditRating(score: number): string {
    if (score >= 750) return 'Excellent';
    if (score >= 700) return 'Good';
    if (score >= 650) return 'Fair';
    return 'Needs attention';
  }

  creditRatingClass(score: number): string {
    if (score >= 700) return 'rating-good';
    if (score >= 650) return 'rating-fair';
    return 'rating-low';
  }
}
