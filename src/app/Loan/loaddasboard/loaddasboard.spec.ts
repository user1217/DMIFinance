import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Lead, LEADS_DATA_URL } from '../../service/lead.service';
import { LoanDashboard } from './loaddasboard';

const sampleLeads: Lead[] = [
  { id: 'DMI1938WK2', name: 'Finverge Labs', createdDate: '2025-07-06', status: 'Pending' },
  { id: 'DMI9283KWJ', name: 'Zentora Tech', createdDate: '2025-07-05', status: 'Active' },
  { id: 'DMI922JK70', name: 'CredoraX Solutions', createdDate: '2025-07-05', status: 'Rejected' },
  { id: 'DMI922JK70', name: 'BharatNest Ventures', createdDate: '2025-07-05', status: 'Disbursed' },
  { id: 'DMI922JK70', name: 'NirogGenix Health', createdDate: '2025-07-05', status: 'Active' },
  { id: 'DMI922JK70', name: 'YantraGrid Systems', createdDate: '2025-07-05', status: 'Pending' },
  { id: 'DMI922JK70', name: 'Aayati Digital', createdDate: '2025-07-05', status: 'Active' },
  { id: 'DMI922JK70', name: 'Vridhi AI Pvt Ltd', createdDate: '2025-07-05', status: 'Pending' },
  { id: 'DMI922JK70', name: 'Tatsam Mobility', createdDate: '2025-07-05', status: 'Disbursed' },
];

describe('LoanDashboard', () => {
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoanDashboard],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  function createLoadedDashboard(data = sampleLeads): {
    fixture: ComponentFixture<LoanDashboard>;
    element: HTMLElement;
  } {
    const fixture = TestBed.createComponent(LoanDashboard);
    fixture.detectChanges();
    httpTesting.expectOne(LEADS_DATA_URL).flush(data);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('loads the leads and displays the screenshot table headings and records', () => {
    const { element } = createLoadedDashboard();
    expect(element.querySelector('.lead-brand')?.getAttribute('href')).toBe('/');
    const headings = Array.from(element.querySelectorAll('thead th')).map((cell) =>
      cell.textContent?.trim(),
    );

    expect(element.querySelector('h1')?.textContent).toContain('Loan Dashboard');
    expect(headings).toEqual(['Lead Name', 'Lead ID', 'Lead Creation Date', 'Status']);
    expect(element.querySelectorAll('tbody tr')).toHaveLength(9);
    expect(element.querySelector('tbody tr')?.textContent).toContain('Finverge Labs');
    expect(element.querySelector('tbody tr')?.textContent).toContain('Jul 06, 2025');
    expect(element.textContent).toContain('Showing data 1 to 9 of 9 entries');
  });

  it('filters by status and lead search query', () => {
    const { fixture, element } = createLoadedDashboard();
    element.querySelector<HTMLButtonElement>('.lead-filter-button')!.click();
    fixture.detectChanges();

    const select = element.querySelector<HTMLSelectElement>('[aria-label="Filter leads by status"]')!;
    select.value = 'Disbursed';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(element.textContent).toContain('BharatNest Ventures');
    expect(element.textContent).toContain('Tatsam Mobility');

    select.value = 'All';
    select.dispatchEvent(new Event('change'));
    const search = element.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = 'NirogGenix';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(element.querySelector('tbody')?.textContent).toContain('NirogGenix Health');
  });

  it('shows the screenshot workflow stages and toggles creation-date sorting', () => {
    const { fixture, element } = createLoadedDashboard();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(9);
    const dateSort = element.querySelector<HTMLButtonElement>('[aria-label*="Sort by creation date"]')!;
    expect(dateSort.getAttribute('aria-label')).toContain('newest first');
    dateSort.click();
    fixture.detectChanges();
    expect(dateSort.getAttribute('aria-label')).toContain('oldest first');

    expect(element.querySelectorAll('.lead-status-card')).toHaveLength(4);
    expect(Array.from(element.querySelectorAll('.lead-stage-label')).map((item) => item.textContent?.trim()))
      .toEqual([
        'Pending for Submission',
        'Lead Initiated',
        'Dedupe Pass',
        'Decision Trigger Initiate',
        'Decision Approved',
        'Offer Accepted',
        'KYC Approved',
        'Mandate Registered',
        'Agreement Signed',
        'Agreement Signed',
        'Disbursement Initiated',
        'Disbursement',
      ]);
    expect(Array.from(element.querySelectorAll('.lead-stage-row strong')).map((item) => item.textContent?.trim()))
      .toEqual(['2910', '2500', '1973', '1973', '1872', '1823', '1521', '1423', '1602', '1209', '1192', '1023']);
  });

  it('shows loading, API error with retry, and empty-result states', () => {
    const fixture = TestBed.createComponent(LoanDashboard);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent).toContain('Loading leads');

    httpTesting.expectOne(LEADS_DATA_URL).flush('Unavailable', {
      status: 500,
      statusText: 'Server Error',
    });
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('lead data file could not be loaded');

    element.querySelector<HTMLButtonElement>('.lead-action-button')!.click();
    fixture.detectChanges();
    httpTesting.expectOne(LEADS_DATA_URL).flush(sampleLeads);
    fixture.detectChanges();

    const search = element.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = 'no matching lead';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.querySelector('.lead-state')?.textContent).toContain('No leads match');
  });

  it('paginates a larger set of leads and updates the displayed range', () => {
    const extraLeads = Array.from({ length: 3 }, (_, index) => ({
      id: `DMI-EXTRA-${index + 1}`,
      name: `Additional Lead ${index + 1}`,
      createdDate: '2025-07-04',
      status: 'Active' as const,
    }));
    const { fixture, element } = createLoadedDashboard([...sampleLeads, ...extraLeads]);

    expect(element.querySelectorAll('tbody tr')).toHaveLength(9);
    element.querySelector<HTMLButtonElement>('[aria-label="Page 2"]')!.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(element.textContent).toContain('Showing data 10 to 12 of 12 entries');
  });
});
