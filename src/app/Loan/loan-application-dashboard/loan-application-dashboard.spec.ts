import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoanApplication } from '../../loan-application';
import { LOAN_APPLICATIONS_API_URL } from '../../service/loan-application.service';
import { LoanApplicationDashboard } from './loan-application-dashboard';

const sampleApplications: LoanApplication[] = [
  {
    id: 'LA-2026-0101',
    applicantName: 'Aarav Mehta',
    loanType: 'Business',
    amount: 1_850_000,
    status: 'Under Review',
    appliedDate: '2026-10-12',
    creditScore: 758,
    assignedTo: 'Rahul Menon',
    remarks: 'Bank statements received; reviewing cash flow.',
  },
  {
    id: 'LA-2026-0102',
    applicantName: 'Priya Sharma',
    loanType: 'Personal',
    amount: 450_000,
    status: 'Pending',
    appliedDate: '2026-10-10',
    creditScore: 724,
    assignedTo: 'Ananya Rao',
    remarks: 'Salary slips pending.',
  },
  {
    id: 'LA-2026-0103',
    applicantName: 'Vikram Iyer',
    loanType: 'Home',
    amount: 6_200_000,
    status: 'Approved',
    appliedDate: '2026-10-08',
    creditScore: 811,
    assignedTo: 'Neha Kapoor',
    remarks: 'Property valuation completed.',
  },
  {
    id: 'LA-2026-0104',
    applicantName: 'Sneha Reddy',
    loanType: 'Personal',
    amount: 800_000,
    status: 'Rejected',
    appliedDate: '2026-10-02',
    creditScore: 612,
    assignedTo: 'Devika Shah',
    remarks: 'Debt-to-income ratio exceeded policy threshold.',
  },
];

describe('LoanApplicationDashboard', () => {
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoanApplicationDashboard],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  function createDashboard(
    applications: LoanApplication[] = sampleApplications,
  ): { fixture: ComponentFixture<LoanApplicationDashboard>; element: HTMLElement } {
    const fixture = TestBed.createComponent(LoanApplicationDashboard);
    fixture.detectChanges();
    httpTesting.expectOne(LOAN_APPLICATIONS_API_URL).flush(applications);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function setSelect(element: HTMLElement, label: string, value: string): void {
    const select = element.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!;
    select.value = value;
    select.dispatchEvent(new Event('change'));
  }

  function applicationIds(element: HTMLElement): string[] {
    return Array.from(element.querySelectorAll('.application-person span'))
      .map((item) => item.textContent?.trim() ?? '');
  }

  it('loads applications and shows summary values from the full dataset', () => {
    const { element } = createDashboard();

    expect(element.querySelector('h1')?.textContent).toContain('Loan applications');
    expect(element.querySelectorAll('.application-card')).toHaveLength(4);
    expect(element.textContent).toContain('4');
    expect(element.textContent).toContain('₹2,300,000');
    expect(element.textContent).toContain('25%');
    expect(element.textContent).toContain('Aarav Mehta');
    expect(element.textContent).toContain('Business loan');
    expect(element.textContent).toContain('Under Review');
    expect(element.textContent).toContain('12 Oct 2026');
  });

  it('filters by status and loan type without changing full-dataset summaries', () => {
    const { fixture, element } = createDashboard();
    setSelect(element, 'Filter by status', 'Under Review');
    setSelect(element, 'Filter by loan type', 'Business');
    fixture.detectChanges();

    expect(element.querySelectorAll('.application-card')).toHaveLength(1);
    expect(element.textContent).toContain('Aarav Mehta');
    expect(element.textContent).toContain('4');
    expect(element.textContent).toContain('₹2,300,000');
    expect(element.textContent).toContain('25%');
  });

  it('sorts by amount and applied date in both directions', () => {
    const { fixture, element } = createDashboard();
    setSelect(element, 'Sort applications', 'amount-asc');
    fixture.detectChanges();
    expect(applicationIds(element)).toEqual([
      'LA-2026-0102',
      'LA-2026-0104',
      'LA-2026-0101',
      'LA-2026-0103',
    ]);

    setSelect(element, 'Sort applications', 'amount-desc');
    fixture.detectChanges();
    expect(applicationIds(element)).toEqual([
      'LA-2026-0103',
      'LA-2026-0101',
      'LA-2026-0104',
      'LA-2026-0102',
    ]);

    setSelect(element, 'Sort applications', 'date-asc');
    fixture.detectChanges();
    expect(applicationIds(element)).toEqual([
      'LA-2026-0104',
      'LA-2026-0103',
      'LA-2026-0102',
      'LA-2026-0101',
    ]);
    setSelect(element, 'Sort applications', 'date-desc');
    fixture.detectChanges();
    expect(applicationIds(element)[0]).toBe('LA-2026-0101');
  });

  it('shows all fields and updates list and detail status only after confirmation', () => {
    const { fixture, element } = createDashboard();
    element.querySelector<HTMLButtonElement>('.application-card')!.click();
    fixture.detectChanges();

    expect(element.querySelector('[role="dialog"]')).not.toBeNull();
    expect(element.querySelector('[aria-label="Credit score 758 out of 850"]')).not.toBeNull();
    expect(element.textContent).toContain('LA-2026-0101');
    expect(element.textContent).toContain('Rahul Menon');
    expect(element.textContent).toContain('Bank statements received; reviewing cash flow.');

    const statusSelect = element.querySelector<HTMLSelectElement>('#next-status')!;
    statusSelect.value = 'Approved';
    statusSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.apply-button')!.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="alertdialog"]')).not.toBeNull();
    expect(element.textContent).toContain('Change status from Under Review to Approved?');

    element.querySelector<HTMLButtonElement>('.confirm-actions .button-secondary')!.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="alertdialog"]')).toBeNull();
    expect(statusSelect.value).toBe('Under Review');
    expect(element.querySelector('.application-card')?.textContent).toContain('Under Review');

    statusSelect.value = 'Approved';
    statusSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.apply-button')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.confirm-actions .button-primary')!.click();
    fixture.detectChanges();

    expect(element.querySelector('.application-card')?.textContent).toContain('Approved');
    expect(element.querySelector('.detail-section .status-badge')?.textContent).toContain('Approved');
    expect(element.textContent).toContain('50%');
    httpTesting.expectNone(LOAN_APPLICATIONS_API_URL);
  });

  it('shows loading then a meaningful error and retries the API request', () => {
    const fixture = TestBed.createComponent(LoanApplicationDashboard);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Loading applications');

    httpTesting.expectOne(LOAN_APPLICATIONS_API_URL).flush('Unavailable', {
      status: 500,
      statusText: 'Server Error',
    });
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('local mock API');
    expect(element.querySelector('[role="status"]')).toBeNull();

    element.querySelector<HTMLButtonElement>('.error-panel button')!.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Loading applications');
    httpTesting.expectOne(LOAN_APPLICATIONS_API_URL).flush(sampleApplications);
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(element.querySelectorAll('.application-card')).toHaveLength(4);
  });

  it('shows an empty state when no applications match the selected filters', () => {
    const { fixture, element } = createDashboard();
    setSelect(element, 'Filter by status', 'Rejected');
    setSelect(element, 'Filter by loan type', 'Business');
    fixture.detectChanges();

    expect(element.querySelector('.application-card')).toBeNull();
    expect(element.querySelector('[role="status"]')?.textContent).toContain('No applications match');

    element.querySelector<HTMLButtonElement>('.state-panel .button-secondary')!.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.application-card')).toHaveLength(4);
  });
});
